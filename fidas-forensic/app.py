"""
FiDAS Forensic Microservice — Flask Entry Point
Exposes POST /analyse  →  runs the full 3-layer pipeline
Exposes GET  /health   →  liveness probe for the Node.js backend
"""


import importlib.util
import sys
import pkgutil

# Inject the missing find_loader function back into pkgutil for Python 3.14 compatibility
if not hasattr(pkgutil, 'find_loader'):
    def find_loader(name):
        spec = importlib.util.find_spec(name)
        return spec.loader if spec else None
    pkgutil.find_loader = find_loader
    
    
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import traceback
import tempfile
import requests
from urllib.parse import urlparse

load_dotenv()

from pipeline import run_full_pipeline

app = Flask(__name__)

def _download_to_temp(url: str) -> str:
    """Download a remote file (e.g. Cloudinary URL) to a local temp file for processing."""
    response = requests.get(url, timeout=20)
    response.raise_for_status()

    parsed = urlparse(url)
    ext = os.path.splitext(parsed.path)[1] or ".jpg"

    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp.write(response.content)
    tmp.close()
    return tmp.name

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "FiDAS Forensic Microservice"}), 200


# ── Main forensic endpoint ────────────────────────────────────────────────────
@app.route("/analyse", methods=["POST"])
def analyse():
    """
    Expects JSON body:
        {
            "file_path" : "/absolute/path/to/uploaded/file.jpg",
            "matric_no" : "2021/293925",
            "doc_type"  : "school_fees"
        }

    Returns the full forensic report JSON that maps 1-to-1
    with the Node.js forensicReportSchema in MongoDB.
    """
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    file_path = data.get("file_path")
    matric_no = data.get("matric_no")
    doc_type  = data.get("doc_type")
    
    print("RECEIVED file_path:", repr(file_path))

    # Validate required fields
    if not file_path:
        return jsonify({"error": "file_path is required."}), 400
    if not matric_no:
        return jsonify({"error": "matric_no is required."}), 400
    if not doc_type:
        return jsonify({"error": "doc_type is required."}), 400

    # If file_path is a URL (Cloudinary), download it to a temp local file first
    downloaded_temp_path = None
    if file_path.startswith("http://") or file_path.startswith("https://"):
        try:
            downloaded_temp_path = _download_to_temp(file_path)
            local_file_path = downloaded_temp_path
        except Exception as e:
            print("DOWNLOAD ERROR:", repr(e))
            return jsonify({"error": f"Failed to download file: {str(e)}"}), 502
    else:
        local_file_path = file_path
        if not os.path.exists(local_file_path):
            return jsonify({"error": f"File not found: {local_file_path}"}), 404

    VALID_DOC_TYPES = ["school_fees", "departmental", "sug", "medical", "library"]
    if doc_type not in VALID_DOC_TYPES:
        return jsonify({"error": f"Invalid doc_type. Must be one of: {VALID_DOC_TYPES}"}), 400

    try:
        report = run_full_pipeline(
            file_path=local_file_path,
            matric_no=matric_no,
            doc_type=doc_type,
        )
        return jsonify(report), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Internal forensic pipeline error.", "detail": str(e)}), 500

    finally:
        # Clean up the downloaded temp file
        if downloaded_temp_path and os.path.exists(downloaded_temp_path):
            try:
                os.remove(downloaded_temp_path)
            except Exception:
                pass


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("FLASK_PORT", 8000)))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"\n🔬 FiDAS Forensic Microservice running on port {port}")
    print(f"   Health: http://localhost:{port}/health")
    print(f"   Analyse: POST http://localhost:{port}/analyse\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
