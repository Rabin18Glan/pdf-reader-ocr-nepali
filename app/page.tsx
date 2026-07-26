"use client";

import React, { useState, useRef } from "react";
import { 
  FileText, Download, Copy, Check, Sparkles, RefreshCw, 
  ShieldCheck, Upload, BookOpen, FileCode, Zap, Sliders
} from "lucide-react";
import { processPdfWithOcr, OcrProgress, PageOcrData } from "../lib/pdf_ocr";
import { exportToDocx } from "../lib/docx_exporter";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesData, setPagesData] = useState<PageOcrData[]>([]);
  const [convertedText, setConvertedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Converter Settings
  const [conversionMode, setConversionMode] = useState<"ocr" | "normal">("ocr");
  const [dpiScale, setDpiScale] = useState<number>(3.0); // 3.0x = 300 DPI default

  const [progress, setProgress] = useState<OcrProgress>({
    currentPage: 0,
    totalPages: 0,
    statusText: "",
    percent: 0,
  });
  const [copied, setCopied] = useState<boolean>(false);

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile || uploadedFile.type !== "application/pdf") return;
    await startConversion(uploadedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      await startConversion(droppedFile);
    }
  };

  const startConversion = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setConvertedText("");
    setPagesData([]);

    try {
      // Load PDF for visual preview canvas
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const loadedPdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPdfDoc(loadedPdf);
      setPageCount(loadedPdf.numPages);
      setCurrentPage(1);

      setTimeout(() => {
        renderPageCanvas(loadedPdf, 1);
      }, 100);

      if (conversionMode === "ocr") {
        const result = await processPdfWithOcr(selectedFile, dpiScale, (p) => {
          setProgress(p);
        });
        setPagesData(result.pages);
        setConvertedText(result.fullText);
      } else {
        let textParts: string[] = [];
        let simplePages: PageOcrData[] = [];
        for (let i = 1; i <= loadedPdf.numPages; i++) {
          const page = await loadedPdf.getPage(i);
          const content = await page.getTextContent();
          const pageStr = content.items.map((item: any) => item.str).join(" ");
          textParts.push(pageStr);
          simplePages.push({ pageNumber: i, text: pageStr, realPictures: [] });
        }
        setPagesData(simplePages);
        setConvertedText(textParts.join("\n\n"));
      }
    } catch (err: any) {
      console.error("Conversion process failed:", err);
      alert("PDF रूपान्तरण गर्दा त्रुटि भयो: " + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPageCanvas = async (pdf: any, pageNum: number) => {
    if (!pdf || !pdfCanvasRef.current) return;
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (e) {
      console.warn("Canvas render error:", e);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (pdfDoc && newPage >= 1 && newPage <= pageCount) {
      setCurrentPage(newPage);
      renderPageCanvas(pdfDoc, newPage);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = async () => {
    if (pagesData.length === 0 && !convertedText) return;
    const filename = file ? file.name.replace(/\.pdf$/i, ".docx") : "nepali-document.docx";
    await exportToDocx(pagesData.length > 0 ? pagesData : convertedText, filename);
  };

  const handleExportText = () => {
    const blob = new Blob([convertedText], { type: "text/plain;charset=utf-8" });
    const filename = file ? file.name.replace(/\.pdf$/i, ".txt") : "nepali-document.txt";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      {/* Top Header Bar */}
      <header className="clean-card" style={{ margin: "16px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: "var(--accent-red)", padding: "10px", borderRadius: "10px", display: "flex" }}>
            <FileText size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
              नेपाली PDF to Word Converter
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Devanagari Unicode Text</span> • <span>१-to-१ Page Matching</span> • <span>Word (.docx) Exporter</span>
            </p>
          </div>
        </div>

        {/* Feature Badge */}
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", backgroundColor: "var(--accent-orange-light)", color: "var(--accent-orange)", border: "1px solid #ffedd5", padding: "6px 14px", borderRadius: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={16} /> १००% गोप्य र सुरक्षित (100% Private Client-Side)
          </span>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main style={{ flex: 1, padding: "0 16px 24px", maxWidth: "1400px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        {!file ? (
          /* Selection & Upload Screen */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Mode & DPI Selectors Card */}
            <div className="clean-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Sliders size={20} color="var(--accent-orange)" />
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  रूपान्तरण विधि छनौट गर्नुहोस् (Select Converter Method)
                </h2>
              </div>

              {/* Selector Tabs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                
                {/* Method 1: OCR Mode (Recommended) */}
                <div 
                  onClick={() => setConversionMode("ocr")}
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    border: conversionMode === "ocr" ? "2px solid var(--accent-orange)" : "1px solid var(--border-color)",
                    backgroundColor: conversionMode === "ocr" ? "var(--accent-orange-light)" : "var(--bg-white)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "1rem", color: "var(--accent-orange)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Zap size={18} /> १. Visual Devanagari OCR (सिफारिस गरिएको)
                    </span>
                    <span style={{ backgroundColor: "var(--accent-orange)", color: "#fff", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                      उत्कृष्ट नतिजा (Best Result)
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    नेपालका सरकारी, लोकसेवा, र पुराना फन्ट (Preeti, Kantipur) भएका PDF हरूबाट <strong>पाठ १००% सही रूपान्तरण गर्दछ।</strong>
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", fontStyle: "italic" }}>
                    (Visual OCR recognizes printed text directly, creating 1-to-1 page matching in Word.)
                  </p>
                </div>

                {/* Method 2: Normal Stream Mode */}
                <div 
                  onClick={() => setConversionMode("normal")}
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    border: conversionMode === "normal" ? "2px solid var(--accent-red)" : "1px solid var(--border-color)",
                    backgroundColor: conversionMode === "normal" ? "var(--accent-red-light)" : "var(--bg-white)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FileText size={18} /> २. Normal PDF Converter (Text Stream)
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    नयाँ युनिकोड (Mangal, Kalimati) फन्टमा बनेका साधारण Vector PDF हरूका लागि छिटो रूपान्तरण।
                  </p>
                </div>
              </div>

              {/* DPI Quality Settings */}
              {conversionMode === "ocr" && (
                <div style={{ backgroundColor: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                      OCR शुद्धता / DPI गुणस्तर (OCR Precision Quality Level):
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      💡 DPI बढाउँदा साना अक्षरको शुद्धता बढ्छ।
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <button 
                      onClick={() => setDpiScale(1.5)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: dpiScale === 1.5 ? "2px solid var(--accent-orange)" : "1px solid var(--border-color)",
                        backgroundColor: dpiScale === 1.5 ? "var(--bg-white)" : "transparent",
                        fontWeight: dpiScale === 1.5 ? "700" : "500",
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      150 DPI (छिटो / Fast)
                    </button>
                    <button 
                      onClick={() => setDpiScale(3.0)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: dpiScale === 3.0 ? "2px solid var(--accent-orange)" : "1px solid var(--border-color)",
                        backgroundColor: dpiScale === 3.0 ? "var(--bg-white)" : "transparent",
                        fontWeight: dpiScale === 3.0 ? "700" : "500",
                        fontSize: "0.85rem",
                        color: "var(--accent-orange)",
                        cursor: "pointer"
                      }}
                    >
                      300 DPI (उच्च शुद्धता - सिफारिस)
                    </button>
                    <button 
                      onClick={() => setDpiScale(4.5)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: dpiScale === 4.5 ? "2px solid var(--accent-orange)" : "1px solid var(--border-color)",
                        backgroundColor: dpiScale === 4.5 ? "var(--bg-white)" : "transparent",
                        fontWeight: dpiScale === 4.5 ? "700" : "500",
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      450 DPI (अधिकतम शुद्धता / Ultra)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              className="clean-dropzone" 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input 
                id="file-input" 
                type="file" 
                accept=".pdf" 
                style={{ display: "none" }} 
                onChange={handleFileUpload} 
              />
              <div style={{ backgroundColor: "var(--accent-red-light)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Upload size={28} color="var(--accent-red)" />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "6px", color: "var(--text-primary)" }}>
                नेपाली PDF फाइल छनौट गर्नुहोस् वा यहाँ Drag & Drop गर्नुहोस्
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                (Select or Drag & Drop your Nepali PDF file to convert text to Word .docx)
              </p>
            </div>

          </div>
        ) : (
          /* Converted Split Workspace View */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flex: 1, height: "calc(100vh - 120px)" }}>
            
            {/* Left Box: PDF Visual Canvas Preview */}
            <div className="clean-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-color)", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen size={16} color="var(--accent-orange)" /> PDF पूर्वावलोकन (Original Preview)
                </span>
                {pdfDoc && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage <= 1}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    >
                      Prev
                    </button>
                    <span style={{ fontWeight: "600" }}>पृष्ठ {currentPage} / {pageCount}</span>
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage >= pageCount}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundColor: "#f1f5f9" }}>
                <canvas ref={pdfCanvasRef} style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderRadius: "6px", maxWidth: "100%", backgroundColor: "#fff" }} />
              </div>
            </div>

            {/* Right Box: Clean Devanagari Editable Text */}
            <div className="clean-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-color)", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--accent-red)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} /> देवनागरी पाठ ({pageCount} पृष्ठ - १:१ Matching)
                </span>

                {/* Export Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleCopy} className="btn-secondary" disabled={isProcessing} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                    {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
                    {copied ? "प्रतिलिपि भयो" : "Copy"}
                  </button>
                  <button onClick={handleExportText} className="btn-secondary" disabled={isProcessing} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                    <FileCode size={14} /> .TXT
                  </button>
                  <button onClick={handleExportWord} className="btn-primary" disabled={isProcessing} style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                    <Download size={14} /> Word (.docx) डाउनलोड
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div style={{ padding: "16px 20px", backgroundColor: "var(--accent-orange-light)", borderBottom: "1px solid #ffedd5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <span style={{ color: "var(--accent-orange)", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                      <RefreshCw className="animate-spin" size={14} style={{ animation: "spin 1s linear infinite" }} />
                      {progress.statusText}
                    </span>
                    <span style={{ fontWeight: "700", color: "var(--accent-orange)" }}>{progress.percent}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#fed7aa", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${progress.percent}%`, height: "100%", backgroundColor: "var(--accent-orange)", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              )}

              {/* Clean Editable Text Area */}
              <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column" }}>
                <textarea
                  className="devanagari-text"
                  value={convertedText}
                  onChange={(e) => setConvertedText(e.target.value)}
                  placeholder={isProcessing ? "रूपान्तरण हुँदैछ (Processing PDF conversion)..." : "रूपान्तरित देवनागरी पाठ यहाँ देखिनेछ..."}
                  style={{
                    flex: 1,
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "16px",
                    color: "var(--text-primary)",
                    fontSize: "1.1rem",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>

              {/* Footer Bar */}
              <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border-color)", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span>जम्मा पृष्ठहरू: {pageCount} | शब्दहरू: {convertedText.trim() ? convertedText.trim().split(/\s+/).length : 0}</span>
                <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "var(--accent-orange)", fontWeight: "600", cursor: "pointer" }}>
                  अर्को PDF रूपान्तरण गर्नुहोस् (Convert Another PDF)
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
