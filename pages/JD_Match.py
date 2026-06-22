import streamlit as st
import plotly.express as px
import pandas as pd
from utils.prompts import JD_MATCH_PROMPT_TEMPLATE
from utils.llm_handler import call_gemini_with_prompt, get_gemini_client

st.set_page_config(
    page_title="AI Resume Analyzer - JD Match Optimizer",
    page_icon="🎯",
    layout="wide"
)

# Dark styled layout structures
st.markdown("""
<style>
    .stApp {
        background: #0b0c10;
        color: #c5c6c7;
    }
    .metric-bubble {
        background: #16161e;
        border: 1px solid #1f1f2e;
        padding: 24px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .percentage-text {
        font-size: 42px;
        font-weight: 900;
        color: #4f46e5;
    }
    .badge-matched {
        background-color: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.25);
        color: #10b981;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        display: inline-block;
        margin: 4px;
    }
    .badge-missing {
        background-color: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.25);
        color: #f59e0b;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        display: inline-block;
        margin: 4px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🎯 Job Description Matching & Alignment Optimizer")
st.markdown("Instantly calculate semantic match scores and isolate keyword discrepancies to score maximal Applicant Tracking Index optimization ranges.")

# Load active cached CV values
if "current_resume_text" not in st.session_state:
    st.session_state["current_resume_text"] = None
if "current_jd_match_result" not in st.session_state:
    st.session_state["current_jd_match_result"] = None
if "jd_text_context" not in st.session_state:
    st.session_state["jd_text_context"] = ""
if "custom_api_key" not in st.session_state:
    st.session_state["custom_api_key"] = ""

from utils.llm_handler import render_sidebar_key_manager

with st.sidebar:
    render_sidebar_key_manager()

api_configured = get_gemini_client()

# Check context limits
if not st.session_state["current_resume_text"]:
    st.warning("⚠️ No parsed resume content located inside memory. First upload your CV on the 'Resume Analysis' page.")
else:
    left_sub, right_sub = st.columns([2, 3], gap="large")
    
    with left_sub:
        st.markdown("### Paste Target Job Details")
        st.markdown("Input prospective roles, requirements grids, responsibilities grids, and technical requirements lists below:")
        
        jd_input = st.text_area(
            "Target Job Description:",
            value=st.session_state["jd_text_context"],
            placeholder="Paste target role guidelines, descriptions and tech requirements here...",
            height=300
        )
        
        if jd_input:
            st.session_state["jd_text_context"] = jd_input
            
        trigger_analysis = st.button("Compare & Align Semantics", disabled=not jd_input.strip())
        
        if trigger_analysis:
            if not api_configured:
                st.error("No valid system GEMINI_API_KEY environment credentials loaded.")
            else:
                with st.spinner("Analyzing semantic models alignment matrices with Gemini..."):
                    formatted_prompt = JD_MATCH_PROMPT_TEMPLATE.format(
                        resume_text=st.session_state["current_resume_text"],
                        jd_text=st.session_state["jd_text_context"]
                    )
                    
                    matched_out = call_gemini_with_prompt(formatted_prompt)
                    
                    if matched_out:
                        st.session_state["current_jd_match_result"] = matched_out
                        st.success("Successfully completed semantic compare parsing!")
                    else:
                        last_err = st.session_state.get("last_api_error", "Unknown Error")
                        st.error("❌ Semantic comparison parsing failed. Verify Gemini parameters.")
                        st.error(f"**Error Details:** {last_err}")
                        
    with right_sub:
        st.markdown("### Semantic Match Metrics")
        
        if st.session_state["current_jd_match_result"]:
            match_res = st.session_state["current_jd_match_result"]
            score = match_res.get("matchPercentage", 0)
            
            # Simple score card visual
            st.markdown(f"""
            <div class="metric-bubble" style="margin-bottom: 24px;">
                <div style="font-size:12px; text-transform:uppercase; color:#8f909a; font-family:monospace;">Semantic Alignment Fit Gauge</div>
                <div class="percentage-text">{score}% Match</div>
                <div style="font-size:11px; color:#8f909a; margin-top:4px;">Minimum benchmark baseline of 75% suggested</div>
            </div>
            """, unsafe_allow_html=True)
            
            # Interactive Plotly alignment gauge bar
            fig_data = pd.DataFrame([
                {"Metric Gauge": "Match Score", "Percent Align": score},
                {"Metric Gauge": "Discrepancy Gap", "Percent Align": 100 - score}
            ])
            fig = px.pie(
                fig_data,
                names="Metric Gauge",
                values="Percent Align",
                color="Metric Gauge",
                color_discrete_map={"Match Score": "#4f46e5", "Discrepancy Gap": "#1f1f2e"},
                hole=0.55,
                title="Semantic Distribution Gauge Chart"
            )
            fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font_color='#c5c6c7',
                showlegend=False
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Input target Job details on the left, then click 'Compare' to inspect alignments.")

    # Render complete details below comparison cards
    if st.session_state["current_jd_match_result"]:
        match_out = st.session_state["current_jd_match_result"]
        
        st.markdown("---")
        st.subheader("Deep Comparative Keyword Analysis")
        
        g1, g2 = st.columns(2, gap="large")
        
        with g1:
            st.markdown("### Verified Strong Matches Key Keywords")
            strong_m = match_out.get("strongMatches", [])
            if strong_m:
                st.write("Identified critical matched keyword indicators matching Job requirements:")
                for item in strong_m:
                    st.markdown(f"<span class='badge-matched'>✅ {item}</span>", unsafe_allow_html=True)
            else:
                st.warning("No direct high matching key keyword sets found in text.")
                
        with g2:
            st.markdown("### Identified Discrepant Gaps")
            missing_k = match_out.get("missingSkills", [])
            if missing_k:
                st.write("Isolate critical requirements defined in JD but absent in your profile text:")
                for item in missing_k:
                    st.markdown(f"<span class='badge-missing'>⚠️ {item}</span>", unsafe_allow_html=True)
            else:
                st.success("ATS checked complete alignment! Zero direct discrepancies computed.")

        st.markdown("---")
        st.markdown("### Profile Optimization Instructions")
        for suggestion in match_out.get("improvementSuggestions", []):
            st.markdown(f"📈 **Enhancement Path:** {suggestion}")

        st.markdown("---")
        st.markdown("### Optimized Tailored Resume Objectives Hook")
        st.markdown("Substitute your primary intro/objective grids with this ATS index-maximizing, targeted summary hook:")
        
        obj_text = match_out.get("optimizedObjective", "No specific tailored objective rendered.")
        st.code(f'"{obj_text}"', language='text')
