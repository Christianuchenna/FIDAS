# FiDAS Forensic Microservice — Python / Flask

The forensic engine for FiDAS. Runs as a standalone Flask server on port 8000.
Called by the Node.js backend whenever a student uploads a document.

---

## Quick Start

```bash
# 1. Install system dependency (ExifTool)
sudo apt-get install libimage-exiftool-perl   # Ubuntu/Debian
brew install exiftool                          # macOS

# 2. Install Tesseract OCR
sudo apt-get install tesseract-ocr            # Ubuntu/Debian
brew install tesseract                         # macOS

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Copy and fill environment variables
cp .env.example .env

# 5. Seed the MySQL payment database (one-time setup)
python seed_payments_db.py

# 6. Run the service
python app.py

# 7. Test the pipeline
python test_pipeline.py
```

---

## Project Structure

```
fidas-forensic/
├── app.py                   # Flask entry point — POST /analyse
├── pipeline.py              # Chains Layer 1 → 2 → 3
├── requirements.txt
├── seed_payments_db.py      # MySQL test data seeder
├── test_pipeline.py         # End-to-end test
│
└── layers/
    ├── metadata_check.py    # Layer 1 — ExifTool metadata provenance
    ├── ela_check.py         # Layer 2 — ELA pixel forensics (OpenCV/PIL)
    └── ocr_check.py         # Layer 3 — PyTesseract OCR + MySQL cross-ref
```

---

## API

### `GET /health`
Returns `{ "status": "ok" }` — used by Node.js backend to check liveness.

### `POST /analyse`
**Request body (JSON):**
```json
{
  "file_path": "/absolute/path/to/file.jpg",
  "matric_no": "2021/293925",
  "doc_type": "school_fees"
}
```

**Response (JSON):**
```json
{
  "provenance_flag": false,
  "detected_software": null,
  "ela_variance_score": 2.14,
  "ela_flagged": false,
  "laplacian_variance": 312.5,
  "low_quality_flag": false,
  "ocr_rrr_number": "2501-3891-2345",
  "ocr_amount": "45000.00",
  "ocr_student_name": "CHUKWUMA CHRISTIAN UCHENNA",
  "ocr_date": "15/01/2024",
  "db_existence": true,
  "db_ownership": true,
  "db_value_match": true,
  "doc_type": "school_fees",
  "pipeline_errors": []
}
```

---

## The Three Forensic Layers

### Layer 1 — Metadata Provenance (ExifTool)
Reads EXIF/XMP headers. Flags any file that contains traces of
image-editing software (Photoshop, Canva, GIMP, Snapseed, etc.)

### Layer 2 — ELA Pixel Forensics (OpenCV + PIL)
Resaves the image at Q=90%, computes the absolute pixel difference,
amplifies it ×10. Homogeneous output = untampered. Bright localised
clusters = spliced or text-replaced regions. Flags if variance > 5.5%.

### Layer 3 — OCR + SQL Cross-Reference (PyTesseract + MySQL)
Pre-processes the image (Otsu binarization + Gaussian blur), runs
Tesseract OCR, extracts RRR number and amount via regex, then runs
3-point MySQL validation: existence → ownership → value match.

---

## Decision Flow (XAI)
The XAI logic lives in the Node.js `utils/xai.util.js` and maps each
flag to a plain-English student message shown on the dashboard.
