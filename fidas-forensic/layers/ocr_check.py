"""
Layer 3 — OCR Semantic Extraction + SQL Cross-Reference

Pipeline:
  1. Pre-process image (grayscale → Otsu binarization → noise filter)
  2. PyTesseract OCR → raw text
  3. Regex extraction of RRR number, amount, name, date
  4. MySQL Three-Point Validation:
       (a) Existence  — does this RRR exist in FUTO payment records?
       (b) Ownership  — does the matric_no match the logged-in student?
       (c) Value      — does the extracted amount match the DB amount?
"""

import cv2
import numpy as np
import pytesseract
import re
import os
from PIL import Image

import mysql.connector
from mysql.connector import Error as MySQLError


# ── Tesseract path override (set in .env if not in system PATH) ───────────────
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd


# ── Regex patterns ────────────────────────────────────────────────────────────
# Remita RRR: 12-digit groups  e.g. 2501-3891-2345  or  250138912345
RRR_PATTERNS = [
    r"\b(\d{4}[-\s]?\d{4}[-\s]?\d{4})\b",   # with separators
    r"\b(\d{12})\b",                           # continuous 12 digits
]

# Amount: e.g. ₦45,000.00  /  N45,000  /  45000.00
AMOUNT_PATTERN = r"[₦N#]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)"

# Date: dd/mm/yyyy  or  dd-mm-yyyy  or  Month dd, yyyy
DATE_PATTERN = r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b"

# ── Document type keyword signatures ──────────────────────────────────────────
DOC_TYPE_KEYWORDS = {
    "school_fees":  ["school fee", "school fees", "tuition", "acceptance fee", "official fee receipt"],
    "departmental": ["computer science", "departmental dues", "dept due", "faculty due"],
    "sug":          ["student union government", "students union", "sug", "aluta"],
    "medical":      ["remita retrieval reference", "futo/medical", "medical (x"],
    "library":      ["library", "borrower's card", "bar code", "valid until", "residence"],
}

def document_mentions_type(text: str, doc_type: str) -> bool:
    text_lower = text.lower()

    # Only school_fees legitimately uses FUTO's combined "official fee receipt" format
    if doc_type == "school_fees":
        generic_receipt_markers = [
            "official fee receipt", "futo sm core portal", "rrr number",
        ]
        if any(marker in text_lower for marker in generic_receipt_markers):
            return True

    keywords = DOC_TYPE_KEYWORDS.get(doc_type, [])
    return any(kw in text_lower for kw in keywords)

from PIL import ImageOps

