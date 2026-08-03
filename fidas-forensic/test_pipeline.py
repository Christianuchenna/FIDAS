"""
FiDAS Forensic Pipeline — End-to-End Test
Generates a synthetic receipt image and runs it through all 3 layers.
Run:  python test_pipeline.py
"""

import os
import sys
import json

# Make sure layers are importable
sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image, ImageDraw, ImageFont
import tempfile

from pipeline import run_full_pipeline


def create_test_receipt(rrr="2501-3891-2345", matric="2021/293925", amount="45,000.00") -> str:
    """
    Create a simple synthetic receipt image for testing.
    Returns path to the temp file.
    """
    img = Image.new("RGB", (600, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    lines = [
        "FEDERAL UNIVERSITY OF TECHNOLOGY OWERRI",
        "SCHOOL FEES PAYMENT RECEIPT",
        "------------------------------------",
        f"Student Name : CHUKWUMA CHRISTIAN UCHENNA",
        f"Matric No    : {matric}",
        f"Department   : COMPUTER SCIENCE",
        f"Session      : 2023/2024",
        f"Amount Paid  : N{amount}",
        f"RRR          : {rrr}",
        f"Date         : 15/01/2024",
        "------------------------------------",
        "Status       : PAYMENT SUCCESSFUL",
    ]

    y = 30
    for line in lines:
        draw.text((30, y), line, fill=(0, 0, 0))
        y += 28

    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name)
    tmp.close()
    return tmp.name


def run_tests():
    print("\n" + "="*60)
    print("  FiDAS Forensic Pipeline — Test Run")
    print("="*60 + "\n")

    # ── Test 1: Clean receipt (should pass all layers) ──────────────────────
    print("TEST 1: Clean receipt image")
    receipt_path = create_test_receipt()
    report = run_full_pipeline(
        file_path=receipt_path,
        matric_no="2021/293925",
        doc_type="school_fees",
    )
    print(json.dumps(report, indent=2))
    os.unlink(receipt_path)

    print("\n" + "-"*60 + "\n")

    # ── Test 2: File not found ────────────────────────────────────────────────
    print("TEST 2: Non-existent file")
    report2 = run_full_pipeline(
        file_path="/tmp/does_not_exist.jpg",
        matric_no="2021/293925",
        doc_type="school_fees",
    )
    print(json.dumps(report2, indent=2))

    print("\n" + "="*60)
    print("  Tests complete")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_tests()
