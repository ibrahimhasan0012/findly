import fitz  # PyMuPDF
from PIL import Image
import io
import os

# Open the PDF
pdf_path = "CFD Handnote 7 Feb.pdf"
doc = fitz.open(pdf_path)

print(f"PDF has {len(doc)} pages")

# Extract images from each page
for page_num in range(len(doc)):
    page = doc[page_num]
    
    # Get page as image
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
    
    # Save as PNG
    img_filename = f"handnote_page_{page_num + 1}.png"
    pix.save(img_filename)
    print(f"Saved: {img_filename} ({pix.width}x{pix.height})")

doc.close()
print("\nAll pages extracted as images!")
