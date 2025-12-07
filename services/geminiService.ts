

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Grade, Subject, Language, TTSConfig, VocabularyItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to normalize text for TTS (pronunciation rules)
const normalizeTextForTTS = (text: string): string => {
  let processed = text;

  const rules: { pattern: RegExp; replacement: string }[] = [
    // Abbreviations
    { pattern: /\bGV\b/g, replacement: "giáo viên" },
    { pattern: /\bHS\b/g, replacement: "học sinh" },

    // Area (High priority for multi-char matches and exponents)
    { pattern: /\bkm[2²]\b/gi, replacement: "ki lô mét vuông" },
    { pattern: /\bhm[2²]\b/gi, replacement: "héc tô mét vuông" },
    { pattern: /\bdam[2²]\b/gi, replacement: "đề ca mét vuông" },
    { pattern: /\bha\b/gi, replacement: "héc ta" },
    { pattern: /\bm[2²]\b/gi, replacement: "mét vuông" },
    { pattern: /\bdm[2²]\b/gi, replacement: "đề xi mét vuông" },
    { pattern: /\bcm[2²]\b/gi, replacement: "xen ti mét vuông" },
    { pattern: /\bmm[2²]\b/gi, replacement: "mi li mét vuông" },

    // Volume
    { pattern: /\bm[3³]\b/gi, replacement: "mét khối" },
    { pattern: /\bdm[3³]\b/gi, replacement: "đề xi mét khối" },
    { pattern: /\bcm[3³]\b/gi, replacement: "xen ti mét khối" },
    { pattern: /\bmm[3³]\b/gi, replacement: "mi li mét khối" },
    { pattern: /\bl\b/g, replacement: "lít" }, // Case sensitive 'l' to avoid generic usage

    // Length (Multi-char first)
    { pattern: /\bkm\b/gi, replacement: "ki lô mét" },
    { pattern: /\bhm\b/gi, replacement: "héc tô mét" },
    { pattern: /\bdam\b/gi, replacement: "đề ca mét" },
    { pattern: /\bdm\b/gi, replacement: "đề xi mét" },
    { pattern: /\bcm\b/gi, replacement: "xen ti mét" },
    { pattern: /\bmm\b/gi, replacement: "mi li mét" },
    { pattern: /\bm\b/g, replacement: "mét" }, // Case sensitive 'm'

    // Mass
    { pattern: /\bkg\b/gi, replacement: "ki lô gam" },
    { pattern: /\bhg\b/gi, replacement: "héc tô gam" },
    { pattern: /\bdag\b/gi, replacement: "đề ca gam" },
    { pattern: /\bg\b/g, replacement: "gam" }, // Case sensitive 'g'
  ];

  for (const rule of rules) {
    processed = processed.replace(rule.pattern, rule.replacement);
  }

  return processed;
};

