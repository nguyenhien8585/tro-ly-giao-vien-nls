/**
 * Utility functions for processing mathematical formulas
 * Converts LaTeX formulas to base64 images for Word export
 */

export interface MathConversionOptions {
  scale?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Convert KaTeX rendered SVG to base64 PNG image
 * @param mathElement - The DOM element containing the rendered math
 * @param options - Conversion options
 * @returns Promise<string> - Base64 encoded PNG image
 */
export const convertMathElementToBase64 = async (
  mathElement: HTMLElement,
  options: MathConversionOptions = {}
): Promise<string> => {
  const {
    scale = 3,
    backgroundColor = 'white',
    foregroundColor = 'black'
  } = options;

  try {
    // Find SVG element within the math container
    const svgElement = mathElement.querySelector('svg');
    if (!svgElement) {
      console.warn('No SVG found in math element');
      return '';
    }

    // Get dimensions
    const bbox = svgElement.getBoundingClientRect();
    const width = Math.max(bbox.width || 100, 50);
    const height = Math.max(bbox.height || 30, 20);

    // Create high-resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set white background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Serialize SVG
    const svgString = new XMLSerializer().serializeToString(svgElement);
    
    // Create blob from SVG
    const svgBlob = new Blob([svgString], { 
      type: 'image/svg+xml;charset=utf-8' 
    });
    const url = URL.createObjectURL(svgBlob);

    // Load and draw SVG
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Draw with scaling
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Clean up
          URL.revokeObjectURL(url);
          
          // Convert to base64
          const base64 = canvas.toDataURL('image/png', 1.0);
          resolve(base64);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };

      // Set source to trigger load
      img.src = url;
    });
  } catch (error) {
    console.error('Error in convertMathElementToBase64:', error);
    return '';
  }
};

/**
 * Extract LaTeX source from KaTeX rendered element
 * @param mathElement - The DOM element containing the rendered math
 * @returns string - The original LaTeX source code
 */
export const extractLatexSource = (mathElement: HTMLElement): string => {
  try {
    // Try to get from MathML annotation
    const annotation = mathElement.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation?.textContent) {
      return annotation.textContent;
    }

    // Try to get from data attribute
    const dataTeX = mathElement.getAttribute('data-tex');
    if (dataTeX) {
      return dataTeX;
    }

    // Fallback to aria-label
    const ariaLabel = mathElement.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    return '';
  } catch (error) {
    console.error('Error extracting LaTeX source:', error);
    return '';
  }
};

/**
 * Check if math element is block-level (display mode)
 * @param mathElement - The DOM element containing the rendered math
 * @returns boolean - True if display mode, false if inline
 */
export const isMathDisplayMode = (mathElement: HTMLElement): boolean => {
  return mathElement.classList.contains('katex-display') ||
         mathElement.parentElement?.classList.contains('katex-display') ||
         false;
};

/**
 * Convert all math formulas in a container to base64 images
 * @param container - The container element with math formulas
 * @param options - Conversion options
 * @returns Promise<HTMLElement> - Clone of container with images
 */
export const convertAllMathToImages = async (
  container: HTMLElement,
  options: MathConversionOptions = {}
): Promise<HTMLElement> => {
  // Clone to avoid modifying original
  const clonedContainer = container.cloneNode(true) as HTMLElement;
  
  // Find all math elements
  const mathElements = clonedContainer.querySelectorAll('.katex');
  
  console.log(`Converting ${mathElements.length} math formulas to images...`);

  // Convert each math element
  for (let i = 0; i < mathElements.length; i++) {
    const mathElement = mathElements[i] as HTMLElement;
    
    try {
      // Get LaTeX source for alt text
      const latexSource = extractLatexSource(mathElement);
      const isDisplayMode = isMathDisplayMode(mathElement);

      // Convert to base64 image
      const base64Image = await convertMathElementToBase64(mathElement, options);

      if (base64Image) {
        // Create image element
        const imgElement = document.createElement('img');
        imgElement.src = base64Image;
        imgElement.alt = latexSource;
        imgElement.setAttribute('data-math-type', isDisplayMode ? 'block' : 'inline');
        
        // Set styling
        imgElement.style.verticalAlign = 'middle';
        imgElement.style.maxWidth = '100%';
        
        if (isDisplayMode) {
          imgElement.style.display = 'block';
          imgElement.style.margin = '12px auto';
        } else {
          imgElement.style.display = 'inline';
          imgElement.style.margin = '0 2px';
        }

        // Replace original element
        mathElement.parentNode?.replaceChild(imgElement, mathElement);

        console.log(`✓ Converted formula ${i + 1}/${mathElements.length}`);
      } else {
        console.warn(`✗ Failed to convert formula ${i + 1}/${mathElements.length}`);
      }
    } catch (error) {
      console.error(`Error converting formula ${i + 1}:`, error);
    }
  }

  return clonedContainer;
};

/**
 * Create a Word-compatible HTML document with embedded images
 * @param htmlContent - The HTML content with base64 images
 * @returns string - Complete HTML document for Word
 */
export const createWordDocument = (htmlContent: string): string => {
  const styles = `
    <style>
      @page {
        size: A4;
        margin: 2.54cm;
      }
      body {
        font-family: 'Times New Roman', serif;
        font-size: 13pt;
        line-height: 1.5;
        color: #000000;
      }
      h1 { 
        font-size: 16pt; 
        font-weight: bold; 
        text-align: center; 
        text-transform: uppercase; 
        margin-bottom: 12pt; 
      }
      h2 { 
        font-size: 14pt; 
        font-weight: bold; 
        color: #0056b3; 
        margin-top: 18pt; 
        margin-bottom: 6pt; 
        border-bottom: 1px solid #ddd; 
      }
      h3 { 
        font-size: 13pt; 
        font-weight: bold; 
        margin-top: 12pt; 
        margin-bottom: 6pt; 
      }
      p { 
        margin-bottom: 6pt; 
        text-align: justify; 
      }
      table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #000000;
        margin-bottom: 12pt;
      }
      th {
        background-color: #e6f7ff;
        border: 1px solid #000000;
        padding: 8pt;
        font-weight: bold;
        text-align: center;
      }
      td {
        border: 1px solid #000000;
        padding: 8pt;
        vertical-align: top;
      }
      ul, ol { 
        margin-left: 18pt; 
        margin-bottom: 12pt; 
      }
      li { 
        margin-bottom: 3pt; 
      }
      img[data-math-type="inline"] {
        display: inline;
        vertical-align: middle;
        margin: 0 2pt;
      }
      img[data-math-type="block"] {
        display: block;
        margin: 12pt auto;
      }
      strong { 
        font-weight: bold; 
      }
    </style>
  `;

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Kế Hoạch Bài Dạy</title>
        ${styles}
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;
};
