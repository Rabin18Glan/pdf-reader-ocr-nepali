export interface RealPictureAsset {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  yRatio: number; // Vertical position ratio on page (0.0 top, 1.0 bottom)
}

export async function extractRealPicturesFromPage(page: any): Promise<RealPictureAsset[]> {
  const realPictures: RealPictureAsset[] = [];

  try {
    const operatorList = await page.getOperatorList();
    const pdfjsLib = await import("pdfjs-dist");

    const fnArray = operatorList.fnArray;
    const argsArray = operatorList.argsArray;

    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    let currentY = pageHeight / 2; // Default vertical middle

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i];

      // Track vertical translation coordinates from drawing matrices
      if (fn === pdfjsLib.OPS.transform || fn === pdfjsLib.OPS.setTextMatrix) {
        if (args && args.length >= 6) {
          currentY = args[5]; // Y translation
        }
      }

      // Detect painted image XObjects
      if (
        fn === pdfjsLib.OPS.paintImageXObject || 
        fn === pdfjsLib.OPS.paintInlineImageXObject ||
        fn === pdfjsLib.OPS.paintImageMaskXObject
      ) {
        const imgName = args[0];
        if (!imgName) continue;

        try {
          // Fetch raw image object from PDF dictionary
          page.objs.get(imgName, (imgObj: any) => {
            if (!imgObj) return;

            const imgWidth = imgObj.width || 0;
            const imgHeight = imgObj.height || 0;

            // STRICT FILTERING: Ignore full page background renders!
            // A real picture is a standalone asset (logo, photo, diagram, seal) smaller than 85% of full page
            const isFullPageRender = 
              (imgWidth >= pageWidth * 0.85 && imgHeight >= pageHeight * 0.85) ||
              (imgWidth > 1500 && imgHeight > 2000);

            if (isFullPageRender) {
              // Skip full page background scans/renders!
              return;
            }

            // Must have valid picture dimensions
            if (imgWidth < 10 || imgHeight < 10) return;

            const canvas = document.createElement("canvas");
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            if (imgObj.data) {
              const imgData = ctx.createImageData(imgWidth, imgHeight);
              const data = imgObj.data;
              const len = data.length;

              if (len === imgWidth * imgHeight * 4) {
                // RGBA pixel buffer
                imgData.data.set(data);
              } else if (len === imgWidth * imgHeight * 3) {
                // RGB pixel buffer
                for (let j = 0, k = 0; j < len; j += 3, k += 4) {
                  imgData.data[k] = data[j];
                  imgData.data[k + 1] = data[j + 1];
                  imgData.data[k + 2] = data[j + 2];
                  imgData.data[k + 3] = 255;
                }
              } else if (len === imgWidth * imgHeight) {
                // Grayscale pixel buffer
                for (let j = 0, k = 0; j < len; j++, k += 4) {
                  const val = data[j];
                  imgData.data[k] = val;
                  imgData.data[k + 1] = val;
                  imgData.data[k + 2] = val;
                  imgData.data[k + 3] = 255;
                }
              }

              ctx.putImageData(imgData, 0, 0);
              const dataUrl = canvas.toDataURL("image/png");

              // Compute vertical position ratio relative to text
              const yRatio = pageHeight > 0 ? Math.max(0, Math.min(1, 1.0 - (currentY / pageHeight))) : 0.5;

              realPictures.push({
                id: imgName,
                dataUrl,
                width: imgWidth,
                height: imgHeight,
                yRatio,
              });
            }
          });
        } catch (err) {
          console.warn("Could not extract embedded picture object:", imgName, err);
        }
      }
    }
  } catch (err) {
    console.warn("Error parsing PDF operator list for real pictures:", err);
  }

  return realPictures;
}
