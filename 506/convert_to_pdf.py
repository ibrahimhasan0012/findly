# Convert DOCX to PDF using Word COM automation
import os
import sys

try:
    import win32com.client
except ImportError:
    print("Installing pywin32...")
    os.system("pip install pywin32")
    import win32com.client

# Paths
docx_path = os.path.abspath("DWT_2012_Complete_Solution.docx")
pdf_path = os.path.abspath("DWT_2012_Complete_Solution.pdf")

# Create Word application
word = win32com.client.Dispatch("Word.Application")
word.Visible = False

try:
    # Open DOCX
    doc = word.Documents.Open(docx_path)
    
    # Save as PDF (format 17 = PDF)
    doc.SaveAs(pdf_path, FileFormat=17)
    
    # Close document
    doc.Close()
    
    print(f"✓ Created: DWT_2012_Complete_Solution.pdf")
    print("\nPDF created from DOCX with all formatting preserved!")
    
except Exception as e:
    print(f"Error: {e}")
    print("\nAlternative: Open DWT_2012_Complete_Solution.docx in Word and use File > Save As > PDF")
    
finally:
    # Quit Word
    word.Quit()
