import streamlit as st
import datetime
import uuid
import plotly.express as px
import pandas as pd
from utils.pdf_reader import extract_text_from_pdf
from utils.prompts import RESUME_ANALYSIS_PROMPT_TEMPLATE
from utils.llm_handler import call_gemini_with_prompt, get_gemini_client
from utils.pdf_report import generate_pdf_report

st.set_page_config(
    page_title="AI Resume Analyzer - Resume Analysis",
    layout="wide"
)

st.markdown("""
<style>
    .stApp {
        background: #0b0c10;
        color: #c5c6c7;
    }
    .status-badge {
        background-color: #1a1b26;
        border: 1px solid #2e3047;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-family: monospace;
        color: #8f909a;
    }
    .metric-bubble {
        background: #16161e;
        border: 1px solid #1f1f2e;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .metric-header {
        font-size: 11px;
        font-family: monospace;
        text-transform: uppercase;
        color: #8f909a;
        margin-bottom: 4px;
    }
    .metric-value-large {
        font-size: 36px;
        font-weight: 800;
        color: #4f46e5;
    }
</style>
""", unsafe_allow_html=True)

st.title("Document Upload & Deep Resume Auditing")
st.markdown("Upload your PDF resume below to extract text features and perform a deep-dive structural evaluation.")

if "history" not in st.session_state:
    st.session_state["history"] = []
if "current_resume_text" not in st.session_state:
    st.session_state["current_resume_text"] = None
if "current_analysis" not in st.session_state:
    st.session_state["current_analysis"] = None
if "candidate_name" not in st.session_state:
    st.session_state["candidate_name"] = "Nominee"
if "custom_api_key" not in st.session_state:
    st.session_state["custom_api_key"] = ""

from utils.llm_handler import render_sidebar_key_manager

with st.sidebar:
    render_sidebar_key_manager()

api_configured = get_gemini_client()

col_up, col_preview = st.columns([1, 1], gap="large")

with col_up:
    st.markdown("### Step 1: Upload PDF Format Resume")
    uploaded_file = st.file_uploader("Drop application PDF directly below:", type=["pdf"])
    
    cand_name = st.text_input("Candidate Target Name (Optional):", value=st.session_state["candidate_name"])
    if cand_name:
        st.session_state["candidate_name"] = cand_name
        
    if uploaded_file is not None:
        if st.button("Parse & Load PDF Document Content"):
            with st.spinner("Extracting layout strings from PDF binary stream..."):
                extracted_text = extract_text_from_pdf(uploaded_file)
                if extracted_text:
                    st.session_state["current_resume_text"] = extracted_text
                    st.success("Successfully parsed PDF file using PyPDF2! Content cached.")
                else:
                    st.error("Text extraction failed. Ensure your file has readable text rather than only image scans.")

with col_preview:
    st.markdown("### Step 2: Document Context Preview")
    if st.session_state["current_resume_text"]:
        st.text_area(
            "Extracted plain text context cached in session:",
            st.session_state["current_resume_text"],
            height=280,
            disabled=True
        )
    else:
        st.info("No active application is loaded. Upload a PDF first.")

if st.session_state["current_resume_text"]:
    st.markdown("---")
    st.markdown("### Step 3: Trigger Structural Evaluation & Analysis Report")
    
    if not api_configured:
        st.warning("Please define your GEMINI_API_KEY globally or check .env file connection to execute analyses.")
    else:
        if st.button("Analyze & Compute Deep ATS Score Alignment"):
            with st.spinner("Connecting with Gemini AI Core Node... Running ATS evaluations"):
                formatted_prompt = RESUME_ANALYSIS_PROMPT_TEMPLATE.format(
                    resume_text=st.session_state["current_resume_text"]
                )
                
                result_payload = call_gemini_with_prompt(formatted_prompt)
                
                if result_payload:
                    st.session_state["current_analysis"] = result_payload
                    
                    record = {
                        "id": str(uuid.uuid4())[:8],
                        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "name": st.session_state["candidate_name"],
                        "summary": result_payload.get("summary", ""),
                        "atsScore": result_payload.get("atsIndex", 60),
                        "analysis": result_payload,
                        "resumeText": st.session_state["current_resume_text"]
                    }
                    st.session_state["history"].append(record)
                    st.success("Successfully generated profile audit! Results cached in session history.")
                else:
                    last_err = st.session_state.get("last_api_error", "Unknown Error")
                    st.error("Failed to parse analysis schema response. Try triggering again.")
                    st.error(f"**Error Details:** {last_err}")

