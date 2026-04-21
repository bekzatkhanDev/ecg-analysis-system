"""ECG analysis endpoints."""
from fastapi import APIRouter, Depends, Form, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.db.models import Record, User
from app.schemas.ecg import (
    DiagnosisUpdateRequest,
    ECGAnalyzeResponse,
    PatientUserResponse,
    RecordResponse,
)
from app.services.ml_service import ModelService, get_model_service
import numpy as np
import wfdb
import tempfile
import os
import json

router = APIRouter(prefix="/ecg", tags=["ecg"])


def _parse_ecg_file(content: bytes) -> np.ndarray:
    """Parse uploaded ECG file bytes into (12, 5000) float32 array."""
    # Try JSON
    try:
        signal_data = json.loads(content.decode("utf-8"))
        if isinstance(signal_data, list) and len(signal_data) == 12 and len(signal_data[0]) == 5000:
            return np.array(signal_data, dtype=np.float32)
        raise ValueError("Invalid JSON format")
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        pass

    # Try CSV
    try:
        content_str = content.decode("utf-8")
        lines = content_str.strip().split("\n")
        if len(lines) == 12:
            return np.array([list(map(float, line.split(","))) for line in lines], dtype=np.float32)
        if len(lines) == 1 and len(lines[0].split(",")) == 60000:
            values = list(map(float, lines[0].split(",")))
            return np.array(values, dtype=np.float32).reshape(12, 5000)
        raise ValueError("Unsupported CSV shape")
    except (UnicodeDecodeError, ValueError):
        pass

    # Try .dat via wfdb
    with tempfile.NamedTemporaryFile(delete=False, suffix=".dat") as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        try:
            record = wfdb.rdsamp(tmp_path)
            return record[0].T.astype(np.float32)
        except FileNotFoundError:
            with open(tmp_path, "rb") as f:
                raw = f.read()
            total = len(raw) // 2
            if total == 12 * 5000:
                import struct
                samples = struct.unpack("<" + "h" * total, raw)
                return np.array(samples, dtype=np.float32).reshape(12, 5000)
            raise ValueError(f"Raw data size {total} doesn't match expected 60000")
    finally:
        os.unlink(tmp_path)


def _record_to_response(rec: Record) -> RecordResponse:
    resp = RecordResponse.model_validate(rec)
    if rec.doctor:
        resp.doctor_email = rec.doctor.email
        resp.doctor_name = rec.doctor.full_name
    if rec.patient:
        resp.patient_email = rec.patient.email
        resp.patient_name = rec.patient.full_name
    return resp


# ── Analyze + persist ────────────────────────────────────────────────────────

@router.post("/analyze", response_model=ECGAnalyzeResponse)
async def analyze_ecg(
    file: UploadFile = File(...),
    patient_id: int | None = Form(None),
    current_user: CurrentUser = ...,
    db: DbSession = ...,
    model_service: ModelService = Depends(get_model_service),
) -> ECGAnalyzeResponse:
    """Parse ECG file, run ML inference, persist result, return probabilities."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can upload ECG files")

    content = await file.read()
    try:
        signal = _parse_ecg_file(content)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid ECG data: {exc}")

    if signal.shape != (12, 5000):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Expected shape (12, 5000), got {signal.shape}",
        )

    # Validate patient_id if provided
    if patient_id is not None:
        patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    try:
        proba = model_service.predict_proba_single(signal)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    predicted = max(proba, key=proba.get)

    # Persist record
    record = Record(
        doctor_id=current_user.id,
        patient_id=patient_id,
        predicted_class=predicted,
        prob_norm=proba.get("NORM", 0.0),
        prob_mi=proba.get("MI", 0.0),
        prob_sttc=proba.get("STTC", 0.0),
        prob_cd=proba.get("CD", 0.0),
        prob_hyp=proba.get("HYP", 0.0),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ECGAnalyzeResponse(
        probabilities=proba,
        predicted_class=predicted,
        ecg_data=signal[:, :5000].tolist(),
        record_id=record.id,
    )


# ── Records ──────────────────────────────────────────────────────────────────

@router.get("/records", response_model=list[RecordResponse])
def list_records(
    current_user: CurrentUser,
    db: DbSession,
) -> list[RecordResponse]:
    """Doctors see records they created; patients see records linked to them."""
    if current_user.role == "doctor":
        records = db.query(Record).filter(Record.doctor_id == current_user.id).order_by(Record.created_at.desc()).all()
    else:
        records = db.query(Record).filter(Record.patient_id == current_user.id).order_by(Record.created_at.desc()).all()
    return [_record_to_response(r) for r in records]


@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(
    record_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> RecordResponse:
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    # Access control: doctor who created it or the linked patient
    if current_user.role == "doctor" and record.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == "patient" and record.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return _record_to_response(record)


@router.patch("/records/{record_id}/diagnosis", response_model=RecordResponse)
def update_diagnosis(
    record_id: int,
    body: DiagnosisUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> RecordResponse:
    """Doctor saves their own diagnosis and comment to a record."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can update diagnosis")
    record = db.query(Record).filter(Record.id == record_id, Record.doctor_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    record.doctor_diagnosis = body.doctor_diagnosis
    record.doctor_comment = body.doctor_comment
    db.commit()
    db.refresh(record)
    return _record_to_response(record)


# ── Patients list (for doctor's selector) ────────────────────────────────────

@router.get("/patients", response_model=list[PatientUserResponse])
def list_patients(
    current_user: CurrentUser,
    db: DbSession,
) -> list[PatientUserResponse]:
    """Return all users with role='patient' for the doctor's patient selector."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can list patients")
    patients = db.query(User).filter(User.role == "patient", User.is_active == True).order_by(User.full_name).all()
    return [PatientUserResponse.model_validate(p) for p in patients]