export const solveProblem = async (
  promptText: string,
  imageBase64: string | null,
  subject: Subject,
  grade: Grade,
  language: Language,
  creativity: 'creative' | 'academic',
  isFollowUp: boolean = false // New parameter to track "Not Understood" state
): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash"; // Fast and capable for tutoring
    
    const langInstruction = language === Language.GB
      ? "QUAN TRỌNG: Hãy giải thích và hướng dẫn hoàn toàn bằng TIẾNG ANH (English)."
      : "Hãy giải thích và hướng dẫn bằng TIẾNG VIỆT.";

    const styleInstruction = creativity === 'creative' 
      ? "Hãy giải thích một cách sáng tạo, vui nhộn, sử dụng các ví dụ thực tế thú vị để học sinh dễ nhớ."
      : "Hãy giải thích theo chuẩn sư phạm, ân cần, kiên nhẫn.";

    // Specific instructions for Primary School Math
    let mathSpecificInstruction = "";
    if (subject === Subject.MATH) {
      if (!isFollowUp) {
        // INITIAL GUIDE MODE
        mathSpecificInstruction = `
        QUY TẮC ĐẶC BIỆT CHO MÔN TOÁN (${grade}):
        1. VAI TRÒ: Bạn là người hướng dẫn, KHÔNG phải máy giải bài tập.
        2. MỤC TIÊU: Giúp học sinh tự tư duy để tìm ra đáp án.
        3. TUYỆT ĐỐI KHÔNG:
           - KHÔNG giải chi tiết ra kết quả cuối cùng.
           - KHÔNG ghi "Đáp số: ..." hoặc đưa ra con số kết quả.
           - KHÔNG làm thay phần tính toán của học sinh.
        4. CẤU TRÚC HƯỚNG DẪN:
           - Bước 1: Tóm tắt đề bài (Ngắn gọn, dùng sơ đồ nếu cần).
           - Bước 2: Phân tích: Đề bài cho gì? Đề bài hỏi gì?
           - Bước 3: Gợi ý phương pháp: Nên dùng cách nào (Sơ đồ đoạn thẳng, Rút về đơn vị, v.v.).
           - Bước 4: Hướng dẫn từng bước: "Đầu tiên em hãy tính...", "Sau đó em tính...".
           - Bước 5: Đặt câu hỏi gợi mở: "Em thử tính xem kết quả bước này là bao nhiêu?"
        `;
      } else {
        // EXPLAIN MORE MODE (Chưa hiểu lắm)
        mathSpecificInstruction = `
        QUY TẮC KHI HỌC SINH CHƯA HIỂU (${grade}):
        1. Học sinh đang gặp khó khăn. Hãy giải thích lại chậm hơn và chi tiết hơn.
        2. Chia nhỏ vấn đề thành các bước đơn giản nhất có thể.
        3. Giải thích "Tại sao" lại làm như vậy (Bản chất toán học).
        4. Vẫn GIỮ NGUYÊN TẮC: KHÔNG đưa ra đáp án cuối cùng ngay lập tức, hãy để học sinh tự điền con số cuối cùng.
        5. Dùng lời động viên, khích lệ.
        `;
      }
    } else {
        // Existing Standard Rules for other subjects (unchanged logic mostly, but ensured plain text)
        mathSpecificInstruction = `
         Với môn này, hãy giải thích chi tiết, đưa ra câu trả lời chính xác và mở rộng kiến thức liên quan.
        `;
    }

    // Construct a persona-based system instruction implicitly via the prompt or explicitly
    const systemContext = `
      Bạn là "Thầy Hùng", một gia sư AI thân thiện, thông minh và kiên nhẫn.
      Đối tượng học sinh: ${grade}.
      Môn học: ${subject}.
      
      Nhiệm vụ của bạn:
      1. ${isFollowUp ? "Học sinh chưa hiểu bài giải trước. Hãy giải thích kỹ hơn." : "Hướng dẫn học sinh giải quyết vấn đề."}
      2. ${langInstruction}
      3. Sử dụng ngôn ngữ phù hợp với lứa tuổi học sinh ${grade}, giọng điệu khích lệ, ân cần.
      4. ${styleInstruction}
      5. Trình bày bài giải dưới dạng VĂN BẢN THUẦN TÚY (Plain Text). 
         - TUYỆT ĐỐI KHÔNG sử dụng các ký tự định dạng Markdown như: dấu sao (*), hai dấu sao (**), ba dấu thăng (###). 
         - Để nhấn mạnh, hãy viết HOA hoặc xuống dòng.
         - Với phép nhân trong toán học, hãy dùng chữ "x" thay vì dấu "*".
         - Với danh sách, hãy dùng gạch đầu dòng "-" thay vì dấu "*".
      6. Khi nhắc đến các nhân vật lịch sử Việt Nam, hãy dùng danh xưng trân trọng là "ông" hoặc "bà" trước tên của họ (ví dụ: ông Ngô Quyền, bà Trưng Trắc).
      7. QUY TẮC XƯNG HÔ: Luôn xưng "Thầy" và gọi học sinh là "em". TUYỆT ĐỐI KHÔNG dùng từ "con", "các con" hoặc cụm từ "đó con".
      
      ${mathSpecificInstruction}
      
      Nếu bài tập là hình ảnh, hãy trích xuất nội dung văn bản và xử lý theo quy tắc trên.
    `;

    const fullPrompt = `${systemContext}\n\nĐề bài/Câu hỏi của học sinh:\n${promptText}`;

    const parts: any[] = [];
    
    // Add image if present
    if (imageBase64) {
      // Remove header from base64 string if present (e.g., "data:image/png;base64,")
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // Assuming JPEG/PNG, gemini handles standard image types
        },
      });
    }

    // Add text prompt
    parts.push({
      text: fullPrompt,
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        temperature: creativity === 'creative' ? 0.7 : 0.2,
      }
    });

    let text = response.text || "Xin lỗi, Thầy Hùng chưa hiểu rõ câu hỏi. Bạn thử lại nhé!";
    
    // Post-processing cleanup to ensure no markdown artifacts remain
    text = text.replace(/\*\*/g, '');
    text = text.replace(/^#+\s*/gm, '');
    text = text.replace(/^\s*\*\s/gm, '- ');

    return text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã có lỗi xảy ra khi kết nối với Thầy Hùng. Vui lòng kiểm tra lại mạng hoặc thử lại sau.";
  }
};

