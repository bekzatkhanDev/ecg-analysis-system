# Sequence Diagrams — ECG Analysis System

---

## 1. Doctor — Registration & Login

```mermaid
sequenceDiagram
    actor Doctor
    participant FE  as Frontend
    participant BE  as FastAPI
    participant DB  as SQLite

    Doctor->>FE: Fill register form\n(name · email · password · role=doctor)
    FE->>BE: POST /api/auth/register
    BE->>BE: validate role ∈ {doctor, patient}
    BE->>BE: bcrypt.hash(password)
    BE->>DB: INSERT INTO users
    DB-->>BE: user row
    BE-->>FE: UserResponse {id, email, role}

    Doctor->>FE: Fill login form
    FE->>BE: POST /api/auth/login
    BE->>DB: SELECT * FROM users WHERE email=?
    DB-->>BE: user row
    BE->>BE: verify password hash
    BE->>BE: create JWT (sub=user.id, exp=8h)
    BE-->>FE: {access_token}
    FE->>FE: authStore.setToken()\ncookies / localStorage
    FE->>BE: GET /api/users/me  [Bearer token]
    BE-->>FE: UserResponse {id, email, role}
    FE->>FE: authStore.setUser()
```

---

## 2. Doctor — ECG Upload & ML Analysis

```mermaid
sequenceDiagram
    actor Doctor
    participant FE   as Frontend
    participant BE   as FastAPI
    participant ML   as ModelService\n(PyTorch)
    participant DB   as SQLite

    Doctor->>FE: Open Dashboard
    FE->>BE: GET /api/ecg/patients  [Bearer]
    BE->>DB: SELECT * FROM users WHERE role='patient'
    DB-->>BE: patient rows
    BE-->>FE: PatientUserResponse[]
    FE->>FE: PatientSelector renders dropdown

    Doctor->>FE: Select patient (or leave anonymous)
    Doctor->>FE: Drag & drop ECG file (.json / .csv / .dat)
    FE->>FE: Parse file client-side\n→ ecgData (12×5000)\n→ analysisStore.setECGData()
    FE->>FE: ECGChart renders preview

    Doctor->>FE: Click "Start Analysis"
    FE->>BE: POST /api/ecg/analyze\n  file: multipart\n  patient_id: form field
    BE->>BE: _parse_ecg_file()\ntry JSON → CSV → wfdb .dat
    BE->>ML: predict_proba_single(signal 12×5000)
    ML->>ML: Z-score normalize\nCNN forward pass\nTransformer encoder\nSoftmax → 5 probs
    ML-->>BE: {NORM:0.05, MI:0.82, STTC:0.06,\n CD:0.04, HYP:0.03}
    BE->>DB: INSERT INTO records\n(doctor_id, patient_id,\n predicted_class, prob_*)
    DB-->>BE: record.id = 42
    BE-->>FE: ECGAnalyzeResponse\n{probabilities, predicted_class,\n ecg_data, record_id=42}
    FE->>FE: analysisStore.setResult()\nanalysisStore.setECGData()
    FE->>FE: AnalysisDashboard renders\nbar chart + ML prediction box
    FE->>FE: DiagnosisForm appears
```

---

## 3. Doctor — Save Clinical Assessment

```mermaid
sequenceDiagram
    actor Doctor
    participant FE   as Frontend
    participant BE   as FastAPI
    participant DB   as SQLite

    Note over FE: DiagnosisForm visible after analysis
    Doctor->>FE: Select diagnosis button (e.g. MI)
    Doctor->>FE: Type clinical comment
    Doctor->>FE: Click "Save Assessment"

    FE->>BE: PATCH /api/ecg/records/42/diagnosis\n{doctor_diagnosis:"MI",\n doctor_comment:"Anterior STEMI…"}
    BE->>BE: verify current_user.role == "doctor"
    BE->>DB: SELECT * FROM records\nWHERE id=42 AND doctor_id=current_user.id
    DB-->>BE: record row
    BE->>DB: UPDATE records SET\n doctor_diagnosis='MI',\n doctor_comment='Anterior STEMI…'
    DB-->>BE: updated row
    BE-->>FE: RecordResponse (full)
    FE->>FE: analysisStore.setDoctorDiagnosis()\nDiagnosisForm shows "Assessment saved ✓"
    FE->>FE: React Query invalidates\n["ecg","records"] cache

    Doctor->>FE: Click "Export PDF"
    FE->>FE: dynamic import("jspdf")\ngenerate PDF:\n  • AI predicted class box\n  • Doctor diagnosis box (tinted)\n  • Doctor comment\n  • Probability table + bars\n  • Disclaimer
    FE->>Doctor: browser downloads\necg-report-MI-2026-04-16.pdf
```

---

## 4. Patient — View Records

```mermaid
sequenceDiagram
    actor Patient
    participant FE   as Frontend
    participant BE   as FastAPI
    participant DB   as SQLite

    Patient->>FE: Login (role=patient)
    FE->>BE: POST /api/auth/login
    BE-->>FE: {access_token}
    FE->>BE: GET /api/users/me
    BE-->>FE: {role:"patient"}
    FE->>FE: authStore.setUser()\nDashboard shows read-only banner\nNo ECGUpload, no PatientSelector

    Patient->>FE: Click "Records" in nav
    FE->>BE: GET /api/ecg/records  [Bearer]
    BE->>BE: current_user.role == "patient"\n→ filter WHERE patient_id=current_user.id
    BE->>DB: SELECT * FROM records\nWHERE patient_id=?
    DB-->>BE: record rows (with doctor join)
    BE-->>FE: RecordResponse[]\n(doctor_name · diagnosis · comment · probs)
    FE->>FE: RecordsPage renders cards

    Patient->>FE: Click "Show class probabilities"
    FE->>FE: expand ProbBar list\n(no API call — data already fetched)

    Note over Patient,FE: Patient cannot upload,\ncannot edit diagnosis,\ncannot export PDF
```
