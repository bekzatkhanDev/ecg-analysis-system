"""SQLAlchemy ORM models: User, Patient, ECGRecord, AnalysisResult."""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patients = relationship("Patient", back_populates="user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="patients")
    ecg_records = relationship("ECGRecord", back_populates="patient")


class ECGRecord(Base):
    __tablename__ = "ecg_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    recorded_at = Column(DateTime, nullable=True)
    sampling_rate_hz = Column(Integer, default=500)
    duration_sec = Column(Float, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="ecg_records")
    analysis_results = relationship("AnalysisResult", back_populates="ecg_record")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    ecg_record_id = Column(Integer, ForeignKey("ecg_records.id"), nullable=False)
    predicted_class = Column(String(32), nullable=False)
    prob_norm = Column(Float, nullable=False)
    prob_mi = Column(Float, nullable=False)
    prob_sttc = Column(Float, nullable=False)
    prob_cd = Column(Float, nullable=False)
    prob_hyp = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ecg_record = relationship("ECGRecord", back_populates="analysis_results")
