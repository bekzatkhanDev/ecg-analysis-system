"""ECG analysis request/response schemas."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator
import numpy as np
from fastapi import UploadFile


# Expect 12 leads × 5000 samples
N_LEADS = 12
SEQ_LEN = 5000


class ECGAnalyzeRequest(BaseModel):
    """Input: ECG signal as list of 12 lists (leads) of 5000 floats, or flat list 12*5000."""

    data: list[list[float]] | list[float] = Field(..., description="12×5000 or 60000 floats")

    @field_validator("data", mode="before")
    @classmethod
    def ensure_shape(cls, v: Any) -> list[list[float]]:
        if isinstance(v, np.ndarray):
            v = v.tolist()
        if not isinstance(v, list):
            raise ValueError("data must be list or numpy array")
        if len(v) == 0:
            raise ValueError("data is empty")
        # (12, 5000) nested
        if isinstance(v[0], (list, np.ndarray)):
            arr = np.asarray(v, dtype=np.float64)
            if arr.shape != (N_LEADS, SEQ_LEN):
                raise ValueError(f"Expected shape (12, 5000), got {arr.shape}")
            return arr.tolist()
        # flat 60000
        flat = np.asarray(v, dtype=np.float64)
        if flat.size != N_LEADS * SEQ_LEN:
            raise ValueError(f"Expected 12*5000={N_LEADS * SEQ_LEN} elements, got {flat.size}")
        return np.reshape(flat, (N_LEADS, SEQ_LEN)).tolist()

    def to_numpy(self) -> np.ndarray:
        """Return (12, 5000) numpy array."""
        return np.array(self.data, dtype=np.float64)


class ECGAnalyzeFileRequest(BaseModel):
    """Input: ECG signal as .dat file (12 leads × 5000 samples)."""

    file: UploadFile = Field(..., description="ECG .dat file (12×5000 samples)")

    class Config:
        arbitrary_types_allowed = True


class ECGAnalyzeResponse(BaseModel):
    """Probabilities for 5 classes (NORM, MI, STTC, CD, HYP)."""

    probabilities: dict[str, float] = Field(..., description="class -> probability")
    predicted_class: str = Field(..., description="argmax class name")
    ecg_data: list[list[float]] = Field(..., description="parsed ECG data for visualization (12x5000)")
    record_id: int = Field(..., description="ID of the saved record in DB")


class DiagnosisUpdateRequest(BaseModel):
    """Doctor's manual diagnosis and comment for a saved record."""

    doctor_diagnosis: str | None = None
    doctor_comment: str | None = None


class PatientUserResponse(BaseModel):
    """Minimal patient user info for doctor's patient selector."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None


class RecordResponse(BaseModel):
    """Full record response including ML results and doctor's assessment."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    patient_id: int | None
    predicted_class: str
    prob_norm: float
    prob_mi: float
    prob_sttc: float
    prob_cd: float
    prob_hyp: float
    doctor_diagnosis: str | None
    doctor_comment: str | None
    created_at: datetime

    # Nested user info (populated via join)
    doctor_email: str | None = None
    doctor_name: str | None = None
    patient_email: str | None = None
    patient_name: str | None = None

    @property
    def probabilities(self) -> dict[str, float]:
        return {
            "NORM": self.prob_norm,
            "MI": self.prob_mi,
            "STTC": self.prob_sttc,
            "CD": self.prob_cd,
            "HYP": self.prob_hyp,
        }
