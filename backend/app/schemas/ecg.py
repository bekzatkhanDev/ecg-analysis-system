"""ECG analysis request/response schemas."""
from typing import Any

from pydantic import BaseModel, Field, field_validator
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
