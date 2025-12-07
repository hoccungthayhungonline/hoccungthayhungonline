

import React, { useRef, useState, useEffect } from 'react';
import { InputMode, Subject, Grade, Language, AppTranslation } from '../types';
import { Icons, ART_STYLES } from '../constants';

interface InputPanelProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  inputText: string;
  setInputText: (text: string | ((prev: string) => string)) => void;
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  selectedSubject?: Subject;
  onSolve: (overrideText?: string) => void;
  onCreateImage?: (prompt: string) => void;
  isLoading: boolean;
  language: Language;
  t: AppTranslation;
  artStyle?: string;
  setArtStyle?: (style: string) => void;
  aspectRatio?: string;
  setAspectRatio?: (ratio: string) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  inputMode,
  setInputMode,
  inputText,
  setInputText,
  selectedImage,
  setSelectedImage,
  selectedSubject,
  onSolve,
  onCreateImage,
  isLoading,
  language,
  t,
  artStyle,
  setArtStyle,
  aspectRatio,
  setAspectRatio
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           // Append with a space if text exists
           setInputText((prev: string) => {
             const trimmed = prev.trim();
             return trimmed ? `${trimmed} ${finalTranscript}` : finalTranscript;
           });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
         // Automatically stop listening state if recognition ends
         // We might want to keep it false unless manually restarted
         // Ideally, users won't switch language mid-dictation often.
         setIsListening(false);
      };
    }
  }, [setInputText]);

  // Update language for speech recognition
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === Language.GB ? 'en-US' : 'vi-VN';
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start recognition:", e);
        setIsListening(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        onSolve();
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(t.placeholders.cameraError);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
  };

  // Manage camera lifecycle
  useEffect(() => {
    if (inputMode === InputMode.CAMERA && !selectedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, selectedImage, t]);

  const handleReadMusic = () => {
      const prompt = `
      Hãy phân tích bản nhạc này (hoặc hình ảnh này). 
      1. Giải thích chi tiết về cao độ, trường độ, nhịp điệu và ý nghĩa của các ký hiệu âm nhạc.
      2. QUAN TRỌNG: Để giúp học sinh nghe được giai điệu, hãy trích xuất các nốt nhạc thành một chuỗi JSON ở CUỐI cùng của câu trả lời.
         Format JSON phải chính xác như sau:
         \`\`\`json
         [
           { "note": "C4", "duration": 1 },
           { "note": "D4", "duration": 0.5 },
           { "note": "Rest", "duration": 1 }
         ]
         \`\`\`
         - "note": Tên nốt + Quãng 8 (Ví dụ: C4, D4, E4, F#4, Bb4, C5...). Dùng "Rest" cho dấu lặng.
         - "duration": Độ dài tính bằng phách (nốt đen = 1, nốt đơn = 0.5, nốt trắng = 2, nốt tròn = 4).
      `;
      setInputText(prompt);
      // Trigger instant solve for "Read Music"
      onSolve(prompt);
  };

  const handleCreateImage = () => {
      if (onCreateImage && inputText.trim()) {
          onCreateImage(inputText);
      }
  };

  const isInputValid = (inputMode === InputMode.TEXT && inputText.trim()) || ((inputMode === InputMode.IMAGE || inputMode === InputMode.CAMERA) && selectedImage);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-xl">
        <button
          onClick={() => setInputMode(InputMode.TEXT)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            inputMode === InputMode.TEXT
              ? 'bg-primary-100 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Icons.Text />
          {t.tabs.text}
        </button>
        <button
          onClick={() => setInputMode(InputMode.IMAGE)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            inputMode === InputMode.IMAGE
              ? 'bg-primary-100 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Icons.Upload />
          {t.tabs.image}
        </button>
        <button
          onClick={() => setInputMode(InputMode.CAMERA)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            inputMode === InputMode.CAMERA
              ? 'bg-primary-100 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Icons.Camera />
          {t.tabs.camera}
        </button>
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative">
        
        {/* Media Area (Image/Camera) */}
        {(inputMode === InputMode.IMAGE || inputMode === InputMode.CAMERA) && (
          <div className="p-4 border-b border-gray-200 bg-white min-h-[250px] flex flex-col justify-center">
             
             {/* 1. Camera View (Camera Mode + No Image) */}
             {inputMode === InputMode.CAMERA && !selectedImage && (
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    {cameraError ? (
                        <div className="text-white text-center p-4">
                            <p className="text-sm mb-2">{cameraError}</p>
                            <button onClick={startCamera} className="text-primary-300 text-sm font-bold underline">{t.placeholders.retry}</button>
                        </div>
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                            <canvas ref={canvasRef} className="hidden" />
                            <button 
                                onClick={capturePhoto}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 bg-white rounded-full"></div>
                            </button>
                        </>
                    )}
                </div>
             )}

             {/* 2. Upload Placeholder (Image Mode + No Image) */}
             {inputMode === InputMode.IMAGE && !selectedImage && (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <div 
                        onClick={triggerFileUpload}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-primary-400 transition-colors h-64 w-full"
                    >
                        <div className="text-primary-500 mb-2">
                            <Icons.Upload />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{t.placeholders.upload}</p>
                        <p className="text-gray-400 text-xs mt-1">{t.placeholders.uploadSupport}</p>
                    </div>
                </>
             )}

             {/* 3. Selected Image Preview (Any Mode + Has Image) */}
             {selectedImage && (
                <div className="relative group w-full h-64 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                    <img 
                        src={selectedImage} 
                        alt="Selected" 
                        className="max-w-full max-h-full object-contain" 
                    />
                    
                    {/* Overlay for Image Mode */}
                    {inputMode === InputMode.IMAGE && (
                        <>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button 
                                onClick={triggerFileUpload}
                                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium"
                            >
                                {t.placeholders.changeImage}
                            </button>
                        </>
                    )}

                    {/* Overlay for Camera Mode */}
                    {inputMode === InputMode.CAMERA && (
                        <button 
                            onClick={handleRetake}
                             className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium"
                        >
                            {t.placeholders.retake}
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                        className="absolute top-2 right-2 bg-white text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-50 z-10"
                    >
                        ✕
                    </button>
                </div>
             )}
          </div>
        )}

        {/* Text Input */}
        <textarea
          className="w-full h-full bg-transparent p-4 outline-none text-gray-700 placeholder-gray-400 resize-none font-medium pb-12"
          placeholder={inputMode === InputMode.TEXT ? t.placeholders.textInput : t.placeholders.imageNote}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        ></textarea>

        {/* Bottom controls inside text area */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
           {isSpeechSupported && (
              <button 
                 onClick={toggleListening}
                 className={`p-2 rounded-full transition-all flex items-center justify-center ${
                   isListening 
                     ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                     : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                 }`}
                 title="Nhấn để nói"
              >
                  <Icons.Mic />
              </button>
           )}
           {isListening && <span className="text-xs text-red-500 font-bold animate-pulse">{t.placeholders.listening}</span>}
        </div>

        {/* Character Count */}
        <div className="absolute bottom-3 right-4 text-xs text-gray-400 pointer-events-none">
             {inputText.length} {t.placeholders.charCount}
        </div>
      </div>

      {/* Special Actions Toolbar */}
      <div className="flex gap-2 mt-3 flex-wrap items-center">
          {/* Music: Read Music */}
          {selectedSubject === Subject.MUSIC && (
             <button 
                onClick={handleReadMusic}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition-colors"
             >
                 <Icons.MusicNote />
                 {t.musicActions.readMusic}
             </button>
          )}

          {/* Art: Create Image & Style Selector */}
          {selectedSubject === Subject.ART && (
             <>
                <button 
                    onClick={handleCreateImage}
                    disabled={isLoading || !inputText.trim()}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                        isLoading || !inputText.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-pink-50 hover:bg-pink-100 text-pink-700'
                    }`}
                 >
                     <Icons.Palette />
                     {t.artActions.createImage}
                 </button>

                 {setArtStyle && (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500 font-medium">{t.artActions.styleLabel}</span>
                        <select 
                            value={artStyle}
                            onChange={(e) => setArtStyle(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-700 outline-none max-w-[120px]"
                        >
                            {ART_STYLES.map((style) => (
                                <option key={style.id} value={style.id}>
                                    {t.artStyles[style.id as keyof typeof t.artStyles]}
                                </option>
                            ))}
                        </select>
                    </div>
                 )}

                 {setAspectRatio && (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500 font-medium">{t.artActions.aspectRatioLabel}</span>
                        <select 
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-700 outline-none max-w-[80px]"
                        >
                            <option value="16:9">16:9</option>
                            <option value="9:16">9:16</option>
                            <option value="1:1">1:1</option>
                        </select>
                    </div>
                 )}
             </>
          )}
      </div>

      {/* Action Buttons Row */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSolve()}
          disabled={isLoading || !isInputValid}
          className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/30 ${
            isLoading || !isInputValid
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
          }`}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.actions.thinking}
                </>
            ) : (
                <>
                    <Icons.Sparkle />
                    {t.actions.solve}
                </>
            )}
        </button>
      </div>
    </div>
  );
};

export default InputPanel;