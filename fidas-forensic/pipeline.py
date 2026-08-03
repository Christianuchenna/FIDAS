"""
Forensic Pipeline Orchestrator
Chains Layer 1 → Layer 2 → Layer 3 and returns a unified JSON report.
"""

from layers.metadata_check import check_metadata
from layers.ela_check import run_ela
from layers.ocr_check import run_ocr


def run_full_pipeline(file_path: str, matric_no: str, doc_type: str) -> dict:
    """
    Run all three forensic layers on a document file.

    Args:
        file_path  : absolute path to the uploaded document
        matric_no  : student's registration number (for OCR ownership check)
        doc_type   : one of school_fees | departmental | sug | medical | library

    Returns a unified forensic report dict that maps 1-to-1
    with the MongoDB forensicReportSchema in the Node.js backend.
    """

    report = {
        # ── Layer 1 ──────────────────────────────────────────────
        "provenance_flag": False,
        "detected_software": None,

        # ── Layer 2 ──────────────────────────────────────────────
        "ela_variance_score": None,
        "ela_flagged": False,
        "laplacian_variance": None,
        "low_quality_flag": False,
# ── Layer 3 ──────────────────────────────────────────────
        "ocr_rrr_number": None,
        "ocr_amount": None,
        "ocr_student_name": None,
        "ocr_date": None,
        "db_existence": None,
        "db_ownership": None,
        "db_value_match": None,
        "detected_doc_type": None,
        "doc_type_mismatch": False,
        # ── Meta ──────────────────────────────────────────────────
        "doc_type": doc_type,
        "pipeline_errors": [],
    }

    # ── Layer 1: Metadata ─────────────────────────────────────────────────────
    try:
        meta = check_metadata(file_path)
        report["provenance_flag"]   = meta.get("provenance_flag", False)
        report["detected_software"] = meta.get("detected_software")
        
    except Exception as e:
        report["pipeline_errors"].append(f"L1_METADATA: {str(e)}")

    # ── Layer 2: ELA ──────────────────────────────────────────────────────────
    try:
        ela = run_ela(file_path)
        report["ela_variance_score"] = ela.get("ela_variance_score")
        report["ela_flagged"]        = ela.get("ela_flagged", False)
        report["laplacian_variance"] = ela.get("laplacian_variance")
        report["low_quality_flag"]   = ela.get("low_quality_flag", False)
        if ela.get("error"):
            report["pipeline_errors"].append(f"L2_ELA: {ela['error']}")
    except Exception as e:
        report["pipeline_errors"].append(f"L2_ELA: {str(e)}")

    # ── Layer 3: OCR + SQL ────────────────────────────────────────────────────
    try:
        ocr = run_ocr(file_path, matric_no, doc_type)
        report["ocr_rrr_number"]   = ocr.get("ocr_rrr_number")
        report["ocr_amount"]       = ocr.get("ocr_amount")
        report["ocr_student_name"] = ocr.get("ocr_student_name")
        report["ocr_date"]         = ocr.get("ocr_date")
        report["db_existence"]     = ocr.get("db_existence")
        report["db_ownership"]     = ocr.get("db_ownership")
        report["db_value_match"]   = ocr.get("db_value_match")
        report["detected_doc_type"] = ocr.get("detected_doc_type")
        report["doc_type_mismatch"] = ocr.get("doc_type_mismatch", False)
        if ocr.get("ocr_error"):
            report["pipeline_errors"].append(f"L3_OCR: {ocr['ocr_error']}")
    except Exception as e:
        report["pipeline_errors"].append(f"L3_OCR: {str(e)}")

    return report
