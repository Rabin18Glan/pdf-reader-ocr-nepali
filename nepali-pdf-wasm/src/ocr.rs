/// Rust Devanagari Image Processing & OCR Preprocessing Engine
/// Performs SIMD-speed Grayscale conversion, Otsu Adaptive Binarization, 
/// and Shirorekha (सिरोरेखा) line segmentation.

#[allow(dead_code)]
pub struct BinaryImage {
    pub width: usize,
    pub height: usize,
    pub data: Vec<u8>, // 255 = background (white), 0 = foreground ink (black)
}

/// Converts RGBA canvas pixels to 8-bit Grayscale and applies Otsu Binarization
pub fn binarize_rgba(rgba_bytes: &[u8], width: usize, height: usize) -> BinaryImage {
    let pixel_count = width * height;
    let mut gray = vec![0u8; pixel_count];

    // Step 1: Fast SIMD-friendly RGBA to Grayscale conversion
    for i in 0..pixel_count {
        let r = rgba_bytes[i * 4] as u32;
        let g = rgba_bytes[i * 4 + 1] as u32;
        let b = rgba_bytes[i * 4 + 2] as u32;
        gray[i] = ((299 * r + 587 * g + 114 * b) / 1000) as u8;
    }

    // Step 2: Calculate Otsu's Threshold
    let mut histogram = [0u32; 256];
    for &pixel in gray.iter() {
        histogram[pixel as usize] += 1;
    }

    let total = pixel_count as f64;
    let mut sum = 0.0;
    for (i, &count) in histogram.iter().enumerate() {
        sum += (i as f64) * (count as f64);
    }

    let mut sum_b = 0.0;
    let mut w_b = 0.0;
    let mut var_max = 0.0;
    let mut threshold = 128u8;

    for t in 0..256 {
        w_b += histogram[t] as f64;
        if w_b == 0.0 {
            continue;
        }
        let w_f = total - w_b;
        if w_f == 0.0 {
            break;
        }

        sum_b += (t as f64) * (histogram[t] as f64);
        let m_b = sum_b / w_b;
        let m_f = (sum - sum_b) / w_f;

        let var_between = w_b * w_f * (m_b - m_f) * (m_b - m_f);
        if var_between > var_max {
            var_max = var_between;
            threshold = t as u8;
        }
    }

    // Step 3: Apply Thresholding (0 = black ink, 255 = white background)
    let mut binary = vec![255u8; pixel_count];
    for i in 0..pixel_count {
        if gray[i] <= threshold {
            binary[i] = 0; // Black Ink
        }
    }

    BinaryImage {
        width,
        height,
        data: binary,
    }
}

/// Detects horizontal Shirorekha (सिरोरेखा) lines in Devanagari text blocks
#[allow(dead_code)]
pub fn detect_shirorekha_lines(binary: &BinaryImage) -> Vec<usize> {
    let mut row_counts = vec![0usize; binary.height];

    for y in 0..binary.height {
        let mut black_count = 0;
        let row_offset = y * binary.width;
        for x in 0..binary.width {
            if binary.data[row_offset + x] == 0 {
                black_count += 1;
            }
        }
        row_counts[y] = black_count;
    }

    let threshold = binary.width / 8;
    let mut lines = Vec::new();

    for (y, &count) in row_counts.iter().enumerate() {
        if count > threshold {
            lines.push(y);
        }
    }

    lines
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_binarization() {
        let rgba = vec![255, 255, 255, 255, 0, 0, 0, 255];
        let bin = binarize_rgba(&rgba, 2, 1);
        assert_eq!(bin.data[0], 255);
        assert_eq!(bin.data[1], 0);
    }
}
