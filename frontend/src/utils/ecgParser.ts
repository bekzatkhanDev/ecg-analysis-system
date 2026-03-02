import type { ECGMatrix } from "../types/ecg";

export const REQUIRED_LEADS = 12;
export const REQUIRED_SAMPLES = 5000;
const REQUIRED_FLAT_LENGTH = REQUIRED_LEADS * REQUIRED_SAMPLES;

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
}

function chunkFlat(flat: number[]): number[][] {
  const matrix: number[][] = [];
  for (let lead = 0; lead < REQUIRED_LEADS; lead += 1) {
    const start = lead * REQUIRED_SAMPLES;
    matrix.push(flat.slice(start, start + REQUIRED_SAMPLES));
  }
  return matrix;
}

function ensureNumericRow(row: unknown[], rowIndex: number): number[] {
  return row.map((value, columnIndex) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error(
        `Invalid numeric value at row ${rowIndex + 1}, column ${columnIndex + 1}`,
      );
    }
    return numeric;
  });
}

function normalizeNested(input: unknown[][]): ECGMatrix {
  const numericRows = input.map((row, index) => ensureNumericRow(row, index));

  if (numericRows.length === REQUIRED_LEADS) {
    const hasValidLength = numericRows.every((row) => row.length === REQUIRED_SAMPLES);
    if (hasValidLength) {
      return numericRows;
    }
  }

  if (numericRows.length === REQUIRED_SAMPLES) {
    const hasValidLength = numericRows.every((row) => row.length === REQUIRED_LEADS);
    if (hasValidLength) {
      return transpose(numericRows);
    }
  }

  if (numericRows.length === 1 && numericRows[0].length === REQUIRED_FLAT_LENGTH) {
    return chunkFlat(numericRows[0]);
  }

  throw new Error(
    `Expected shape ${REQUIRED_LEADS}x${REQUIRED_SAMPLES}, ${REQUIRED_SAMPLES}x${REQUIRED_LEADS}, or flat ${REQUIRED_FLAT_LENGTH}.`,
  );
}

export function normalizeECGData(input: unknown): ECGMatrix {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("ECG data must be a non-empty array.");
  }

  if (Array.isArray(input[0])) {
    return normalizeNested(input as unknown[][]);
  }

  const flat = ensureNumericRow(input as unknown[], 0);
  if (flat.length !== REQUIRED_FLAT_LENGTH) {
    throw new Error(
      `Expected flat ${REQUIRED_FLAT_LENGTH} values, but received ${flat.length}.`,
    );
  }
  return chunkFlat(flat);
}

function parseDelimitedText(rawText: string): number[][] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("File is empty.");
  }

  const parsedRows = lines.map((line) =>
    line
      .split(/[,\s;]+/)
      .filter(Boolean)
      .map((token) => Number(token)),
  );

  const isNumericRow = (row: number[]) => row.length > 0 && row.every(Number.isFinite);

  if (parsedRows.every(isNumericRow)) {
    return parsedRows;
  }

  const withoutHeader = parsedRows.slice(1);
  if (withoutHeader.length > 0 && withoutHeader.every(isNumericRow)) {
    return withoutHeader;
  }

  throw new Error("Could not parse file. Use CSV/TXT with numeric values only.");
}

function extractJsonPayload(parsed: unknown): unknown {
  if (parsed && typeof parsed === "object" && "data" in parsed) {
    return (parsed as { data: unknown }).data;
  }
  return parsed;
}

export async function parseEcgFile(file: File): Promise<ECGMatrix> {
  const text = await file.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Uploaded file is empty.");
  }

  const looksLikeJson =
    file.name.toLowerCase().endsWith(".json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  const looksLikeDat =
    file.name.toLowerCase().endsWith(".dat") ||
    file.type === "application/octet-stream";

  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeECGData(extractJsonPayload(parsed));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON format";
      throw new Error(message);
    }
  }

  if (looksLikeDat) {
    try {
      const rows = parseDelimitedText(trimmed);
      return normalizeECGData(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid DAT format";
      throw new Error(message);
    }
  }

  const rows = parseDelimitedText(trimmed);
  return normalizeECGData(rows);
}
