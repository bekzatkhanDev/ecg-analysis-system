"""ECG analysis endpoint: POST /api/ecg/analyze."""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile

from app.api.deps import CurrentUser
from app.schemas.ecg import ECGAnalyzeResponse
from app.services.ml_service import ModelService, get_model_service
import numpy as np
import wfdb
import tempfile
import os
import json

router = APIRouter(prefix="/ecg", tags=["ecg"])


@router.post("/analyze", response_model=ECGAnalyzeResponse)
async def analyze_ecg(
    file: UploadFile = File(...),
    current_user: CurrentUser = ...,
    model_service: ModelService = Depends(get_model_service),
) -> ECGAnalyzeResponse:
    """
    Preprocess (Z-score, shape 12×5000), run PyTorch inference, return 5-class probabilities.
    """
    try:
        # Read the file content from UploadFile
        content = await file.read()
        
        # Try to parse as JSON first
        try:
            signal_data = json.loads(content.decode('utf-8'))
            if isinstance(signal_data, list) and len(signal_data) == 12 and len(signal_data[0]) == 5000:
                signal = np.array(signal_data, dtype=np.float32)
            else:
                raise ValueError("Invalid JSON format")
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
            # If not JSON, try to parse as CSV
            try:
                content_str = content.decode('utf-8')
                lines = content_str.strip().split('\n')
                if len(lines) == 12:
                    signal = np.array([list(map(float, line.split(','))) for line in lines], dtype=np.float32)
                elif len(lines) == 1 and len(lines[0].split(',')) == 60000:
                    # Single line with all values
                    values = list(map(float, lines[0].split(',')))
                    signal = np.array(values, dtype=np.float32).reshape(12, 5000)
                else:
                    raise ValueError("Unsupported file format")
            except (UnicodeDecodeError, ValueError):
                # If not JSON or CSV, try to parse as .dat file using wfdb
                try:
                    # Create a temporary file to store the uploaded .dat content
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.dat') as tmp_file:
                        tmp_file.write(content)
                        tmp_file_path = tmp_file.name
                    
                    try:
                        # Use wfdb to read the temporary file
                        # wfdb.rdsamp expects both .dat and .hea files
                        # For single .dat files, we need to handle this differently
                        try:
                            record = wfdb.rdsamp(tmp_file_path)
                            signal = record[0].T.astype(np.float32)  # Transpose to (12, 5000)
                        except FileNotFoundError:
                            # If .hea file is missing, try to read as raw binary data
                            # Assuming 12 leads with 5000 samples each, 2 bytes per sample (int16)
                            with open(tmp_file_path, 'rb') as f:
                                raw_data = f.read()
                            
                            # Try to reshape the raw data
                            total_samples = len(raw_data) // 2  # 2 bytes per sample
                            if total_samples == 12 * 5000:
                                # Convert to numpy array and reshape
                                import struct
                                samples = struct.unpack('<' + 'h' * total_samples, raw_data)
                                signal = np.array(samples, dtype=np.float32).reshape(12, 5000)
                            else:
                                raise ValueError(f"Raw data size {total_samples} doesn't match expected 60000 samples")
                    finally:
                        # Clean up temporary file
                        os.unlink(tmp_file_path)
                except Exception as e:
                    raise ValueError(f"Failed to parse file: {e}")
        
        if signal.shape != (12, 5000):
            raise ValueError(f"Expected shape (12, 5000), got {signal.shape}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid ECG data: {e!s}",
        )
    try:
        proba = model_service.predict_proba_single(signal)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    predicted = max(proba, key=proba.get)
    # Return only 10 seconds of data (5000 samples) instead of full 12 seconds
    return ECGAnalyzeResponse(
        probabilities=proba, 
        predicted_class=predicted,
        ecg_data=signal[:, :5000].tolist()
    )
