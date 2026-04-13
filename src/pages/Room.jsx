
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRoomParticipants, getRoomDetails, leaveRoom, 
  updateRoomCategories, getCategories, updateRoomSettings, startGame
} from '../api/services';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const { socket } = useContext(SocketContext);
  
  // Layout & Lobby State
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(true);
  const [settings, setSettings] = useState({ maxScore: 100, timePerRound: 15 });
  const [roomDetails, setRoomDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [allCategories, setAllCategories] = useState([]); 
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

  // Game State
  const [roundState, setRoundState] = useState('IDLE'); 
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState([]);
  const [winnerInfo, setWinnerInfo] = useState(null);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const isHost = user?.id && roomDetails?.hostUserId && user.id === roomDetails.hostUserId;

  const currentCategoryIds = roomDetails?.categories?.map(c => c.categoryId) || [];
  const unselectedCategories = allCategories.filter(cat => !currentCategoryIds.includes(cat.id));

  // NEW NEUBRUTALIST TEXTURE: Blue-tinted gradient with a grid overlay
  const panelTexture = "bg-gradient-to-br from-[#F8FAFC] to-[#D1EAFF] relative before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] before:opacity-[0.03] before:pointer-events-none";

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

  useEffect(() => {
    let timer;
    if (roundState === 'ACTIVE' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [roundState, timeLeft]);

  useEffect(() => {
    if (roundState === 'ACTIVE' && !hasGuessed) {
      setTimeout(() => { inputRef.current?.focus(); }, 50);
    }
  }, [roundState, hasGuessed]);

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join_game_room', { roomId });

    const fetchFreshParticipants = async () => {
      try {
        const res = await getRoomParticipants(roomId);
        if (res.success) {
          setParticipants(prev => {
            const localStateMap = new Map(prev.map(p => [p.user.id, { justGuessed: p.justGuessed, timeTaken: p.timeTaken }]));
            return res.data.map(newP => {
              const localState = localStateMap.get(newP.user.id) || {};
              return { ...newP, ...localState };
            });
          });
        }
      } catch (e) {}
    };

    socket.on('room_settings_updated', (data) => { if (data.settings) setSettings(data.settings); });
    socket.on('room_categories_updated', (data) => setRoomDetails(prev => ({...prev, categories: data.categories})));
    socket.on('game_started', (data) => {
      setRoomDetails(prev => ({ ...prev, status: data.status }));
      if (data.settings) setSettings(data.settings);
    });
    socket.on('round_started', (data) => {
      setRoundState('ACTIVE');
      setCurrentPrompt(data);
      setTimeLeft(data.duration);
      setHasGuessed(false);
      setRevealedAnswers([]);
      setParticipants(prev => prev.map(p => ({ ...p, justGuessed: false, timeTaken: null })));
    });
    socket.on('round_ended', (data) => {
      setRoundState('ENDED');
      setTimeLeft(0);
      setRevealedAnswers(data.correctAnswers);
    });
    socket.on('player_guessed_correctly', (data) => {
      setParticipants(prev => prev.map(p => 
        p.user.id === data.userId ? { ...p, score: data.newTotalScore, justGuessed: true, timeTaken: data.timeTaken } : p
      ));
      setChatLog(log => [...log, { system: true, text: `🌟 ${data.username} Correct! (+${data.pointsEarned} pts)` }]);
    });
    socket.on('player_left', (data) => { setParticipants(prev => prev.filter(p => p.user.id !== data.userId)); });
    socket.on('host_updated', (data) => {
      setRoomDetails(prev => ({ ...prev, hostUserId: data.newHostId }));
      setChatLog(log => [...log, { system: true, text: `👑 NEW HOST ASSIGNED!` }]);
    });
    socket.on('guess_result', (data) => { if (data.success) { setHasGuessed(true); setGuessInput(''); } });
    socket.on('chat_message', (data) => { setChatLog(log => [...log, { userId: data.userId, username: data.username, text: data.text }]); });
    socket.on('game_over', (data) => {
      setRoundState('GAME_OVER');
      setRoomDetails(prev => ({...prev, status: 'FINISHED'}));
      setWinnerInfo(data);
    });
    socket.on('game_restarted', () => {
      setRoundState('IDLE');
      setRoomDetails(prev => ({ ...prev, status: 'WAITING' }));
      setChatLog([]);
      setWinnerInfo(null);
      setParticipants(prev => prev.map(p => ({ ...p, score: 0, justGuessed: false, timeTaken: null })));
    });
    socket.on('player_connected', fetchFreshParticipants); 

    return () => { socket.off(); };
  }, [socket, roomId]);

  useEffect(() => {
    getCategories().then(res => { if (res.success) setAllCategories(res.data); });
    getRoomDetails(roomId).then(res => {
      if (res.success) {
        setRoomDetails(res.data);
        if (res.data.settingsJson) setSettings(res.data.settingsJson);
      }
    }).catch(() => navigate('/'));
    getRoomParticipants(roomId).then(res => { if (res.success) setParticipants(res.data); });
  }, [roomId, navigate]);

  const handleLeave = async () => { try { await leaveRoom(roomId); navigate('/'); } catch (e) {} };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomDetails.inviteCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const handleAddCategory = async (id) => {
    setIsUpdating(true);
    try { 
      const res = await updateRoomCategories(roomId, [...currentCategoryIds, id]); 
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } finally { setIsUpdating(false); setIsDropdownOpen(false); }
  };
  const handleRemoveCategory = async (id) => {
    setIsUpdating(true);
    try { 
      const res = await updateRoomCategories(roomId, currentCategoryIds.filter(catId => catId !== id)); 
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } finally { setIsUpdating(false); }
  };

  // ADD THIS NEW FUNCTION TO SELECT ALL CATEGORY 
  const handleAddAllCategories = async () => {
    setIsUpdating(true);
    try { 
      const allCategoryIds = allCategories.map(cat => cat.id);
      const res = await updateRoomCategories(roomId, allCategoryIds);
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } finally { 
      setIsUpdating(false); 
      setIsDropdownOpen(false); 
    }
  };

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try { await updateRoomSettings(roomId, settings); } finally { setIsUpdating(false); }
  };
  const handleStartGame = async () => {
    try { await startGame(roomId); socket.emit('request_next_round', { roomId }); } catch (error) { alert('Failed to start'); }
  };
  const submitGuess = (e) => {
    e.preventDefault();
    if (!guessInput.trim() || hasGuessed || roundState !== 'ACTIVE') return;
    socket.emit('submit_guess', { roomId, guess: guessInput.trim() });
    setGuessInput(''); 
  };

  return (
    <div className="min-h-screen bg-[#E0F2FE] text-[#1E293B] p-3 md:p-5 flex flex-col font-sans selection:bg-[#FDE047] overflow-hidden relative">
      {/* Background Dots */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#1E293B 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

      {/* HEADER */}
      <div className="max-w-[1400px] w-full mx-auto flex justify-between items-center bg-white border-[2.5px] border-[#1E293B] p-3 rounded-2xl shadow-[4px_4px_0px_#1E293B] mb-5 relative z-20">
        <div className="flex items-center gap-4">
          <div className="bg-[#FDE047] border-[2.5px] border-[#1E293B] px-3 py-1 rounded-lg -rotate-1 shadow-[2px_2px_0px_#1E293B]">
            <h1 className="text-xl font-black italic tracking-tighter text-[#1E293B] uppercase leading-none">BhejaFry</h1>
          </div>
          {roomDetails?.inviteCode && (
            <div className="hidden sm:flex items-center gap-2 bg-[#F1F5F9] px-3 py-1.5 rounded-xl border-[1.5px] border-[#1E293B]">
              <span className="text-[10px] font-black uppercase text-slate-500">CODE:</span>
              <span className="font-mono text-sm font-bold text-[#2563EB] tracking-widest">{roomDetails.inviteCode}</span>
              <button onClick={copyToClipboard} className="text-[10px] font-black bg-white border border-[#1E293B] px-2 py-0.5 rounded shadow-[1px_1px_0px_#1E293B]">
                {copied ? '✅' : 'COPY'}
              </button>
            </div>
          )}
        </div>
        <button onClick={() => setIsLeftPaneOpen(!isLeftPaneOpen)} className="bg-white border-[2px] border-[#1E293B] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-[3px_3px_0px_#1E293B] hover:translate-y-0.5 active:shadow-none transition-all">
          {isLeftPaneOpen ? 'Close Menu' : 'Open Menu'}
        </button>
      </div>

      <div className={`max-w-[1400px] w-full mx-auto grid grid-cols-1 ${isLeftPaneOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5 flex-grow overflow-hidden relative z-10`}>
        
        {/* PANEL 1: CONFIG */}
        {isLeftPaneOpen && (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <div className={`border-[2.5px] border-[#1E293B] rounded-3xl p-5 shadow-[6px_6px_0px_#1E293B] flex flex-col h-full overflow-hidden ${panelTexture}`}>
              <h3 className="text-[10px] font-black uppercase text-[#1E293B]/60 mb-4 tracking-widest italic underline decoration-[#FDE047] decoration-2">Config Panel</h3>
              
              <div className="space-y-5 flex-grow relative z-10">
                <div>
                  <span className="block text-[10px] font-black uppercase text-[#1E293B] mb-2">Topics:</span>
                  <div className="flex flex-wrap gap-2">
                    {roomDetails?.categories?.map(c => (
                      <div key={c.categoryId} className="flex items-center bg-[#FDE047] border border-[#1E293B] text-[#1E293B] px-2.5 py-1 rounded-lg text-xs font-bold shadow-[2px_2px_0px_#1E293B]">
                        {c.category?.name}
                        {isHost && roomDetails?.status !== 'PLAYING' && (
                          <button onClick={() => handleRemoveCategory(c.categoryId)} className="ml-2 hover:text-red-500">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isHost && roomDetails?.status !== 'PLAYING' && (
                  <div className="space-y-3 pt-4 border-t-2 border-dashed border-[#1E293B]/20">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-white border-2 border-[#1E293B] px-3 py-2 rounded-xl flex items-center justify-between text-[10px] font-black uppercase shadow-[3px_3px_0px_#1E293B]">
                      <span>Add Topic</span>
                      <span>{isDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="bg-white border-2 border-[#1E293B] rounded-xl overflow-hidden shadow-xl max-h-32 overflow-y-auto relative z-20">

                        {unselectedCategories.length > 1 && (
                          <button 
                            onClick={handleAddAllCategories} 
                            className="w-full text-left px-4 py-2 hover:bg-[#FDE047] border-b-2 border-[#1E293B] font-black text-xs uppercase italic text-[#2563EB] bg-slate-50"
                          >
                            ⚡ SELECT ALL CATEGORIES
                          </button>
                        )}

                        {unselectedCategories.map(cat => (
                          <button key={cat.id} onClick={() => handleAddCategory(cat.id)} className="w-full text-left px-4 py-2 hover:bg-[#FDE047] border-b border-slate-100 font-bold text-xs uppercase italic">
                            + {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="bg-[#1E293B]/5 p-4 rounded-2xl border-2 border-[#1E293B] space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-[#1E293B]/70 tracking-tighter">Target Pts</label>
                        <input type="number" value={settings.maxScore} onChange={(e) => setSettings({...settings, maxScore: parseInt(e.target.value) || 0})} className="w-16 bg-white border-2 border-[#1E293B] rounded-lg text-center font-black text-sm py-1 shadow-[2px_2px_0px_#1E293B] outline-none" />
                      </div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-[#1E293B]/70 tracking-tighter">Round Time</label>
                        <input type="number" value={settings.timePerRound} onChange={(e) => setSettings({...settings, timePerRound: parseInt(e.target.value) || 0})} className="w-16 bg-white border-2 border-[#1E293B] rounded-lg text-center font-black text-sm py-1 shadow-[2px_2px_0px_#1E293B] outline-none" />
                      </div>
                      <button onClick={handleSaveSettings} disabled={isUpdating} className="w-full bg-[#2563EB] text-white text-[11px] font-black py-3 rounded-xl uppercase shadow-[4px_4px_0px_#1E293B] active:translate-y-1 active:shadow-none transition-all">
                        Sync System
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: GAME WINDOW */}
        <div className={`lg:col-span-2 flex flex-col h-full border-[3px] border-[#1E293B] rounded-[2rem] overflow-hidden relative shadow-[10px_10px_0px_#1E293B] ${panelTexture}`}>
          {roomDetails?.status === 'WAITING' ? (
            <div className="flex flex-col items-center justify-center flex-grow p-8 text-center relative z-10">
              <div className="w-24 h-24 mb-6 border-[6px] border-[#F1F5F9] border-t-[#2563EB] rounded-full animate-spin shadow-[4px_4px_0px_#1E293B]" />
              <h2 className="text-4xl font-black italic text-[#1E293B] mb-2 uppercase tracking-tighter">READY?</h2>
              <p className="text-[#2563EB] font-black text-xs mb-8 uppercase tracking-[0.2em] animate-pulse">Waiting for host command...</p>
              {isHost && (
                <button onClick={handleStartGame} disabled={!roomDetails?.categories?.length} className="bg-[#22C55E] border-[4px] border-[#1E293B] text-white text-lg font-black py-5 px-14 rounded-full uppercase shadow-[6px_6px_0px_#1E293B] hover:translate-y-1 hover:shadow-none transition-all disabled:bg-slate-300">
                  START GAME
                </button>
              )}
            </div>
          ) : roundState === 'GAME_OVER' ? (
            <div className="flex flex-col items-center justify-center flex-grow p-8 text-center bg-[#FDE047] relative z-10">
              <h1 className="text-5xl mb-6 drop-shadow-[4px_4px_0px_#1E293B]">🏆</h1>
              <h2 className="text-4xl font-black uppercase italic text-[#1E293B] tracking-tighter mb-2">{winnerInfo?.winnerName}</h2>
              <p className="text-[#1E293B] font-black text-sm uppercase tracking-[0.4em] mb-12 italic underline underline-offset-8 decoration-4">BHEJA FRY CHAMPION</p>
              {isHost && (
                <button onClick={() => socket.emit('restart_game', { roomId })} className="bg-white border-[4px] border-[#1E293B] text-[#1E293B] text-lg font-black py-5 px-14 rounded-full uppercase shadow-[6px_6px_0px_#1E293B] transition-all active:translate-y-1">
                  PLAY AGAIN
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="w-full bg-[#1E293B]/10 h-6 relative border-b-[3px] border-[#1E293B]">
                <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-[#EF4444]' : 'bg-[#2563EB]'}`} style={{ width: `${currentPrompt ? (timeLeft / currentPrompt.duration) * 100 : 0}%` }} />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="absolute top-6 right-8 bg-[#FDE047] border-[3px] border-[#1E293B] px-6 py-2 rounded-2xl font-black text-3xl italic shadow-[4px_4px_0px_#1E293B]">
                  {timeLeft}s
                </div>

                <div className="max-w-lg w-full flex flex-col items-center justify-center gap-8 text-center">

                  {roundState === 'ACTIVE' && currentPrompt && (
  <div className="animate-fadeIn flex flex-col items-center gap-6">
    
    {/* 1. ALWAYS SHOW THE QUESTION TEXT IF IT EXISTS */}
    {currentPrompt.textContent && (
      <p className="text-2xl md:text-3xl font-black text-[#2563EB] uppercase tracking-tighter leading-none italic px-4">
        {currentPrompt.textContent}
      </p>
    )}

    {/* 2. SHOW THE IMAGE IF TYPE IS IMAGE */}
    {currentPrompt.type === 'IMAGE' && currentPrompt.mediaUrl && (
      <img 
        src={currentPrompt.mediaUrl} 
        alt="Trivia" 
        className="max-h-[280px] rounded-[2rem] border-[6px] border-[#1E293B] shadow-[10px_10px_0px_#1E293B] object-contain" 
      />
    )}

    {/* 3. SHOW AUDIO PLAYER IF TYPE IS MUSIC (If you added this category) */}
    {currentPrompt.type === 'MUSIC' && currentPrompt.mediaUrl && (
      <div className="bg-[#FDE047] p-4 rounded-2xl border-[4px] border-[#1E293B] shadow-[6px_6px_0px_#1E293B]">
        <audio controls autoPlay src={currentPrompt.mediaUrl} className="outline-none">
          Your browser does not support the audio element.
        </audio>
      </div>
    )}

    {/* 4. SHOW QUOTE STYLING ONLY IF NO MEDIA */}
    {currentPrompt.type === 'QUOTE' && (
      <p className="text-3xl md:text-4xl font-black italic text-[#1E293B] leading-tight px-4 mt-4">
        "{currentPrompt.textContent}"
      </p>
    )}

  </div>
)}
                  {roundState === 'ENDED' && (
                    <div className="animate-bounce-slow">
                      <span className="text-xl font-black text-red-500 uppercase mb-6 block tracking-widest italic underline decoration-8">ROUND OVER!</span>
                      <div className="flex flex-wrap justify-center gap-4">
                        {revealedAnswers.map((ans, idx) => (
                          <span key={idx} className="bg-[#22C55E] border-[4px] border-[#1E293B] text-white px-10 py-4 rounded-3xl font-black uppercase text-3xl shadow-[6px_6px_0px_#1E293B] italic tracking-tighter">{ans}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-40 overflow-y-auto px-8 py-4 space-y-3 bg-white/40 backdrop-blur-md border-t-[3px] border-[#1E293B] custom-scrollbar">
                {chatLog.map((msg, index) => (
                  <div key={index} className={`flex ${msg.system ? 'justify-center' : 'justify-start'}`}>
                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black border-2 border-[#1E293B] ${msg.system ? 'bg-[#FDE047] uppercase italic tracking-tighter' : 'bg-white shadow-[3px_3px_0px_#1E293B]'}`}>
                      {!msg.system && <span className="text-[#2563EB] mr-2 underline decoration-[#FDE047]">{msg.username} &gt;</span>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={submitGuess} className="p-6 bg-[#F1F5F9] border-t-[3px] border-[#1E293B] flex gap-4">
                <input ref={inputRef} type="text" value={guessInput} onChange={(e) => setGuessInput(e.target.value)} disabled={hasGuessed || roundState !== 'ACTIVE'} placeholder={hasGuessed ? "NAILED IT! WAIT..." : "TYPE YOUR GUESS..."} className="flex-grow bg-white border-[3px] border-[#1E293B] text-[#1E293B] rounded-2xl px-6 py-4 focus:bg-[#FDE047] transition-all font-black uppercase text-lg tracking-widest shadow-inner outline-none" autoComplete="off" />
                <button type="submit" disabled={hasGuessed || roundState !== 'ACTIVE'} className="bg-[#2563EB] border-[4px] border-[#1E293B] text-white font-black px-10 rounded-2xl uppercase shadow-[6px_6px_0px_#1E293B] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">SEND</button>
              </form>
            </>
          )}
        </div>

        {/* PANEL 3: LEADERBOARD */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <button onClick={handleLeave} className="bg-white border-[3px] border-[#EF4444] text-[#EF4444] py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-[6px_6px_0px_#EF4444] active:translate-y-1 transition-all">EXIT ROOM</button>

          <div className={`border-[3px] border-[#1E293B] rounded-[2rem] flex-grow flex flex-col overflow-hidden shadow-[8px_8px_0px_#1E293B] ${panelTexture}`}>
            <div className="p-6 border-b-[3px] border-[#1E293B] bg-white/30 backdrop-blur-sm flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-[#1E293B] italic tracking-tighter">Players</h3>
              <span className="font-black text-[#2563EB] bg-[#FDE047] border-2 border-[#1E293B] px-4 py-1 rounded-full text-[10px] shadow-[2px_2px_0px_#1E293B]">GOAL: {settings?.maxScore}</span>
            </div>
            
            <ul className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar relative z-10">
              {[...participants].sort((a, b) => b.score - a.score).map((p, index) => (
                <li key={p.user.id} className={`p-4 rounded-2xl border-[3px] border-[#1E293B] transition-all duration-300 ${p.justGuessed ? 'bg-[#FDE047] -rotate-1 scale-105 shadow-[6px_6px_0px_#1E293B]' : 'bg-white/70 shadow-[4px_4px_0px_#1E293B]'}`}>
                  <div className="flex items-center gap-4">
                    <div className="font-black text-xl text-[#1E293B] w-8 italic tracking-tighter">0{index + 1}</div>
                    <img src={p.user.avatarUrl || 'https://via.placeholder.com/40'} alt="avatar" className="w-12 h-12 rounded-xl border-2 border-[#1E293B] object-cover" />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase text-[#1E293B] truncate tracking-tight">{p.user.username} {p.user.id === roomDetails?.hostUserId && '👑'}</span>
                        <span className="text-2xl font-black text-[#2563EB] italic leading-none">{p.score}</span>
                      </div>
                      {p.justGuessed && <div className="text-[9px] font-black text-green-600 uppercase mt-1 animate-pulse tracking-tighter">+ CORRECT! {p.timeTaken && `(${p.timeTaken}s)`}</div>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; border: 2px solid #E0F2FE; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-bounce-slow { animation: bounceSlow 2.2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}