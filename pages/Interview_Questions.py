import streamlit as st
from utils.prompts import INTERVIEW_PROMPT_TEMPLATE
from utils.llm_handler import call_gemini_with_prompt, get_gemini_client

st.set_page_config(
    page_title="AI Resume Analyzer - Interview Questions Generator",
    layout="wide"
)

st.markdown("""
<style>
    .stApp {
        background: #0b0c10;
        color: #c5c6c7;
    }
    .question-card {
        background-color: #16161e;
        border: 1px solid #1f1f2e;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 16px;
    }
    .question-type-badge {
        font-family: monospace;
        font-size: 10px;
        font-weight: bold;
        background-color: #4f46e5;
        color: #ffffff;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 8px;
    }
    .difficulty-badge {
        font-family: monospace;
        font-size: 10px;
        background-color: #f59e0b;
        color: #111;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 8px;
        margin-left: 8px;
    }
</style>
""", unsafe_allow_html=True)

st.title("Professional Adaptive Practice Deck")
st.markdown("Analyze your parsed CV capabilities, align hard skills, and practice tailored Technical, HR behavior and past Project scale tests.")

if "current_questions" not in st.session_state:
    st.session_state["current_questions"] = []
if "current_resume_text" not in st.session_state:
    st.session_state["current_resume_text"] = None
if "candidate_name" not in st.session_state:
    st.session_state["candidate_name"] = "Nominee"
if "custom_api_key" not in st.session_state:
    st.session_state["custom_api_key"] = ""

from utils.llm_handler import render_sidebar_key_manager

with st.sidebar:
    render_sidebar_key_manager()

api_configured = get_gemini_client()

if not st.session_state["current_resume_text"]:
    st.warning("Practice portals require an active CV uploaded. Go back to the 'Resume Analysis' page and compile your profile.")
else:
    st.success("Profile context parsed and ready for questions generation.")
    
    st.markdown("Choose Training Mode & Set Up Deck")
    st.markdown("Click the button below to parse candidate capabilities and generate exactly **20 custom questions** aligned directly with domain experience.")
    
    if not api_configured:
        st.error("Cannot locate proper global GEMINI_API_KEY environment credentials. Add a key inside your configuration files.")
    else:
        if st.button("Generate Balanced 20 Practice Questions Set"):
            with st.spinner("Compiling target behavioral contexts... generating questions..."):
                formatted_prompt = INTERVIEW_PROMPT_TEMPLATE.format(
                    resume_text=st.session_state["current_resume_text"]
                )
                
                payload = call_gemini_with_prompt(formatted_prompt)
                
                if payload and "questions" in payload:
                    st.session_state["current_questions"] = payload["questions"]
                    st.success(f"Successfully generated dynamic practicing deck containing: {len(payload['questions'])} balanced questions!")
                else:
                    last_err = st.session_state.get("last_api_error", "Unknown Error")
                    st.error("Failed to parse dynamic test decks. Re-trigger parsing loop.")
                    st.error(f"**Error Details:** {last_err}")

    if st.session_state["current_questions"]:
        st.markdown("---")
        st.subheader("Interactive Questions Grid Interface")
        
        tech_q = [q for q in st.session_state["current_questions"] if q.get("type") == "Technical"]
        hr_q = [q for q in st.session_state["current_questions"] if q.get("type") == "HR"]
        proj_q = [q for q in st.session_state["current_questions"] if q.get("type") == "Project-Based"]
        
        col_t, col_h, col_p = st.columns(3)
        col_t.metric("Technical Coding Questions", f"{len(tech_q)}", "Target set count")
        col_h.metric("Behavioral HR Questions", f"{len(hr_q)}", "Target set count")
        col_p.metric("Project-Scale Architecture Sets", f"{len(proj_q)}", "Target set count")
        
        st.markdown("---")
        
        for idx, q_item in enumerate(st.session_state["current_questions"]):
            qtype = q_item.get("type", "Technical")
            difficulty = q_item.get("difficulty", "Medium")
            question_desc = q_item.get("question", "Inquiry description mismatch.")
            sample_ans = q_item.get("sampleAnswer", "No reference sample answers created.")
            
            st.markdown(f"""
            <div class="question-card">
                <div>
                    <span class="question-type-badge">{qtype} Question</span>
                    <span class="difficulty-badge">{difficulty}</span>
                </div>
                <h4 style="color:#ffffff; margin: 8px 0; font-size: 15px;">Question {idx+1}: {question_desc}</h4>
            </div>
            """, unsafe_allow_html=True)
            
            with st.expander(f"Reveal Expert Sample Answer Reference / Guide for Question {idx+1}"):
                st.markdown(f"**Best Practice Reference Answer:**\n*{sample_ans}*")
                
                user_notes = st.text_area("Your outline drafting / vocal notes:", key=f"notes_{idx}", placeholder="Write notes here...")
                if user_notes:
                    st.caption("Notes stored locally inside session dictionary.")

        markdown_deck = f"""# AI RESUME DECK - CUSTOMIZED INTERVIEW DECK
Candidate: {st.session_state['candidate_name']}
Generated Practice Questions Output List

"""
        for i, q in enumerate(st.session_state["current_questions"]):
            markdown_deck += f"""
### Question {i+1} [{q.get('type')} - {q.get('difficulty')}]
{q.get('question')}

**Expert Correct Guidance Reference:**
{q.get('sampleAnswer')}
-------------------------------------------------------------------------
"""
        
        st.markdown("---")
        st.download_button(
            label="Download Interactive Practice Deck (.TXT Markdown)",
            data=markdown_deck,
            file_name="Target_Practice_Interview_Deck.txt",
            mime="text/plain"
        )
