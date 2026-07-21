from fpdf import FPDF
from fpdf.enums import XPos, YPos
import datetime
import re

_UNICODE_REPLACEMENTS = {
    "\u2014": "-",   
    "\u2013": "-",   
    "\u2018": "'",   
    "\u2019": "'",   
    "\u201c": '"',   
    "\u201d": '"',   
    "\u2026": "...", 
    "\u2022": "-",   
    "\u2192": "->",  
    "\u00a0": " ",  
}

def _sanitize(text: str) -> str:
    if not text:
        return ""
    for bad, good in _UNICODE_REPLACEMENTS.items():
        text = text.replace(bad, good)
    return text.encode("latin-1", errors="ignore").decode("latin-1")


class ResumeReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(79, 70, 229)  # matches the app's #4f46e5 accent
        self.cell(0, 10, "AI Resume Analyzer - Audit Report", ln=True, align="C")
        self.set_draw_color(79, 70, 229)
        self.line(10, 20, 200, 20)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(20, 20, 20)
        self.ln(4)
        self.cell(0, 8, title, ln=True)
        self.set_draw_color(220, 220, 220)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(2)

    def body_text(self, text: str):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 6, _sanitize(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def bullet_list(self, items, bullet="- "):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(50, 50, 50)
        for item in items:
            if self.get_y() > 270:
                self.add_page()
            self.multi_cell(
                0, 6, f"{bullet}{_sanitize(item)}",
                new_x=XPos.LMARGIN, new_y=YPos.NEXT
            )
        self.ln(1)


def generate_pdf_report(analysis: dict, candidate_name: str) -> bytes:
    pdf = ResumeReportPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(90, 90, 90)
    generated_on = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    pdf.cell(0, 6, f"Candidate: {candidate_name}    |    Generated: {generated_on}", ln=True)

    ats_score = analysis.get("atsIndex", 0)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 14, f"ATS Score: {ats_score}%", ln=True)

    pdf.section_title("Executive Summary")
    pdf.body_text(analysis.get("summary", "No summary generated."))

    pdf.section_title("Technical Skills")
    tech_skills = analysis.get("technicalSkills", [])
    pdf.body_text(", ".join(tech_skills) if tech_skills else "None detected.")

    pdf.section_title("Soft Skills")
    soft_skills = analysis.get("softSkills", [])
    pdf.body_text(", ".join(soft_skills) if soft_skills else "None detected.")

    pdf.section_title("Strengths")
    pdf.bullet_list(analysis.get("strengths", []) or ["None identified."])

    pdf.section_title("Weaknesses")
    pdf.bullet_list(analysis.get("weaknesses", []) or ["None identified."])

    pdf.section_title("Missing / Recommended Skills")
    pdf.bullet_list(analysis.get("missingSkills", []) or ["None identified."])

    pdf.section_title("Actionable Recommendations")
    pdf.bullet_list(analysis.get("recommendations", []) or ["None generated."])

    raw = pdf.output(dest="S")
    return bytes(raw) if not isinstance(raw, (bytes, bytearray)) else bytes(raw)
