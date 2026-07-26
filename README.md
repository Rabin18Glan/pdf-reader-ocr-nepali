# Nepali PDF to Word (.docx) Converter

A web application designed to parse and convert Nepali PDF documents into editable Microsoft Word (.docx) files and Devanagari Unicode text. The system supports visual Devanagari OCR, legacy font decoding (Preeti/Kantipur), and embedded image extraction with 1-to-1 page matching. All processing runs 100% client-side inside the user's browser.

---

## Usage Guide

1. **Access Application**: Open the web application URL in any modern web browser.
2. **Select Conversion Mode**:
   - **Visual Devanagari OCR**: Recommended for legacy fonts (Preeti, Kantipur), government notices, and scanned PDFs.
   - **Normal PDF Converter**: For standard digital Unicode PDFs.
3. **Select Precision Level**: Choose the target DPI resolution (150 DPI for fast conversion, 300 DPI for standard accuracy, 450 DPI for fine detail).
4. **Upload Document**: Click the dropzone or drag and drop a Nepali PDF file.
5. **Review Output**: Use the left pane to preview original PDF pages and the right pane to inspect or edit converted Devanagari text.
6. **Export**:
   - Click **Word (.docx) Download** to export an editable Microsoft Word document with 1-to-1 page matching.
   - Click **Copy** or **.TXT** to export plain Devanagari Unicode text.

---

## Technical Features

- **100% Client-Side Privacy**: All document processing, OCR recognition, image extraction, and Word (.docx) generation occur entirely within the client browser. No files or document data are transmitted to external servers.
- **Devanagari OCR**: Renders PDF pages to high-resolution canvas elements and performs optical character recognition for Devanagari text.
- **Embedded Image Extraction**: Isolates standalone image assets (JPEGs, PNGs, logos, stamps) from PDF streams and places them relative to the document text in the exported Word file.
- **1-to-1 Page Matching**: Inserts page breaks during Word document generation to maintain the exact page count of the source PDF.
- **Quality Control**: Configurable rendering resolutions (150 DPI, 300 DPI, 450 DPI) to optimize accuracy for small fonts and complex conjuncts.
- **WebAssembly Performance**: Utilizes a compiled Rust WebAssembly module for SIMD-accelerated image binarization and Preeti font mapping.

---

## System Architecture

The application consists of three main components:

1. **Frontend Interface (`app/`)**: A Next.js application that provides the user interface for file selection, conversion mode settings, previewing, and downloading exported documents.
2. **Core OCR & Document Engine (`lib/`)**:
   - `pdf_ocr.ts`: Handles high-resolution canvas rendering and Tesseract Devanagari OCR processing.
   - `pdf_image_extractor.ts`: Identifies and extracts embedded image assets (JPEGs, PNGs, stamps) from PDF dictionary streams while excluding full-page background renders.
   - `docx_exporter.ts`: Compiles Devanagari text and embedded images into Microsoft Word (.docx) files, inserting page breaks to maintain identical page counts.
3. **WebAssembly Engine (`nepali-pdf-wasm/`)**: A Rust crate compiled to WebAssembly that performs SIMD image binarization and legacy font decoding.

---

## Directory Structure

```
nepali-pdf-converter/
├── app/
│   ├── globals.css          # Application styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main dashboard and workspace UI
├── lib/
│   ├── pdf_ocr.ts           # OCR pipeline and text processing
│   ├── pdf_image_extractor.ts # PDF image stream extraction
│   └── docx_exporter.ts     # Word document compilation
├── nepali-pdf-wasm/        # Rust WebAssembly crate
│   ├── Cargo.toml           # Rust package definition
│   └── src/
│       ├── lib.rs           # WebAssembly bindings
│       ├── preeti.rs        # Preeti font mapping and matra reordering
│       └── ocr.rs           # Otsu binarization algorithms
├── pkg/                     # Compiled WebAssembly bundle
├── .gitignore               # Version control exclusion rules
├── package.json             # Node.js dependencies and scripts
└── README.md                # Project documentation
```

---

## Prerequisites

- Node.js version 18.0.0 or higher
- npm or yarn package manager
- Rust toolchain and `wasm-pack` (required only if modifying the WebAssembly module)

---

## Installation and Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nepali-pdf-converter.git
   cd nepali-pdf-converter
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

---

## How to Build for Production

To create an optimized production build:

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

---

## How to Update the Application

### Updating Node.js Dependencies
To update the project dependencies:
```bash
npm update
```

### Modifying and Rebuilding the WebAssembly Module
If changes are made to the Rust code inside `nepali-pdf-wasm/`:

1. Navigate to the crate directory:
   ```bash
   cd nepali-pdf-wasm
   ```

2. Run tests to verify logic:
   ```bash
   cargo test
   ```

3. Rebuild the WebAssembly package:
   ```bash
   wasm-pack build --target web --out-dir ../pkg
   ```

4. Return to the root directory and rebuild the application:
   ```bash
   cd ..
   npm run build
   ```
