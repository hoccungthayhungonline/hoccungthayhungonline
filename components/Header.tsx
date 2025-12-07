
import React from 'react';
import { Icons, SUBJECTS, GRADES } from '../constants';
import { Subject, Grade, Language, AppTranslation } from '../types';

interface HeaderProps {
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  selectedGrade: Grade;
  setSelectedGrade: (g: Grade) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: AppTranslation;
}

const Header: React.FC<HeaderProps> = ({
  selectedSubject,
  setSelectedSubject,
  selectedGrade,
  setSelectedGrade,
  language,
  setLanguage,
  t
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="text-primary-600">
            <Icons.Sparkle />
          </div>
          <h1 className="text-2xl font-bold font-calligraphy text-primary-700 tracking-normal">{t.appTitle}</h1>
        </div>

        {/* Controls Area */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          
          {/* Subject Select */}
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none min-w-[120px]"
          >
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{t.subjects[sub] || sub}</option>
            ))}
          </select>

          {/* Grade Select */}
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value as Grade)}
            className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none min-w-[100px]"
          >
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>{t.grades[grade] || grade}</option>
            ))}
          </select>

          {/* Language Toggle */}
          <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200 shrink-0">
            <button 
              onClick={() => setLanguage(Language.VN)}
              className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm transition-all whitespace-nowrap ${
                language === Language.VN 
                  ? 'bg-gray-600 text-white' 
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t.langVN}
            </button>
            <button 
              onClick={() => setLanguage(Language.GB)}
              className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm transition-all whitespace-nowrap ${
                language === Language.GB 
                  ? 'bg-gray-600 text-white' 
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t.langGB}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;