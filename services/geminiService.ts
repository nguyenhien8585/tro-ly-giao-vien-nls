import { GoogleGenAI } from "@google/genai";

// Năng lực số Reference Data (Condensed for Context)
export const NLS_CONTEXT_REF = `
TÀI LIỆU THAM CHIẾU (BẮT BUỘC DÙNG):
1. KHUNG NĂNG LỰC SỐ (TT 02/2025):
- Lĩnh vực 1: Khai thác dữ liệu & thông tin (1.1: Dữ liệu, 1.2: Đánh giá, 1.3: Quản lý).
- Lĩnh vực 2: Giao tiếp & Hợp tác (2.1: Tương tác, 2.2: Chia sẻ, 2.3: Công dân số, 2.4: Hợp tác, 2.5: Ứng xử).
- Lĩnh vực 3: Sáng tạo nội dung số (3.1: Phát triển ND, 3.2: Hiệu chỉnh, 3.3: Bản quyền, 3.4: Lập trình).
- Lĩnh vực 4: An toàn (4.1: Thiết bị, 4.2: Dữ liệu, 4.3: Sức khoẻ, 4.4: Môi trường).
- Lĩnh vực 5: Giải quyết vấn đề (5.1: Kỹ thuật, 5.2: Nhu cầu, 5.3: Sáng tạo, 5.4: Lỗ hổng).
- Lĩnh vực 6: Ứng dụng AI (6.1: Dữ liệu AI, 6.2: Sử dụng AI, 6.3: Đạo đức AI).

2. BẬC NĂNG LỰC (CV 3456):
- CB1, CB2 (Cơ bản)
- TC1, TC2 (Trung cấp)
- NC1 (Nâng cao)

QUY TẮC MÃ: [Lĩnh vực].[Thành phần].[Bậc]. Ví dụ: 1.1.CB1, 6.2.TC1.
`;

