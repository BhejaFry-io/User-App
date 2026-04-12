import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { createRoom, joinRoom } from '../api/services';
import { AuthContext } from '../context/AuthContext';

export default function Lobby() {
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();
  const { user, login, logout } = useContext(AuthContext);

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

  return (
    // Gaming Blue Background with a subtle Dot Grid Pattern
    <div className="min-h-screen bg-[#e0f2fe] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" 
         style={{ backgroundImage: 'radial-gradient(#bae6fd 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
      
      {/* --- 3D GAME STICKERS (Realistic Floating Assets) --- */}
      <div className="absolute top-[10%] left-[5%] text-[120px] md:text-[180px] select-none pointer-events-none opacity-90 animate-bounce-slow filter drop-shadow-[5px_5px_0px_#fff] drop-shadow-[15px_15px_20px_rgba(0,0,0,0.15)]">
        🎮
      </div>
      <div className="absolute bottom-[10%] right-[5%] text-[100px] md:text-[150px] rotate-12 select-none pointer-events-none opacity-90 filter drop-shadow-[5px_5px_0px_#fff] drop-shadow-[15px_15px_20px_rgba(0,0,0,0.15)]">
        🏆
      </div>
      <div className="absolute top-[15%] right-[10%] text-[80px] md:text-[120px] -rotate-12 select-none pointer-events-none opacity-80 filter drop-shadow-[4px_4px_0px_#fff] drop-shadow-[10px_10px_15px_rgba(0,0,0,0.1)]">
        💡
      </div>
      <div className="absolute bottom-[15%] left-[10%] text-[70px] md:text-[100px] rotate-45 select-none pointer-events-none opacity-80 filter drop-shadow-[4px_4px_0px_#fff] drop-shadow-[10px_10px_15px_rgba(0,0,0,0.1)]">
        ⭐
      </div>

      {/* Title Section */}
      <div className="text-center z-10 mb-10">
        <h1 className="text-7xl md:text-9xl font-black text-[#1e293b] tracking-tighter drop-shadow-[6px_6px_0px_#fff] italic">
          BhejaFry
        </h1>
        <div className="bg-[#facc15] border-[4px] border-slate-900 px-6 py-2 rounded-xl shadow-[4px_4px_0px_#000] inline-block -rotate-2 transform hover:rotate-0 transition-transform cursor-default">
          <p className="text-slate-900 font-black text-xs md:text-sm tracking-widest uppercase">
            The Ultimate Desi Brain Tickler
          </p>
        </div>
      </div>
      
      {/* Main Interface Card */}
      <div className="bg-white border-[6px] border-slate-900 p-8 md:p-10 rounded-[3rem] shadow-[20px_20px_0px_0px_#1e293b] w-full max-w-lg z-10 relative">
        
        {!user ? (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">Ready to Play?</h2>
            <p className="text-slate-500 font-bold text-sm mb-12">Login to start frying those brains</p>
            
            {/* ENLARGED LOGIN BUTTON */}
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
            <div className="flex items-center justify-between p-5 bg-[#f1f5f9] rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_#334155]">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl border-4 border-slate-900 shadow-sm object-cover" />
                  <div className="absolute -top-2 -left-2 bg-green-500 border-2 border-slate-900 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-[2px_2px_0px_#000]">Online</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase">Champion</span>
                  <span className="text-slate-900 font-black text-xl leading-tight tracking-tight">{user.username}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="text-[10px] font-black px-4 py-2 bg-[#ef4444] text-white border-4 border-slate-900 rounded-xl hover:translate-y-1 active:translate-y-2 transition-all shadow-[4px_4px_0px_0px_#000] active:shadow-none"
              >
                EXIT
              </button>
            </div>

            {/* Menu Options */}
            <div className="space-y-5">
              <button 
                onClick={handleCreateRoom}
                className="w-full bg-[#3b82f6] hover:bg-[#60a5fa] text-white font-black text-2xl py-6 rounded-3xl border-b-[12px] border-r-[4px] border-slate-900 active:border-b-4 active:translate-y-2 transition-all shadow-xl uppercase tracking-tighter italic"
              >
                Start New Game
              </button>

              <div className="flex items-center py-2">
                <div className="flex-grow border-t-4 border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-xs font-black uppercase tracking-widest">Or Join</span>
                <div className="flex-grow border-t-4 border-slate-100"></div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-5">
                <input 
                  type="text" 
                  placeholder="ENTER ROOM CODE" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-6 py-5 bg-[#f8fafc] text-slate-900 text-center tracking-[0.5em] font-black text-3xl rounded-3xl border-4 border-slate-900 focus:outline-none focus:ring-8 focus:ring-blue-100 transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm shadow-inner"
                  maxLength={6}
                />
                <button 
                  type="submit"
                  className="w-full bg-[#22c55e] hover:bg-[#4ade80] text-slate-900 font-black text-2xl py-6 rounded-3xl border-b-[12px] border-r-[4px] border-slate-900 active:border-b-4 active:translate-y-2 transition-all shadow-xl uppercase tracking-tighter italic"
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
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping delay-150"></div>
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