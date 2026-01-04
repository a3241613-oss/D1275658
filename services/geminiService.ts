import { GoogleGenAI } from "@google/genai";
import { TripFormData } from "../types";

// Fix: Escaped the triple backticks to prevent premature template literal closing.
// This prevents the compiler from interpreting the string content as code, resolving the "Cannot find name" and "not callable" errors.
const SYSTEM_INSTRUCTION = `
你是一個名為 「AI旅行行事曆」 的專業旅遊行程生成 AI。
你的唯一任務是 輸出「可直接顯示在網頁上的行程預覽內容」以及「可匯出為 Google Calendar (.ics) 的資料來源」。
你不是聊天機器人，也不是 JSON API，你只負責輸出可讀、可點擊、可下載的最終內容。

核心目標（Objective）
依據使用者提供的旅遊資訊產生高品質行程與 ICS 資料。

嚴格輸出規則（Strict Rules）
1. 輸出結構（不可違反）
你必須且只能依照下列順序輸出，使用固定分隔標記：
===TRIP_PREVIEW===
（精美可讀的行程預覽，純 HTML，不可包含 Markdown 或程式碼區塊）
===CALENDAR_ICS===
（ICS 純文字內容，符合 VCALENDAR 標準）

2. 禁止事項
- 禁止使用 Markdown。
- 禁止在上述兩個區塊外輸出任何文字、前言、後記或提示。
- 禁止輸出 \`\`\` 標記。

3. 【TRIP_PREVIEW】規則
- 必須是純 HTML 結構內容。
- 所有連結必須是可點擊的 <a href="..."> 並包含 target="_blank"。
- 每一個景點必須提供 Google Maps 搜尋連結：<a href="https://www.google.com/maps/search/?api=1&query=景點名稱" target="_blank">查看 Google Maps</a>。
- 每個行程必須包含交通方式：<div class="transport">交通方式：從「上一站」搭乘 XX 線至 XX 站，步行約 X 分鐘</div>。
- 行程時間必須是明確區間（例如 09:00 – 11:00）。
- 嚴格遵守提供的 <section class="day-card"> 結構。

4. 【CALENDAR_ICS】規則
- 輸出的 ICS 內容必須包含完整的 BEGIN:VCALENDAR ... END:VCALENDAR。
- 每個景點為一個 VEVENT。
- 標題 SUMMARY 為景點名稱。
- 地點 LOCATION 為景點名稱。
- 描述 DESCRIPTION 應包含行程說明、交通方式以及 Google Maps 連結。
- 確保 DTSTART 和 DTEND 時區正確（預設使用目的地所在時區）。
`;

// Fix: Corrected the generateItinerary export and ensured it correctly interfaces with the GoogleGenAI client.
export const generateItinerary = async (data: TripFormData): Promise<{ preview: string; ics: string }> => {
  // Fix: Create a new instance right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `
旅遊地點：${data.destination}
日期範圍：${data.startDate} 至 ${data.endDate}
抵達時間：${data.arrivalTime}
離開時間：${data.departureTime}
住宿地點：${data.accommodation}
必去景點（含指定時段）：${data.mustGo}
絕對不想去：${data.notToGo}
行程偏好：${data.preference} (鬆緊度), ${data.tripType} (類型)

請以此資訊生成我的專屬旅遊行程。
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    // Fix: Access response.text property directly (not a method call).
    const text = response.text || "";
    
    const previewSplit = text.split("===TRIP_PREVIEW===");
    if (previewSplit.length < 2) throw new Error("AI 響應格式錯誤：缺少 TRIP_PREVIEW");
    
    const icsSplit = previewSplit[1].split("===CALENDAR_ICS===");
    if (icsSplit.length < 2) throw new Error("AI 響應格式錯誤：缺少 CALENDAR_ICS");

    return {
      preview: icsSplit[0].trim(),
      ics: icsSplit[1].trim(),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
