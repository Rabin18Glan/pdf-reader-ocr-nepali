use regex::Regex;
use unicode_normalization::UnicodeNormalization;

/// Multi-character replacements for legacy Preeti (sorted by descending length)
const PREETI_MULTI: &[(&str, &str)] = &[
    ("cf}", "औ"),
    ("cf]", "ओ"),
    ("cf", "आ"),
    ("c}", "ऐ"),
    ("c]", "ऐ"),
    ("c", "अ"),
    ("f}", "ौ"),
    ("f]", "ो"),
    ("km", "फ"),
    ("s|", "क्र"),
    ("v|", "ख्र"),
    ("u|", "ग्र"),
    ("3|", "घ्र"),
    ("r|", "च्र"),
    ("h|", "ज्र"),
    ("t|", "त्र"),
    ("w|", "ध्र"),
    ("g|", "न्र"),
    ("k|", "प्र"),
    ("e|", "भ्र"),
    ("d|", "म्र"),
    ("o|", "य्र"),
    ("0f", "ण"),
    ("0", "ण्"),
    ("4", "द्ध"),
    ("9", "ढ"),
    ("8", "ड"),
    ("7", "ठ"),
    ("6", "ट"),
    ("5", "द्द"),
    ("3", "घ"),
    ("2", "द्व"),
    ("1", "ङ"),
    ("O", "इ"),
    ("I", "क्ष"),
    ("H", "ः"),
    ("G", "द्य"),
    ("F", "ँ"),
    ("E", "झ्"),
    ("D", "ॐ"),
    ("C", "ऋ"),
    ("B", "द्य्"),
    ("A", "छ"),
    ("@", "२"),
    ("!", "१"),
    ("#", "३"),
    ("$", "४"),
    ("%", "५"),
    ("^", "६"),
    ("&", "७"),
    ("*", "८"),
    ("(", "९"),
    (")", "०"),
    ("M", "ं"),
    ("N", "्र"),
    ("P", "ए"),
    ("Q", "त्त"),
    ("R", "द्व"),
    ("S", "श्"),
    ("T", "त्त्व"),
    ("U", "थ्"),
    ("V", "्य"),
    ("W", "ध्"),
    ("X", "्य"),
    ("Y", "ञ्"),
    ("Z", "ज्ञ"),
    ("`", "ञ"),
    ("~", "ञ्"),
    ("+", "ं"),
    ("=", "ऋ"),
    ("[", "्र"),
    ("]", "े"),
    ("\\", "्"),
    (";", "स"),
    (":", "स्"),
    ("'", "ु"),
    ("\"", "ू"),
    ("<", "ि"),
    (">", "श्र"),
    ("?", "रु"),
    ("/", "र"),
];

