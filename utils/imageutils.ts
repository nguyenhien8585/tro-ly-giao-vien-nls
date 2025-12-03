/**
 * Image Extraction and Processing Utility
 * Extracts images from PDF/Word files and converts to base64
 */

export interface ExtractedImage {
  index: number;
  base64: string;
  mimeType: string;
  width?: number;
  height?: number;
  description?: string;
}

/**
 * Extract images from PDF using PDF.js
 * @param pdfData - Base64 encoded PDF data
 * @returns Promise<ExtractedImage[]>
 */
export const extractImagesFromPDF = async (pdfData: string): Promise<ExtractedImage[]> => {
  // Note: This requires pdf.js library
  // For now, return empty array as placeholder
  // In production, implement with pdf.js
  console.log('PDF image extraction not yet implemented');
  return [];
};

/**
 * Extract images from Word document
 * @param docxFile - File object
 * @returns Promise<ExtractedImage[]>
 */
export const extractImagesFromDocx = async (docxFile: File): Promise<ExtractedImage[]> => {
  try {
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.warn('JSZip not available, cannot extract images');
      return [];
    }

    const zip = new JSZip();
    const zipContent = await zip.loadAsync(docxFile);
    
    const images: ExtractedImage[] = [];
    const mediaFolder = zipContent.folder('word/media');
    
    if (!mediaFolder) {
      return [];
    }

    let index = 0;
    for (const [filename, file] of Object.entries(mediaFolder.files)) {
      if (file.dir) continue;
      
      // Check if it's an image
      const ext = filename.split('.').pop()?.toLowerCase();
      if (!['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext || '')) {
        continue;
      }

      // Get image data
      const imageData = await file.async('base64');
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      
      images.push({
        index: index + 1,
        base64: `data:${mimeType};base64,${imageData}`,
        mimeType,
        description: `Image ${index + 1} from document`
      });
      
      index++;
    }

    return images;
  } catch (error) {
    console.error('Error extracting images from DOCX:', error);
    return [];
  }
};

/**
 * Replace image placeholders in markdown with actual base64 images
 * @param markdown - Markdown content with [IMAGE_PLACEHOLDER_X] markers
 * @param images - Array of extracted images
 * @returns string - Markdown with embedded base64 images
 */
export const replaceImagePlaceholders = (
  markdown: string,
  images: ExtractedImage[]
): string => {
  let result = markdown;
  
  images.forEach((image) => {
    const placeholder = `[IMAGE_PLACEHOLDER_${image.index}]`;
    
    // Replace placeholder with markdown image syntax
    const imageMarkdown = `![Hình ${image.index}](${image.base64})`;
    
    result = result.replace(placeholder, imageMarkdown);
  });
  
  return result;
};

/**
 * Convert markdown images to HTML with base64
 * Used for Word export
 * @param markdown - Markdown content
 * @returns string - HTML with img tags
 */
export const convertMarkdownImagesToHTML = (markdown: string): string => {
  // Match markdown image syntax: ![alt](src)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  return markdown.replace(imageRegex, (match, alt, src) => {
    // If src is already base64, use it directly
    if (src.startsWith('data:')) {
      return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; display: block; margin: 12px auto;" />`;
    }
    
    // Otherwise, it's a URL or path
    return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; display: block; margin: 12px auto;" />`;
  });
};

/**
 * Extract images from uploaded file based on file type
 * @param file - Uploaded file
 * @returns Promise<ExtractedImage[]>
 */
export const extractImagesFromFile = async (file: File): Promise<ExtractedImage[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      // For PDF, we'd need to use the base64 data passed to Gemini
      // Gemini can "see" images in PDF and describe them
      console.log('PDF images will be processed by Gemini Vision API');
      return [];
      
    case 'docx':
      return await extractImagesFromDocx(file);
      
    default:
      return [];
  }
};

/**
 * Create image placeholder instruction for AI
 * @param imageCount - Number of images detected
 * @returns string - Instruction for AI
 */
export const createImagePlaceholderInstruction = (imageCount: number): string => {
  if (imageCount === 0) return '';
  
  return `
📸 PHÁT HIỆN ${imageCount} HÌNH ẢNH TRONG TÀI LIỆU:

Khi gặp hình ảnh, hãy:
1. Mô tả chi tiết nội dung hình ảnh
2. Đánh dấu vị trí bằng [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2], etc.
3. Thêm chú thích: *Hình X: Mô tả ngắn gọn*

Ví dụ:
\`\`\`
Quan sát đồ thị sau:

[IMAGE_PLACEHOLDER_1]
*Hình 1: Đồ thị hàm số y = x²*

Từ đồ thị ta thấy hàm số đạt giá trị nhỏ nhất tại x = 0.
\`\`\`
`;
};

/**
 * Process content after AI generation
 * Replace placeholders with actual images if available
 * @param content - AI generated content
 * @param images - Extracted images
 * @returns string - Processed content
 */
export const processContentWithImages = (
  content: string,
  images: ExtractedImage[]
): string => {
  if (images.length === 0) {
    return content;
  }
  
  return replaceImagePlaceholders(content, images);
};
