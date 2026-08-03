"""
Layer 1 — Metadata Provenance Check
Uses ExifTool to interrogate EXIF/XMP headers for traces
of image-editing software (Photoshop, Canva, PicsArt, etc.)
"""

import exiftool
import os

# Software names that indicate the file was created or edited
# in a consumer image-editing tool rather than a scanner or camera
SUSPICIOUS_SOFTWARE = [
    "adobe photoshop",
    "photoshop",
    "canva",
    "picsart",
    "snapseed",
    "adobe express",
    "adobe illustrator",
    "adobe lightroom",
    "gimp",
    "paint.net",
    "affinity photo",
    "pixlr",
    "fotor",
    "corel",
    "inkscape",
]

# Fields ExifTool exposes that can carry software signatures
SOFTWARE_FIELDS = [
    "EXIF:Software",
    "XMP:CreatorTool",
    "XMP:Creator",
    "PDF:Creator",
    "PDF:Producer",
    "Composite:Software",
]


def check_metadata(file_path: str) -> dict:
    """
    Interrogate a file's EXIF/XMP metadata for editing-software signatures.

    Returns:
        {
            provenance_flag   : bool   — True if suspicious software detected or metadata absent
            detected_software : str    — name of detected software, or None
            raw_metadata      : dict   — full ExifTool output for audit trail
            no_metadata       : bool   — True if file has no metadata at all (also suspicious)
        }
    """
    result = {
        "provenance_flag": False,
        "detected_software": None,
        "raw_metadata": {},
        "no_metadata": False,
    }

    if not os.path.exists(file_path):
        result["provenance_flag"] = True
        result["detected_software"] = "FILE_NOT_FOUND"
        return result

    try:
        with exiftool.ExifToolHelper() as et:
            metadata_list = et.get_metadata(file_path)
            if not metadata_list:
                result["provenance_flag"] = True
                result["no_metadata"] = True
                return result

            metadata = metadata_list[0]
            result["raw_metadata"] = metadata

            # Check all software-related fields
            for field in SOFTWARE_FIELDS:
                value = metadata.get(field, "")
                if not value:
                    continue
                value_lower = str(value).lower()
                for suspicious in SUSPICIOUS_SOFTWARE:
                    if suspicious in value_lower:
                        result["provenance_flag"] = True
                        result["detected_software"] = str(value)
                        return result

            # Zero-trust: if NO standard origin fields exist at all, treat as suspicious
            has_origin = any(
                metadata.get(f) for f in [
                    "EXIF:Make", "EXIF:Model",          # camera/scanner device
                    "EXIF:Software",                     # any software tag
                    "XMP:CreatorTool",
                    "File:FileType",
                ]
            )
            if not has_origin:
                result["provenance_flag"] = True
                result["no_metadata"] = True

    except Exception as e:
        # If ExifTool fails entirely, flag as suspicious
        result["provenance_flag"] = True
        result["detected_software"] = f"EXIFTOOL_ERROR: {str(e)}"

    return result
