import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import streamlit as st

# Load environment variables
load_dotenv()

def get_active_api_key() -> Optional[str]:
    """
    Resolves the API key by checking Streamlit session state fallback and environment variables.
    """
    # 1. Check Streamlit user inputted session state first
    session_key = st.session_state.get("custom_api_key")
    if session_key and session_key.strip():
        return session_key.strip()
    
    # 2. Check standard system environment variable
    env_key = os.getenv("GEMINI_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
        
    return None

def fetch_available_models() -> list:
    """
    Queries the Gemini API to find which models are accessible to the current API key.
    Stores the list in st.session_state["available_models"].
    """
    # Quick caching check
    if "available_models" in st.session_state and st.session_state["available_models"]:
        return st.session_state["available_models"]
        
    api_key = get_active_api_key()
    if not api_key:
        st.session_state["available_models"] = []
        return []
        
    try:
        genai.configure(api_key=api_key)
        models_list = []
        # Attempt to list models
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                clean_name = m.name.replace("models/", "")
                models_list.append(clean_name)
        
        st.session_state["available_models"] = models_list
        st.session_state["list_models_error"] = None
        return models_list
    except Exception as e:
        err_msg = str(e)
        st.session_state["list_models_error"] = err_msg
        st.session_state["available_models"] = []
        print(f"Failed to fetch available models: {err_msg}")
        return []

def get_gemini_client() -> bool:
    """
    Initializes and validates the Gemini API key.
    
    Returns:
        bool: True if key is set and valid, False otherwise.
    """
    api_key = get_active_api_key()
    if not api_key:
        return False
    try:
        genai.configure(api_key=api_key)
        # Instant local verification - do not make blocking network list-calls on load
        return True
    except Exception as e:
        print(f"Gemini configuration error: {str(e)}")
        return False

def clean_json_response(raw_text: str) -> str:
    """
    Cleans up common formatting glitches in code responses:
    removes block markers, extracts underlying JSON string, and strips trailing JS comments.
    """
    trimmed = raw_text.strip()
    # Remove standard markdown code blocks
    trimmed = re.sub(r"^```json\s*", "", trimmed, flags=re.IGNORECASE)
    trimmed = re.sub(r"^```\s*", "", trimmed)
    trimmed = re.sub(r"```$", "", trimmed)
    
    # Clean up single-line JavaScript style comments (e.g. // some comment)
    cleaned_lines = []
    for line in trimmed.splitlines():
        # Strip comments that are not part of a URL (e.g. not preceded by ':')
        cleaned_line = re.sub(r'\s*//.*$', '', line)
        cleaned_lines.append(cleaned_line)
        
    return "\n".join(cleaned_lines).strip()

def select_active_model() -> genai.GenerativeModel:
    """
    Dynamically resolves the active Gemini model based on user selection,
    available models from API listing, and automatic fallbacks.
    """
    api_key = get_active_api_key()
    if api_key:
        genai.configure(api_key=api_key)
        
    # Check if user selected one or if there's an available list
    selected_model = st.session_state.get("selected_gemini_model")
    if selected_model and selected_model.strip():
        return genai.GenerativeModel(selected_model)
        
    # Try dynamic loading
    models = fetch_available_models()
    if models:
        # Check priority list
        # We prefer gemini-2.5-flash, gemini-3.5-flash, gemini-1.5-flash, etc.
        priority = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]
        for p in priority:
            if p in models:
                st.session_state["selected_gemini_model"] = p
                return genai.GenerativeModel(p)
        # Otherwise use first available model
        st.session_state["selected_gemini_model"] = models[0]
        return genai.GenerativeModel(models[0])
        
    # Fetch failed or list is empty: default to modern standard name
    return genai.GenerativeModel("gemini-2.5-flash")

def call_gemini_with_prompt(prompt: str) -> Optional[Dict[str, Any]]:
    """
    Executes a structured query against Gemini with comprehensive logging, fallback strategies
    and raw JSON cleaning routines.
    
    Args:
        prompt (str): Instantiated instruction string.
        
    Returns:
        Optional[dict]: Parsed response model or None if a failure occurs.
    """
    # Reset any previous cached error
    st.session_state["last_api_error"] = None
    
    api_key = get_active_api_key()
    if api_key:
        genai.configure(api_key=api_key)
        
    # Resolve the preferred model
    preferred_model_name = "gemini-2.5-flash"
    selected_model = st.session_state.get("selected_gemini_model")
    if selected_model and selected_model.strip():
        preferred_model_name = selected_model.strip()
    else:
        models = fetch_available_models()
        if models:
            priority = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]
            found = False
            for p in priority:
                if p in models:
                    preferred_model_name = p
                    found = True
                    break
            if not found:
                preferred_model_name = models[0]
                
    # Build robust candidate queue to rotate through in case of errors (429, 404, etc.)
    candidates = [preferred_model_name]
    fallback_pool = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-2.5-pro"]
    for f in fallback_pool:
        if f not in candidates:
            candidates.append(f)
            
    errors = []
    
    # Iterate over candidates
    for model_name in candidates:
        # First Pass: JSON schema constrained mode
        try:
            print(f"Attempting JSON-constrained generation with model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=dict(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            if response and response.text:
                json_string = clean_json_response(response.text)
                payload = json.loads(json_string)
                # Success! Persist this as the verified working model for subsequent calls
                st.session_state["selected_gemini_model"] = model_name
                return payload
            raise ValueError("Empty response received from LLM node in JSON mode.")
        except Exception as e:
            err_msg = str(e)
            print(f"JSON mode failed on {model_name}: {err_msg}")
            errors.append(f"{model_name} (JSON Mode) failed: {err_msg}")
            
            # Second Pass: Relaxed mode for this model
            try:
                print(f"Attempting relaxed fallback generation with model: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    json_string = clean_json_response(response.text)
                    payload = json.loads(json_string)
                    # Success!
                    st.session_state["selected_gemini_model"] = model_name
                    return payload
                raise ValueError("Empty fallback response in relaxed mode.")
            except Exception as e2:
                err_msg2 = str(e2)
                print(f"Relaxed mode failed on {model_name}: {err_msg2}")
                errors.append(f"{model_name} (Relaxed Mode) failed: {err_msg2}")
                
    # If all candidate models have failed, surface comprehensive trace
    st.session_state["last_api_error"] = " || ".join(errors)
    return None

def render_sidebar_key_manager():
    """
    Renders the sidebar branding and handles key setup only when necessary.
    If standard GEMINI_API_KEY environment credentials exist, this function runs
    completely silently, keeping the interface uncluttered and professional by omitting
    dynamic selectors, debug alerts, overriding options, and other key manager logs.
    """
    # 1. Quiet, high-fidelity branding image
    st.image(
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300", 
        width=230, 
        caption="Analysis Portal Powered by Google Gemini"
    )
    
    active_key = get_active_api_key()
    
    # 2. Key management is entirely silent if the key is already active/loaded.
    # Otherwise, render a humble setup input box.
    if not active_key:
        st.markdown("### 🔑 API Key Setup")
        st.info("To check metrics and run resumes, please set your Gemini API Key in the AI Studio cloud panel or paste it below:")
        input_key = st.text_input(
            "Paste API Key here:",
            value=st.session_state.get("custom_api_key", ""),
            type="password",
            placeholder="Starts with AIzaSy..."
        )
        if input_key != st.session_state.get("custom_api_key", ""):
            st.session_state["custom_api_key"] = input_key
            st.rerun()

