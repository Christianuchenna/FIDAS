"""
MySQL Payment DB Seed Script
Creates the `fidas_payments` database and populates it with
realistic sample payment records for testing all 3 OCR validation points.

Run once:  python seed_payments_db.py
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

# ── Sample payment records ─────────────────────────────────────────────────────
# Each row = one payment a student would have made to FUTO
SAMPLE_PAYMENTS = [
    # (rrr_number,         matric_no,      amount,    doc_type,       pay_date,     status)
    ("2501-3891-2345", "2021293925",  45000.00,  "school_fees",    "2024-01-15", "SUCCESS"),
    ("3601-4892-3456", "2021293925",  5000.00,   "departmental",   "2024-01-16", "SUCCESS"),
    ("4701-5893-4567", "2021293925",  2000.00,   "sug",            "2024-01-16", "SUCCESS"),
    ("5801-6894-5678", "2021293925",  3500.00,   "medical",        "2024-01-17", "SUCCESS"),
    ("6901-7895-6789", "2021293925",  1500.00,   "library",        "2024-01-17", "SUCCESS"),

    # Second test student
    ("7001-8896-7890", "2020184530",  45000.00,  "school_fees",    "2024-01-10", "SUCCESS"),
    ("8101-9897-8901", "2020184530",  5000.00,   "departmental",   "2024-01-11", "SUCCESS"),
    ("9201-0898-9012", "2020184530",  2000.00,   "sug",            "2024-01-11", "SUCCESS"),
    ("0301-1899-0123", "2020184530",  3500.00,   "medical",        "2024-01-12", "SUCCESS"),
    ("1401-2890-1234", "2020184530",  1500.00,   "library",        "2024-01-12", "SUCCESS"),
    ("2207-5741-3605", "20211293925", 108000.00, "school_fees", "2023-10-25", "SUCCESS"),
    ("1608-9238-3446", "20211293925", 62500.00,  "school_fees", "2023-09-02", "SUCCESS"),
    ("3112-0856-3323", "20211293925", 123000.00, "school_fees", "2025-02-19", "SUCCESS"),
    ("3413-5780-1648", "20211293925", 126000.00, "school_fees", "2025-10-30", "SUCCESS"),
    ("2410-5208-3632", "20211293925", 62500.00,  "school_fees", "2024-05-24", "SUCCESS"),
    ("00644", "20211269405", 3000.00, "sug",          "2022-12-21", "SUCCESS"),
    ("5551",  "20211269405", 2000.00, "departmental",  "2022-12-21", "SUCCESS"),
    ("2014-1477-6475",  "20211269405", 126000.00, "school_fees",  "2026-01-20", "SUCCESS"),
    ("2736-4918-5204", "20211293925", 3500.00, "medical", "2026-07-27", "SUCCESS"),
    ("3847-1529-6830", "20211269405", 3500.00, "medical", "2026-07-27", "SUCCESS"),
]


CREATE_DB_SQL = "CREATE DATABASE IF NOT EXISTS fidas_payments;"

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS payments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    rrr_number  VARCHAR(20) NOT NULL UNIQUE,
    matric_no   VARCHAR(20) NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    doc_type    VARCHAR(30) NOT NULL,
    pay_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rrr (rrr_number),
    INDEX idx_matric (matric_no)
);
"""

INSERT_SQL = """
INSERT IGNORE INTO payments (rrr_number, matric_no, amount, doc_type, pay_date, status)
VALUES (%s, %s, %s, %s, %s, %s);
"""


def seed():
    try:
        # Connect without specifying database first
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", 3306)),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
        )
        cursor = conn.cursor()

        # Create DB
        cursor.execute(CREATE_DB_SQL)
        cursor.execute("USE fidas_payments;")
        print("✅ Database `fidas_payments` ready")

        # Create table
        cursor.execute(CREATE_TABLE_SQL)
        print("✅ Table `payments` ready")

        # Insert sample records
        for row in SAMPLE_PAYMENTS:
            cursor.execute(INSERT_SQL, row)
        conn.commit()
        print(f"✅ Seeded {len(SAMPLE_PAYMENTS)} payment records")

        cursor.close()
        conn.close()
        print("\n🌱 MySQL seed complete. FiDAS payment DB is ready for testing.\n")

    except Error as e:
        print(f"❌ MySQL seed error: {e}")


if __name__ == "__main__":
    seed()
