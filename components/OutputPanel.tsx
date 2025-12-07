

import React, { useState, useRef, useEffect } from 'react';
import { Icons, VOICE_REGIONS, COLORING_STYLES, NOTE_FREQUENCIES } from '../constants';
import { AppTranslation, TTSConfig, Subject, VocabularyItem, MelodyNote } from '../types';
import { streamSpeech, extractVocabulary } from '../services/geminiService';

interface OutputPanelProps {
  result: string | null;
  resultImage?: string | null; // New prop for generated image
  isLoading: boolean;
  t: AppTranslation;
  onExplainMore: () => void;
  selectedSubject: Subject;
  artStyle: string;
  onColorSketch: (styleId: string) => void;
}

// Base64 to Bytes
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to write string to DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Create WAV File from PCM Data
function createWavBlob(audioData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): Blob {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length = 36 + data length
  view.setUint32(4, 36 + audioData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * 2, true); // 16-bit = 2 bytes per sample
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, audioData.length, true);

  // Combine header and data
  return new Blob([view, audioData], { type: 'audio/wav' });
}

// PCM Bytes (Int16) to AudioBuffer (Float32)
async function pcmToAudioBuffer(
  data: Uint8Array, 
  ctx: AudioContext, 
  sampleRate: number = 24000, 
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert int16 to float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ 
  result, 
  resultImage, 
  isLoading, 
  t, 
  onExplainMore,
  selectedSubject,
  artStyle,
  onColorSketch
}) => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [ttsConfig, setTTSConfig] = useState<TTSConfig>({
    voiceName: 'Puck',
    speed: 1,
    regionStyle: 'west_male' // Default updated to Male - Western
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  // Selection for Slow Read
  const [selectionBtnPos, setSelectionBtnPos] = useState<{top: number, left: number} | null>(null);
  const [selectionText, setSelectionText] = useState<string>("");
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // VOCABULARY SUPPORT STATE
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [isVocabLoading, setIsVocabLoading] = useState(false);
  const [vocabMode, setVocabMode] = useState<'view' | 'quiz' | 'match' | 'listen' | null>(null);
  
  // MUSIC STATE
  const [musicData, setMusicData] = useState<MelodyNote[] | null>(null);
  const [cleanTextResult, setCleanTextResult] = useState<string | null>(null);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const melodyOscillators = useRef<OscillatorNode[]>([]);

  // Quiz State
  const [quizItem, setQuizItem] = useState<VocabularyItem | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  // Match State
  const [matchSelectedWord, setMatchSelectedWord] = useState<string | null>(null);
  const [matchPairs, setMatchPairs] = useState<VocabularyItem[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  useEffect(() => {
    // Reset audio when result changes
    stopAudio();
    stopMelody(); // Also stop melody
    setAudioBase64(null);
    setSelectionBtnPos(null);
    setVocabList([]);
    setVocabMode(null);
    setMusicData(null);
    
    // Parse result for Music JSON
    if (result) {
      const jsonRegex = /```json\s*(\[[\s\S]*?\])\s*```/;
      const match = result.match(jsonRegex);
      if (match && match[1]) {
        try {
          const notes = JSON.parse(match[1]) as MelodyNote[];
          setMusicData(notes);
          // Remove the JSON block from text display to keep it clean
          setCleanTextResult(result.replace(jsonRegex, '').trim());
        } catch (e) {
          console.error("Failed to parse music JSON", e);
          setCleanTextResult(result);
        }
      } else {
        setCleanTextResult(result);
      }
    } else {
      setCleanTextResult(null);
    }

  }, [result, resultImage]);

  // Update voice config when gender changes
  useEffect(() => {
    // Find first available voice for the new gender if current doesn't match
    // Check if current style matches gender
    let currentOption = null;
    for(const grp of VOICE_REGIONS) {
        const opt = grp.options.find(o => o.id === ttsConfig.regionStyle);
        if (opt) { currentOption = opt; break; }
    }

    if (currentOption && currentOption.gender !== selectedGender) {
        // Find a default for the new gender
        let newOption = null;
        for(const grp of VOICE_REGIONS) {
            const opt = grp.options.find(o => o.gender === selectedGender);
            if (opt) { newOption = opt; break; }
        }
        
        if (newOption) {
            setTTSConfig(prev => ({
                ...prev,
                regionStyle: newOption.id,
                voiceName: newOption.voice
            }));
        }
    }
  }, [selectedGender, ttsConfig.regionStyle]);

  // Handle Text Selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionBtnPos(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setSelectionBtnPos(null);
      return;
    }

    // Check if selection is inside the content area
    if (contentAreaRef.current && contentAreaRef.current.contains(selection.anchorNode)) {
       const range = selection.getRangeAt(0);
       const rect = range.getBoundingClientRect();
       const containerRect = contentAreaRef.current.getBoundingClientRect();
       
       // Calculate position relative to container
       // Account for scrolling
       const scrollTop = contentAreaRef.current.scrollTop;
       
       setSelectionBtnPos({
           top: rect.top - containerRect.top + scrollTop - 45, // Position above
           left: rect.left - containerRect.left + (rect.width / 2) // Center horizontally
       });
       setSelectionText(text);
    } else {
        setSelectionBtnPos(null);
    }
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleTTS = async (textToRead?: string, speedOverride?: number) => {
    const text = textToRead || cleanTextResult;
    if (!text) return;
    
    // Stop existing if any (acts as reset before new play)
    if (isPlaying) {
      stopAudio();
    }
    stopMelody();

    setIsPlaying(true);
    initAudioContext();
    if (!audioContextRef.current) return;

    const currentSpeed = speedOverride || ttsConfig.speed;

    // CHECK CACHE: If reading full result AND we have cached audio
    if (!textToRead && audioBase64 && !isGeneratingAudio) {
        try {
            const byteArray = decode(audioBase64);
            const buffer = await pcmToAudioBuffer(byteArray, audioContextRef.current);
            // Reset start time for immediate playback
            nextStartTimeRef.current = audioContextRef.current.currentTime;
            playChunk(buffer, currentSpeed);
            return; // Exit, do not stream
        } catch (e) {
            console.error("Error playing cached audio, falling back to stream", e);
            // If error, fall through to stream
        }
    }

    // Start streaming (fresh generation)
    setIsGeneratingAudio(true);
    if (!textToRead) setAudioBase64(null); // Clear cache if we are generating fresh full text
    
    // Schedule play start time slightly in the future to allow buffering
    nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;
    let fullAudioData = "";

    try {
      const config = { 
          ...ttsConfig, 
          speed: currentSpeed 
      };
      
      const stream = streamSpeech(text, config);
      
      for await (const chunkBase64 of stream) {
        setIsGeneratingAudio(false); // First chunk received, stop loading spinner
        fullAudioData += chunkBase64;
        
        // Cache data chunk by chunk
        if (!textToRead) {
            setAudioBase64(fullAudioData); 
        }

        const byteArray = decode(chunkBase64);
        const buffer = await pcmToAudioBuffer(byteArray, audioContextRef.current!);
        
        playChunk(buffer, config.speed);
      }
    } catch (e) {
      console.error("TTS Stream Error", e);
      setIsGeneratingAudio(false);
      setIsPlaying(false);
    }
  };

  const playChunk = (buffer: AudioBuffer, speed: number) => {
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    source.connect(audioContextRef.current.destination);
    
    // Clean up source from list when done
    source.onended = () => {
       activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
       // If no more sources and not generating, we are done
       if (activeSourcesRef.current.length === 0 && !isGeneratingAudio) {
         setIsPlaying(false);
       }
    };

    const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
    source.start(startTime);
    activeSourcesRef.current.push(source);

    // Calculate next start time: duration / speed
    const duration = buffer.duration / speed;
    nextStartTimeRef.current = startTime + duration;
  };

  const stopAudio = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e){}
    });
    activeSourcesRef.current = [];
    setIsPlaying(false);
    setIsGeneratingAudio(false);
  };

  // --- MUSIC PLAYBACK LOGIC ---

  const playMelody = () => {
    if (!musicData || musicData.length === 0) return;
    
    stopAudio(); // Stop TTS
    stopMelody(); // Reset melody

    setIsPlayingMelody(true);
    initAudioContext();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    let currentTime = now + 0.1; // Start slightly delayed
    const tempo = 60; // 60 BPM -> 1 beat = 1 second
    const beatDuration = 60 / tempo;

    musicData.forEach((noteData, index) => {
       const durationSeconds = noteData.duration * beatDuration;
       
       if (noteData.note !== 'Rest') {
          const frequency = NOTE_FREQUENCIES[noteData.note];
          if (frequency) {
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             
             osc.type = 'triangle'; // Flute/Organ like sound
             osc.frequency.value = frequency;
             
             // Envelope for smoother sound
             gain.gain.setValueAtTime(0, currentTime);
             gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.05); // Attack
             gain.gain.setValueAtTime(0.3, currentTime + durationSeconds - 0.05); // Sustain
             gain.gain.linearRampToValueAtTime(0, currentTime + durationSeconds); // Release
             
             osc.connect(gain);
             gain.connect(ctx.destination);
             
             osc.start(currentTime);
             osc.stop(currentTime + durationSeconds);
             
             melodyOscillators.current.push(osc);
          }
       }
       
       currentTime += durationSeconds;
    });

    // Reset playing state after melody finishes
    setTimeout(() => {
        setIsPlayingMelody(false);
    }, (currentTime - now) * 1000);
  };

  const stopMelody = () => {
     melodyOscillators.current.forEach(osc => {
         try { osc.stop(); } catch (e) {}
     });
     melodyOscillators.current = [];
     setIsPlayingMelody(false);
  };


  const handleDownload = () => {
    if (!audioBase64) return;
    
    const byteArray = decode(audioBase64);
    
    // Create WAV blob instead of generic stream
    const blob = createWavBlob(byteArray, 24000, 1);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thay_hung_ai_voice_${Date.now()}.wav`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImageDownload = () => {
    if (!resultImage) return;

    const url = `data:image/png;base64,${resultImage}`;
    const a = document.createElement('a');
    a.href = url;
    // Determine filename based on context
    const filenamePrefix = selectedSubject === Subject.ART ? 'thay_hung_art' : 'thay_hung_result';
    a.download = `${filenamePrefix}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    let foundOption = null;
    for(const grp of VOICE_REGIONS) {
        const opt = grp.options.find(o => o.id === selectedId);
        if (opt) { foundOption = opt; break; }
    }
    
    setTTSConfig(prev => ({
        ...prev,
        regionStyle: selectedId,
        voiceName: foundOption ? foundOption.voice : prev.voiceName
    }));
  };

  // --- VOCABULARY FUNCTIONS ---

  const handleAnalyzeVocab = async () => {
    if (!result) return;
    setIsVocabLoading(true);
    setVocabMode('view');
    try {
      const data = await extractVocabulary(result);
      setVocabList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVocabLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200';
      case 'hard': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to highlight words in text
  const renderHighlightedText = () => {
    if (!cleanTextResult) return null;
    
    let parts: (string | React.ReactNode)[] = [cleanTextResult];

    vocabList.forEach(v => {
      // Create a safe regex escaping for the word
      const regex = new RegExp(`\\b(${v.word})\\b`, 'gi');
      
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(regex);
          for (let i = 0; i < split.length; i++) {
             // If it matches the word (odd indices in split with capturing group)
             if (split[i].toLowerCase() === v.word.toLowerCase()) {
                newParts.push(
                  <span 
                    key={`${v.word}-${i}-${Math.random()}`}
                    className={`px-1 rounded border cursor-pointer hover:opacity-80 transition-opacity mx-0.5 ${getLevelColor(v.level)}`}
                    onClick={(e) => {
                       e.stopPropagation();
                       handleTTS(v.word);
                    }}
                    title={`${v.type}: ${v.vietnamese} - ${v.meaning}`}
                  >
                    {split[i]}
                  </span>
                );
             } else {
               newParts.push(split[i]);
             }
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return <div className="whitespace-pre-wrap">{parts}</div>;
  };

  // --- GAME LOGIC ---

  const startQuiz = () => {
    if (vocabList.length < 2) return;
    setQuizScore(0);
    setQuizFeedback(null);
    nextQuizQuestion();
    setVocabMode('quiz');
  };

  const nextQuizQuestion = () => {
    const randomItem = vocabList[Math.floor(Math.random() * vocabList.length)];
    setQuizItem(randomItem);
    
    // Generate distractors (wrong answers)
    const otherItems = vocabList.filter(i => i.word !== randomItem.word);
    // Shuffle and pick 3
    const shuffled = [...otherItems].sort(() => 0.5 - Math.random());
    const distractors = shuffled.slice(0, 3).map(i => i.vietnamese);
    
    const options = [...distractors, randomItem.vietnamese].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
    setQuizFeedback(null);
  };

  const handleQuizAnswer = (answer: string) => {
    if (answer === quizItem?.vietnamese) {
      setQuizFeedback('correct');
      setQuizScore(s => s + 10);
      setTimeout(nextQuizQuestion, 1000);
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const startMatch = () => {
    // Take first 5 items or less
    const items = vocabList.slice(0, 5);
    setMatchPairs(items);
    setMatchedIds([]);
    setMatchSelectedWord(null);
    setVocabMode('match');
  };

  const handleMatchWordClick = (word: string) => {
    setMatchSelectedWord(word);
  };

  const handleMatchMeaningClick = (item: VocabularyItem) => {
    if (matchSelectedWord === item.word) {
      // Correct match
      setMatchedIds(prev => [...prev, item.word]);
      setMatchSelectedWord(null);
    } else {
      // Wrong match
      setMatchSelectedWord(null);
      // Optional: visual shake or error feedback
    }
  };

  const startListen = () => {
     if (vocabList.length < 2) return;
     setQuizScore(0);
     nextListenQuestion();
     setVocabMode('listen');
  };

  const nextListenQuestion = () => {
    const randomItem = vocabList[Math.floor(Math.random() * vocabList.length)];
    setQuizItem(randomItem);
    
    // Options are English words this time
    const otherItems = vocabList.filter(i => i.word !== randomItem.word);
    const shuffled = [...otherItems].sort(() => 0.5 - Math.random());
    const distractors = shuffled.slice(0, 3).map(i => i.word);
    
    const options = [...distractors, randomItem.word].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
    setQuizFeedback(null);

    // Auto play audio
    setTimeout(() => handleTTS(randomItem.word), 500);
  };

  const handleListenAnswer = (answer: string) => {
     if (answer === quizItem?.word) {
        setQuizFeedback('correct');
        setQuizScore(s => s + 10);
        setTimeout(nextListenQuestion, 1000);
     } else {
        setQuizFeedback('incorrect');
     }
  };


  if (!result && !resultImage && !isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-6 text-primary-600 dark:text-primary-400">
            <Icons.Sparkle />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.output.readyTitle}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          {t.output.readyDesc}
        </p>
      </div>
    );
  }

  const isArt = selectedSubject === Subject.ART;
  const isEnglish = selectedSubject === Subject.ENGLISH;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col overflow-hidden min-h-[500px] relative">
        {/* Header of output */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg">
                    <Icons.Sparkle />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-200">{t.output.solutionTitle}</span>
            </div>
            {result && (
              <div className="flex gap-2">
                  <button 
                      onClick={handleCopy} 
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
                      title="Sao chép văn bản"
                  >
                      {isCopied ? <Icons.Check /> : <Icons.Copy />}
                  </button>
              </div>
            )}
        </div>

        {/* Content Area */}
        <div 
            id="output-content-area"
            ref={contentAreaRef}
            onMouseUp={handleMouseUp}
            className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800 relative"
        >
            {/* Floating Selection Button */}
            {selectionBtnPos && (
                <div 
                    className="absolute z-50 transform -translate-x-1/2"
                    style={{ top: selectionBtnPos.top, left: selectionBtnPos.left }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTTS(selectionText, 0.75); // Read selected text slowly
                            setSelectionBtnPos(null); // Hide after click
                        }}
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary-700 transition-all animate-bounce"
                    >
                        <Icons.Speaker />
                        <span className="text-xs font-bold whitespace-nowrap">{t.tts.slowRead}</span>
                    </button>
                    {/* Arrow down */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary-600 absolute left-1/2 -translate-x-1/2 -bottom-2"></div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded w-full mt-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-4"></div>
                </div>
            ) : vocabMode ? (
                // --- VOCABULARY MODE VIEWS ---
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400">{t.vocab.title}</h3>
                        <button onClick={() => setVocabMode(null)} className="text-xs underline text-gray-500">{t.vocab.backToText}</button>
                    </div>

                    {vocabMode === 'view' && (
                        <div className="space-y-6">
                            {/* Legend */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2 py-1 rounded bg-green-100 text-green-800">{t.vocab.easy}</span>
                                <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">{t.vocab.medium}</span>
                                <span className="px-2 py-1 rounded bg-red-100 text-red-800">{t.vocab.hard}</span>
                            </div>

                            {/* Highlighted Text */}
                            <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                                {renderHighlightedText()}
                            </div>

                            {/* Game Mode Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t dark:border-gray-700">
                                <button onClick={startQuiz} className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 transition-colors">
                                    <Icons.Puzzle />
                                    <span className="mt-2 font-bold text-sm">{t.vocab.modeQuiz}</span>
                                </button>
                                <button onClick={startMatch} className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-100 transition-colors">
                                    <Icons.ListCheck />
                                    <span className="mt-2 font-bold text-sm">{t.vocab.modeMatch}</span>
                                </button>
                                <button onClick={startListen} className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 transition-colors">
                                    <Icons.Headphones />
                                    <span className="mt-2 font-bold text-sm">{t.vocab.modeListen}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {vocabMode === 'quiz' && quizItem && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl text-center">
                            <div className="mb-4">
                                <span className="text-sm text-gray-500 uppercase tracking-widest">{t.vocab.modeQuiz}</span>
                                <h4 className="text-3xl font-bold text-blue-600 dark:text-blue-300 my-4">{quizItem.word}</h4>
                                <span className="italic text-gray-500">{quizItem.type}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                                {quizOptions.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleQuizAnswer(opt)}
                                        disabled={!!quizFeedback}
                                        className={`p-3 rounded-lg font-medium transition-all ${
                                            quizFeedback === 'correct' && opt === quizItem.vietnamese 
                                                ? 'bg-green-500 text-white'
                                                : quizFeedback === 'incorrect' && opt === quizItem.vietnamese
                                                ? 'bg-green-500 text-white' // Show correct one even if wrong
                                                : quizFeedback === 'incorrect'
                                                ? 'bg-red-200 text-red-800 opacity-50'
                                                : 'bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            
                            {quizFeedback && (
                                <div className="mt-6 font-bold text-xl animate-bounce">
                                    {quizFeedback === 'correct' ? (
                                        <span className="text-green-500">{t.vocab.correct}</span>
                                    ) : (
                                        <span className="text-red-500">{t.vocab.incorrect}</span>
                                    )}
                                </div>
                            )}
                            <div className="mt-4 text-sm text-gray-500">{t.vocab.score} {quizScore}</div>
                            <button onClick={() => setVocabMode('view')} className="mt-4 text-xs underline">Back</button>
                        </div>
                    )}

                    {vocabMode === 'match' && (
                         <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl">
                             <div className="text-center mb-6">
                                 <h4 className="font-bold text-green-700 dark:text-green-300">{t.vocab.modeMatch}</h4>
                             </div>
                             <div className="flex flex-col sm:flex-row gap-8 justify-between">
                                 {/* Words Column */}
                                 <div className="flex-1 space-y-3">
                                     {matchPairs.map((item) => (
                                         <button
                                             key={`w-${item.word}`}
                                             onClick={() => handleMatchWordClick(item.word)}
                                             disabled={matchedIds.includes(item.word)}
                                             className={`w-full p-3 rounded-lg border-2 font-bold transition-all ${
                                                 matchedIds.includes(item.word) 
                                                    ? 'bg-gray-200 border-transparent opacity-50'
                                                    : matchSelectedWord === item.word 
                                                    ? 'bg-green-200 border-green-500 text-green-900'
                                                    : 'bg-white border-green-100 hover:border-green-300 dark:bg-gray-700 dark:border-gray-600'
                                             }`}
                                         >
                                             {item.word}
                                         </button>
                                     ))}
                                 </div>
                                 {/* Meanings Column */}
                                 <div className="flex-1 space-y-3">
                                     {/* Shuffle meanings for display but keep item ref */}
                                     {[...matchPairs].sort((a,b) => a.vietnamese.localeCompare(b.vietnamese)).map((item) => (
                                          <button
                                             key={`m-${item.word}`}
                                             onClick={() => handleMatchMeaningClick(item)}
                                             disabled={matchedIds.includes(item.word)}
                                             className={`w-full p-3 rounded-lg border-2 text-sm transition-all ${
                                                 matchedIds.includes(item.word) 
                                                    ? 'bg-gray-200 border-transparent opacity-50'
                                                    : 'bg-white border-green-100 hover:border-green-300 dark:bg-gray-700 dark:border-gray-600'
                                             }`}
                                          >
                                              {item.vietnamese}
                                          </button>
                                     ))}
                                 </div>
                             </div>
                             {matchedIds.length === matchPairs.length && (
                                 <div className="text-center mt-6">
                                     <p className="font-bold text-green-600 text-xl mb-2">{t.vocab.correct}</p>
                                     <button onClick={startMatch} className="px-4 py-2 bg-green-600 text-white rounded-lg">{t.vocab.playAgain}</button>
                                 </div>
                             )}
                              <div className="text-center mt-4">
                                <button onClick={() => setVocabMode('view')} className="text-xs underline">Back</button>
                             </div>
                         </div>
                    )}

                    {vocabMode === 'listen' && quizItem && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl text-center">
                             <div className="mb-6">
                                <span className="text-sm text-gray-500 uppercase tracking-widest">{t.vocab.modeListen}</span>
                                <div className="flex justify-center my-4">
                                    <button 
                                        onClick={() => handleTTS(quizItem.word)}
                                        className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                                    >
                                        <Icons.Headphones />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500">Listen and choose the word</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                                {quizOptions.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleListenAnswer(opt)}
                                        disabled={!!quizFeedback}
                                        className={`p-3 rounded-lg font-bold text-lg transition-all ${
                                            quizFeedback === 'correct' && opt === quizItem.word 
                                                ? 'bg-green-500 text-white'
                                                : quizFeedback === 'incorrect' && opt === quizItem.word
                                                ? 'bg-green-500 text-white'
                                                : quizFeedback === 'incorrect'
                                                ? 'bg-red-200 text-red-800 opacity-50'
                                                : 'bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                             {quizFeedback && (
                                <div className="mt-6 font-bold text-xl animate-bounce">
                                    {quizFeedback === 'correct' ? (
                                        <span className="text-green-500">{t.vocab.correct}</span>
                                    ) : (
                                        <span className="text-red-500">{t.vocab.incorrect}</span>
                                    )}
                                </div>
                            )}
                             <div className="mt-4 text-sm text-gray-500">{t.vocab.score} {quizScore}</div>
                             <button onClick={() => setVocabMode('view')} className="mt-4 text-xs underline">Back</button>
                        </div>
                    )}
                </div>
            ) : (
                // --- NORMAL VIEW ---
                <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {/* Render Image if available */}
                    {resultImage && (
                       <div className="mb-4">
                           <img 
                              src={`data:image/png;base64,${resultImage}`} 
                              alt="Generated by AI" 
                              className="w-full rounded-xl shadow-md" 
                           />
                       </div>
                    )}
                    
                    {/* Render Text if available (using Clean Text to hide JSON) */}
                    {cleanTextResult || result}
                </div>
            )}
        </div>

        {/* TTS Toolbar (only if text is present) */}
        {!isLoading && result && (
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
             <div className="flex flex-wrap items-center gap-2 mb-2">
                
                {/* Gender Toggle */}
                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5">
                   <button 
                     onClick={() => setSelectedGender('female')}
                     className={`p-1.5 rounded-md flex items-center gap-1 transition-colors ${selectedGender === 'female' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                     title={t.tts.female}
                   >
                     <Icons.Female />
                   </button>
                   <button 
                     onClick={() => setSelectedGender('male')}
                     className={`p-1.5 rounded-md flex items-center gap-1 transition-colors ${selectedGender === 'male' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                     title={t.tts.male}
                   >
                     <Icons.Male />
                   </button>
                </div>

                {/* Voice Region Select (Filtered) */}
                <select 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs rounded-md p-2 outline-none text-gray-700 dark:text-gray-200 max-w-[150px]"
                  value={ttsConfig.regionStyle}
                  onChange={handleRegionChange}
                >
                  {VOICE_REGIONS.map((region, idx) => {
                    const filteredOptions = region.options.filter(opt => opt.gender === selectedGender);
                    if (filteredOptions.length === 0) return null;
                    return (
                        <optgroup key={idx} label={region.label}>
                          {filteredOptions.map(opt => (
                             <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </optgroup>
                    );
                  })}
                </select>

                {/* Speed */}
                <select
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-xs rounded-md p-2 outline-none text-gray-700 dark:text-gray-200"
                  value={ttsConfig.speed}
                  onChange={(e) => setTTSConfig({...ttsConfig, speed: parseFloat(e.target.value)})}
                >
                   <option value={0.75}>0.75x</option>
                   <option value={1}>1.0x</option>
                   <option value={1.25}>1.25x</option>
                   <option value={1.5}>1.5x</option>
                </select>

                <div className="flex-1"></div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                   {isGeneratingAudio ? (
                      <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 font-medium px-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.tts.generating}
                      </div>
                   ) : null}

                   {isPlaying ? (
                     <button onClick={stopAudio} className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full text-gray-700 dark:text-gray-200" title={t.tts.pause}>
                        <Icons.Pause />
                     </button>
                   ) : (
                     <button onClick={() => handleTTS()} className="p-2 bg-primary-600 hover:bg-primary-700 rounded-full text-white shadow-sm" title={t.tts.play}>
                        <Icons.Play />
                     </button>
                   )}

                   {audioBase64 && (
                     <button onClick={handleDownload} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400" title={t.tts.download}>
                        <Icons.Download />
                     </button>
                   )}
                </div>
             </div>
          </div>
        )}
        
        {/* Footer actions */}
        {!isLoading && (result || resultImage) && (
             <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 items-center flex-wrap">
                 
                 {/* MUSIC ACTIONS: PLAY MELODY */}
                 {musicData && musicData.length > 0 && (
                     <div className="flex items-center gap-2 mr-auto">
                         <button
                            onClick={isPlayingMelody ? stopMelody : playMelody}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-md ${
                                isPlayingMelody 
                                ? "bg-red-500 text-white animate-pulse" 
                                : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-105"
                            }`}
                         >
                             {isPlayingMelody ? (
                                <>
                                    <Icons.Pause />
                                    <span>Stop</span>
                                </>
                             ) : (
                                <>
                                    <Icons.MusicNote />
                                    <span>{t.musicActions.playMelody}</span>
                                </>
                             )}
                         </button>
                     </div>
                 )}

                 {/* Coloring Action for Art / Pencil Sketch */}
                 {isArt && artStyle === 'pencil_sketch' && resultImage && (
                    <div className="flex items-center gap-2 mr-auto bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-bold hidden sm:block">
                            {t.artActions.coloringStyleLabel}
                        </span>
                        <div className="flex gap-1">
                            {COLORING_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => onColorSketch(style.id)}
                                    className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-md transition-colors text-orange-600 dark:text-orange-400"
                                    title={t.coloringStyles[style.id as keyof typeof t.coloringStyles]}
                                >
                                    <Icons.Brush />
                                    <span className="sr-only">{t.coloringStyles[style.id as keyof typeof t.coloringStyles]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                 )}
                 
                 {/* ENGLISH ACTIONS: VOCAB */}
                 {result && (
                    <div className="flex items-center gap-2 mr-auto">
                        {isEnglish && (
                            <button
                                onClick={handleAnalyzeVocab}
                                disabled={isVocabLoading}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                            >
                                {isVocabLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t.vocab.loading}
                                    </>
                                ) : (
                                    <>
                                        <Icons.BookOpen />
                                        {t.actions.analyzeVocab}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                 )}

                 {resultImage && (
                    <button 
                        onClick={handleImageDownload}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isArt 
                            ? "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/50"
                            : "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                        }`}
                    >
                        <Icons.Download />
                        {t.artActions.downloadImage}
                    </button>
                 )}

                 <button 
                   onClick={onExplainMore}
                   className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                 >
                     {t.actions.notUnderstood}
                 </button>
                 <button className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors">
                     {t.actions.anotherProblem}
                 </button>
             </div>
        )}
    </div>
  );
};

export default OutputPanel;