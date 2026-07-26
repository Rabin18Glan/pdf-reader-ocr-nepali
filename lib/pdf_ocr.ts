import { createWorker } from "tesseract.js";
import { extractRealPicturesFromPage, RealPictureAsset } from "./pdf_image_extractor";

let wasmModule: any = null;

async function getWasm() {
  if (wasmModule) return wasmModule;
  try {
    const pkg = await import("../pkg/nepali_pdf_wasm.js");
    await pkg.default();
    wasmModule = pkg;
    return wasmModule;
  } catch (err) {
    return null;
  }
}

export interface OcrProgress {
  currentPage: number;
  totalPages: number;
  statusText: string;
  percent: number;
}

export interface PageOcrData {
  pageNumber: number;
  text: string;
  realPictures: RealPictureAsset[];
}

export interface PdfOcrFullResult {
  pages: PageOcrData[];
  fullText: string;
  totalRealPictures: number;
  pageCount: number;
}

// Clean spacing and unmapped font artifacts while preserving 100% of valid words (including निषेधित)
export function cleanDevanagariText(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
      .replace(/[¥©®§¶¤¢£§±×÷•]/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/अा/g, "आ")
      .replace(/अो/g, "ओ")
      .replace(/अौ/g, "औ")
      .replace(/अे/g, "ए");

    const trimmed = line.trim();

    if (!trimmed) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== "") {
        cleanedLines.push("");
      }
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export async function processPdfWithOcr(
  pdfFile: File,
  dpiScale: number = 3.0,
  onProgress?: (progress: OcrProgress) => void
): Promise<PdfOcrFullResult> {
  const buffer = await pdfFile.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const wasm = await getWasm();

  // Load PDF.js
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  onProgress?.({
    currentPage: 0,
    totalPages,
    statusText: "OCR Engine सुरु हुँदैछ (Initializing OCR Engine)...",
    percent: 5,
  });

  let worker: any = null;
  try {
    worker = await createWorker("nep+hin+eng");
  } catch (err) {
    try {
      worker = await createWorker("nep+hin");
    } catch (e2) {
      worker = await createWorker("hin");
    }
  }

  const pagesData: PageOcrData[] = [];
  let totalPicsCount = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const currentPercent = Math.round(10 + (pageNum / totalPages) * 85);
    onProgress?.({
      currentPage: pageNum,
      totalPages,
      statusText: `पृष्ठ ${pageNum}/${totalPages} को पाठ र फोटो/तस्बिर रूपान्तरण हुँदैछ...`,
      percent: currentPercent,
    });

    const page = await pdfDoc.getPage(pageNum);
    
    // Extract real standalone picture assets (photos, JPEGs, PNGs, logos, seals)
    const realPictures = await extractRealPicturesFromPage(page);
    totalPicsCount += realPictures.length;

    const viewport = page.getViewport({ scale: dpiScale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    // Apply Rust WASM SIMD Binarization
    if (wasm && typeof wasm.preprocess_canvas_image === "function") {
      try {
        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        const binarizedMask = wasm.preprocess_canvas_image(imgData.data, canvas.width, canvas.height);

        const newImgData = context.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < binarizedMask.length; i++) {
          const val = binarizedMask[i];
          newImgData.data[i * 4] = val;
          newImgData.data[i * 4 + 1] = val;
          newImgData.data[i * 4 + 2] = val;
          newImgData.data[i * 4 + 3] = 255;
        }
        context.putImageData(newImgData, 0, 0);
      } catch (e) {
        console.warn("Rust WASM image preprocessing fallback:", e);
      }
    }

    const dataUrl = canvas.toDataURL("image/png");
    const ret = await worker.recognize(dataUrl);

    let pageText = cleanDevanagariText(ret.data.text.trim());

    pagesData.push({
      pageNumber: pageNum,
      text: pageText,
      realPictures,
    });
  }

  await worker.terminate();

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    statusText: "रूपान्तरण सम्पन्न भयो (Conversion Complete!)",
    percent: 100,
  });

  const fullText = cleanDevanagariText(pagesData.map(p => p.text).join("\n\n"));

  return {
    pages: pagesData,
    fullText,
    totalRealPictures: totalPicsCount,
    pageCount: totalPages
  };
}
