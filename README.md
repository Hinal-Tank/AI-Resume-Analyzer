# AI Resume Analyzer 🎯

A production-quality Applicant Tracking System (ATS) feedback platform, alignment engine, and interactive interview question coach driven by Streamlit and the Google Gemini API.

## Project Structure Overview
```text
AI-Resume-Analyzer/
├── app.py                      # Multi-page welcome dashboard and global styles
├── pages/
│   ├── Resume_Analysis.py      # Detailed ATS scoring, skills parsing & TXT downloads
│   ├── Interview_Questions.py  # Adaptive practice behavior testing decks (20 balanced sets)
│   └── JD_Match.py             # Target Job Description alignments and semantic scores
├── utils/
│   ├── pdf_reader.py           # Multi-page plain-text extraction using PyPDF2
│   ├── prompts.py              # String validation formats & structure templates
│   └── llm_handler.py          # Configuration interfaces and retry handler routines
├── requirements.txt            # Dependency listings
├── .env.example                # Local environment template file
└── README.md                   # Setup manual
```

---

## 🚀 Key Feature Modules
1. **Resume Parser (PyPDF2)**: Upload PDF application files, extract pure text profiles in real-time, and cache documents in session workspace memory formats.
2. **Structural Evaluation Report (Gemini AI)**: Generates detailed ATS matching metrics (0-100 score grids), highlights core hard/soft strengths, lists growth opportunities, and delivers custom feedback tips.
3. **Adaptive Interactive Tutor (20-Set practice dynamic lists)**: Aligns behavior coaching questions categorized precisely by core qualifications. Reveals expert sample mock answers.
4. **Target Role Alignment Tool (JD Match)**: Paste job requisitions and obtain customized match indicators, locate semantic indexing gaps, and replace summary intros with max-index ATS objectives.
5. **Interactive Metrics Visualizers (Plotly)**: Beautiful responsive charts showing soft/hard competencies metrics distributions.

---

## 🛠️ Installation & Setup Manual

To run this application locally on your computer:

### 1. Prerequisite Installations
Ensure Python `>= 3.9` and pip are installed in your execution environment.

### 2. Repository Core Setup
Navigate into your cloned code root directory and install requirements:
```bash
pip install -r requirements.txt
```

### 3. Load Environment Variables
1. Duplicate `.env.example` into a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your confidential API key generated inside your Google AI Studio configuration menus:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```

### 4. Running the Dashboard
Start the Streamlit development server locally:
```bash
streamlit run app.py
```
This boots up the multi-page platform and maps hot reload connections on your local port (typically `http://localhost:8501`).

---

## 🎯 Project Architecture Data Flow
```text
 +--------------+        +-----------------+        +---------------------+
 | Uploaded PDF | =====> | pdf_reader.py   | =====> | cached_resume_text  |
 +--------------+        | (PyPDF2 parser) |        | (st.session_state)  |
                         +-----------------+        +----------+----------+
                                                               |
                                                               v
 +------------------------------------------+       +----------+----------+
 |  llm_handler.py Calls Client Middleware  | <==== |  Prompts Templates  |
 |  (Response Type: application/json)       |       |  (prompts.py maps)  |
 +------------------+-----------------------+       +---------------------+
                    |
                    v
 +------------------+-----------------------+
 | Parsed Structural Reports Dashboard      |
 |  - Match indicators lists, visuals charts|
 |  - Download text options                 |
 +------------------------------------------+
```

---

## 🔮 Roadmap & Future Optimizations
* **Database Integration (Firebase / PostgreSQL)**: Connect external storage databases to save candidate record tables securely and support cross-device authentications.
* **Bulk Import Pipelines**: Support multi-file batches to compare CV directories instantly.
* **PDF Direct Layout Rendering**: Present original resume outlines alongside AI comment boxes.
* **Modern Integration Hooks**: Support syncing directly to personal LinkedIn profiles.
