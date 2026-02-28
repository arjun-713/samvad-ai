import sys
import os
from pdf2image import convert_from_path
from pyzbar.pyzbar import decode
import argparse

def extract_links_from_pdf(pdf_path: str):
    """Converts PDF pages to images and decodes QR codes."""
    print(f"Opening PDF: {pdf_path}")
    try:
        pages = convert_from_path(pdf_path)
    except Exception as e:
        print(f"Error converting PDF: {e}")
        print("Note: You may need 'poppler-utils' installed (sudo apt install poppler-utils)")
        return

    print(f"Found {len(pages)} pages. Scanning for QR codes...")
    
    unique_links = set()
    for i, page in enumerate(pages):
        # Scan page for barcodes/QR codes
        decoded_objects = decode(page)
        for obj in decoded_objects:
            link = obj.data.decode('utf-8')
            if link.startswith('http'):
                unique_links.add(link)
        
        if (i + 1) % 5 == 0:
            print(f"Processed {i+1} pages...")

    print(f"\nFound {len(unique_links)} unique links:")
    for link in sorted(list(unique_links)):
        print(link)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract QR code links from a PDF")
    parser.add_argument("pdf", help="Path to the PDF file")
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf):
        print(f"File not found: {args.pdf}")
        sys.exit(1)
        
    extract_links_from_pdf(args.pdf)
