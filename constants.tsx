

import React from 'react';
import { Subject, Grade, Language, AppTranslation } from './types';

export const SUBJECTS = Object.values(Subject);
export const GRADES = Object.values(Grade);

// Audio Frequencies for Music Playback (Equal Temperament)
export const NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 2
  "C2": 65.41, "C#2": 69.30, "Db2": 69.30, "D2": 73.42, "D#2": 77.78, "Eb2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "Gb2": 92.50, "G2": 98.00, "G#2": 103.83, "Ab2": 103.83, "A2": 110.00, "A#2": 116.54, "Bb2": 116.54, "B2": 123.47,
  // Octave 3
  "C3": 130.81, "C#3": 138.59, "Db3": 138.59, "D3": 146.83, "D#3": 155.56, "Eb3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "Gb3": 185.00, "G3": 196.00, "G#3": 207.65, "Ab3": 207.65, "A3": 220.00, "A#3": 233.08, "Bb3": 233.08, "B3": 246.94,
  // Octave 4 (Middle C)
  "C4": 261.63, "C#4": 277.18, "Db4": 277.18, "D4": 293.66, "D#4": 311.13, "Eb4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "Gb4": 369.99, "G4": 392.00, "G#4": 415.30, "Ab4": 415.30, "A4": 440.00, "A#4": 466.16, "Bb4": 466.16, "B4": 493.88,
  // Octave 5
  "C5": 523.25, "C#5": 554.37, "Db5": 554.37, "D5": 587.33, "D#5": 622.25, "Eb5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "Gb5": 739.99, "G5": 783.99, "G#5": 830.61, "Ab5": 830.61, "A5": 880.00, "A#5": 932.33, "Bb5": 932.33, "B5": 987.77,
  // Octave 6
  "C6": 1046.50
};

export const ART_STYLES = [
  { id: 'none', promptSuffix: '' },
  { id: 'chibi', promptSuffix: ', phong cách Chibi dễ thương' },
  { id: 'cartoon3d', promptSuffix: ', phong cách hoạt hình 3D (Pixar style)' },
  { id: 'anime', promptSuffix: ', phong cách Anime Nhật Bản' },
  { id: 'manga', promptSuffix: ', phong cách truyện tranh Manga Nhật Bản, nét vẽ sắc sảo, đen trắng hoặc màu, chi tiết' },
  { id: 'comic_us', promptSuffix: ', phong cách truyện tranh Comic Mỹ (Marvel/DC style), nét vẽ mạnh mẽ, màu sắc rực rỡ, action, đậm chất siêu anh hùng' },
  { id: 'webtoon', promptSuffix: ', phong cách Webtoon Hàn Quốc (Manhwa), màu sắc tươi sáng, nét vẽ hiện đại, kỹ thuật số' },
  { id: 'kawaii', promptSuffix: ', phong cách Kawaii cute' },
  { id: 'disney', promptSuffix: ', phong cách Walt Disney classic' },
  { id: 'harry_potter', promptSuffix: ', phong cách phép thuật Harry Potter (Hogwarts style)' },
  { id: 'pencil_sketch', promptSuffix: ', phong cách tranh vẽ chì (pencil sketch), đen trắng nghệ thuật, chi tiết' },
];

export const COLORING_STYLES = [
  { id: 'watercolor', promptPrefix: 'Hãy tô màu nước (watercolor) nhẹ nhàng, nghệ thuật cho bức tranh này.' },
  { id: 'crayon', promptPrefix: 'Hãy tô màu sáp (crayon) rực rỡ, vui tươi cho bức tranh này.' },
  { id: 'oil', promptPrefix: 'Hãy tô màu sơn dầu (oil painting) đậm đà, có chiều sâu cho bức tranh này.' },
  { id: 'digital', promptPrefix: 'Hãy tô màu kỹ thuật số (digital art) hiện đại, sắc nét, 3D cho bức tranh này.' },
];

