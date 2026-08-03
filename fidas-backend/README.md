# FiDAS Backend — Node.js / Express.js

**FUTO Integrity Detection Authentication System**
Final Year Project — Department of Computer Science, FUTO

---

## Quick Start

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Install dependencies (already done)
npm install

# 3. Start development server
npm run dev

# 4. Health check
curl http://localhost:5000/api/health
```

---

## Project Structure

```
fidas-backend/
├── server.js                  # Entry point
├── .env.example               # Environment variable template
│
├── config/
│   ├── db.mongo.js            # MongoDB connection
│   └── db.mysql.js            # MySQL (payment DB) connection
│
├── models/
│   ├── Student.js             # Student schema + matric_no year validation
│   ├── Document.js            # Document schema + forensic report embedding
│   ├── ClearanceRecord.js     # Final clearance record
│   └── Admin.js               # Admin account schema
│
├── controllers/
│   ├── auth.controller.js     # Register, login, forgot/reset password
│   ├── document.controller.js # Upload, status, finalize clearance
│   └── admin.controller.js    # Admin login, cleared students list
│
├── middleware/
│   ├── auth.middleware.js     # JWT protect for student and admin routes
│   └── upload.middleware.js   # Multer config (5MB, JPG/PNG/PDF only)
│
├── routes/
│   ├── auth.routes.js         # /api/auth/*
│   ├── document.routes.js     # /api/documents/*
│   └── admin.routes.js        # /api/admin/*
│
├── services/
│   ├── email.service.js       # Nodemailer — clearance + reset emails
│   └── forensic.service.js    # HTTP call to Python microservice
│
└── utils/
    ├── token.util.js          # JWT generation
    └── xai.util.js            # Forensic flag → plain English XAI message
```

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register student (2021 & below only) |
| POST | `/login` | Student login → JWT |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password/:token` | Reset password with token |
| GET | `/me` | Get logged-in student (protected) |

### Documents — `/api/documents` (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Get status of all 5 documents |
| POST | `/upload` | Upload a document (triggers forensic analysis) |
| POST | `/finalize` | Finalize clearance (sends email) |

### Admin — `/api/admin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Admin login → JWT |
| POST | `/create` | Create admin account (requires secret) |
| GET | `/cleared-students` | List all cleared students (protected) |

---

## Registration Year Rule
Only students whose registration number **starts with 2021 or an earlier year** can register.
- ✅ `2021/293925` — allowed
- ✅ `2020/123456` — allowed
- ❌ `2022/456789` — blocked

---

## Document Types
Each student must verify exactly 5 documents:
1. `school_fees` — School fees receipt
2. `departmental` — Departmental dues receipt
3. `sug` — SUG receipt
4. `medical` — FUTO medical receipt
5. `library` — Library receipt

---

## Next Steps
- **Step 2:** Python forensic microservice (ELA + Metadata + OCR)
- **Step 3:** MySQL payment DB seed data
- **Step 4:** Connect React frontend
