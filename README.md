# 🇳🇵 Nepali PDF to Word (.docx) & Editable Devanagari Converter

A high-performance, privacy-first web application built with **Next.js 14**, **Rust WebAssembly (WASM)**, and **Tesseract Devanagari OCR** for converting complex, legacy (Preeti/Kantipur), and corrupted Nepali PDFs into editable **Microsoft Word (.docx)** documents.

---

## 🌟 Key Features & Innovations

- **⚡ Rust WASM SIMD Preprocessor (`nepali-pdf-wasm/`)**:
  - Performs SIMD-speed Grayscale conversion, Otsu Adaptive Binarization, and Shirorekha (सिरोरेखा) line detection to sharpen Devanagari matras (`ि`, `्`, `ं`, `ँ`).
- **📸 Real Picture Asset Extractor (`lib/pdf_image_extractor.ts`)**:
  - Automatically filters out full-page canvas background renders and extracts **ONLY standalone embedded picture assets** (photos, JPEG/PNG images, logos, seals, diagrams).
  - Places extracted real pictures directly beside their corresponding Devanagari text inside Word `.docx` documents.
- **📄 1-to-1 Exact Page Breaks**:
  - Inserts native Word `PageBreak` between pages, guaranteeing a **strict 1:1 page count match** (e.g. 118 PDF pages = 118 Word document pages).
- **🧹 Header & Watermark Deduplication**:
  - Automatically deduplicates repeated top-margin header words (like **निषेधित** / Restricted) and strips unmapped font symbols (`¥`).
- **🎯 Selectable Quality (DPI Options)**:
  - **150 DPI (1.5x)**: Fast conversion
  - **300 DPI (3.0x - Recommended)**: High precision
  - **450 DPI (4.5x)**: Ultra precision for small fonts & complex ligatures
- **🔒 100% Client-Side Privacy**:
  - All processing runs directly inside your browser. No files or text are ever uploaded to remote servers.

---

## 🛠️ Project Structure

```
nepali-pdf-coverter/
├── app/
│   ├── globals.css         # Clean white theme with crimson red & warm orange accents
│   ├── layout.tsx          # Root Next.js layout
│   └── page.tsx            # Main converter dashboard & workspace UI
├── lib/
│   ├── pdf_ocr.ts          # High-resolution Devanagari OCR pipeline
│   ├── pdf_image_extractor.ts # Real picture asset filter & extractor
│   └── docx_exporter.ts    # Microsoft Word (.docx) builder with 1-to-1 page breaks
├── nepali-pdf-wasm/       # Rust WebAssembly crate
│   ├── Cargo.toml          # Rust package config
│   └── src/
│       ├── lib.rs          # WASM export functions
│       ├── preeti.rs       # Legacy Preeti font decoder & matra reorderer
│       └── ocr.rs          # Otsu binarization & Shirorekha detector
├── pkg/                    # Compiled WASM Web bundle
├── .gitignore              # Git ignore rules for Next.js and Rust WASM
├── package.json            # Node.js dependencies
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or later
- **Rust & Cargo**: (Optional, for re-compiling WASM crate)
- **wasm-pack**: (Optional, for building WASM) `cargo install wasm-pack`

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/nepali-pdf-converter.git
cd nepali-pdf-converter
npm install
```

### 2. Running Development Server

Start the local Next.js dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

### 3. Production Build

To test and compile the production build:

```bash
npm run build
```

---

## 🦀 Building the Rust WebAssembly Crate (Optional)

If you modify Rust files in `nepali-pdf-wasm/`:

```bash
cd nepali-pdf-wasm

# Run unit tests
cargo test

# Compile WASM bundle to ../pkg
wasm-pack build --target web --out-dir ../pkg
```

---

## 📜 License

MIT License. Designed with ❤️ for Nepal.