// Mapping of regional descriptions to available Gemini Voices
// Gemini Voices: Kore (F), Zephyr (F), Fenrir (M), Puck (M), Charon (M)
export const VOICE_REGIONS = [
  {
    label: "Miền Nam (Southern)",
    options: [
      { id: "sg_female", name: "Sài Gòn (Nữ - Chuẩn)", voice: "Kore", gender: 'female' },
      { id: "sg_male", name: "Sài Gòn (Nam - Phóng khoáng)", voice: "Fenrir", gender: 'male' },
      { id: "west_male", name: "Miền Tây (Nam - Miệt vườn)", voice: "Puck", gender: 'male' },
      { id: "ben_tre_female", name: "Bến Tre (Nữ - Ngọt ngào)", voice: "Zephyr", gender: 'female' },
      { id: "ca_mau_male", name: "Cà Mau (Nam - Bác Ba Phi)", voice: "Charon", gender: 'male' },
    ]
  },
  {
    label: "Miền Trung (Central)",
    options: [
      { id: "hue_female", name: "Huế (Nữ - Nhẹ nhàng)", voice: "Zephyr", gender: 'female' },
      { id: "nghe_tinh_male", name: "Nghệ Tĩnh (Nam - Trầm)", voice: "Charon", gender: 'male' },
      { id: "da_nang_male", name: "Đà Nẵng (Nam - Năng động)", voice: "Puck", gender: 'male' },
      { id: "binh_dinh_male", name: "Bình Định (Nam - Nẫu)", voice: "Fenrir", gender: 'male' },
    ]
  },
  {
    label: "Miền Bắc (Northern)",
    options: [
      { id: "hn_female", name: "Hà Nội (Nữ - Chuẩn)", voice: "Kore", gender: 'female' },
      { id: "hn_male", name: "Hà Nội (Nam - Chuẩn)", voice: "Fenrir", gender: 'male' },
      { id: "bac_ninh_female", name: "Bắc Ninh (Nữ - Quan họ)", voice: "Zephyr", gender: 'female' },
      { id: "hai_phong_male", name: "Hải Phòng (Nam - Mạnh mẽ)", voice: "Charon", gender: 'male' },
    ]
  },
  {
    label: "Phong cách Đặc biệt (Special)",
    options: [
      { id: "story_horror", name: "Kể chuyện Ma (Nam)", voice: "Charon", gender: 'male' },
      { id: "story_comedy", name: "Hài hước / Tếu táo (Nam)", voice: "Puck", gender: 'male' },
      { id: "ad_sale", name: "Rao bán hàng (Nữ)", voice: "Zephyr", gender: 'female' },
      { id: "monk", name: "Thuyết giảng (Nam - Hào sảng)", voice: "Fenrir", gender: 'male' },
    ]
  }
];

