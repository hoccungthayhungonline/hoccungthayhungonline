

import React, { useEffect, useRef, useState } from 'react';
import { streamSpeech } from '../services/geminiService';

// --- Audio Helpers ---

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
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const RobotTeacherLarge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 animate-bounce-slow drop-shadow-2xl">
    <defs>
      <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0e7ff" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Body */}
    <rect x="60" y="90" width="80" height="70" rx="10" fill="url(#metalGradient)" stroke="#4338ca" strokeWidth="3" />
    
    {/* Screen/Chest */}
    <rect x="75" y="110" width="50" height="30" rx="5" fill="#1e1b4b" />
    <path d="M80 125h10M80 130h20M80 120h30" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />

    {/* Neck */}
    <rect x="90" y="80" width="20" height="10" fill="#6366f1" />

    {/* Head */}
    <rect x="50" y="20" width="100" height="60" rx="12" fill="white" stroke="#4338ca" strokeWidth="3" />
    
    {/* Antenna */}
    <line x1="100" y1="20" x2="100" y2="5" stroke="#4338ca" strokeWidth="3" />
    <circle cx="100" cy="5" r="5" fill="#ef4444" className="animate-ping" />

    {/* Eyes */}
    <circle cx="80" cy="45" r="8" fill="#1e1b4b" />
    <circle cx="120" cy="45" r="8" fill="#1e1b4b" />
    <circle cx="82" cy="43" r="3" fill="white" />
    <circle cx="122" cy="43" r="3" fill="white" />

    {/* Glasses */}
    <path d="M65 45 a15 15 0 0 1 30 0" fill="none" stroke="#fbbf24" strokeWidth="2" />
    <path d="M105 45 a15 15 0 0 1 30 0" fill="none" stroke="#fbbf24" strokeWidth="2" />
    <line x1="95" y1="45" x2="105" y2="45" stroke="#fbbf24" strokeWidth="2" />

    {/* Smile */}
    <path d="M85 65 q15 10 30 0" fill="none" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />

    {/* Arms */}
    <path d="M60 100 c-20 0 -30 20 -30 40" fill="none" stroke="#6366f1" strokeWidth="8" strokeLinecap="round" />
    <path d="M140 100 c20 0 30 -40 30 -60" fill="none" stroke="#6366f1" strokeWidth="8" strokeLinecap="round" />
    
    {/* Hand waving */}
    <circle cx="170" cy="35" r="10" fill="url(#metalGradient)" />
  </svg>
);

const WelcomeScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Function to generate happy music using Oscillators (Web Audio API)
  const playHappyMusic = (ctx: AudioContext) => {
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine'; // Smooth tone
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05); // Fade in
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Fade out

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // C Major Arpeggio + High C (Happy/Success sound)
    playNote(261.63, now, 0.3);       // C4
    playNote(329.63, now + 0.15, 0.3); // E4
    playNote(392.00, now + 0.3, 0.3);  // G4
    playNote(523.25, now + 0.45, 0.8); // C5 (Longer)
    playNote(659.25, now + 0.55, 0.8); // E5 (Sparkle)
  };

  // Function to stream the voice greeting
  const playWelcomeVoice = async (ctx: AudioContext) => {
    try {
      const greetingText = "Thầy Hùng online chào các em!";
      const config = { voiceName: 'Fenrir', speed: 1.1, regionStyle: '' }; // Fenrir is cheerful male
      
      let nextStartTime = ctx.currentTime + 0.8; // Start after music intro
      
      const stream = streamSpeech(greetingText, config);
      
      for await (const chunkBase64 of stream) {
         const byteArray = decode(chunkBase64);
         const buffer = await pcmToAudioBuffer(byteArray, ctx);
         
         const source = ctx.createBufferSource();
         source.buffer = buffer;
         source.connect(ctx.destination);
         source.start(nextStartTime);
         nextStartTime += buffer.duration;
      }
    } catch (e) {
      console.error("Welcome voice error", e);
    }
  };

  useEffect(() => {
    // --- Visual Animation ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      size: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.color = color;
        this.size = Math.random() * 3 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.alpha -= 0.01;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const createFirework = () => {
      const x = Math.random() * width;
      const y = Math.random() * (height / 2); // Top half
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle(x, y, color));
      }
    };

    let animationFrameId: number;
    let timer = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.2)'; // Trail effect
      ctx.fillRect(0, 0, width, height);

      // Launch fireworks randomly
      if (timer % 20 === 0) {
        createFirework();
      }
      timer++;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // --- Audio Logic ---
    try {
      // Create Audio Context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      // Attempt to resume and play (Browser policy might block this without interaction)
      const playSequence = () => {
         if (audioCtx.state === 'suspended') {
             audioCtx.resume();
         }
         playHappyMusic(audioCtx);
         playWelcomeVoice(audioCtx);
      };

      playSequence();
      
      // Add a one-time click listener to document to force unblock audio if it failed initially
      const unlockAudio = () => {
         if (audioCtx.state === 'suspended') audioCtx.resume();
         window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);

    } catch (e) {
      console.error("Audio init failed", e);
    }

    // Resize handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Fade out sequence
    const fadeTimeout = setTimeout(() => {
        setOpacity(0);
    }, 4500); // Start fading out

    const finishTimeout = setTimeout(() => {
        onFinished();
    }, 5500); // Fully remove

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(fadeTimeout);
      clearTimeout(finishTimeout);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onFinished]);

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-gray-900 flex flex-col items-center justify-center transition-opacity duration-1000 cursor-pointer"
      style={{ opacity: opacity, pointerEvents: opacity === 0 ? 'none' : 'auto' }}
      onClick={() => {
         // Allow clicking to dismiss early or unblock audio
         if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
         }
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      <div className="z-10 flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-8 transform hover:scale-110 transition-transform duration-500">
             <RobotTeacherLarge />
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold font-calligraphy text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 animate-pulse drop-shadow-md">
           Thầy Hùng Online <br/> Chào Các Em!
        </h1>
        <p className="text-gray-400 text-sm mt-4 animate-bounce">(Chạm vào màn hình để vào lớp)</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;