/// Custom Devanagari CMap & Word Mappings for government/custom font PDFs
const CMAP_REPAIR_MAP: &[(&str, &str)] = &[
    ("ि भित", "मिति"),
    ("िभित", "मिति"),
    ("ि व .सं", "वि.सं."),
    ("ि व.सं", "वि.सं."),
    ("ि किलोमिटर", "किलोमिटर"),
    ("ि हिसाबले", "हिसाबले"),
    ("ि विभाजन", "विभाजन"),
    ("ि हिमाली", "हिमाली"),
    ("ि दिशामा", "दिशामा"),
    ("ि भटयसम्भका", "मिटरसम्मका"),
    ("ि नैकै", "निकै"),
    ("ि नकै", "निकै"),
    ("बौगोङ्झरक", "भौगोलिक"),
    ("भौगोङ्झरक", "भौगोलिक"),
    ("करोङ्झभटय", "किलोमिटर"),
    ("साववजङ्झनक", "सार्वजनिक"),
    ("साववज", "सार्वज"),
    ("बयणऩोषणभा", "भरणपोषणमा"),
    ("अनङ्टसाय", "अनुसार"),
    ("अनङ्ट", "अनु"),
    ("ङ्चयचम", "रिचय"),
    ("ङ्चय", "रि"),
    ("ङ्चयव", "रिब"),
    ("ऩङ्चयचम", "परिचय"),
    ("बए अनुसार", "भए अनुसार"),
    ("करिव", "करिब"),
    ("भाईर", "माइल"),
    ("भाइर", "माइल"),
    ("रम्फाई", "लम्बाई"),
    ("चौडाई", "चौडाइ"),
    ("कूर क्षेत्र पर", "कुल क्षेत्रफल"),
    ("क्षेत्र पर", "क्षेत्रफल"),
    ("कूर", "कुल"),
    ("ऺेत्र", "क्षेत्र"),
    ("ऺ", "क्ष"),
    ("वर्ग ि किलोमिटर", "वर्ग किलोमिटर"),
    ("वर्ग किलोमिटर", "वर्ग किलोमिटर"),
    ("वगव", "वर्ग"),
    ("हसाफरे", "हिसाबले"),
    ("हिसाबरे", "हिसाबले"),
    ("वबाजन", "विभाजन"),
    ("हभारी", "हिमाली"),
    ("तयाई", "तराई"),
    ("ऩहाडी", "पहाडी"),
    ("ऩूवव", "पूर्व"),
    ("ऩङ्ञिभ", "पश्चिम"),
    ("दशाभा", "दिशामा"),
    ("देशबङ्च य", "देशभर"),
    ("देशबङ्चय", "देशभर"),
    ("पैङ्झ रएका", "फैलिएका"),
    ("पैङ्झरएका", "फैलिएका"),
    ("यीनीहरूलाई", "यीनीहरूलाई"),
    ("नेऩारका", "नेपालका"),
    ("नेऩारको", "नेपालको"),
    ("नेऩारराई", "नेपाललाई"),
    ("नेपालराई", "नेपाललाई"),
    ("प्र भङ्टख", "प्रमुख"),
    ("भङ्टख", "मुख"),
    ("भङ्टख् म", "मुख्य"),
    ("मुख् म", "मुख्य"),
    ("उपत् मका", "उपत्यका"),
    ("ठाउॉ", "ठाउँ"),
    ("गयेका", "गरेका"),
    ("बायतसॉग", "भारतसँग"),
    ("भारतसॉग", "भारतसँग"),
    ("जोिडएको", "जोडिएको"),
    ("पाॊट", "फाँट"),
    ("बायतीम", "भारतीय"),
    ("गॊगा", "गंगा"),
    ("सभथयको", "समथरको"),
    ("उत्तयी", "उत्तरी"),
    ("सॊचाई", "सिंचाइ"),
    ("सिंचाइ", "सिंचाइ"),
    ("हङ्टन्", "हुन्"),
    ("कणावरी", "कर्णाली"),
    ("बूबाग", "भूभाग"),
    ("बागभा", "भागमा"),
    ("बाग", "भाग"),
    ("देङ्ञ ख", "देखि"),
    ("भटयसम्भका", "मिटरसम्मका"),
    ("भटय", "मिटर"),
    ("पववत", "पर्वत"),
    ("पदवछन्", "पर्दछन्"),
    ("पदवछ", "पर्दछ"),
    ("भहाबायत", "महाभारत"),
    ("रेक", "लेक"),
    ("सवाि रक", "सिवालिक"),
    ("श्रृ ङखरा", "श्रृङ्खला"),
    ("श्रृङखरा", "श्रृङ्खला"),
    ("श्रृ ङखला", "श्रृङ्खला"),
    ("चङ्टङ्च यमा", "चुरिया"),
    ("चङ्टङ्चयमा", "चुरिया"),
    ("नाभका", "नामका"),
    ("दङ्टई", "दुई"),
    ("पि न", "पनि"),
    ("जङ्टन", "जुन"),
    ("सफैबन् दा", "सबैभन्दा"),
    ("सफैबन्दा", "सबैभन्दा"),
    ("उववय", "उर्वर"),
    ("शहयी", "शहरी"),
    ("उपत्मकाहरूको", "उपत्यकाहरूको"),
    ("दाॊजोभा", "दोजोमा"),
    ("बन्दा", "भन्दा"),
    ("उच्च स् थरभा", "उच्च स्थलमा"),
    ("स् थरभा", "स्थलमा"),
    ("नैकै", "निकै"),
    ("कभ", "कम"),
    ("बौगो", "भौगो"),
    ("सॊ", "सं"),
    ("ङ्झ", "ि"),
    ("ङ्ज", "ि"),
    ("ङ्छ", "ि"),
    ("ङ््ट", "ु"),
    ("ऩ", "प"),
];

