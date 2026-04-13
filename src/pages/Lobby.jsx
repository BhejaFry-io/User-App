import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { createRoom, joinRoom } from '../api/services';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext'; // <-- Import Theme Context

export default function Lobby() {
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();
  const { user, login, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

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
      alert("Invalid Invite Code or Room already started");
    }
  };

  // --- THEME VARIABLES ---
  const bgClass = isDarkMode ? "bg-[#0f172a]" : "bg-[#e0f2fe]";
  const dotPattern = isDarkMode ? "radial-gradient(#334155 2px, transparent 2px)" : "radial-gradient(#bae6fd 2px, transparent 2px)";
  const emojiShadow1 = isDarkMode ? "drop-shadow-[15px_15px_20px_rgba(0,0,0,0.5)]" : "drop-shadow-[15px_15px_20px_rgba(0,0,0,0.15)]";
  const emojiShadow2 = isDarkMode ? "drop-shadow-[10px_10px_15px_rgba(0,0,0,0.4)]" : "drop-shadow-[10px_10px_15px_rgba(0,0,0,0.1)]";
  const titleText = isDarkMode ? "text-white drop-shadow-[6px_6px_0px_#ef4444]" : "text-[#1e293b] drop-shadow-[6px_6px_0px_#fff]";
  const subtitleBorder = isDarkMode ? "border-black text-black" : "border-slate-900 text-slate-900";
  const cardBg = isDarkMode ? "bg-[#1e293b] border-black shadow-[20px_20px_0px_0px_#000]" : "bg-white border-slate-900 shadow-[20px_20px_0px_0px_#1e293b]";
  const headingText = isDarkMode ? "text-white" : "text-slate-900";
  const pText = isDarkMode ? "text-slate-400" : "text-slate-500";
  const profileBg = isDarkMode ? "bg-[#0f172a] border-black shadow-[8px_8px_0px_0px_#000]" : "bg-[#f1f5f9] border-slate-900 shadow-[8px_8px_0px_0px_#334155]";
  const avatarBorder = isDarkMode ? "border-black" : "border-slate-900";
  const exitBtnBorder = isDarkMode ? "border-black shadow-[4px_4px_0px_0px_#000]" : "border-slate-900 shadow-[4px_4px_0px_0px_#000]";
  const actionBtnBorder = isDarkMode ? "border-black" : "border-slate-900";
  const divider = isDarkMode ? "border-slate-700" : "border-slate-100";
  const orText = isDarkMode ? "text-slate-500" : "text-slate-300";
  const inputBg = isDarkMode ? "bg-[#0f172a] text-white border-black focus:ring-slate-700 placeholder:text-slate-600" : "bg-[#f8fafc] text-slate-900 border-slate-900 focus:ring-blue-100 placeholder:text-slate-300";
  const enterBtnText = isDarkMode ? "text-black" : "text-slate-900";
  const thirdDot = isDarkMode ? "bg-[#facc15]" : "bg-yellow-500";

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500`} 
         style={{ backgroundImage: dotPattern, backgroundSize: '30px 30px' }}>
      
      {/* THEME TOGGLE BUTTON */}
      <button 
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-50 text-2xl p-3 rounded-full border-[4px] hover:-translate-y-1 active:translate-y-1 transition-all flex items-center justify-center ${isDarkMode ? 'bg-[#1e293b] border-black shadow-[4px_4px_0px_#000] active:shadow-none' : 'bg-white border-slate-900 shadow-[4px_4px_0px_#1e293b] active:shadow-none'}`}
      >
        {isDarkMode ? '🌙' : '☀️'}
      </button>

      {/* --- 3D GAME STICKERS --- */}
      <div className={`absolute top-[10%] left-[5%] text-[120px] md:text-[180px] select-none pointer-events-none opacity-90 animate-bounce-slow filter drop-shadow-[5px_5px_0px_#fff] ${emojiShadow1}`}>
        🎮
      </div>
      <div className={`absolute bottom-[10%] right-[5%] text-[100px] md:text-[150px] rotate-12 select-none pointer-events-none opacity-90 filter drop-shadow-[5px_5px_0px_#fff] ${emojiShadow1}`}>
        🏆
      </div>
      <div className={`absolute top-[15%] right-[10%] text-[80px] md:text-[120px] -rotate-12 select-none pointer-events-none opacity-80 filter drop-shadow-[4px_4px_0px_#fff] ${emojiShadow2}`}>
        💡
      </div>
      <div className={`absolute bottom-[15%] left-[10%] text-[70px] md:text-[100px] rotate-45 select-none pointer-events-none opacity-80 filter drop-shadow-[4px_4px_0px_#fff] ${emojiShadow2}`}>
        ⭐
      </div>

      {/* Title Section */}
      <div className="text-center z-10 mb-10 mt-8">
        <h1 className={`text-7xl md:text-9xl font-black tracking-tighter italic transition-colors ${titleText}`}>
          BhejaFry
        </h1>
        <div className={`bg-[#facc15] border-[4px] px-6 py-2 rounded-xl shadow-[4px_4px_0px_#000] inline-block -rotate-2 transform hover:rotate-0 transition-all cursor-default mt-2 ${subtitleBorder}`}>
          <p className="font-black text-xs md:text-sm tracking-widest uppercase">
            The Ultimate Desi Brain Tickler
          </p>
        </div>
      </div>
      
      {/* Main Interface Card */}
      <div className={`border-[6px] p-8 md:p-10 rounded-[3rem] w-full max-w-lg z-10 relative transition-all duration-300 ${cardBg}`}>
        
        {!user ? (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className={`text-3xl font-black mb-2 uppercase italic tracking-tighter ${headingText}`}>Ready to Play?</h2>
            <p className={`font-bold text-sm mb-12 ${pText}`}>Login to start frying those brains</p>
            
            <div className="transform scale-[1.7] hover:scale-[1.8] transition-all duration-300 drop-shadow-[4px_4px_0px_#000]">
              <GoogleLogin
                onSuccess={(res) => login(res.credential)}
                onError={() => console.log('Login Failed')}
                theme="filled_blue"
                shape="pill"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Player Profile Dashboard */}
            <div className={`flex items-center justify-between p-5 rounded-3xl border-4 transition-all ${profileBg}`}>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img src={user.avatarUrl} alt="Avatar" className={`w-16 h-16 rounded-2xl border-4 shadow-sm object-cover ${avatarBorder}`} />
                  <div className={`absolute -top-2 -left-2 bg-green-500 border-2 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-[2px_2px_0px_#000] ${avatarBorder}`}>Online</div>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase ${pText}`}>Champion</span>
                  <span className={`font-black text-xl leading-tight tracking-tight ${headingText}`}>{user.username}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className={`text-[10px] font-black px-4 py-2 bg-[#ef4444] text-white border-4 rounded-xl hover:translate-y-1 active:translate-y-2 transition-all active:shadow-none ${exitBtnBorder}`}
              >
                EXIT
              </button>
            </div>

            {/* Menu Options */}
            <div className="space-y-5">
              <button 
                onClick={handleCreateRoom}
                className={`w-full bg-[#3b82f6] hover:bg-[#60a5fa] text-white font-black text-2xl py-6 rounded-3xl border-b-[12px] border-r-[4px] active:border-b-4 active:translate-y-2 transition-all shadow-xl uppercase tracking-tighter italic ${actionBtnBorder}`}
              >
                Start New Game
              </button>

              <div className="flex items-center py-2">
                <div className={`flex-grow border-t-4 ${divider}`}></div>
                <span className={`flex-shrink mx-4 text-xs font-black uppercase tracking-widest ${orText}`}>Or Join</span>
                <div className={`flex-grow border-t-4 ${divider}`}></div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-5">
                <input 
                  type="text" 
                  placeholder="ENTER ROOM CODE" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`w-full px-6 py-5 text-center tracking-[0.5em] font-black text-3xl rounded-3xl border-4 focus:outline-none focus:ring-8 transition-all placeholder:tracking-normal placeholder:text-sm shadow-inner ${inputBg}`}
                  maxLength={6}
                />
                <button 
                  type="submit"
                  className={`w-full bg-[#22c55e] hover:bg-[#4ade80] font-black text-2xl py-6 rounded-3xl border-b-[12px] border-r-[4px] active:border-b-4 active:translate-y-2 transition-all shadow-xl uppercase tracking-tighter italic ${actionBtnBorder} ${enterBtnText}`}
                >
                  Enter Room
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Floating UI Hints */}
      <div className="mt-12 z-10 flex space-x-6">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping delay-75"></div>
        <div className={`w-3 h-3 rounded-full animate-ping delay-150 ${thirdDot}`}></div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}