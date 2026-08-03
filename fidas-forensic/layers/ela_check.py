"""
Layer 2 — Error Level Analysis (ELA) Pixel Forensics
Implements the new ELA algorithm described in the project:

    I_resave  = JPEG resave of I_orig at Q=90%
    D         = |I_orig - I_resave|
    D_enhanced = D * S   (S = scale factor, default 10)

In an untampered document D_enhanced is spatially homogeneous.
Localised high-brightness clusters indicate splicing, cloning,
or text replacement — regions that were re-compressed at a
different quality than the surrounding image surface.
"""

import cv2
import numpy as np
from PIL import Image
import os
import tempfile


# ── Thresholds (overridable via environment) ──────────────────────────────────
import os as _os

ELA_VARIANCE_THRESHOLD = float(_os.getenv("ELA_VARIANCE_THRESHOLD", 5.5))
ELA_RESAVE_QUALITY     = int(_os.getenv("ELA_RESAVE_QUALITY", 90))
ELA_SCALE_FACTOR       = int(_os.getenv("ELA_SCALE_FACTOR", 10))
LAPLACIAN_THRESHOLD    = float(_os.getenv("LAPLACIAN_VARIANCE_THRESHOLD", 100))


def check_image_quality(image_gray: np.ndarray) -> dict:
    """
    Compute Laplacian variance to detect blurry / low-DPI images.
    Returns { low_quality_flag, laplacian_variance }
    """
    lap_var = float(cv2.Laplacian(image_gray, cv2.CV_64F).var())
    return {
        "low_quality_flag": lap_var < LAPLACIAN_THRESHOLD,
        "laplacian_variance": round(lap_var, 4),
    }


def run_ela(file_path: str) -> dict:
    """
    Full ELA pipeline for a single document image.

    Steps:
      1. Load original image as RGB array
      2. Resave at Q=90% to a temp file → I_resave
      3. Reload I_resave
      4. Compute difference map D = |I_orig - I_resave|
      5. Amplify: D_enhanced = D * S
      6. Compute global mean variance as % of max possible (255)
      7. Analyse spatial clustering of anomaly regions

    Returns:
        {
            ela_variance_score : float  — global ELA variance as % (0–100)
            ela_flagged        : bool   — True if variance > threshold
            laplacian_variance : float  — image sharpness score
            low_quality_flag   : bool   — True if image is too blurry
            ela_heatmap_path   : str    — path to saved heatmap PNG (for audit)
        }
    """
    result = {
        "ela_variance_score": None,
        "ela_flagged": False,
        "laplacian_variance": None,
        "low_quality_flag": False,
        "ela_heatmap_path": None,
        "error": None,
    }

    if not os.path.exists(file_path):
        result["error"] = "FILE_NOT_FOUND"
        return result

    try:
        # ── Handle PDF: convert first page to image ────────────────────────────
        if file_path.lower().endswith(".pdf"):
            file_path = _pdf_to_image(file_path)
            if file_path is None:
                result["error"] = "PDF_CONVERSION_FAILED"
                return result

        # ── Load original ──────────────────────────────────────────────────────
        pil_orig = Image.open(file_path).convert("RGB")
        arr_orig = np.array(pil_orig, dtype=np.float32)

        # ── Quality check (grayscale) ──────────────────────────────────────────
        gray = cv2.cvtColor(np.array(pil_orig), cv2.COLOR_RGB2GRAY)
        quality = check_image_quality(gray)
        result["laplacian_variance"] = quality["laplacian_variance"]
        result["low_quality_flag"]   = quality["low_quality_flag"]

        # If image is too blurry, skip ELA (results would be unreliable)
        if quality["low_quality_flag"]:
            return result

        # ── Resave at Q=90% ────────────────────────────────────────────────────
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name
        pil_orig.save(tmp_path, "JPEG", quality=ELA_RESAVE_QUALITY)

        # ── Reload resaved ─────────────────────────────────────────────────────
        pil_resave = Image.open(tmp_path).convert("RGB")
        arr_resave = np.array(pil_resave, dtype=np.float32)
        os.unlink(tmp_path)

        # ── Ensure same shape (PIL may round dimensions slightly) ──────────────
        h = min(arr_orig.shape[0], arr_resave.shape[0])
        w = min(arr_orig.shape[1], arr_resave.shape[1])
        arr_orig   = arr_orig[:h, :w]
        arr_resave = arr_resave[:h, :w]

        # ── Difference map ─────────────────────────────────────────────────────
        diff = np.abs(arr_orig - arr_resave)
        enhanced = np.clip(diff * ELA_SCALE_FACTOR, 0, 255).astype(np.uint8)

        # ── Global ELA variance score as % of max (255) ───────────────────────
        mean_enhanced = float(np.mean(enhanced))
        ela_score = round((mean_enhanced / 255.0) * 100, 4)
        result["ela_variance_score"] = ela_score
        result["ela_flagged"] = ela_score > ELA_VARIANCE_THRESHOLD

        # ── Save heatmap for audit trail ───────────────────────────────────────
        heatmap_path = _save_heatmap(enhanced, file_path)
        result["ela_heatmap_path"] = heatmap_path

    except Exception as e:
        result["error"] = str(e)

    return result


def _pdf_to_image(pdf_path: str) -> str | None:
    """Convert first page of a PDF to a temporary JPEG for ELA processing."""
    try:
        import subprocess
        out_path = pdf_path.replace(".pdf", "_page1.jpg")
        subprocess.run(
            ["pdftoppm", "-jpeg", "-f", "1", "-l", "1", "-r", "150", pdf_path,
             out_path.replace("_page1.jpg", "")],
            check=True, capture_output=True
        )
        # pdftoppm appends -1 to the filename
        candidate = out_path.replace("_page1.jpg", "-1.jpg")
        return candidate if os.path.exists(candidate) else None
    except Exception:
        return None


def _save_heatmap(enhanced: np.ndarray, source_path: str) -> str | None:
    """Save the amplified ELA difference map as a grayscale PNG for audit."""
    try:
        base = os.path.splitext(source_path)[0]
        heatmap_path = f"{base}_ela_heatmap.png"
        # Convert to grayscale heatmap (mean across channels)
        gray_enhanced = np.mean(enhanced, axis=2).astype(np.uint8)
        cv2.imwrite(heatmap_path, gray_enhanced)
        return heatmap_path
    except Exception:
        return None
