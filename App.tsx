
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import WelcomeScreen from './components/WelcomeScreen';
import { Subject, Grade, InputMode, Language, AppSettings } from './types';
import { solveProblem, generateImage } from './services/geminiService';
import { TRANSLATIONS, Icons, ART_STYLES, COLORING_STYLES } from './constants';

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
  const [selectedGrade, setSelectedGrade] = useState<Grade>(Grade.GRADE_5);
  const [language, setLanguage] = useState<Language>(Language.VN);
  
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.TEXT);
  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [result, setResult] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: true,
    creativityLevel: 'academic'
  });

  const [artStyle, setArtStyle] = useState<string>('none');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9'); // Default aspect ratio

  const t = TRANSLATIONS[language];

  // Update browser document title when language changes
  useEffect(() => {
    document.title = t.appTitle;
  }, [t.appTitle]);

  // Handle Dark Mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleSolve = async (overrideText?: string) => {
    const textToSolve = overrideText || inputText;

    // Validate inputs using the text we are about to send
    if ((inputMode === InputMode.TEXT && !textToSolve.trim()) || 
        ((inputMode === InputMode.IMAGE || inputMode === InputMode.CAMERA) && !selectedImage)) {
      return;
    }

    setIsLoading(true);
    setResult(null); // Clear previous result
    setResultImage(null); // Clear previous image
    
    // Smooth scroll to result on mobile
    if (window.innerWidth < 1024) {
        window.scrollTo({ top: 500, behavior: 'smooth' });
    }

    try {
      const responseText = await solveProblem(
        textToSolve,
        (inputMode === InputMode.IMAGE || inputMode === InputMode.CAMERA) ? selectedImage : null,
        selectedSubject,
        selectedGrade,
        language,
        settings.creativityLevel,
        false // Not a follow-up
      );
      setResult(responseText);
    } catch (error) {
      setResult("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainMore = async () => {
     if (!result && !resultImage) return;
     
     setIsLoading(true);
     // We keep the current result but maybe append loading... 
     // For this UX, let's just replace or append. Replacing feels cleaner for "trying again" style.
     
     try {
      const responseText = await solveProblem(
        inputText,
        (inputMode === InputMode.IMAGE || inputMode === InputMode.CAMERA) ? selectedImage : null,
        selectedSubject,
        selectedGrade,
        language,
        settings.creativityLevel,
        true // This IS a follow-up ("Explain More")
      );
      setResult(responseText);
    } catch (error) {
      setResult(prev => prev + "\n\n(Có lỗi xảy ra khi giải thích thêm.)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateImage = async (prompt: string) => {
      setIsLoading(true);
      setResult(null);
      setResultImage(null);

      // Smooth scroll to result on mobile
      if (window.innerWidth < 1024) {
          window.scrollTo({ top: 500, behavior: 'smooth' });
      }

      try {
          // If we have a selected image, we can pass it as reference (inputMode check or just presence)
          // For simplicity, let's use selectedImage if present, regardless of input mode if user uploaded it
          const refImage = (inputMode === InputMode.IMAGE || inputMode === InputMode.CAMERA) ? selectedImage : null;
          
          // Inject Style to Prompt
          let finalPrompt = prompt;
          const selectedStyleObj = ART_STYLES.find(s => s.id === artStyle);
          if (selectedStyleObj && selectedStyleObj.promptSuffix) {
              finalPrompt += selectedStyleObj.promptSuffix;
          }

          const base64Image = await generateImage(finalPrompt, refImage, aspectRatio);
          
          if (base64Image) {
              setResultImage(base64Image);
              setResult("Đây là tác phẩm Thầy Hùng (Nano Banana) vẽ cho bạn:");
          } else {
              setResult("Xin lỗi, Thầy Hùng chưa vẽ được hình ảnh này. Hãy thử mô tả chi tiết hơn nhé.");
          }
      } catch (error) {
          setResult("Có lỗi xảy ra khi tạo ảnh.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleColorSketch = async (styleId: string) => {
      if (!resultImage) return;

      setIsLoading(true);
      
      try {
          // Find the prompt prefix for coloring
          const styleConfig = COLORING_STYLES.find(s => s.id === styleId);
          const coloringPrompt = styleConfig 
            ? styleConfig.promptPrefix 
            : "Hãy tô màu cho bức tranh này một cách nghệ thuật.";

          // Use resultImage as reference. Coloring should typically keep same aspect ratio or default.
          // Since we are using image-to-image with the same previous image, we can keep the aspect ratio or just default.
          const base64Image = await generateImage(coloringPrompt, `data:image/png;base64,${resultImage}`, aspectRatio);
          
          if (base64Image) {
              setResultImage(base64Image);
              setResult(`Đã tô màu theo phong cách ${t.coloringStyles[styleId as keyof typeof t.coloringStyles]}!`);
          } else {
              setResult(prev => prev + "\n\n(Không thể tô màu lúc này. Hãy thử lại.)");
          }
      } catch (error) {
          console.error("Coloring Error:", error);
          setResult(prev => prev + "\n\n(Có lỗi xảy ra khi tô màu.)");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
      
      {/* Welcome Screen Overlay */}
      {showWelcome && <WelcomeScreen onFinished={() => setShowWelcome(false)} />}

      <Header 
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      {/* Settings Trigger (Floating or in Header - Adding here for specific request visibility) */}
      <div className="absolute top-3 right-4 lg:right-10 z-[60]">
        <button 
           onClick={() => setSettingsOpen(true)}
           className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <Icons.Settings />
        </button>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="h-full min-h-[500px]">
          <InputPanel 
            inputMode={inputMode}
            setInputMode={setInputMode}
            inputText={inputText}
            setInputText={setInputText}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedSubject={selectedSubject}
            onSolve={handleSolve}
            onCreateImage={handleCreateImage}
            isLoading={isLoading}
            language={language}
            t={t}
            artStyle={artStyle}
            setArtStyle={setArtStyle}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
          />
        </section>

        <section className="h-full min-h-[500px]">
          <OutputPanel 
            result={result}
            resultImage={resultImage}
            isLoading={isLoading}
            t={t}
            onExplainMore={handleExplainMore}
            selectedSubject={selectedSubject}
            artStyle={artStyle}
            onColorSketch={handleColorSketch}
          />
        </section>
      </main>
      
      <footer className="py-4 text-center text-gray-400 text-sm dark:text-gray-600">
        <p>{t.footerText}</p>
      </footer>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all">
             <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
               <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                 <Icons.Settings />
                 {t.settings.title}
               </h3>
               <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                 ✕
               </button>
             </div>

             <div className="space-y-6">
               {/* Dark Mode */}
               <div className="flex items-center justify-between">
                 <span className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                    {settings.darkMode ? <Icons.Moon /> : <Icons.Sun />}
                    {t.settings.darkMode}
                 </span>
                 <button 
                   onClick={() => setSettings(s => ({...s, darkMode: !s.darkMode}))}
                   className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
                 >
                   <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </button>
               </div>

               {/* Creativity Level */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.settings.aiModel}</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                      <button 
                         onClick={() => setSettings(s => ({...s, creativityLevel: 'academic'}))}
                         className={`py-2 text-sm font-medium rounded-lg transition-all ${
                            settings.creativityLevel === 'academic' 
                            ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                         }`}
                      >
                          {t.settings.academic}
                      </button>
                      <button 
                         onClick={() => setSettings(s => ({...s, creativityLevel: 'creative'}))}
                         className={`py-2 text-sm font-medium rounded-lg transition-all ${
                            settings.creativityLevel === 'creative' 
                            ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                         }`}
                      >
                          {t.settings.creative}
                      </button>
                  </div>
               </div>

               <div className="pt-4">
                 <button 
                   onClick={() => setSettingsOpen(false)}
                   className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30"
                 >
                   {t.settings.close}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
