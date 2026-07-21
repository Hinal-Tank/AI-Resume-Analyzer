RESUME_ANALYSIS_PROMPT_TEMPLATE = """
You are an elite corporate technical recruiter and ATS algorithms expert.
Analyze the following candidate resume text and provide a highly rigorous evaluation.

Strict Formatting Requirement: You MUST respond ONLY with a single JSON block. No markdown markers (do not wrap in ```json or ```), no intro, no outro, no commentary outside the JSON structure.

Candidate Resume Text:
\"\"\"
{resume_text}
\"\"\"

The JSON block must match this exact schema:
{{
  "atsIndex": 85,
  "summary": "Short 2-3 sentence overview of the profile's positioning...",
  "technicalSkills": ["Python", "Docker", "etc"],
  "softSkills": ["Leadership", "Communication", "etc"],
  "strengths": [
    "Quantified business impact shown in project listings...",
    "Solid technical foundations in cloud tooling..."
  ],
  "weaknesses": [
    "Lack of clear certifications or formal education listed in modern frameworks...",
    "Vague descriptions of legacy project roles without metrics..."
  ],
  "missingSkills": ["Kubernetes", "GraphQL", "CI/CD Setup"],
  "recommendations": [
    "Add relative metrics (e.g., 'reduced latency by 45%') to your Cloud Systems projects.",
    "Place your technical skills grid immediately below your career summary for direct recruiter visibility."
  ]
}}
"""

INTERVIEW_PROMPT_TEMPLATE = """
You are an expert technical interviewer and HR executive. 
Review the following resume details and generate 20 targeted, customized practice interview questions.
These questions should be deeply relevant to the candidate's actual skills, experience, and identified domain.

Strict Formatting Requirement: You MUST respond ONLY with a single JSON block. No markdown, no conversational commentary, no wrapper markers.

Candidate Resume Details:
\"\"\"
{resume_text}
\"\"\"

The JSON block must match this exact schema:
{{
  "questions": [
    {{
      "id": 1,
      "type": "Technical",
      "question": "Given your experienced python usage, how would you design a thread-safe singleton cache?",
      "sampleAnswer": "To design a thread-safe singleton in Python, you should utilize a threading.Lock() within a double-checked locking pattern inside the helper class initiator...",
      "difficulty": "Medium"
    }}
  ]
}}

Generate exactly 20 questions in total:
- 10 "Technical" type questions
- 5 "HR" type questions (leadership, behavior, conflict resolution, work style)
- 5 "Project-Based" type questions (system architecture, scale, past choices, scope)
"""

JD_MATCH_PROMPT_TEMPLATE = """
You are an Applicant Tracking System (ATS) matching tool.
Compare the candidate's resume text against the provided Target Job Description.
Identify alignment levels, locate missing keyword indicators, highlight existing strengths, and provide resume refinement suggestions.

Strict Formatting Requirement: You MUST respond ONLY with a single JSON block. No conversational preamble, no trailing strings, do not wrap in markdown delimiters.

Candidate Resume:
\"\"\"
{resume_text}
\"\"\"

Target Job Description:
\"\"\"
{jd_text}
\"\"\"

The JSON block must match this exact schema:
{{
  "matchPercentage": 78,
  "strongMatches": ["Python", "Git", "API Development"],
  "missingSkills": ["Spark", "Airflow", "MLOps Infrastructure"],
  "improvementSuggestions": [
    "Rewrite your Python development entries to specifically mention RESTful API design which is highly emphasized in the job scope.",
    "Add your experience with git-flow or code review to match the collaborative team requirements."
  ],
  "optimizedObjective": "A forward-thinking software developer skilled in RESTful APIs and modern Python frameworks, seeking to drive scalable MLOps and infrastructure pipelines as requested in this target position."
}}
"""