export const TRANSLATIONS: Record<Language, AppTranslation> = {
  [Language.VN]: {
    appTitle: "Học cùng Thầy Hùng Online !",
    footerText: "© 2024 Học cùng Thầy Hùng Online. Powered by Google Gemini.",
    langVN: "Tiếng Việt",
    langGB: "Tiếng Anh",
    tabs: {
      text: "Gõ chữ",
      image: "Tải ảnh",
      camera: "Máy ảnh"
    },
    placeholders: {
      textInput: "Gõ đề bài của bạn vào đây... (hoặc dùng mic để nói)",
      imageNote: "Thêm ghi chú cho ảnh (nếu cần)...",
      upload: "Nhấn để tải ảnh đề bài lên",
      uploadSupport: "Hỗ trợ JPG, PNG",
      cameraError: "Không thể truy cập máy ảnh. Hãy kiểm tra quyền truy cập.",
      retry: "Thử lại",
      changeImage: "Thay đổi ảnh",
      retake: "Chụp lại",
      listening: "Đang nghe...",
      charCount: "ký tự"
    },
    actions: {
      solve: "Giải bài",
      thinking: "Đang suy nghĩ...",
      tryAgain: "Thử lại",
      anotherProblem: "Giải bài khác",
      notUnderstood: "Chưa hiểu lắm?",
      analyzeVocab: "Học từ vựng",
    },
    output: {
      readyTitle: "Thầy Hùng đã sẵn sàng!",
      readyDesc: "Nhập đề bài vào bên trái để bắt đầu. Bạn có thể gõ hoặc tải ảnh lên!",
      solutionTitle: "Lời giải của Thầy Hùng"
    },
    tts: {
      play: "Đọc",
      pause: "Dừng",
      download: "Tải về",
      speed: "Tốc độ",
      voice: "Giọng",
      style: "Vùng/Kiểu",
      generating: "Đang tạo giọng...",
      gender: "Giới tính",
      male: "Nam",
      female: "Nữ",
      slowRead: "Đọc chậm"
    },
    settings: {
      title: "Cài đặt",
      darkMode: "Giao diện Tối",
      languageSystem: "Ngôn ngữ hệ thống",
      aiModel: "Mô hình AI",
      creative: "Sáng tạo",
      academic: "Chuẩn học thuật",
      close: "Đóng"
    },
    subjects: {
      [Subject.MATH]: "Toán",
      [Subject.VIETNAMESE]: "Tiếng Việt",
      [Subject.HISTORY_GEOGRAPHY]: "Lịch sử & Địa lí",
      [Subject.SCIENCE]: "Khoa học",
      [Subject.ENGLISH]: "Tiếng Anh",
      [Subject.MORAL]: "Đạo đức",
      [Subject.ACTIVITY]: "Hoạt động trải nghiệm (HĐTN)",
      [Subject.TECHNOLOGY]: "Công nghệ",
      [Subject.INFORMATICS]: "Tin học",
      [Subject.NATURE_SOCIETY]: "Tự nhiên và xã hội (TN&XH)",
      [Subject.GENERAL_KNOWLEDGE]: "Tìm hiểu thêm (VH-XH-KH)",
      [Subject.MUSIC]: "Âm nhạc",
      [Subject.ART]: "Mĩ thuật"
    },
    grades: {
      [Grade.GRADE_1]: "Lớp 1",
      [Grade.GRADE_2]: "Lớp 2",
      [Grade.GRADE_3]: "Lớp 3",
      [Grade.GRADE_4]: "Lớp 4",
      [Grade.GRADE_5]: "Lớp 5"
    },
    musicActions: {
      readMusic: "Đọc nhạc",
      playMelody: "Phát giai điệu"
    },
    artActions: {
      createImage: "Tạo ảnh",
      styleLabel: "Phong cách:",
      aspectRatioLabel: "Tỉ lệ:",
      downloadImage: "Tải & Lưu",
      colorAction: "Tô màu",
      coloringStyleLabel: "Chọn màu:"
    },
    artStyles: {
      none: "Tự do",
      chibi: "Chibi",
      cartoon3d: "Cartoon 3D",
      anime: "Anime",
      manga: "Manga",
      comic_us: "Comic Mỹ",
      webtoon: "Webtoon",
      kawaii: "Kawaii",
      disney: "Walt Disney",
      harry_potter: "Harry Potter",
      pencil_sketch: "Pencil Sketch"
    },
    coloringStyles: {
      watercolor: "Màu nước",
      crayon: "Sáp màu",
      oil: "Sơn dầu",
      digital: "Kỹ thuật số"
    },
    vocab: {
      title: "Học từ vựng cùng Thầy Hùng",
      loading: "Đang phân tích từ vựng...",
      easy: "Dễ (A1-A2)",
      medium: "Trung bình (B1)",
      hard: "Khó (B2+)",
      modeQuiz: "Trắc nghiệm tốc độ",
      modeMatch: "Nối từ với nghĩa",
      modeListen: "Luyện nghe",
      backToText: "Quay lại bài đọc",
      correct: "Chính xác!",
      incorrect: "Sai rồi!",
      score: "Điểm số:",
      playAgain: "Chơi lại"
    }
  },
  [Language.GB]: {
    appTitle: "LEARN WITH MR. HUNG ONLINE",
    footerText: "© 2024 Learn with Mr. Hung Online. Powered by Google Gemini.",
    langVN: "Vietnamese",
    langGB: "English",
    tabs: {
      text: "Text",
      image: "Upload",
      camera: "Camera"
    },
    placeholders: {
      textInput: "Type your question here... (or use mic)",
      imageNote: "Add notes for the image (optional)...",
      upload: "Click to upload your question image",
      uploadSupport: "Supports JPG, PNG",
      cameraError: "Cannot access camera. Please check permissions.",
      retry: "Retry",
      changeImage: "Change Image",
      retake: "Retake",
      listening: "Listening...",
      charCount: "chars"
    },
    actions: {
      solve: "Solve",
      thinking: "Thinking...",
      tryAgain: "Try Again",
      anotherProblem: "Solve Another",
      notUnderstood: "Explain more?",
      analyzeVocab: "Learn Vocab",
    },
    output: {
      readyTitle: "Mr. Hung is ready!",
      readyDesc: "Enter your question on the left to start. You can type or upload an image!",
      solutionTitle: "Mr. Hung's Solution"
    },
    tts: {
      play: "Play",
      pause: "Pause",
      download: "Download",
      speed: "Speed",
      voice: "Voice",
      style: "Region/Style",
      generating: "Generating audio...",
      gender: "Gender",
      male: "Male",
      female: "Female",
      slowRead: "Read slowly"
    },
    settings: {
      title: "Settings",
      darkMode: "Dark Mode",
      languageSystem: "System Language",
      aiModel: "AI Model",
      creative: "Creative",
      academic: "Academic Standard",
      close: "Close"
    },
    subjects: {
      [Subject.MATH]: "Math",
      [Subject.VIETNAMESE]: "Vietnamese",
      [Subject.HISTORY_GEOGRAPHY]: "History & Geography",
      [Subject.SCIENCE]: "Science",
      [Subject.ENGLISH]: "English",
      [Subject.MORAL]: "Ethics",
      [Subject.ACTIVITY]: "Exp. Activities",
      [Subject.TECHNOLOGY]: "Technology",
      [Subject.INFORMATICS]: "Informatics",
      [Subject.NATURE_SOCIETY]: "Nature & Society",
      [Subject.GENERAL_KNOWLEDGE]: "General Knowledge (Ext)",
      [Subject.MUSIC]: "Music",
      [Subject.ART]: "Art/Fine Arts"
    },
    grades: {
      [Grade.GRADE_1]: "Grade 1",
      [Grade.GRADE_2]: "Grade 2",
      [Grade.GRADE_3]: "Grade 3",
      [Grade.GRADE_4]: "Grade 4",
      [Grade.GRADE_5]: "Grade 5"
    },
    musicActions: {
      readMusic: "Read Music",
      playMelody: "Play Melody"
    },
    artActions: {
      createImage: "Create Image",
      styleLabel: "Style:",
      aspectRatioLabel: "Ratio:",
      downloadImage: "Save Image",
      colorAction: "Color it",
      coloringStyleLabel: "Color style:"
    },
    artStyles: {
      none: "None",
      chibi: "Chibi",
      cartoon3d: "Cartoon 3D",
      anime: "Anime",
      manga: "Manga",
      comic_us: "US Comic",
      webtoon: "Webtoon",
      kawaii: "Kawaii",
      disney: "Walt Disney",
      harry_potter: "Harry Potter",
      pencil_sketch: "Pencil Sketch"
    },
    coloringStyles: {
      watercolor: "Watercolor",
      crayon: "Crayon",
      oil: "Oil Painting",
      digital: "Digital Art"
    },
    vocab: {
      title: "Vocabulary Practice with Mr. Hung",
      loading: "Scanning for vocabulary...",
      easy: "Basic (Green)",
      medium: "Intermediate (Yellow)",
      hard: "Advanced (Red)",
      modeQuiz: "Speed Quiz",
      modeMatch: "Definition Matching",
      modeListen: "Listening Practice",
      backToText: "Back to Reading",
      correct: "Correct!",
      incorrect: "Incorrect!",
      score: "Score:",
      playAgain: "Play Again"
    }
  }
};

