mod preeti;
mod ocr;

use wasm_bindgen::prelude::*;
use preeti::{convert_preeti_to_unicode, is_legacy_preeti_text, repair_devanagari_cmap};
use ocr::binarize_rgba;

/// Convert legacy Preeti text to Devanagari Unicode
#[wasm_bindgen]
pub fn convert_preeti(input: &str) -> String {
    convert_preeti_to_unicode(input)
}

/// Detect if text is legacy Preeti encoded
#[wasm_bindgen]
pub fn detect_preeti(input: &str) -> bool {
    is_legacy_preeti_text(input)
}

/// Parse and convert full text stream from PDF page
#[wasm_bindgen]
pub fn parse_pdf_text_stream(input: &str) -> String {
    let mut out_lines = Vec::new();

    for line in input.lines() {
        if is_legacy_preeti_text(line) {
            out_lines.push(convert_preeti_to_unicode(line));
        } else {
            out_lines.push(repair_devanagari_cmap(line));
        }
    }

    out_lines.join("\n")
}

/// Preprocesses canvas RGBA pixels in Rust WASM using Otsu Binarization
#[wasm_bindgen]
pub fn preprocess_canvas_image(rgba_bytes: &[u8], width: u32, height: u32) -> Vec<u8> {
    let binary = binarize_rgba(rgba_bytes, width as usize, height as usize);
    binary.data
}