fn preeti_single_map(ch: char) -> &'static str {
    match ch {
        'a' => "ब",
        'b' => "द",
        'c' => "अ",
        'd' => "म",
        'e' => "भ",
        'f' => "ा",
        'g' => "न",
        'h' => "ज",
        'i' => "ष",
        'j' => "व",
        'k' => "प",
        'l' => "ि",
        'm' => "म्",
        'n' => "ल",
        'o' => "य",
        'p' => "उ",
        'q' => "त्र",
        'r' => "च",
        's' => "क",
        't' => "त",
        'u' => "ग",
        'v' => "ख",
        'w' => "ध",
        'x' => "ह",
        'y' => "थ",
        'z' => "श",
        '{' => "र्",
        _ => "",
    }
}

pub fn is_legacy_preeti_text(text: &str) -> bool {
    if text.is_empty() {
        return false;
    }
    let preeti_signatures = [
        "g]kfn", "sf7df8f", "a'4", "sfo{", "ljsf;", "f]", "f}", "]", "{",
    ];

    for sig in preeti_signatures.iter() {
        if text.contains(sig) {
            return true;
        }
    }
    false
}

pub fn convert_preeti_to_unicode(input: &str) -> String {
    if input.is_empty() {
        return String::new();
    }

    let mut res = input.to_string();

    for &(preeti_str, uni_str) in PREETI_MULTI {
        res = res.replace(preeti_str, uni_str);
    }

    let mut replaced = String::with_capacity(res.len() * 2);
    for ch in res.chars() {
        let mapped = preeti_single_map(ch);
        if !mapped.is_empty() {
            replaced.push_str(mapped);
        } else {
            replaced.push(ch);
        }
    }

    res = replaced;

    let devanagari_consonant = r"[\u{0915}-\u{0939}\u{0958}-\u{095F}]";
    let halant = r"\u{094D}";
    let consonant_cluster = format!("(?:{}{})*{}", devanagari_consonant, halant, devanagari_consonant);
    let pattern_ikar_str = format!("ि({})", consonant_cluster);

    if let Ok(re_ikar) = Regex::new(&pattern_ikar_str) {
        res = re_ikar.replace_all(&res, "$1ि").to_string();
    }

    res = res.replace('{', "र्");
    res = res.replace("अा", "आ");
    res = res.replace("अो", "ओ");
    res = res.replace("अौ", "औ");
    res = res.replace("अे", "ए");

    res = repair_devanagari_cmap(&res);
    res.nfc().collect::<String>()
}

/// Repairs Devanagari glyph offsets, matra reorderings, and split character spaces
pub fn repair_devanagari_cmap(input: &str) -> String {
    let mut res = input.to_string();

    // 1. Apply CMap Repair Dictionary FIRST
    for &(bad_str, good_str) in CMAP_REPAIR_MAP {
        res = res.replace(bad_str, good_str);
    }

    // 2. Fix '् म' ligature splitting (e.g., 'त् म' -> 'त्य', 'ख् म' -> 'ख्य')
    let devanagari_consonant = r"[\u{0915}-\u{0939}\u{0958}-\u{095F}]";
    let pattern_yam = format!("({})् म", devanagari_consonant);
    if let Ok(re_yam) = Regex::new(&pattern_yam) {
        res = re_yam.replace_all(&res, "$1्य").to_string();
    }

    // 3. Fix orphan ' य ' -> ' र ' in sentence context
    if let Ok(re_ya) = Regex::new(r" (\u{092F}) ") {
        res = re_ya.replace_all(&res, " र ").to_string();
    }

    // Collapse multiple spaces
    if let Ok(re_spaces) = Regex::new(r"[ \t]{2,}") {
        res = re_spaces.replace_all(&res, " ").to_string();
    }

    res
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nepal_conversion() {
        assert_eq!(convert_preeti_to_unicode("g]kfn"), "नेपाल");
    }

    #[test]
    fn test_kathmandu_conversion() {
        assert_eq!(convert_preeti_to_unicode("sf7df8f}+"), "काठमाडौ\u{902}");
    }

    #[test]
    fn test_buddha_conversion() {
        assert_eq!(convert_preeti_to_unicode("a'4"), "बुद्ध");
    }

    #[test]
    fn test_vikas_conversion() {
        assert_eq!(convert_preeti_to_unicode("ljsf;"), "विकास");
    }

    #[test]
    fn test_custom_cmap_repair() {
        let bad_input = "निषेधित १.ि भित ि व .सं २०७७ जेष्ठ ७ गते";
        let repaired = repair_devanagari_cmap(bad_input);
        assert!(repaired.contains("मिति"), "Expected 'मिति' in '{}'", repaired);
        assert!(repaired.contains("वि.सं"), "Expected 'वि.सं' in '{}'", repaired);
    }
}
