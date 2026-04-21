/**
 * Loads Arial Regular + Bold from /fonts/ (bundled in public/).
 * Arial covers Latin, Cyrillic (Russian, Kazakh), Greek, and more.
 * Results are cached in memory so subsequent PDF exports are instant.
 */

interface FontPair {
  normal: string;
  bold: string;
}

let cache: FontPair | null = null;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function loadPdfFonts(): Promise<FontPair> {
  if (cache) return cache;

  const [normalBuf, boldBuf] = await Promise.all([
    fetch("/fonts/Arial-Regular.ttf").then((r) => {
      if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`);
      return r.arrayBuffer();
    }),
    fetch("/fonts/Arial-Bold.ttf").then((r) => {
      if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);

  cache = {
    normal: bufferToBase64(normalBuf),
    bold: bufferToBase64(boldBuf),
  };
  return cache;
}

/** Register fonts on a jsPDF doc instance. Returns the font family name to use. */
export function registerFonts(
  doc: { addFileToVFS: (n: string, d: string) => void; addFont: (n: string, f: string, s: string) => void },
  fonts: FontPair,
): string {
  doc.addFileToVFS("Arial-Regular.ttf", fonts.normal);
  doc.addFont("Arial-Regular.ttf", "Arial", "normal");
  doc.addFileToVFS("Arial-Bold.ttf", fonts.bold);
  doc.addFont("Arial-Bold.ttf", "Arial", "bold");
  return "Arial";
}