if st.session_state["current_analysis"]:
    res = st.session_state["current_analysis"]
    
    st.markdown("---")
    st.subheader(f"Assessment Report - Candidate: {st.session_state['candidate_name']}")
    
    col_score, col_skills, col_gaps = st.columns(3)
    
    with col_score:
        st.markdown(f"""
        <div class="metric-bubble">
            <div class="metric-header">Computed Key ATS Index</div>
            <div class="metric-value-large">{res.get('atsIndex', 0)}%</div>
            <div style="font-size:12px; color: #8f909a; margin-top:4px;">Recruiter Screen Score</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col_skills:
        scount = len(res.get("technicalSkills", []))
        st.markdown(f"""
        <div class="metric-bubble">
            <div class="metric-header">Structured Hardware/Software Keywords</div>
            <div class="metric-value-large">{scount}</div>
            <div style="font-size:12px; color: #8f909a; margin-top:4px;">Hard technical tags parsed</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col_gaps:
        gcount = len(res.get("missingSkills", []))
        st.markdown(f"""
        <div class="metric-bubble">
            <div class="metric-header">Urgent Trends Gaps Identified</div>
            <div class="metric-value-large">{gcount}</div>
            <div style="font-size:12px; color: #8f909a; margin-top:4px;">Recommended modern keyword updates</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("### Profile Executive Overview Highlight")
    st.info(res.get("summary", "No summarization text index generated."))
    
    left_grid, right_grid = st.columns(2, gap="large")
    
    with left_grid:
        st.markdown("### Parse hard & soft qualifications distribution:")
        
        skills_df = pd.DataFrame([
            {"Skill Category": "Hard/Tech Skills", "Parsed Count": len(res.get("technicalSkills", []))},
            {"Skill Category": "Soft Skills", "Parsed Count": len(res.get("softSkills", []))},
            {"Skill Category": "Modern Trend Gaps", "Parsed Count": len(res.get("missingSkills", []))},
        ])
        
        fig = px.bar(
            skills_df, 
            x="Skill Category", 
            y="Parsed Count", 
            color="Skill Category",
            title="Competency Volume Distribution Chart",
            color_discrete_sequence=["#4f46e5", "#10b981", "#f59e0b"]
        )
        fig.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='#c5c6c7',
            xaxis=dict(showgrid=False),
            yaxis=dict(showgrid=True, gridcolor='#1f1f2e'),
            showlegend=False
        )
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("#### Technical Key Competencies Parsing List:")
        t_skills = res.get("technicalSkills", [])
        if t_skills:
            st.write(", ".join([f"`{s}`" for s in t_skills]))
        else:
            st.warning("No specific technical capabilities matched.")

        st.markdown("#### Soft Skills Attributes Parsing List:")
        s_skills = res.get("softSkills", [])
        if s_skills:
            st.write(", ".join([f"`{s}`" for s in s_skills]))
        else:
            st.warning("No soft competencies parsed.")

    with right_grid:
        st.markdown("### Strengths & Development Optimization Paths")
        
        st.markdown("#### Found Core Strengths:")
        for str_item in res.get("strengths", []):
            st.markdown(f"{str_item}")
            
        st.markdown("#### Identified Limitations/Weaknesses:")
        for weak_item in res.get("weaknesses", []):
            st.markdown(f"{weak_item}")
            
        st.markdown("#### Modern Target Gaps Recommendations:")
        for missing_item in res.get("missingSkills", []):
            st.markdown(f" Missing requirement: **{missing_item}**")

    st.markdown("---")
    st.markdown("### Actionable Enhancement Suggestions List")
    for suggestion in res.get("recommendations", []):
        st.markdown(f"**How to Optimize:** {suggestion}")

    st.markdown("---")
    st.markdown("### Export Current Audited Report")
    
    report_text = f"""=============================================
AI RESUME ANALYZER AUDIT REPORT
Generated Timestamp: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Candidate: {st.session_state['candidate_name']}
ATS Score Level: {res.get('atsIndex', 0)}%
=============================================

EXECUTIVE OVERVIEW OVERALL POSITIONING:
{res.get('summary')}

TECHNICAL SKILLS Parsed:
{', '.join(res.get('technicalSkills', []))}

SOFT SKILLS Parsed:
{', '.join(res.get('softSkills', []))}

STRENGTHS DETECTED:
{chr(10).join(['- ' + s for s in res.get('strengths', [])])}

WEAKNESSES AND MINOR RE-WRITES:
{chr(10).join(['- ' + w for w in res.get('weaknesses', [])])}

ACTIONABLE ADVICE / WRITING ENHANCEMENTS:
{chr(10).join(['- ' + r for r in res.get('recommendations', [])])}
"""
    
    dl_col1, dl_col2 = st.columns(2)

    with dl_col1:
        st.download_button(
            label="Download Resume Analysis Text (.TXT)",
            data=report_text,
            file_name=f"ATS_Audit_Report_{st.session_state['candidate_name'].replace(' ', '_')}.txt",
            mime="text/plain"
        )

    with dl_col2:
        try:
            pdf_bytes = generate_pdf_report(res, st.session_state["candidate_name"])
            st.download_button(
                label="Download Resume Analysis Report (.PDF)",
                data=pdf_bytes,
                file_name=f"ATS_Audit_Report_{st.session_state['candidate_name'].replace(' ', '_')}.pdf",
                mime="application/pdf"
            )
        except Exception as e:
            st.error(f"PDF generation failed: {str(e)}")
