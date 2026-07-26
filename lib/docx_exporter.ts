import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, ImageRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { PageOcrData } from "./pdf_ocr";

function dataURLtoUint8Array(dataurl: string): Uint8Array {
  const arr = dataurl.split(",");
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return u8arr;
}

export async function exportToDocx(
  pagesData: PageOcrData[] | string, 
  fileName: string = "converted-nepali-document.docx"
) {
  const children: Paragraph[] = [];

  if (Array.isArray(pagesData)) {
    // Page-by-Page 1-to-1 Exact PDF Page Matching & Real Picture Placement
    pagesData.forEach((pageObj, index) => {
      const lines = pageObj.text.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(new Paragraph({ text: "" }));
          continue;
        }

        // Heading detection for main titles
        if (trimmed.length < 50 && (trimmed.startsWith("नेपाल") || trimmed.includes("सरकार") || trimmed.includes("विभाग") || trimmed.includes("निषेधित"))) {
          children.push(
            new Paragraph({
              text: trimmed,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed,
                  font: "Mangal",
                  size: 24, // 12pt
                }),
              ],
              spacing: { before: 40, after: 80, line: 260 },
            })
          );
        }
      }

      // Embed ONLY real standalone picture assets (photos, JPEGs, PNGs, logos, seals)
      if (pageObj.realPictures && pageObj.realPictures.length > 0) {
        pageObj.realPictures.forEach((pic) => {
          try {
            const u8arr = dataURLtoUint8Array(pic.dataUrl);
            const targetWidth = Math.min(450, Math.max(80, pic.width));
            const targetHeight = Math.round(targetWidth * (pic.height / (pic.width || 1)));

            children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: u8arr,
                    transformation: {
                      width: targetWidth,
                      height: Math.min(350, targetHeight),
                    },
                  }),
                ],
                spacing: { before: 140, after: 140 },
              })
            );
          } catch (e) {
            console.warn("Could not embed real picture for page " + pageObj.pageNumber, e);
          }
        });
      }

      // Insert PageBreak between pages to guarantee strict 1-to-1 page matching!
      if (index < pagesData.length - 1) {
        children.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    });
  } else {
    // Simple text string fallback
    const lines = pagesData.split("\n");
    for (const line of lines) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Mangal",
              size: 24,
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}
