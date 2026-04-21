# ER Diagram — ECG Analysis System

> **Active tables** (`users`, `records`) are fully wired to the API.  
> Legacy tables (`patients`, `ecg_records`, `analysis_results`) exist in the ORM but are not used by any endpoint.

```mermaid
erDiagram

    USERS {
        INTEGER     id              PK
        VARCHAR255  email           UK  "unique, indexed"
        VARCHAR255  hashed_password     "bcrypt hash"
        VARCHAR255  full_name           "nullable"
        VARCHAR32   role                "doctor | patient  default: doctor"
        BOOLEAN     is_active           "default: true"
        DATETIME    created_at          "utcnow"
    }

    RECORDS {
        INTEGER     id              PK
        INTEGER     doctor_id       FK  "→ users.id  NOT NULL"
        INTEGER     patient_id      FK  "→ users.id  nullable"
        VARCHAR32   predicted_class     "NORM | MI | STTC | CD | HYP"
        FLOAT       prob_norm
        FLOAT       prob_mi
        FLOAT       prob_sttc
        FLOAT       prob_cd
        FLOAT       prob_hyp
        VARCHAR100  doctor_diagnosis    "nullable  set after review"
        TEXT        doctor_comment      "nullable  set after review"
        DATETIME    created_at          "utcnow"
    }

    %% --- Legacy tables (ORM-only, no active endpoints) ---

    PATIENTS_LEGACY {
        INTEGER     id              PK
        INTEGER     user_id         FK  "→ users.id"
        VARCHAR255  full_name
        DATETIME    date_of_birth       "nullable"
        TEXT        notes               "nullable"
        DATETIME    created_at
    }

    ECG_RECORDS_LEGACY {
        INTEGER     id              PK
        INTEGER     patient_id      FK  "→ patients.id"
        DATETIME    recorded_at         "nullable"
        INTEGER     sampling_rate_hz    "default: 500"
        FLOAT       duration_sec        "nullable"
        TEXT        metadata_json       "nullable"
        DATETIME    created_at
    }

    ANALYSIS_RESULTS_LEGACY {
        INTEGER     id              PK
        INTEGER     ecg_record_id   FK  "→ ecg_records.id"
        VARCHAR32   predicted_class
        FLOAT       prob_norm
        FLOAT       prob_mi
        FLOAT       prob_sttc
        FLOAT       prob_cd
        FLOAT       prob_hyp
        DATETIME    created_at
    }

    %% Active relationships
    USERS ||--o{ RECORDS : "doctor_id  creates"
    USERS |o--o{ RECORDS : "patient_id  assigned to"

    %% Legacy relationships
    USERS ||--o{ PATIENTS_LEGACY   : "user_id"
    PATIENTS_LEGACY ||--o{ ECG_RECORDS_LEGACY : "patient_id"
    ECG_RECORDS_LEGACY ||--o{ ANALYSIS_RESULTS_LEGACY : "ecg_record_id"
```