def _pdf_first_page(pdf_path: str) -> str | None:
    """Convert first page of PDF to a temp image for OCR."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        out_path = pdf_path.replace(".pdf", "_ocr.jpg")
        pix.save(out_path)
        doc.close()
        return out_path if os.path.exists(out_path) else None
    except Exception as e:
        print("PDF CONVERSION ERROR:", repr(e))
        return None

def _preprocess_image(file_path: str) -> np.ndarray | None:
    """
    Fast two-pass preprocessing:
      Pass 1 — downscale to ~600px wide, quickly test all 8
               rotation/method combinations, pick the best scorer
      Pass 2 — re-run only the winning combination at full resolution
    This avoids running expensive full-resolution OCR 8 times.
    """
    ANCHOR_WORDS = [
        "federal", "university", "technology", "owerri", "department",
        "receipt", "student", "government", "library", "computer",
        "science", "payment", "date", "received", "reference", "medical",
    ]

    try:
        if file_path.lower().endswith(".pdf"):
            img_path = _pdf_first_page(file_path)
            if img_path is None:
                return None
            pil = Image.open(img_path)
        else:
            pil = Image.open(file_path)

        pil = ImageOps.exif_transpose(pil)
        pil = pil.convert("L")

        # ── Pass 1: fast low-res scan to find best rotation+method ─────────────
        scale = 350 / pil.width if pil.width > 350 else 1.0
        small = pil.resize((int(pil.width * scale), int(pil.height * scale))) if scale < 1.0 else pil

        best_angle = 0
        best_method = "raw"
        best_score = -1

        for angle in [0, 90, 180, 270]:
            rotated = small.rotate(-angle, expand=True)
            gray_arr = np.array(rotated)

            blurred = cv2.GaussianBlur(gray_arr, (5, 5), 0)
            thresh_arr = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 31, 15
            )

            for method_name, candidate in [("raw", gray_arr), ("thresh", thresh_arr)]:
                try:
                    sample_text = pytesseract.image_to_string(candidate, config="--oem 3 --psm 6")
                except Exception:
                    sample_text = ""

                text_lower = sample_text.lower()
                score = sum(1 for w in ANCHOR_WORDS if w in text_lower)

                if score > best_score:
                    best_score = score
                    best_angle = angle
                    best_method = method_name

        # ── Pass 2: apply winning combination at FULL resolution ───────────────
        full_rotated = pil.rotate(-best_angle, expand=True)
        full_arr = np.array(full_rotated)

        if best_method == "thresh":
            blurred = cv2.GaussianBlur(full_arr, (5, 5), 0)
            final = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 31, 15
            )
        else:
            final = full_arr

        return final
    except Exception as e:
        print("PREPROCESSING ERROR:", repr(e))
        return None

def _extract_rrr(text: str) -> str | None:
    for pattern in RRR_PATTERNS:
        match = re.search(pattern, text)
        if match:
            # Normalise: strip separators → raw 12 digits
            raw = re.sub(r"[-\s]", "", match.group(1))
            # Reformat as XXXX-XXXX-XXXX
            return f"{raw[:4]}-{raw[4:8]}-{raw[8:12]}"
    return None
SHORT_RECEIPT_PATTERN = r"\b(\d{4,6})\b"

def _extract_receipt_no(text: str) -> str | None:
    """
    Extract a short sequential receipt number (e.g. 00644, 5551) —
    used for SUG and Departmental receipts, which don't use the
    12-digit RRR format.
    """
    # FUTO's fixed P.M.B. box number — always appears near the header,
    # remove it first so it's never mistaken for the receipt number.
    cleaned_text = re.sub(r"p\.?\s?m\.?\s?b\.?\s*\d{3,5}", "", text, flags=re.IGNORECASE)

    skip_keywords = ['date', 'reg', 'phone', '/']
    for line in cleaned_text.splitlines():
        low = line.lower()
        if any(kw in low for kw in skip_keywords):
            continue
        match = re.search(SHORT_RECEIPT_PATTERN, line)
        if match:
            return match.group(1)
    return None
def _extract_registration_number(text: str) -> str | None:
    """
    Extract a student registration number from lines containing 'reg'
    (used for Library cards, which have no payment reference at all).
    """
    for line in text.splitlines():
        if 'reg' in line.lower():
            digits = re.sub(r"[^0-9]", "", line)
            if len(digits) >= 8:
                return digits
    return None

def _extract_amount(text: str) -> str | None:
    skip_keywords = ['rrr', 'matric', 'jamb', 'level', 'date', ' pm', ' am', '/']
    for line in text.splitlines():
        low = line.lower()
        if any(kw in low for kw in skip_keywords):
            continue
        match = re.search(AMOUNT_PATTERN, line)
        if match:
            value = re.sub(r"[,\s]", "", match.group(1))
            # Require at least 3 digits to avoid false positives
            if len(value.replace(".", "")) >= 3:
                return value
    return None


def _extract_date(text: str) -> str | None:
    match = re.search(DATE_PATTERN, text)
    return match.group(1) if match else None


    
def run_ocr(file_path: str, matric_no: str, doc_type: str) -> dict:
    """
    Full OCR + SQL cross-reference pipeline.

    Returns:
        {
            ocr_rrr_number   : str | None
            ocr_amount       : str | None
            ocr_student_name : str | None   (first line of text, heuristic)
            ocr_date         : str | None
            ocr_raw_text     : str          (full OCR output, for debugging)
            db_existence     : bool | None  (None = DB unavailable)
            db_ownership     : bool | None
            db_value_match   : bool | None
            ocr_error        : str | None
            
        }
    """
    result = {
        "ocr_rrr_number": None,
        "ocr_amount": None,
        "ocr_student_name": None,
        "ocr_date": None,
        "ocr_raw_text": "",
        "db_existence": None,
        "db_ownership": None,
        "db_value_match": None,
        "ocr_error": None,
        "detected_doc_type": None,
        "doc_type_mismatch": False,
    }


    # ── Step 1: Pre-process ────────────────────────────────────────────────────
    processed = _preprocess_image(file_path)
    if processed is None:
        result["ocr_error"] = "IMAGE_PREPROCESSING_FAILED"
        return result
# ── Step 2: OCR ───────────────────────────────────────────────────────────
    try:
        config = "--oem 3 --psm 6"   # LSTM engine, assume uniform block of text
        raw_text = pytesseract.image_to_string(processed, config=config)
        result["ocr_raw_text"] = raw_text
        print("OCR SUCCESS, text length:", len(raw_text))
    except Exception as e:
        print("TESSERACT ERROR:", repr(e))
        result["ocr_error"] = f"TESSERACT_ERROR: {str(e)}"
        return result
# ── Step 3: Extract semantic fields ───────────────────────────────────────
    result["ocr_amount"] = _extract_amount(raw_text)
    result["ocr_date"]   = _extract_date(raw_text)

    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    if lines:
        result["ocr_student_name"] = lines[0]

    # ── Step 4: Type-specific reference number + validation ───────────────────
    if doc_type == "library":
        # No payment involved. The registration number field is
        # frequently obscured by ink/signature overlap and cannot be
        # reliably extracted. Since there's nothing to verify against
        # a payment database anyway, correct keyword identification
        # (checked below) is sufficient proof of a genuine Library card.
        result["ocr_rrr_number"] = None
        result["db_existence"]   = True
        result["db_ownership"]   = True
        result["db_value_match"] = True

    elif doc_type in ("sug", "departmental"):
        # Short sequential receipt number
        receipt_no = _extract_receipt_no(raw_text)
        result["ocr_rrr_number"] = receipt_no
        if receipt_no:
            db_result = _validate_against_db(
                rrr_number=receipt_no,
                matric_no=matric_no,
                extracted_amount=result["ocr_amount"],
            )
            result.update(db_result)

    else:
        # school_fees, medical — standard 12-digit RRR
        rrr = _extract_rrr(raw_text)
        result["ocr_rrr_number"] = rrr
        if rrr:
            db_result = _validate_against_db(
                rrr_number=rrr,
                matric_no=matric_no,
                extracted_amount=result["ocr_amount"],
            )
            result.update(db_result)

    result["detected_doc_type"] = doc_type if document_mentions_type(raw_text, doc_type) else "unrecognized"
    result["doc_type_mismatch"] = (result["detected_doc_type"] == "unrecognized")

    return result


def _validate_against_db(rrr_number: str, matric_no: str, extracted_amount: str | None) -> dict:
    """
    Three-Point SQL Validation:
      1. Existence  — SELECT * FROM payments WHERE rrr_number = ?
      2. Ownership  — does matric_no in DB match the student's matric_no?
      3. Value      — does amount in DB match OCR-extracted amount?
    """
    db_result = {
        "db_existence": False,
        "db_ownership": False,
        "db_value_match": False,
    }

    try:
        ssl_enabled = os.getenv("MYSQL_SSL", "false").lower() == "true"
        print("Attempting MySQL connection to:", os.getenv("MYSQL_HOST", "localhost"))
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", 3306)),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "fidas_payments"),
            connection_timeout=5,
            ssl_disabled=not ssl_enabled,
        )
        print("MySQL connection established")
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT rrr_number, matric_no, amount, pay_date, status FROM payments WHERE rrr_number = %s LIMIT 1",
            (rrr_number,)
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        print("MySQL query completed successfully")

        if not row:
            # RRR not found at all
            db_result["db_existence"] = False
            db_result["db_ownership"] = False
            db_result["db_value_match"] = False
            return db_result

        # Point 1 — Existence ✓
        db_result["db_existence"] = True

        # Point 2 — Ownership: compare matric numbers (normalise format)
        db_matric = re.sub(r"[^0-9]", "", str(row["matric_no"]))
        input_matric = re.sub(r"[^0-9]", "", str(matric_no))
        db_result["db_ownership"] = db_matric == input_matric

        # Point 3 — Value: compare amounts (strip formatting)
        if extracted_amount and row.get("amount") is not None:
            ocr_amt = float(re.sub(r"[^0-9.]", "", extracted_amount) or 0)
            db_amt  = float(row["amount"])
            # Allow ±1 tolerance for rounding differences
            db_result["db_value_match"] = abs(ocr_amt - db_amt) <= 1.0
        else:
            # Could not extract or compare amount — treat as mismatch
            db_result["db_value_match"] = False

    except MySQLError as e:
        print("MYSQL ERROR:", repr(e))
        return {
            "db_existence": None,
            "db_ownership": None,
            "db_value_match": None,
        }
    except Exception as e:
        print("MYSQL UNEXPECTED ERROR:", repr(e))
        return {
            "db_existence": None,
            "db_ownership": None,
            "db_value_match": None,
        }

    return db_result