const SYSTEM_INSTRUCTION = `
Bạn là chuyên gia số hóa tài liệu giáo dục và tích hợp năng lực số chuẩn 5512.

QUY TẮC SỐNG CÒN (BẮT BUỘC TUÂN THỦ 100%):

1. KHÔNG ĐƯỢC CẮT BỚT NỘI DUNG (CRITICAL):
   - Bạn phải đóng vai một máy OCR (Quét văn bản) thông minh.
   - Nhiệm vụ: Tái tạo lại CHÍNH XÁC và ĐẦY ĐỦ nội dung từ file gốc vào định dạng Markdown.
   - TUYỆT ĐỐI KHÔNG dùng các cụm từ: "Tương tự như trên", "Các bước tiếp theo...", "Nội dung còn lại...".
   - Nếu file gốc có 10 trang, bạn phải xử lý đủ 10 trang. Nếu bảng có 50 dòng, phải viết đủ 50 dòng.

2. ƯU TIÊN TUYỆT ĐỐI CHO BẢNG TIẾN TRÌNH (PHẦN III):
   - Đây là phần quan trọng nhất. Dù nội dung dài đến đâu, Bảng Tiến Trình Dạy Học (Cột Hoạt động & Cột Sản phẩm) KHÔNG ĐƯỢC PHÉP THIẾU DÒNG NÀO.
   - Nếu sắp hết giới hạn từ (token), hãy viết ngắn gọn phần I, II, IV, nhưng PHẦN III PHẢI FULL.

3. ĐỊNH DẠNG BẢNG (MARKDOWN TABLE) CHUẨN:
   - Chỉ kẻ bảng cho phần "III. TIẾN TRÌNH DẠY HỌC".
   - Cấu trúc 2 cột cứng:
     | HOẠT ĐỘNG CỦA GV - HS | DỰ KIẾN SẢN PHẨM |
     | :--- | :--- |
     | <b>Hoạt động 1: ...</b><br>- GV: ...<br>- HS: ... | - Sản phẩm A...<br>- Sản phẩm B... |
   - XUỐNG DÒNG TRONG Ô: Bắt buộc dùng thẻ <br>. Không dùng phím Enter.

4. TÍCH HỢP MÃ NLS:
   - Chèn mã (VD: **[NLS: 1.1.CB1]**) vào cuối dòng tương ứng trong bảng hoặc mục tiêu.

5. NỐI TRANG:
   - File input thường là PDF/Ảnh bị ngắt trang. Bạn phải tự động NỐI LIỀN nội dung các trang lại. Không được để bảng bị đứt quãng giữa chừng.

6. XỬ LÝ CÔNG THỨC TOÁN HỌC (CRITICAL - MỚI):
   ⚠️ QUAN TRỌNG: Khi gặp công thức toán học, BẮT BUỘC viết theo format LaTeX:
   
   A. CÔNG THỨC INLINE (trong dòng văn bản):
      - Dùng dấu $ đơn: $công_thức$
      - Ví dụ: "Phương trình $ax^2 + bx + c = 0$ với $a \\neq 0$"
      - Ví dụ: "Biệt thức $\\Delta = b^2 - 4ac$"
   
   B. CÔNG THỨC DISPLAY (hiển thị riêng, căn giữa):
      - Dùng dấu $$ kép: $$công_thức$$
      - Ví dụ:
        $$
        x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
        $$
   
   C. CÔNG THỨC TRONG BẢNG:
      - Vẫn dùng $ hoặc $$ như bình thường
      - Ví dụ trong cell: "Tính $\\Delta = b^2 - 4ac$"
   
   D. CÁC KÝ HIỆU TOÁN PHẢI DÙNG LaTeX:
      - Phân số: \\frac{tử}{mẫu}
      - Căn bậc hai: \\sqrt{x}
      - Lũy thừa: x^2 (hoặc x^{10} nếu >1 chữ số)
      - Chỉ số dưới: x_1, x_2
      - Khác không: \\neq
      - Lớn hơn/nhỏ hơn: >, <, \\geq, \\leq
      - Dấu cộng trừ: \\pm
      - Tích phân: \\int
      - Sigma: \\sum
      - Pi: \\pi
      - Alpha, Beta: \\alpha, \\beta
   
   ❌ KHÔNG ĐƯỢC VIẾT:
      - "x2 + 5x + 6 = 0" (thiếu dấu $)
      - "Δ = b² - 4ac" (dùng ký tự Unicode thay vì LaTeX)
      - "x = (-b ± √(b²-4ac))/2a" (không dùng format LaTeX)
   
   ✅ PHẢI VIẾT:
      - "$x^2 + 5x + 6 = 0$"
      - "$\\Delta = b^2 - 4ac$"
      - "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"

7. XỬ LÝ ẢNH TỪ FILE INPUT (CRITICAL - MỚI):
   Khi phát hiện ảnh/hình vẽ/biểu đồ trong file input:
   
   A. MÔ TÃ CHI TIẾT:
      - Mô tả chi tiết nội dung ảnh bằng văn bản
      - Nếu là biểu đồ: mô tả trục, giá trị, xu hướng
      - Nếu là hình vẽ hình học: mô tả kích thước, góc, tên các điểm
   
   B. ĐÁNH DẤU VỊ TRÍ CHÈN ẢNH:
      - Sử dụng marker: [IMAGE_PLACEHOLDER_X]
      - X là số thứ tự ảnh (1, 2, 3,...)
      - Ví dụ:
        ```
        Quan sát hình vẽ sau:
        
        [IMAGE_PLACEHOLDER_1]
        *Hình 1: Đồ thị hàm số y = x^2*
        
        Từ đồ thị ta thấy...
        ```
   
   C. CHÚ THÍCH ẢNH:
      - Sau mỗi [IMAGE_PLACEHOLDER_X], thêm dòng chú thích
      - Format: *Hình X: Mô tả ngắn gọn*
   
   D. MÔ TẢ THAY THẾ (fallback):
      - Nếu không chèn được ảnh, cung cấp mô tả chi tiết
      - Ví dụ: "Hình vẽ thể hiện tam giác ABC vuông tại A, với AB = 3cm, AC = 4cm"

8. VÍ DỤ TỔNG HỢP:

   ```markdown
   ## Bài 1: Giải phương trình bậc hai
   
   Xét phương trình $ax^2 + bx + c = 0$ với $a \\neq 0$.
   
   **Công thức nghiệm:**
   
   $$
   x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}
   $$
   
   trong đó biệt thức $\\Delta = b^2 - 4ac$.
   
   [IMAGE_PLACEHOLDER_1]
   *Hình 1: Đồ thị hàm số bậc hai*
   
   **Ví dụ:** Giải phương trình $x^2 - 5x + 6 = 0$
   
   Ta có: $a = 1$, $b = -5$, $c = 6$
   
   Tính $\\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1 > 0$
   
   Phương trình có hai nghiệm:
   $$
   x_1 = \\frac{5 + 1}{2} = 3
   $$
   $$
   x_2 = \\frac{5 - 1}{2} = 2
   $$
   ```
`;

