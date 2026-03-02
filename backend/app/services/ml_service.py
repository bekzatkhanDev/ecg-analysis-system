"""
ModelService — Singleton для CNN+Transformer+Attention модели ЭКГ.
Загружает best_model_500hz.pth один раз при запуске (lifespan). Предоставляет предобработку и инференс.
"""
from pathlib import Path
from typing import Any

import numpy as np
import torch

from app.core.config import settings
from app.models.ecg_model import ECGModel

# Названия классов из ecgmodelv2.ipynb
CLASS_NAMES = ["NORM", "MI", "STTC", "CD", "HYP"]
NUM_CLASSES = 5
EXPECTED_SHAPE = (12, 5000)


class ModelService:
    """Singleton: один экземпляр модели, загружается при запуске."""

    _instance: "ModelService | None" = None
    _model: torch.nn.Module | None = None
    _device: torch.device | None = None

    def __new__(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        """Загрузка модели PyTorch из весов. Идемпотентно."""
        if self._model is not None:
            return
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = ECGModel(num_classes=NUM_CLASSES).to(self._device)
        path = Path(settings.model_weights_path)
        if not path.is_absolute():
            path = Path(__file__).resolve().parent.parent.parent / path
        state = torch.load(path, map_location=self._device, weights_only=True)
        self._model.load_state_dict(state)
        self._model.eval()

    @property
    def model(self) -> torch.nn.Module:
        if self._model is None:
            raise RuntimeError("ModelService: модель не загружена. Сначала вызовите load_model() (например, в lifespan).")
        return self._model

    @property
    def device(self) -> torch.device:
        if self._device is None:
            raise RuntimeError("ModelService: не инициализирован.")
        return self._device

    @staticmethod
    def preprocess(signal: np.ndarray) -> np.ndarray:
        """
        Z-оценка нормализации по каждому отведению (на образец).
        Вход: (12, 5000) или (1, 12, 5000). Выход: (12, 5000) float32.
        """
        x = np.asarray(signal, dtype=np.float64)
        if x.ndim == 2:
            x = x[np.newaxis, ...]
        # (N, 12, 5000) -> среднее/std по оси=2 -> (N, 12, 1)
        mean = x.mean(axis=2, keepdims=True)
        std = x.std(axis=2, keepdims=True) + 1e-8
        x = (x - mean) / std
        return x.astype(np.float32).squeeze(0) if x.shape[0] == 1 else x.astype(np.float32)

    def predict_proba(self, signal: np.ndarray) -> list[dict[str, float]]:
        """
        Предобработка -> тензор -> инференс -> вероятности на образец.
        signal: (12, 5000) или (N, 12, 5000). Возвращает список {class_name: prob}.
        """
        self.load_model()
        x = self.preprocess(signal)
        if x.ndim == 2:
            x = x[np.newaxis, ...]
        if x.shape[1:] != EXPECTED_SHAPE:
            raise ValueError(f"Ожидаемая форма (..., 12, 5000), получено {x.shape}")
        with torch.no_grad():
            t = torch.from_numpy(x).to(self._device)
            logits = self.model(t)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
        out = []
        for i in range(probs.shape[0]):
            out.append({CLASS_NAMES[j]: float(probs[i, j]) for j in range(NUM_CLASSES)})
        return out

    def predict_proba_single(self, signal: np.ndarray) -> dict[str, float]:
        """Один образец (12, 5000). Возвращает один словарь class -> probability."""
        result = self.predict_proba(signal)
        return result[0]


def get_model_service() -> ModelService:
    """Зависимость: возвращает singleton ModelService."""
    return ModelService()
