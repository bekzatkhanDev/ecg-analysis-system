"""
CNN + Transformer + Additive Attention — architecture from ecgmodelv2.ipynb.
Input: (B, 12, 5000). Output: (B, num_classes).
"""
import math
from typing import Optional

import torch
import torch.nn as nn


class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding (Vaswani et al., 2017)."""

    def __init__(self, d_model: int, max_len: int = 2048) -> None:
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        pos = torch.arange(0, max_len).unsqueeze(1).float()
        div = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(pos * div)
        pe[:, 1::2] = torch.cos(pos * div)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, : x.size(1)]


class ECGModel(nn.Module):
    """
    CNN + Positional Encoding + Transformer + Additive Attention.
    (B, 12, 5000) -> Conv1d -> (B, 256, 1250) -> Transformer -> Additive Attention -> (B, num_classes).
    """

    def __init__(self, num_classes: int = 5) -> None:
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv1d(12, 64, kernel_size=7, padding=3),
            nn.BatchNorm1d(64),
            nn.GELU(),
            nn.MaxPool1d(2),
            nn.Conv1d(64, 128, kernel_size=5, padding=2),
            nn.BatchNorm1d(128),
            nn.GELU(),
            nn.MaxPool1d(2),
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm1d(256),
            nn.GELU(),
        )
        self.pos_enc = PositionalEncoding(d_model=256, max_len=1250)
        enc_layer = nn.TransformerEncoderLayer(
            d_model=256,
            nhead=8,
            dim_feedforward=512,
            dropout=0.2,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.transformer = nn.TransformerEncoder(enc_layer, num_layers=2)
        self.attention = nn.Sequential(
            nn.Linear(256, 128),
            nn.Tanh(),
            nn.Linear(128, 1),
        )
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(256, num_classes)
        self._init_weights()

    def _init_weights(self) -> None:
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.Conv1d):
                nn.init.kaiming_normal_(m.weight, nonlinearity="relu")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.cnn(x)
        x = x.permute(0, 2, 1)
        x = self.pos_enc(x)
        x = self.transformer(x)
        attn_w = torch.softmax(self.attention(x), dim=1)
        x = torch.sum(x * attn_w, dim=1)
        return self.fc(self.dropout(x))
