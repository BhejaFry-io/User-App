import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { createRoom, joinRoom, updateUsernameAPI } from '../api/services'; 
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext'; 
import Footer from '../components/Footer';

export default function Lobby() {
  const [inviteCode, setInviteCode] = useState('');
  const [guestName, setGuestName] = useState(''); 
  const [guestError, setGuestError] = useState(''); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // STATES FOR USERNAME EDITING
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updateError, setUpdateError] = useState('');
  
  const navigate = useNavigate();
  const { user, login, logout, loginGuest, updateUser } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Automatically clear all forms and errors when auth state changes
  useEffect(() => {
    if (!user) {
      setUpdateError('');
      setNewUsername('');
      setIsEditingName(false);
      setIsProfileOpen(false);
    } else {
      setGuestError('');
      setGuestName('');
    }
  }, [user]);

  const handleCreateRoom = async () => {
    try {
      const response = await createRoom({ visibility: 'PRIVATE', settingsJson: {} });
      if (response.success) {
        navigate(`/room/${response.data.id}`);
      }
    } catch (error) {
      console.error("Failed to create room", error);
    }
  };

const handleJoinRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await joinRoom({ inviteCode });
      if (response.success) {
        navigate(`/room/${response.data.roomId}`);
      }
    } catch (error) {
      // 🟢 UPDATED: Removed "or Room already started" text
      alert("Invalid Invite Code. Please check and try again.");
    }
  };

  // Guest form handler
  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setGuestError('');
    if (!guestName.trim()) return;
    
    const result = await loginGuest(guestName);
    if (!result.success) {
      setGuestError(result.message);
    }
  };

  // Handle updating username
  const handleSaveUsername = async () => {
    setUpdateError('');
    if (!newUsername.trim() || newUsername.trim() === user.username) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await updateUsernameAPI(newUsername);
      if (res.success) {
        updateUser(res.data); // Update local context
        setIsEditingName(false); // Close edit mode
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update username');
    }
  };

  // --- THEME VARIABLES ---
  const bgClass = isDarkMode ? "bg-[#0f172a]" : "bg-[#e0f2fe]";
  const dotPattern = isDarkMode ? "radial-gradient(#334155 2px, transparent 2px)" : "radial-gradient(#bae6fd 2px, transparent 2px)";
  const emojiShadow1 = isDarkMode ? "drop-shadow-[15px_15px_20px_rgba(0,0,0,0.5)]" : "drop-shadow-[15px_15px_20px_rgba(0,0,0,0.15)]";
  const emojiShadow2 = isDarkMode ? "drop-shadow-[10px_10px_15px_rgba(0,0,0,0.4)]" : "drop-shadow-[10px_10px_15px_rgba(0,0,0,0.1)]";
  
  const titleText = isDarkMode ? "text-white drop-shadow-[2px_2px_0px_#ef4444]" : "text-[#1e293b] drop-shadow-[2px_2px_0px_#fff]";
  const subtitleBorder = isDarkMode ? "border-black text-black" : "border-slate-900 text-slate-900";
  
  const cardBg = isDarkMode ? "bg-[#1e293b] border-black shadow-[8px_8px_0px_0px_#000] md:shadow-[15px_15px_0px_0px_#000]" : "bg-white border-slate-900 shadow-[8px_8px_0px_0px_#1e293b] md:shadow-[15px_15px_0px_0px_#1e293b]";
  const headingText = isDarkMode ? "text-white" : "text-slate-900";
  const pText = isDarkMode ? "text-slate-400" : "text-slate-500";
  const avatarBorder = isDarkMode ? "border-black shadow-[3px_3px_0px_0px_#000]" : "border-slate-900 shadow-[3px_3px_0px_0px_#1e293b]";
  const dropdownBg = isDarkMode ? "bg-[#0f172a] border-black shadow-[8px_8px_0px_0px_#000]" : "bg-white border-slate-900 shadow-[8px_8px_0px_0px_#1e293b]";
  const actionBtnBorder = isDarkMode ? "border-black" : "border-slate-900";
  const divider = isDarkMode ? "border-slate-700" : "border-slate-100";
  const orText = isDarkMode ? "text-slate-500" : "text-slate-300";
  const inputBg = isDarkMode ? "bg-[#0f172a] text-white border-black focus:ring-slate-700 placeholder:text-slate-600" : "bg-[#f8fafc] text-slate-900 border-slate-900 focus:ring-blue-100 placeholder:text-slate-300";
  const enterBtnText = isDarkMode ? "text-black" : "text-slate-900";
  const thirdDot = isDarkMode ? "bg-[#facc15]" : "bg-yellow-500";

  return (
    <div className={`h-[100dvh] w-full ${bgClass} flex flex-col justify-between overflow-hidden relative font-sans transition-colors duration-500 p-3 md:p-6`} 
         style={{ backgroundImage: dotPattern, backgroundSize: '30px 30px' }}>
      
      {/* --- BACKGROUND 3D EMOJIS --- */}
      <div className={`hidden sm:block absolute top-[10%] left-[5%] text-[100px] md:text-[180px] select-none pointer-events-none opacity-90 animate-bounce-slow filter drop-shadow-[5px_5px_0px_#fff] z-0 ${emojiShadow1}`}>🎮</div>
      <div className={`hidden sm:block absolute bottom-[10%] right-[5%] text-[80px] md:text-[150px] rotate-12 select-none pointer-events-none opacity-90 filter drop-shadow-[5px_5px_0px_#fff] z-0 ${emojiShadow1}`}>🏆</div>
      <div className={`hidden sm:block absolute top-[15%] right-[10%] text-[60px] md:text-[120px] -rotate-12 select-none pointer-events-none opacity-80 filter drop-shadow-[4px_4px_0px_#fff] z-0 ${emojiShadow2}`}>💡</div>
      <div className={`hidden sm:block absolute bottom-[15%] left-[10%] text-[50px] md:text-[100px] rotate-45 select-none pointer-events-none opacity-80 filter drop-shadow-[4px_4px_0px_#fff] z-0 ${emojiShadow2}`}>⭐</div>

      {/* ================= HEADER AREA (Top) ================= */}
      <div className="w-full flex justify-center shrink-0 z-50 relative pt-1 md:pt-0">
        
        {/* Center: Logo & Tagline */}
        <div className="flex flex-col items-center">
          <h1 className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter italic transition-colors leading-none ${titleText}`}>
            BhejaFry
          </h1>
          <div className={`bg-[#facc15] border-[2px] md:border-[3px] px-2 py-0.5 md:px-3 md:py-1 rounded-md md:rounded-lg shadow-[2px_2px_0px_#000] inline-block -rotate-2 transform hover:rotate-0 transition-all cursor-default mt-1 ${subtitleBorder}`}>
            <p className="font-black text-[9px] md:text-[11px] tracking-widest uppercase">
              The Ultimate Desi Brain Tickler
            </p>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="absolute top-0 right-0 flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleTheme}
            className={`text-lg md:text-xl p-2 rounded-full border-[3px] hover:-translate-y-1 active:translate-y-1 transition-all flex items-center justify-center ${isDarkMode ? 'bg-[#1e293b] border-black shadow-[3px_3px_0px_#000] active:shadow-none' : 'bg-white border-slate-900 shadow-[3px_3px_0px_#1e293b] active:shadow-none'}`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          {user && (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-10 h-10 md:w-12 h-12 rounded-full border-[3px] hover:-translate-y-1 active:translate-y-1 transition-all active:shadow-none overflow-hidden ${avatarBorder}`}
              >
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </button>

              {/* EDITABLE PROFILE DROPDOWN */}
              {isProfileOpen && (
                <div className={`absolute top-full right-0 mt-2 p-3 md:p-4 rounded-xl md:rounded-2xl border-[3px] md:border-4 w-48 md:w-56 flex flex-col items-center gap-3 transition-all z-50 ${dropdownBg}`}>
                  
                  {/* EDIT MODE TOGGLE */}
                  {!isEditingName ? (
                    <>
                      <span className={`font-black text-xs md:text-sm text-center truncate w-full ${headingText}`} title={user.username}>
                        {user.username}
                      </span>
                      
                      {/* 🟢 NEW: Conditional rendering for Guests vs Google Users */}
                      {user.email ? (
                        <button 
                          onClick={() => { setIsEditingName(true); setNewUsername(user.username); }} 
                          className="text-[10px] md:text-xs text-blue-500 underline font-bold hover:text-blue-600 mb-1"
                        >
                          Edit Username
                        </button>
                      ) : (
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-bold italic mb-1 text-center leading-tight">
                          Log in to have custom name
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="w-full flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={newUsername} 
                        onChange={e => setNewUsername(e.target.value)} 
                        className={`w-full text-xs font-black p-2 border-[2px] border-black rounded-lg focus:outline-none focus:ring-2 shadow-inner ${inputBg}`} 
                        maxLength={15}
                      />
                      {updateError && <span className="text-[9px] text-red-500 font-bold text-center">{updateError}</span>}
                      <div className="flex gap-2 w-full mt-1">
                        <button onClick={handleSaveUsername} className="flex-1 bg-[#22c55e] text-black text-[10px] font-black py-1.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all uppercase">Save</button>
                        <button onClick={() => { setIsEditingName(false); setUpdateError(''); }} className="flex-1 bg-gray-200 text-black text-[10px] font-black py-1.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all uppercase">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className={`w-full border-t-[2px] my-1 ${divider}`}></div>

                  <button 
                    onClick={() => {
                      logout();
                    }}
                    className="w-full text-[9px] md:text-xs font-black px-3 py-2 bg-[#ef4444] text-white border-[2px] md:border-[3px] border-black rounded-lg hover:-translate-y-0.5 active:translate-y-1 transition-all shadow-[2px_2px_0px_#000] active:shadow-none uppercase"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= MIDDLE AREA (Card Content) ================= */}
      <div className="flex-1 w-full flex items-center justify-center z-10 min-h-0 py-4">
        
        <div className={`border-[4px] md:border-[6px] p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-sm md:max-w-md relative transition-all duration-300 max-h-full overflow-y-auto custom-scrollbar mr-2 md:mr-4 mb-2 md:mb-4 ${cardBg}`}>
          
          {!user ? (
            <div className="flex flex-col items-center justify-center py-2 md:py-4 w-full">
              <h2 className={`text-xl md:text-3xl font-black mb-1 md:mb-2 uppercase italic tracking-tighter text-center ${headingText}`}>Ready to Play?</h2>
              <p className={`font-bold text-[10px] md:text-sm mb-4 md:mb-6 text-center ${pText}`}>Choose how you want to join</p>

              {/* 🟢 Guest Login Form */}
              <form onSubmit={handleGuestLogin} className="w-full space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div>
                  <input
                    type="text"
                    placeholder="ENTER GUEST NAME"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={`w-full px-4 py-3 md:px-6 md:py-4 text-center font-black text-sm md:text-xl rounded-xl md:rounded-2xl border-[3px] md:border-4 focus:outline-none focus:ring-4 transition-all uppercase tracking-widest placeholder:tracking-normal placeholder:text-[10px] md:placeholder:text-sm shadow-inner ${inputBg} ${guestError ? 'border-red-500 focus:ring-red-200' : ''}`}
                    maxLength={15}
                  />
                  {guestError && (
                    <p className="text-red-500 font-bold text-[10px] md:text-xs mt-2 text-center animate-pulse">
                      ⚠️ {guestError}
                    </p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={!guestName.trim()}
                  className={`w-full bg-[#facc15] hover:bg-[#fde047] text-black font-black text-sm md:text-xl py-3 md:py-4 rounded-xl md:rounded-2xl border-b-[4px] md:border-b-[8px] border-r-[2px] md:border-r-[4px] active:border-b-[2px] active:translate-y-1 transition-all shadow-md md:shadow-lg uppercase tracking-tighter italic disabled:opacity-50 disabled:cursor-not-allowed ${actionBtnBorder}`}
                >
                  Play as Guest
                </button>
              </form>

              <div className="flex items-center w-full py-1 md:py-2 mb-4 md:mb-6">
                <div className={`flex-grow border-t-[2px] md:border-t-[3px] ${divider}`}></div>
                <span className={`flex-shrink mx-2 md:mx-4 text-[8px] md:text-xs font-black uppercase tracking-widest ${orText}`}>Or Save Stats</span>
                <div className={`flex-grow border-t-[2px] md:border-t-[3px] ${divider}`}></div>
              </div>

              {/* Google Login */}
              <div className="transform scale-[1.2] md:scale-[1.4] hover:scale-[1.3] md:hover:scale-[1.5] transition-all duration-300 drop-shadow-[3px_3px_0px_#000]">
                <GoogleLogin
                  onSuccess={(res) => login(res.credential)}
                  onError={() => console.log('Login Failed')}
                  theme="filled_blue"
                  shape="pill"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {/* Start New Game */}
              <button 
                onClick={handleCreateRoom}
                className={`w-full bg-[#3b82f6] hover:bg-[#60a5fa] text-white font-black text-sm md:text-xl py-3 md:py-4 rounded-xl md:rounded-2xl border-b-[4px] md:border-b-[8px] border-r-[2px] md:border-r-[4px] active:border-b-[2px] active:translate-y-1 transition-all shadow-md md:shadow-lg uppercase tracking-tighter italic ${actionBtnBorder}`}
              >
                Start New Game
              </button>

              {/* Divider */}
              <div className="flex items-center py-1">
                <div className={`flex-grow border-t-[2px] md:border-t-[3px] ${divider}`}></div>
                <span className={`flex-shrink mx-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest ${orText}`}>Or Join</span>
                <div className={`flex-grow border-t-[2px] md:border-t-[3px] ${divider}`}></div>
              </div>

              {/* Join Existing Room */}
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="ENTER ROOM CODE" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-3 md:py-4 text-center tracking-[0.3em] font-black text-base md:text-xl rounded-xl md:rounded-2xl border-[3px] md:border-4 focus:outline-none focus:ring-4 transition-all placeholder:tracking-normal placeholder:text-[9px] md:placeholder:text-xs shadow-inner ${inputBg}`}
                  maxLength={6}
                />
                <button 
                  type="submit"
                  className={`w-full bg-[#22c55e] hover:bg-[#4ade80] font-black text-sm md:text-xl py-3 md:py-4 rounded-xl md:rounded-2xl border-b-[4px] md:border-b-[8px] border-r-[2px] md:border-r-[4px] active:border-b-[2px] active:translate-y-1 transition-all shadow-md md:shadow-lg uppercase tracking-tighter italic ${actionBtnBorder} ${enterBtnText}`}
                >
                  Enter Room
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= BOTTOM AREA (Footer + Dots) ================= */}
      <div className="w-full shrink-0 flex flex-col items-center justify-end z-20 gap-3 md:gap-4 pb-1">
        
        {/* Blinking Dots */}
        <div className="flex space-x-3 md:space-x-5">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-ping"></div>
          <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-ping delay-75"></div>
          <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full animate-ping delay-150 ${thirdDot}`}></div>
        </div>

        {/* Dynamic Footer Component */}
        <Footer />
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 6s ease-in-out infinite;
        }
        
        /* Subtle scrollbar just in case a mobile screen is incredibly tiny */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#000' : '#1E293B'}; 
          border-radius: 8px; 
        }
      `}</style>
    </div>
  );
}