// Helper to parse multiple keys
const parseKeys = (apiKeyString: string): string[] => {
  if (!apiKeyString) return [];
  return apiKeyString
    .split(/[\n,]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0 && k.startsWith('AIza'));
};

const callGeminiWithKey = async (
  key: string,
  modelId: string,
  contents: any[]
) => {
  const client = new GoogleGenAI({ apiKey: key });
  const response = await client.models.generateContent({
    model: modelId,
    contents: contents.length > 1 ? { parts: contents } : contents[0].text,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    },
  });
  return response;
};

export const generateLessonPlan = async (
  prompt: string, 
  pdfPart?: { mimeType: string; data: string },
  apiKeyRaw?: string
) => {
  // 1. Prepare Keys
  const keySource = apiKeyRaw || process.env.API_KEY || "";
  const keys = parseKeys(keySource);

  if (keys.length === 0) {
    throw new Error("Vui lòng nhập ít nhất một API Key hợp lệ (bắt đầu bằng AIza...) trong phần Cấu hình.");
  }

  // 2. Prepare Content
  const contents = [];
  if (pdfPart) {
    contents.push({
      inlineData: {
        mimeType: pdfPart.mimeType,
        data: pdfPart.data
      }
    });
  }
  
  // Add enhanced prompt with math and image instructions
  const enhancedPrompt = `
${prompt}

⚠️ LƯU Ý QUAN TRỌNG VỀ ĐỊNH DẠNG:

1. CÔNG THỨC TOÁN HỌC:
   - Inline: $công_thức$ (ví dụ: $x^2 + 2x + 1 = 0$)
   - Display: $$công_thức$$ (công thức riêng, căn giữa)
   - PHẢI dùng LaTeX syntax: \\frac, \\sqrt, \\pm, \\neq, v.v.

2. HÌNH ẢNH (nếu có trong file):
   - Đánh dấu vị trí: [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2],...
   - Thêm chú thích: *Hình X: Mô tả*
   - Mô tả chi tiết nội dung ảnh

3. XUẤT RA MARKDOWN CHUẨN với bảng, công thức, và placeholder ảnh.
`;
  
  contents.push({ text: enhancedPrompt });

  // 3. Model Selection
  const modelId = "gemini-2.0-flash-exp"; 

  // 4. Retry Loop
  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    console.log(`Trying API Key ${i + 1}/${keys.length} (${currentKey.slice(0, 8)}...)`);

    try {
      const response = await callGeminiWithKey(currentKey, modelId, contents);
      
      if (!response.text) {
         throw new Error("AI trả về kết quả rỗng.");
      }
      
      // Post-process: Replace image placeholders with actual base64 if needed
      let processedText = response.text;
      
      // If we have images in the input, we could extract and replace placeholders here
      // For now, we just return the text with placeholders
      
      return processedText;

    } catch (error: any) {
      console.warn(`Key ${i + 1} failed:`, error.message);
      lastError = error;

      const isRetryable = 
        error.message?.includes('429') ||
        error.message?.includes('500') ||
        error.message?.includes('503') ||
        error.message?.includes('403') ||
        error.message?.includes('fetch failed');

      if (isRetryable && i < keys.length - 1) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
    }
  }

  // 5. Handle Final Failure
  console.error("All keys failed. Last error:", lastError);
  
  if (lastError?.message?.includes('429')) {
       throw new Error(`Tất cả ${keys.length} API Key đều đang bị quá tải (429). Vui lòng đợi 1 phút hoặc thêm Key mới.`);
  }
  if (lastError?.message?.includes('404')) {
      throw new Error("Model AI không khả dụng. Vui lòng kiểm tra lại cấu hình Key.");
  }
  
  throw new Error(lastError?.message || "Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối mạng và API Key.");
};
