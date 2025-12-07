

export enum Subject {
  MATH = 'Toán',
  VIETNAMESE = 'Tiếng Việt',
  HISTORY_GEOGRAPHY = 'Lịch sử & Địa lí',
  SCIENCE = 'Khoa học',
  ENGLISH = 'Tiếng Anh',
  MORAL = 'Đạo đức',
  ACTIVITY = 'Hoạt động trải nghiệm (HĐTN)',
  TECHNOLOGY = 'Công nghệ',
  INFORMATICS = 'Tin học',
  NATURE_SOCIETY = 'Tự nhiên và xã hội (TN&XH)',
  GENERAL_KNOWLEDGE = 'Tìm hiểu thêm (VH-XH-KH)',
  MUSIC = 'Âm nhạc',
  ART = 'Mĩ thuật'
}

export enum Grade {
  GRADE_1 = 'Lớp 1',
  GRADE_2 = 'Lớp 2',
  GRADE_3 = 'Lớp 3',
  GRADE_4 = 'Lớp 4',
  GRADE_5 = 'Lớp 5'
}

export enum InputMode {
  TEXT = 'text',
  IMAGE = 'image',
  CAMERA = 'camera'
}

export enum Language {
  VN = 'VN',
  GB = 'GB'
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export interface AppSettings {
  darkMode: boolean;
  creativityLevel: 'creative' | 'academic';
}

export interface TTSConfig {
  voiceName: string; // 'Kore', 'Fenrir', etc.
  speed: number;
  regionStyle: string; // Description for prompt injection if needed
}

// Vocabulary Types
export type VocabLevel = 'easy' | 'medium' | 'hard';

export interface VocabularyItem {
  word: string;
  type: string; // noun, verb, etc.
  meaning: string; // English definition
  vietnamese: string;
  level: VocabLevel;
}

// Music Types
export interface MelodyNote {
  note: string; // e.g., "C4", "D#4", "Rest"
  duration: number; // 1 = quarter note (đen), 0.5 = eighth (đơn), 2 = half (trắng), 4 = whole (tròn)
}

export interface AppTranslation {
  appTitle: string;
  footerText: string;
  langVN: string;
  langGB: string;
  tabs: {
    text: string;
    image: string;
    camera: string;
  };
  placeholders: {
    textInput: string;
    imageNote: string;
    upload: string;
    uploadSupport: string;
    cameraError: string;
    retry: string;
    changeImage: string;
    retake: string;
    listening: string;
    charCount: string;
  };
  actions: {
    solve: string;
    thinking: string;
    tryAgain: string;
    anotherProblem: string;
    notUnderstood: string;
    analyzeVocab: string;
  };
  output: {
    readyTitle: string;
    readyDesc: string;
    solutionTitle: string;
  };
  tts: {
    play: string;
    pause: string;
    download: string;
    speed: string;
    voice: string;
    style: string;
    generating: string;
    gender: string;
    male: string;
    female: string;
    slowRead: string;
  };
  settings: {
    title: string;
    darkMode: string;
    languageSystem: string;
    aiModel: string;
    creative: string;
    academic: string;
    close: string;
  };
  subjects: Record<string, string>;
  grades: Record<string, string>;
  musicActions: {
    readMusic: string;
    playMelody: string;
  };
  artActions: {
    createImage: string;
    styleLabel: string;
    aspectRatioLabel: string;
    downloadImage: string;
    colorAction: string;
    coloringStyleLabel: string;
  };
  artStyles: {
    none: string;
    chibi: string;
    cartoon3d: string;
    anime: string;
    manga: string;
    kawaii: string;
    disney: string;
    harry_potter: string;
    pencil_sketch: string;
    comic_us: string;
    webtoon: string;
  };
  coloringStyles: {
    watercolor: string;
    crayon: string;
    oil: string;
    digital: string;
  };
  vocab: {
    title: string;
    loading: string;
    easy: string;
    medium: string;
    hard: string;
    modeQuiz: string;
    modeMatch: string;
    modeListen: string;
    backToText: string;
    correct: string;
    incorrect: string;
    score: string;
    playAgain: string;
  };
}