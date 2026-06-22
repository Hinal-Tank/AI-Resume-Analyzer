import PyPDF2
import io
from typing import Optional

def extract_text_from_pdf(pdf_file) -> Optional[str]:
    """
    Extracts plain text from an uploaded PDF file or file-like object using PyPDF2.
    
    Args:
        pdf_file: A Streamlit UploadedFile or file-like object containing PDF data.
        
    Returns:
        str: Extracted clean text, or None if extraction fails.
    """
    try:
        # If it's bytes, wrap it in io.BytesIO
        if isinstance(pdf_file, bytes):
            pdf_file = io.BytesIO(pdf_file)
            
        reader = PyPDF2.PdfReader(pdf_file)
        text_parts = []
        
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
                
        full_text = "\n".join(text_parts).strip()
        if not full_text:
            raise ValueError("No extractable text found in the PDF document.")
            
        return full_text
    except Exception as e:
        print(f"Error extracting PDF: {str(e)}")
        return None
