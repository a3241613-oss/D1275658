
import React, { useState, useCallback, useRef } from 'react';
import { TripFormData, TripResponse } from './types';
import { generateItinerary } from './services/geminiService';

const App: React.FC = () => {
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    startDate: '',
    endDate: '',
    arrivalTime: '10:00',
    departureTime: '18:00',
    accommodation: '',
    mustGo: '',
    notToGo: '',
    preference: 'normal',
    tripType: '觀光、美食、文化體驗',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "正在分析目的地最佳路線...",
    "正在挑選推薦的在地美食...",
    "正在規劃順暢的交通接駁...",
    "正在編排精美的行程預覽...",
    "即將完成，準備好您的行李了嗎？"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    let step = 0;
    const interval = setInterval(() => {
      setLoadingStep(s => (s + 1) % loadingMessages.length);
    }, 3000);

    try {
      const { preview, ics } = await generateItinerary(formData);
      setResult({ html: preview, ics });
    } catch (err: any) {
      setError(err.message || "行程生成失敗，請稍後再試。");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleDownloadIcs = useCallback(() => {
    if (!result?.ics) return;
    const blob = new Blob([result.ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trip-to-${formData.destination}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result, formData.destination]);

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <h1 className="text-xl font-bold text-slate-800">AI 旅行行事曆</h1>
          </div>
          {result && (
            <button
              onClick={handleDownloadIcs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <span>📅</span> 匯出到 Google 日曆
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {!result && !isLoading && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">開始規劃您的完美旅程</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">旅遊地點</label>
                  <input
                    required
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="例如：東京、巴黎、紐約"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">行程類型</label>
                  <input
                    name="tripType"
                    value={formData.tripType}
                    onChange={handleInputChange}
                    placeholder="例如：親子、血拼、放鬆"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">出發日期</label>
                  <input
                    required
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">回程日期</label>
                  <input
                    required
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">預計抵達時間</label>
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">預計離開時間</label>
                  <input
                    type="time"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">住宿地點 (及名稱)</label>
                <input
                  required
                  name="accommodation"
                  value={formData.accommodation}
                  onChange={handleInputChange}
                  placeholder="例如：東京站丸之內飯店"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">必去景點（可指定時段）</label>
                <textarea
                  name="mustGo"
                  value={formData.mustGo}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="例如：晴空塔、淺草寺 (第一天下午)、迪士尼 (全天)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">不想去的地方 (選填)</label>
                  <input
                    name="notToGo"
                    value={formData.notToGo}
                    onChange={handleInputChange}
                    placeholder="不想去的景點或區域"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">行程緊湊度</label>
                  <select
                    name="preference"
                    value={formData.preference}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="relaxed">輕鬆慢活</option>
                    <option value="normal">標準節奏</option>
                    <option value="packed">精實飽滿</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95"
              >
                生成專屬行程 🚀
              </button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-24 h-24 mb-6 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-xl font-medium text-slate-800 transition-all duration-500 h-8">
              {loadingMessages[loadingStep]}
            </p>
            <p className="mt-2 text-slate-500">這可能需要幾秒鐘的時間</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl flex flex-col items-center gap-4">
            <span className="text-3xl">⚠️</span>
            <p className="font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試一次
            </button>
          </div>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{formData.destination} 之旅</h2>
                <p className="text-slate-500 mt-1">{formData.startDate} ~ {formData.endDate}</p>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                重新規劃
              </button>
            </div>
            <div 
              className="itinerary-preview"
              dangerouslySetInnerHTML={{ __html: result.html }}
            />
            
            <div className="mt-12 p-8 bg-blue-600 rounded-3xl text-white text-center shadow-xl">
              <h3 className="text-2xl font-bold mb-4">這份行程滿意嗎？</h3>
              <p className="mb-8 text-blue-100 max-w-md mx-auto">
                您可以點擊上方或下方的按鈕，將這份精心規劃的行程匯出為 Google 日曆，隨時隨地查看，不錯過任何精彩亮點！
              </p>
              <button
                onClick={handleDownloadIcs}
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95"
              >
                📥 立即下載日曆檔案 (.ics)
              </button>
              <p className="mt-4 text-xs text-blue-200 opacity-75">
                下載後開啟檔案，即可快速匯入您的日曆應用程式
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Mobile CTA */}
      {result && (
        <div className="fixed bottom-6 left-0 right-0 px-4 md:hidden z-20">
          <button
            onClick={handleDownloadIcs}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <span>📅</span> 匯出至 Google 日曆
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
