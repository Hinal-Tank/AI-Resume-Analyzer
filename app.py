import streamlit as tf
import os
from dotenv import load_dotenv

# Load variables
load_dotenv()

# Streamlit general configuration
tf.set_page_config(
    page_title="AI Resume Analyzer - Dashboard",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Elegant Dark CSS injection matching the specified design guidelines
tf.markdown("""
<style>
    /* Gradient highlight scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: #0d0d12; 
    }
    ::-webkit-scrollbar-thumb {
        background: #1f1f2e; 
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #4f46e5; 
    }
    
    /* General styles */
    .stApp {
        background: #0b0c10;
        color: #c5c6c7;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: #16161e !important;
        border-right: 1px solid #1f1f2e;
    }
    
    /* Cards styling */
    .metric-card {
        background: #16161e;
        border: 1px solid #1f1f2e;
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        text-align: center;
        margin-bottom: 16px;
    }
    .metric-value {
        font-size: 32px;
        font-weight: 800;
        color: #4f46e5;
        margin: 8px 0;
    }
    .metric-label {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #8f909a;
    }
    
    /* Custom features list buttons */
    .feature-box {
        background: #16161e;
        border-left: 4px solid #4f46e5;
        padding: 16px;
        margin: 12px 0;
        border-radius: 0 12px 12px 0;
    }
</style>
""", unsafe_allow_html=True)

# Main Title and Overview
tf.title("AI Resume Analyzer")

tf.markdown("""
Welcome to the **AI Resume Analyzer**, a professional Applicant Tracking System (ATS) feedback platform, alignment engine, and real-time interview coach driven by the Gemini API.

### Applet Workflow Instruction
Use the sidebar layout panel on the left to navigate between different core platform modules:
1. **Resume Analysis**: Submit your CV PDF, extract structural text features, inspect comprehensive ATS grades and soft/hard skills distributions.
2. **Interview Questions**: Conduct live behavioral/architectural practice sessions using lists targeted directly towards your historic strengths and skillsets.
3. **Job Description Matching**: Paste a prospective role details panel, discover critical keyword indexing gaps, and generate optimized resume objective highlights.
""")

# Initialize Session Storing to hold analyses across different pages
if "history" not in tf.session_state:
    tf.session_state["history"] = []
if "current_resume_text" not in tf.session_state:
    tf.session_state["current_resume_text"] = None
if "current_analysis" not in tf.session_state:
    tf.session_state["current_analysis"] = None
if "candidate_name" not in tf.session_state:
    tf.session_state["candidate_name"] = "Nominee"

# Key Checking Interface in Streamlit sidebar
if "custom_api_key" not in tf.session_state:
    tf.session_state["custom_api_key"] = ""

from utils.llm_handler import render_sidebar_key_manager

with tf.sidebar:
    render_sidebar_key_manager()
    tf.markdown("---")
    tf.markdown("### Quick Statistics Dashboard")
    runs_count = len(tf.session_state["history"])
    tf.info(f"Active Audited States Saved in Stash: **{runs_count}**")

# Modern layout grid detailing platform parameters
col1, col2, col3 = tf.columns(3)

with col1:
    tf.markdown("""
    <div class="metric-card">
        <div class="metric-label">Structural Analytics</div>
        <div class="metric-value">0-100</div>
        <div style="font-size: 12px; color: #8f909a;">Rigorous Score Matrix Evaluation</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    tf.markdown("""
    <div class="metric-card">
        <div class="metric-label">Total Audits</div>
        <div class="metric-value">LIVE</div>
        <div style="font-size: 12px; color: #8f909a;">Multi-page active monitoring state</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    tf.markdown("""
    <div class="metric-card">
        <div class="metric-label">Core Engine</div>
        <div class="metric-value">Gemini 1.5</div>
        <div style="font-size: 12px; color: #8f909a;">Optimal cost-efficient reasoning</div>
    </div>
    """, unsafe_allow_html=True)

tf.markdown("### Platform Features Catalog")

tf.markdown("""
<div class="feature-box">
    <strong>Real-Time Resume Auditing:</strong> Instantly inspect and display comprehensive score card metrics covering critical technical skills, strengths, opportunities for optimization and soft metrics.
</div>
<div class="feature-box">
    <strong>Adaptive Interview Coaching:</strong> Generate customized exam datasets featuring Technical, Behavioral, and Project-Based modules based on CV parsing outputs.
</div>
<div class="feature-box">
    <strong>Job Description Alignment:</strong> Perform targeted semantic matching calculations between your current resume assets and a benchmark role description. Identify missing key descriptors.
</div>
""", unsafe_allow_html=True)
