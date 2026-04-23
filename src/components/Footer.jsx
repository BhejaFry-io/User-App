// src/components/Footer.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

export default function Footer() {
  const { isDarkMode } = useContext(ThemeContext);
  
  // Theme-aware link colors
  const linkColor = isDarkMode 
    ? "text-slate-400 hover:text-[#facc15]" 
    : "text-slate-500 hover:text-[#2563EB]";

  return (
    <div className="w-full py-6 mt-auto flex flex-wrap justify-center gap-4 md:gap-8 text-[10px] md:text-xs font-black uppercase tracking-widest z-20">
      <Link to="/about" className={`transition-colors ${linkColor}`}>About Us</Link>
      <Link to="/contact" className={`transition-colors ${linkColor}`}>Contact Us</Link>
      <Link to="/privacy" className={`transition-colors ${linkColor}`}>Privacy Policy</Link>
      <Link to="/terms" className={`transition-colors ${linkColor}`}>Terms & Conditions</Link>
    </div>
  );
}