export const Icons = {
  Sparkle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M9 3v4"/>
      <path d="M3 5h4"/>
      <path d="M3 9h4"/>
    </svg>
  ),
  Text: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="12" x2="9" y2="12"></line>
      <line x1="21" y1="18" x2="7" y2="18"></line>
    </svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Robot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M12 7v4"></path>
      <line x1="8" y1="16" x2="8" y2="16"></line>
      <line x1="16" y1="16" x2="16" y2="16"></line>
    </svg>
  ),
  Send: () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  Mic: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
  Pause: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Speaker: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  ),
  Male: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5"></circle>
      <line x1="19" y1="5" x2="13.6" y2="10.4"></line>
      <line x1="19" y1="5" x2="14" y2="5"></line>
      <line x1="19" y1="5" x2="19" y2="10"></line>
    </svg>
  ),
  Female: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="5"></circle>
      <line x1="12" y1="15" x2="12" y2="21"></line>
      <line x1="9" y1="18" x2="15" y2="18"></line>
    </svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  MusicNote: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  ),
  Palette: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"></circle>
      <circle cx="17.5" cy="10.5" r=".5"></circle>
      <circle cx="8.5" cy="7.5" r=".5"></circle>
      <circle cx="6.5" cy="12.5" r=".5"></circle>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
    </svg>
  ),
  Brush: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.61 18.89a2.5 2.5 0 0 1-1.3-3.63l5.88-10.18a2.5 2.5 0 0 1 4.3 2.5l-5.87 10.17a2.5 2.5 0 0 1-3.01 1.14z"></path>
      <path d="M4.56 12.83a2.5 2.5 0 0 0-3.3 2.87l1.1 6.8c.1.6.6 1.1 1.2 1.2l6.8 1.1a2.5 2.5 0 0 0 2.87-3.3"></path>
    </svg>
  ),
  Puzzle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 15.424c-1.298-2.67-4.145-4.526-7.44-4.526s-6.142 1.856-7.44 4.526c-1.298 2.67-1.298 5.765 0 8.435 1.298 2.67 4.145 4.526 7.44 4.526s6.142-1.856 7.44-4.526c1.298-2.67 1.298-5.765 0-8.435z" transform="scale(0.8) translate(4 0)" />
      <path d="M10 3a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M21 12h-4l-3 7h-4l-3 -7h-4" />
    </svg>
  ),
  Headphones: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
    </svg>
  ),
  ListCheck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 6h9"></path>
      <path d="M11 12h9"></path>
      <path d="M11 18h9"></path>
      <path d="M3 6h2"></path>
      <path d="M3 12h2"></path>
      <path d="M3 18h2"></path>
    </svg>
  ),
  BookOpen: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  )
};