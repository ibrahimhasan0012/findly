import fitz  # PyMuPDF
import os

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(len(doc)):
        page = doc[page_num]
        text += f"\n--- Page {page_num + 1} ---\n"
        text += page.get_text()
    doc.close()
    return text

# Extract all three lectures
lectures = ['AMCS506_Lec1.pdf', 'AMCS506_Lec2.pdf', 'AMCS506_Lec3.pdf']

for lecture in lectures:
    print(f"\n{'='*60}")
    print(f"Processing: {lecture}")
    print('='*60)
    
    text = extract_pdf_text(lecture)
    
    # Save to text file
    output_file = lecture.replace('.pdf', '.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"Extracted to: {output_file}")
    print(f"Length: {len(text)} characters")

print("\n\nAll lectures extracted successfully!")
