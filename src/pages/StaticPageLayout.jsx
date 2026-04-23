// src/pages/StaticPageLayout.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import Footer from '../components/Footer';

export default function StaticPageLayout({ title, children }) {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Exact BhejaFry Theme Variables
  const bgClass = isDarkMode ? "bg-[#0f172a]" : "bg-[#e0f2fe]";
  const dotPattern = isDarkMode ? "radial-gradient(#334155 2px, transparent 2px)" : "radial-gradient(#bae6fd 2px, transparent 2px)";
  const cardBg = isDarkMode ? "bg-[#1e293b] border-black shadow-[20px_20px_0px_0px_#000]" : "bg-white border-slate-900 shadow-[20px_20px_0px_0px_#1e293b]";
  const headingText = isDarkMode ? "text-white drop-shadow-[4px_4px_0px_#ef4444]" : "text-[#1e293b] drop-shadow-[4px_4px_0px_#fff]";
  const pText = isDarkMode ? "text-slate-300" : "text-slate-700";

  return (
    <div className={`min-h-screen flex flex-col items-center ${bgClass} p-4 relative overflow-x-hidden font-sans transition-colors duration-500`} 
         style={{ backgroundImage: dotPattern, backgroundSize: '30px 30px' }}>
      
      {/* Top Navigation Controls */}
      <div className="w-full max-w-5xl flex justify-between items-center z-50 pt-4 px-4">
        <Link to="/" className={`text-xs md:text-sm font-black uppercase px-4 py-2 md:px-6 md:py-3 rounded-xl border-[4px] hover:-translate-y-1 active:translate-y-1 transition-all ${isDarkMode ? 'bg-[#1e293b] text-white border-black shadow-[4px_4px_0px_#000] active:shadow-none' : 'bg-white text-slate-900 border-slate-900 shadow-[4px_4px_0px_#1e293b] active:shadow-none'}`}>
          ← Back to Game
        </Link>
        <button onClick={toggleTheme} className={`text-xl md:text-2xl p-2 md:p-3 rounded-full border-[4px] hover:-translate-y-1 active:translate-y-1 transition-all flex items-center justify-center ${isDarkMode ? 'bg-[#1e293b] border-black shadow-[4px_4px_0px_#000] active:shadow-none' : 'bg-white border-slate-900 shadow-[4px_4px_0px_#1e293b] active:shadow-none'}`}>
          {isDarkMode ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="flex-grow flex items-center justify-center w-full max-w-4xl py-12 z-10">
        <div className={`border-[6px] p-6 md:p-12 rounded-[3rem] w-full relative transition-all duration-300 ${cardBg}`}>
          <h1 className={`text-4xl md:text-6xl font-black mb-8 uppercase italic tracking-tighter ${headingText}`}>
            {title}
          </h1>
          <div className={`font-bold text-sm md:text-base space-y-6 ${pText} leading-relaxed`}>
            {children}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}