export async function* streamSpeech(text: string, config: TTSConfig) {
  try {
    // Clean text from markdown for better reading
    let cleanText = text.replace(/[*#_`]/g, '');

    // Apply pronunciation rules
    cleanText = normalizeTextForTTS(cleanText);

    const streamResult = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: cleanText }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: config.voiceName // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            }
          }
        }
      }
    });

    for await (const chunk of streamResult) {
      const audioData = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        yield audioData;
      }
    }
  } catch (error) {
    console.error("TTS Streaming Error:", error);
  }
}

export const generateImage = async (
  prompt: string, 
  referenceImageBase64: string | null,
  aspectRatio: string = "16:9" // Default aspect ratio
): Promise<string | null> => {
  try {
    const parts: any[] = [];
    
    if (referenceImageBase64) {
      const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/png", 
        },
      });
    }
    
    parts.push({ text: prompt });

    // Use "Nano Banana" model alias
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts: parts },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio
        }
      }
    });

    // Check for image in parts
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
         if (part.inlineData) {
             return part.inlineData.data;
         }
      }
    }
    return null;
  } catch (e) {
    console.error("Generate Image Error:", e);
    return null;
  }
}

export const extractVocabulary = async (text: string): Promise<VocabularyItem[]> => {
  try {
    const prompt = `
      Hãy phân tích văn bản tiếng Anh sau và trích xuất các từ vựng quan trọng để học sinh tiểu học học tập.
      Phân loại từ vựng thành 3 cấp độ:
      - 'easy': Từ cơ bản (A1-A2)
      - 'medium': Từ trung bình (B1)
      - 'hard': Từ khó (B2 trở lên)

      Văn bản: "${text}"

      Trả về kết quả dưới dạng JSON Array (chỉ JSON thuần, không markdown) với cấu trúc:
      [
        {
          "word": "apple",
          "type": "n (danh từ)",
          "meaning": "a round fruit with red or green skin",
          "vietnamese": "quả táo",
          "level": "easy"
        }
      ]
      Hãy tìm ít nhất 5-10 từ nếu có thể.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT,
             properties: {
               word: { type: Type.STRING },
               type: { type: Type.STRING },
               meaning: { type: Type.STRING },
               vietnamese: { type: Type.STRING },
               level: { type: Type.STRING }
             }
           }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as VocabularyItem[];
    }
    return [];
  } catch (e) {
    console.error("Extract Vocab Error:", e);
    return [];
  }
};