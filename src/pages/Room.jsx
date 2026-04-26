import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRoomParticipants, getRoomDetails, leaveRoom, 
  updateRoomCategories, getCategories, updateRoomSettings, startGame
} from '../api/services';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext'; 

// ==========================================
// --- CUSTOM CONFETTI COMPONENT ---
// ==========================================
const ConfettiBlast = () => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400', 'bg-pink-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-400'];
  const shapes = ['rounded-full', 'rounded-sm', '']; 

  const generateParticles = (side) => {
    return [...Array(60)].map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = Math.random() > 0.5 ? 'w-2 h-2 md:w-3 md:h-3' : 'w-2 h-3 md:w-3 md:h-4';

      // 'left' shoots positive X (rightwards), 'right' shoots negative X (leftwards)
      const directionMult = side === 'left' ? 1 : -1;
      const tx = (10 + Math.random() * 80) * directionMult; 
      const ty = -40 - Math.random() * 60; // Shoot upwards
      const rot = Math.random() * 720;     
      const delay = Math.random() * 0.15;  
      const duration = 2.5 + Math.random() * 1.5; 

      const positionClass = side === 'left' ? 'bottom-0 left-[-20px]' : 'bottom-0 right-[-20px]';

      return (
        <div
          key={`${side}-${i}`}
          className={`absolute ${positionClass} ${size} ${color} ${shape}`}
          style={{
            animation: `confetti-blast ${duration}s cubic-bezier(.25,.46,.45,.94) ${delay}s forwards`,
            opacity: 0,
            '--tx': `${tx}vw`,
            '--ty': `${ty}vh`,
            '--rot': `${rot}deg`,
          }}
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Trigger both sides simultaneously */}
      {generateParticles('left')}
      {generateParticles('right')}
    </div>
  );
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const { socket } = useContext(SocketContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext); 
  
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
  
  // Visual FX & SPA State
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimer = useRef(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const isRefreshing = useRef(false);
  const isIntentionalExit = useRef(false); // 🟢 TRACKS INTENTIONAL EXITS

  // --- SOUND EFFECTS ---
  const correctSound = useRef(new Audio('/correct.mp3'));
  const wrongSound = useRef(new Audio('/wrong.mp3'));
  const wrongSoundTimer = useRef(null); 

  useEffect(() => {
    correctSound.current.type = 'audio/mpeg';
    wrongSound.current.type = 'audio/mpeg';
    correctSound.current.load();
    wrongSound.current.load();

    return () => {
      if (wrongSoundTimer.current) clearTimeout(wrongSoundTimer.current);
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    };
  }, []);

  const isHost = user?.id && roomDetails?.hostUserId && user.id === roomDetails.hostUserId;
  const currentCategoryIds = roomDetails?.categories?.map(c => c.categoryId) || [];
  const unselectedCategories = allCategories.filter(cat => !currentCategoryIds.includes(cat.id));

  // ==========================================
  // --- ROBUST THEME VARIABLES ---
  // ==========================================
  
  const bgClass = isDarkMode ? "bg-[#0f172a] text-white selection:bg-[#facc15] selection:text-black" : "bg-[#E0F2FE] text-[#1E293B] selection:bg-[#FDE047]";
  const dotPattern = isDarkMode ? "radial-gradient(#334155 2px, transparent 0)" : "radial-gradient(#1E293B 1px, transparent 0)";
  const dotOpacity = isDarkMode ? "opacity-40" : "opacity-20";
  
  const bColor = isDarkMode ? "border-black" : "border-[#1E293B]";
  const shadowColor = isDarkMode ? "#000" : "#1E293B";

  const headerBg = isDarkMode ? "bg-[#1e293b]" : "bg-white";
  const titleBadge = isDarkMode ? "bg-[#facc15] text-black drop-shadow-[1px_1px_0px_#fff]" : "bg-[#FDE047] text-[#1E293B]";
  const codeBadge = isDarkMode ? "bg-[#0f172a]" : "bg-[#F1F5F9]";
  const codeLabel = isDarkMode ? "text-slate-400" : "text-slate-500";
  const codeValue = isDarkMode ? "text-[#60a5fa]" : "text-[#2563EB]";
  const copyBtn = isDarkMode ? "bg-[#1e293b] text-white hover:bg-slate-700" : "bg-white text-[#1E293B]";
  const menuBtn = isDarkMode ? "bg-[#0f172a] text-white hover:bg-slate-800" : "bg-white text-[#1E293B]";

  const panelTexture = isDarkMode 
    ? "bg-gradient-to-br from-[#1e293b] to-[#0f172a] relative before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] before:opacity-[0.1] before:pointer-events-none"
    : "bg-gradient-to-br from-[#F8FAFC] to-[#D1EAFF] relative before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] before:opacity-[0.03] before:pointer-events-none";
  
  const configTitle = isDarkMode ? "text-slate-400 decoration-[#facc15]" : "text-[#1E293B]/60 decoration-[#FDE047]";
  const topicsLabel = isDarkMode ? "text-slate-300" : "text-[#1E293B]";
  const topicTag = isDarkMode ? "bg-[#facc15] text-black" : "bg-[#FDE047] text-[#1E293B]";
  const removeCatBtn = isDarkMode ? "text-red-600 hover:text-red-800" : "text-[#1E293B] hover:text-red-500";
  const addTopicBtn = isDarkMode ? "bg-[#0f172a] text-white hover:bg-slate-800" : "bg-white text-[#1E293B]";
  const dropdownMenu = isDarkMode ? "bg-[#1e293b]" : "bg-white";
  const selectAllBtn = isDarkMode ? "hover:bg-[#facc15] hover:text-black border-slate-700 text-[#60a5fa] bg-[#0f172a]" : "hover:bg-[#FDE047] border-slate-200 text-[#2563EB] bg-slate-50";
  const categoryItem = isDarkMode ? "hover:bg-[#facc15] hover:text-black border-slate-800 text-slate-300" : "hover:bg-[#FDE047] border-slate-100 text-[#1E293B]";
  const settingsBg = isDarkMode ? "bg-[#0f172a]/50" : "bg-[#1E293B]/5";
  const settingsLabel = isDarkMode ? "text-slate-400" : "text-[#1E293B]/70";
  const settingsInput = isDarkMode ? "bg-[#1e293b] text-white focus:ring-[#facc15]" : "bg-white text-[#1E293B] focus:outline-none";
  const syncBtn = isDarkMode ? "bg-[#3b82f6] text-white hover:bg-[#60a5fa]" : "bg-[#2563EB] text-white hover:bg-blue-500";
  
  const spinner = isDarkMode ? "border-slate-800 border-t-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "border-[#F1F5F9] border-t-[#2563EB] shadow-[3px_3px_0px_#1E293B]";
  const readyText = isDarkMode ? "text-white drop-shadow-[3px_3px_0px_#ef4444]" : "text-[#1E293B]";
  const waitingText = isDarkMode ? "text-[#60a5fa]" : "text-[#2563EB]";
  const startBtn = isDarkMode ? "bg-[#22c55e] text-black hover:bg-[#facc15] disabled:bg-slate-700 disabled:text-slate-500" : "bg-[#22C55E] text-white hover:bg-[#FDE047] hover:text-[#1E293B] disabled:bg-slate-300 disabled:text-slate-500";
  
  const gameOverBg = isDarkMode ? "bg-[#facc15] text-black" : "bg-[#FDE047] text-[#1E293B]";
  const trophyShadow = isDarkMode ? "drop-shadow-[3px_3px_0px_#000]" : "drop-shadow-[3px_3px_0px_#1E293B]";
  const winnerText = isDarkMode ? "drop-shadow-[1px_1px_0px_#fff]" : "";
  const playAgainBtn = isDarkMode ? "bg-[#0f172a] text-white hover:bg-slate-800" : "bg-white text-[#1E293B]";
  
  const timerTrack = isDarkMode ? "bg-[#0f172a]" : "bg-[#1E293B]/10";
  const timerFillNormal = isDarkMode ? "bg-[#3b82f6]" : "bg-[#2563EB]";
  const timerFillLow = isDarkMode ? "bg-[#ef4444]" : "bg-[#EF4444]";
  const timerBadge = isDarkMode ? "bg-[#facc15] text-black" : "bg-[#FDE047] text-[#1E293B]";
  
  const promptText = isDarkMode ? "text-[#60a5fa] drop-shadow-[1px_1px_0px_#000]" : "text-[#2563EB]";
  const promptMusic = isDarkMode ? "bg-[#facc15]" : "bg-[#FDE047]";
  const roundOverText = isDarkMode ? "text-[#ef4444] drop-shadow-[1px_1px_0px_#000]" : "text-red-500";
  const answerBadge = isDarkMode ? "bg-[#22c55e] text-black" : "bg-[#22C55E] text-white";
  
  const chatBg = isDarkMode ? "bg-[#0f172a]/80" : "bg-white/40";
  const chatSystem = isDarkMode ? "bg-[#facc15] text-black" : "bg-[#FDE047] text-[#1E293B]";
  const chatUser = isDarkMode ? "bg-[#1e293b] text-slate-200" : "bg-white text-[#1E293B]";
  const chatUsername = isDarkMode ? "text-[#60a5fa] decoration-[#facc15]" : "text-[#2563EB] decoration-[#FDE047]";
  
  const inputArea = isDarkMode ? "bg-[#0f172a]" : "bg-[#F1F5F9]";
  const guessInputClass = isDarkMode ? "bg-[#1e293b] text-white focus:bg-slate-800 placeholder-slate-500" : "bg-white text-[#1E293B] focus:bg-[#FDE047]";
  const sendBtn = isDarkMode ? "bg-[#3b82f6] text-white hover:bg-blue-500 disabled:bg-slate-600" : "bg-[#2563EB] text-white hover:bg-blue-600";
  
  const exitRoomBtn = isDarkMode ? "bg-[#0f172a] border-[#ef4444] text-[#ef4444] shadow-[4px_4px_0px_#ef4444] hover:bg-[#ef4444] hover:text-white" : "bg-white border-[#EF4444] text-[#EF4444] shadow-[4px_4px_0px_#EF4444] hover:bg-[#EF4444] hover:text-white";
  const lbHeader = isDarkMode ? "bg-[#1e293b]/50" : "bg-white/30";
  const lbTitle = isDarkMode ? "text-white" : "text-[#1E293B]";
  const goalBadge = isDarkMode ? "text-black bg-[#facc15]" : "text-[#2563EB] bg-[#FDE047]";
  const playerItemActive = isDarkMode ? "bg-[#22c55e] text-black" : "bg-[#FDE047] text-[#1E293B]";
  const playerItemInactive = isDarkMode ? "bg-[#1e293b] text-white" : "bg-white/70 text-[#1E293B]";
  const playerRankActive = isDarkMode ? "text-black" : "text-[#1E293B]";
  const playerRankInactive = isDarkMode ? "text-slate-500" : "text-[#1E293B]";
  const avatarBgPlayer = isDarkMode ? "bg-slate-800" : "bg-white";
  const playerScoreActive = isDarkMode ? "text-black" : "text-[#2563EB]";
  const playerScoreInactive = isDarkMode ? "text-[#60a5fa]" : "text-[#2563EB]";
  const correctBadge = isDarkMode ? "text-black bg-white/30 border-black" : "text-green-800 bg-white/50 border-[#1E293B]";

  // ==========================================
  // --- SOCKET EFFECTS ---
  // ==========================================

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
    // 🟢 DETECT HARD REFRESH vs SPA NAVIGATION
    const handleBeforeUnload = () => { isRefreshing.current = true; };
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (!socket || !roomId) return;
    socket.emit('join_game_room', { roomId });

    const fetchFreshParticipants = async () => {
      try {
        const res = await getRoomParticipants(roomId);
        if (res.success) {
          setParticipants(prev => {
            const localStateMap = new Map(prev.map(p => [p.user.id, { 
              justGuessed: p.justGuessed, 
              timeTaken: p.timeTaken,
              localScore: p.score 
            }]));
            
            return res.data.map(newP => {
              const localState = localStateMap.get(newP.user.id) || {};
              const highestScore = Math.max((newP.score || 0), (localState.localScore || 0));
              
              return { 
                ...newP, 
                ...localState,
                score: highestScore 
              };
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
      setGuessInput('');
      setParticipants(prev => prev.map(p => ({ ...p, justGuessed: false, timeTaken: null })));
    });

    socket.on('sync_active_round', (data) => {
      setRoundState('ACTIVE');
      setCurrentPrompt({
        id: data.id,
        type: data.type,
        mediaUrl: data.mediaUrl,
        textContent: data.textContent,
        duration: data.duration 
      });
      setTimeLeft(data.timeLeft);
      setHasGuessed(data.hasGuessed);
      setRevealedAnswers([]);
      
      if (data.correctGuessers && data.correctGuessers.length > 0) {
        setParticipants(prev => prev.map(p => 
          data.correctGuessers.includes(p.user.id) ? { ...p, justGuessed: true } : p
        ));
      }
    });

    socket.on('sync_round_ended', (data) => {
      setRoundState('ENDED');
      setTimeLeft(0);
      setRevealedAnswers(data.correctAnswers);
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

    socket.on('player_left', (data) => { 
      setParticipants(prev => prev.filter(p => String(p.user.id) !== String(data.userId))); 
    });
    
    socket.on('host_updated', (data) => {
      setRoomDetails(prev => ({ ...prev, hostUserId: data.newHostId }));
      setChatLog(log => [...log, { system: true, text: `👑 NEW HOST ASSIGNED!` }]);
    });

    socket.on('guess_result', (data) => {
      if (data.success) {
        if (wrongSoundTimer.current) clearTimeout(wrongSoundTimer.current);
        if (wrongSound.current) {
          wrongSound.current.pause();
          wrongSound.current.currentTime = 0;
        }
        if (correctSound.current) {
          correctSound.current.currentTime = 0;
          correctSound.current.play().catch(() => {});
        }
        setHasGuessed(true); 
      }
    });

    socket.on('chat_message', (data) => { setChatLog(log => [...log, { userId: data.userId, username: data.username, text: data.text }]); });
    
    socket.on('game_over', (data) => {
      setRoundState('GAME_OVER');
      setRoomDetails(prev => ({...prev, status: 'FINISHED'}));
      setWinnerInfo(data);
      
      setShowConfetti(true);
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
      confettiTimer.current = setTimeout(() => setShowConfetti(false), 4000);
    });
    
    socket.on('game_restarted', () => {
      setRoundState('IDLE');
      setRoomDetails(prev => ({ ...prev, status: 'WAITING' }));
      setChatLog([]);
      setWinnerInfo(null);
      setShowConfetti(false);
      setParticipants(prev => prev.map(p => ({ ...p, score: 0, justGuessed: false, timeTaken: null })));
    });
    
    socket.on('player_connected', fetchFreshParticipants); 

    // 🟢 ENHANCED CLEANUP: Only fires grace period on accidental "Back" button presses
    return () => { 
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.off(); 
      if (!isRefreshing.current && !isIntentionalExit.current) {
        socket.emit('leave_game_room', { roomId });
      }
    };
  }, [socket, roomId]);

  useEffect(() => {
    getCategories().then(res => { if (res.success) setAllCategories(res.data); });
    
    getRoomDetails(roomId).then(res => {
      if (res.success) {
        setRoomDetails(res.data);
        if (res.data.settingsJson) setSettings(res.data.settingsJson);
        if (res.data.status === 'FINISHED') setRoundState('GAME_OVER');
      }
    }).catch(() => navigate('/'));

    getRoomParticipants(roomId).then(res => { 
      if (res.success) { 
        setParticipants(current => {
          const localMap = new Map(current.map(p => [p.user.id, p.score || 0]));
          return res.data.map(newP => ({
            ...newP,
            score: Math.max(newP.score, localMap.get(newP.user.id) || 0)
          }));
        });
      } 
    });
  }, [roomId, navigate]);

  // 🟢 INTENTIONAL EXIT HANDLER
  const handleLeave = async () => { 
    isIntentionalExit.current = true; 
    try { 
      await leaveRoom(roomId); 
      navigate('/'); 
    } catch (e) {} 
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomDetails?.inviteCode || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCategory = async (id) => {
    if (currentCategoryIds.includes(id)) return;
    setIsUpdating(true);
    try { 
      const res = await updateRoomCategories(roomId, [...currentCategoryIds, id]); 
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } catch (err) { console.error(err); } 
    finally { setIsUpdating(false); setIsDropdownOpen(false); }
  };

  const handleRemoveCategory = async (id) => {
    setIsUpdating(true);
    try { 
      const res = await updateRoomCategories(roomId, currentCategoryIds.filter(catId => catId !== id)); 
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } finally { setIsUpdating(false); }
  };

  const handleAddAllCategories = async () => {
    setIsUpdating(true);
    try { 
      const allCategoryIds = allCategories.map(cat => cat.id);
      const res = await updateRoomCategories(roomId, allCategoryIds);
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } finally { setIsUpdating(false); setIsDropdownOpen(false); }
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

    if (wrongSoundTimer.current) clearTimeout(wrongSoundTimer.current);

    wrongSoundTimer.current = setTimeout(() => {
      if (wrongSound.current && !hasGuessed) {
        wrongSound.current.currentTime = 0;
        wrongSound.current.play().catch(() => {});
      }
    }, 250); 
  };

  return (
    <div className={`min-h-[100dvh] lg:h-[100dvh] w-full ${bgClass} p-3 md:p-4 flex flex-col font-sans overflow-x-hidden overflow-y-auto lg:overflow-hidden relative transition-colors duration-500`}>
      
      {showConfetti && <ConfettiBlast />}

      {/* Background Dots */}
      <div className={`absolute inset-0 ${dotOpacity} pointer-events-none z-0`} style={{ backgroundImage: dotPattern, backgroundSize: '30px 30px' }}></div>

      {/* HEADER */}
      <div className={`max-w-[1400px] w-full mx-auto flex justify-between items-center border-[3px] ${bColor} p-2 md:p-3 rounded-xl mb-4 relative z-20 shrink-0 shadow-[4px_4px_0px_${shadowColor}] ${headerBg}`}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`px-2 py-1 rounded-md -rotate-1 border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] ${titleBadge}`}>
            <h1 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter uppercase leading-none">BhejaFry</h1>
          </div>
          {roomDetails?.inviteCode && (
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border-[2px] ${bColor} ${codeBadge}`}>
              <span className={`text-[9px] font-black uppercase ${codeLabel}`}>CODE:</span>
              <span className={`font-mono text-sm font-bold tracking-widest ${codeValue}`}>{roomDetails.inviteCode}</span>
              <button onClick={copyToClipboard} className={`text-[9px] font-black px-2 py-0.5 rounded border-[2px] ${bColor} shadow-[1px_1px_0px_${shadowColor}] transition-colors ${copyBtn}`}>
                {copied ? '✅' : 'COPY'}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={toggleTheme}
            className={`border-[2px] ${bColor} px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-sm md:text-lg flex items-center justify-center hover:-translate-y-0.5 shadow-[2px_2px_0px_${shadowColor}] transition-all ${menuBtn}`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          
          <button onClick={() => setIsLeftPaneOpen(!isLeftPaneOpen)} className={`border-[2px] ${bColor} px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase hover:-translate-y-0.5 shadow-[2px_2px_0px_${shadowColor}] transition-all ${menuBtn}`}>
            {isLeftPaneOpen ? 'Close Menu' : 'Open Menu'}
          </button>
        </div>
      </div>

      <div className={`max-w-[1400px] w-full mx-auto grid grid-cols-1 ${isLeftPaneOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6 lg:gap-4 flex-1 lg:min-h-0 relative z-10 pb-4 lg:pb-0`}>
        
        {/* PANEL 1: CONFIG (Pushed to bottom on mobile, side on desktop) */}
        {isLeftPaneOpen && (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar order-3 lg:order-1 h-[50dvh] lg:h-full lg:min-h-0">
            <div className={`border-[3px] ${bColor} shadow-[6px_6px_0px_${shadowColor}] rounded-2xl p-4 flex flex-col h-full overflow-hidden ${panelTexture}`}>
              <h3 className={`text-[9px] font-black uppercase mb-3 tracking-widest italic underline decoration-2 ${configTitle}`}>Config Panel</h3>
              
              <div className="space-y-4 flex-grow relative z-10 overflow-y-auto custom-scrollbar pr-2">
                <div>
                  <span className={`block text-[9px] font-black uppercase mb-2 ${topicsLabel}`}>Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {roomDetails?.categories?.map(c => (
                      <div key={c.categoryId} className={`flex items-center border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] px-2 py-0.5 rounded-md text-[11px] font-bold ${topicTag}`}>
                        {c.category?.name}
                        {isHost && roomDetails?.status !== 'PLAYING' && (
                          <button onClick={() => handleRemoveCategory(c.categoryId)} className={`ml-1.5 ${removeCatBtn}`}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isHost && roomDetails?.status !== 'PLAYING' && (
                  <div className={`space-y-3 pt-3 border-t-[2px] border-dashed ${isDarkMode ? 'border-slate-700' : 'border-[#1E293B]/20'}`}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] px-3 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-black uppercase transition-colors ${addTopicBtn}`}>
                      <span>Add Topic</span>
                      <span>{isDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    {isDropdownOpen && (
                      <div className={`border-[2px] ${bColor} rounded-lg overflow-hidden max-h-40 overflow-y-auto relative z-20 custom-scrollbar ${dropdownMenu}`}>
                        {unselectedCategories.length > 1 && (
                          <button 
                            onClick={handleAddAllCategories} 
                            className={`w-full text-left px-3 py-2 border-b-[2px] ${bColor} font-black text-[10px] uppercase italic transition-colors ${selectAllBtn}`}
                          >
                            ⚡ SELECT ALL CATEGORIES
                          </button>
                        )}
                        {unselectedCategories.map(cat => (
                          <button key={cat.id} onClick={() => handleAddCategory(cat.id)} className={`w-full text-left px-3 py-1.5 border-b-[1px] ${bColor} font-bold text-[10px] uppercase italic transition-colors ${categoryItem}`}>
                            + {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className={`p-3 rounded-xl border-[2px] ${bColor} space-y-3 ${settingsBg}`}>
                      <div className="flex justify-between items-center">
                        <label className={`text-[9px] font-black uppercase tracking-tighter ${settingsLabel}`}>Target Pts</label>
                        <input type="number" value={settings?.maxScore ?? 100} onChange={(e) => setSettings({...settings, maxScore: parseInt(e.target.value) || 0})} className={`w-14 border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] rounded-md text-center font-black text-xs py-1 ${settingsInput}`} />
                      </div>
                      <div className="flex justify-between items-center">
                        <label className={`text-[9px] font-black uppercase tracking-tighter ${settingsLabel}`}>Round Time</label>
                        <input type="number" value={settings?.timePerRound ?? 15} onChange={(e) => setSettings({...settings, timePerRound: parseInt(e.target.value) || 0})} className={`w-14 border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] rounded-md text-center font-black text-xs py-1 ${settingsInput}`} />
                      </div>
                      <button onClick={handleSaveSettings} disabled={isUpdating} className={`w-full border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] text-[10px] font-black py-2 rounded-lg uppercase active:translate-y-1 active:shadow-none transition-all ${syncBtn}`}>
                        Sync System
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: GAME WINDOW (Always top priority on mobile) */}
        <div className={`lg:col-span-2 flex flex-col border-[3px] ${bColor} shadow-[8px_8px_0px_${shadowColor}] rounded-3xl overflow-hidden relative order-1 lg:order-2 h-[80dvh] lg:h-full lg:min-h-0 ${panelTexture}`}>
          {roomDetails?.status === 'WAITING' ? (
            <div className="flex flex-col items-center justify-center flex-grow p-6 text-center relative z-10 min-h-0">
              <div className={`w-16 h-16 md:w-20 md:h-20 mb-4 border-[5px] rounded-full animate-spin shrink-0 ${spinner}`} />
              <h2 className={`text-2xl md:text-3xl font-black italic mb-2 uppercase tracking-tighter shrink-0 ${readyText}`}>READY?</h2>
              <p className={`font-black text-[9px] md:text-[10px] mb-6 uppercase tracking-[0.2em] animate-pulse shrink-0 ${waitingText}`}>Waiting for host command...</p>
              {isHost && (
                <button onClick={handleStartGame} disabled={!roomDetails?.categories?.length} className={`border-[3px] ${bColor} shadow-[4px_4px_0px_${shadowColor}] hover:shadow-[1px_1px_0px_${shadowColor}] font-black py-3 px-8 md:py-4 md:px-10 rounded-full uppercase hover:translate-y-1 transition-all shrink-0 ${startBtn}`}>
                  START GAME
                </button>
              )}
            </div>
          ) : roundState === 'GAME_OVER' ? (
            <div className={`flex flex-col items-center justify-center flex-grow p-6 text-center relative z-10 border-b-[3px] ${bColor} min-h-0 ${gameOverBg}`}>
              <h1 className={`text-4xl md:text-5xl mb-4 shrink-0 ${trophyShadow}`}>🏆</h1>
              <h2 className={`text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-2 shrink-0 ${winnerText}`}>
                {winnerInfo?.winnerName || [...participants].sort((a, b) => b.score - a.score)[0]?.user?.username}
              </h2>
              <p className="font-black text-[10px] md:text-xs uppercase tracking-[0.4em] mb-8 italic underline underline-offset-8 decoration-4 shrink-0">BHEJA FRY CHAMPION</p>
              {isHost && (
                <button onClick={() => socket.emit('restart_game', { roomId })} className={`border-[3px] ${bColor} shadow-[4px_4px_0px_${shadowColor}] text-sm md:text-base font-black py-3 px-8 md:py-4 md:px-10 rounded-full uppercase transition-all active:translate-y-1 active:shadow-none shrink-0 ${playAgainBtn}`}>
                  PLAY AGAIN
                </button>
              )}
            </div>
          ) : (
            <>
              {/* TIMER BAR */}
              <div className={`w-full h-3 md:h-4 shrink-0 relative border-b-[3px] ${bColor} ${timerTrack}`}>
                <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? timerFillLow : timerFillNormal}`} style={{ width: `${currentPrompt ? (timeLeft / currentPrompt.duration) * 100 : 0}%` }} />
              </div>

              <div className="flex-1 flex flex-col p-2 md:p-4 relative z-10 w-full min-h-0">
                <div className="w-full flex justify-end mb-2 shrink-0">
                  <div className={`border-[2px] ${bColor} shadow-[3px_3px_0px_${shadowColor}] px-3 md:px-4 py-1 md:py-1.5 rounded-xl font-black text-lg md:text-xl italic h-fit ${timerBadge}`}>
                    {timeLeft}s
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center max-w-2xl mx-auto w-full min-h-0">
                  {roundState === 'ACTIVE' && currentPrompt && (
                    <div className="animate-fadeIn flex flex-col items-center justify-center gap-2 md:gap-4 w-full h-full min-h-0">
                      
                      {currentPrompt.textContent && (
                        <p className={`text-sm sm:text-lg md:text-xl font-black uppercase tracking-tighter leading-tight italic px-3 shrink-0 mb-1 ${promptText}`}>
                          {currentPrompt.textContent}
                        </p>
                      )}

                      {currentPrompt.type === 'IMAGE' && currentPrompt.mediaUrl && (
                        <div className="flex justify-center items-center shrink min-h-0 w-full">
                          <img 
                            src={currentPrompt.mediaUrl} 
                            alt="Trivia" 
                            className={`max-h-[20vh] md:max-h-[30vh] lg:max-h-[35vh] max-w-full object-contain rounded-xl border-[3px] ${bColor} shadow-[4px_4px_0px_${shadowColor}] transform ${isDarkMode ? '-rotate-1' : 'rotate-1'}`}
                          />
                        </div>
                      )}

                      {currentPrompt.type === 'MUSIC' && currentPrompt.mediaUrl && (
                        <div className={`p-2 md:p-3 rounded-xl border-[3px] ${bColor} shadow-[4px_4px_0px_${shadowColor}] shrink-0 w-full max-w-[300px] ${promptMusic}`}>
                          <audio controls autoPlay src={currentPrompt.mediaUrl} className="outline-none h-8 md:h-10 w-full">
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  )}

                  {roundState === 'ENDED' && (
                    <div className="animate-bounce-slow flex flex-col items-center w-full min-h-0 justify-center">
                      <span className={`text-lg md:text-xl font-black uppercase mb-4 block tracking-widest italic underline decoration-4 shrink-0 ${roundOverText}`}>ROUND OVER!</span>
                      
                      <div className="flex flex-wrap justify-center gap-3 md:gap-4 min-h-0 overflow-y-auto custom-scrollbar p-2 md:p-3 pb-4 mb-2">
                        {revealedAnswers.map((ans, idx) => (
                          <span key={idx} className={`border-[3px] ${bColor} shadow-[4px_4px_0px_${shadowColor}] px-4 py-2 md:px-6 md:py-3 rounded-2xl font-black uppercase text-base md:text-2xl italic tracking-tighter transform ${isDarkMode ? 'rotate-1' : '-rotate-1'} shrink-0 ${answerBadge}`}>
                            {ans}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAT BOX */}
              <div className={`h-24 sm:h-28 lg:h-32 shrink-0 overflow-y-auto px-3 md:px-4 py-2 md:py-3 space-y-2 backdrop-blur-md border-t-[3px] ${bColor} custom-scrollbar ${chatBg}`}>
                {chatLog.map((msg, index) => (
                  <div key={index} className={`flex ${msg.system ? 'justify-center' : 'justify-start'}`}>
                    <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] ${msg.system ? chatSystem + ' uppercase italic tracking-tighter' : chatUser}`}>
                      {!msg.system && <span className={`mr-2 underline ${chatUsername}`}>{msg.username} &gt;</span>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* INPUT AREA */}
              <form onSubmit={submitGuess} className={`p-2 md:p-4 border-t-[3px] ${bColor} flex gap-2 md:gap-3 shrink-0 ${inputArea}`}>
                <input 
                  ref={inputRef} 
                  type="text" 
                  value={guessInput || ''} 
                  onChange={(e) => setGuessInput(e.target.value)} 
                  disabled={hasGuessed || roundState !== 'ACTIVE'} 
                  placeholder={hasGuessed ? "NAILED IT! WAIT..." : "TYPE YOUR GUESS..."} 
                  className={`flex-grow border-[2px] ${bColor} rounded-xl px-3 py-2 md:px-4 md:py-3 transition-colors font-black uppercase text-xs sm:text-sm md:text-base tracking-widest shadow-inner min-w-0 ${guessInputClass}`} 
                  autoComplete="off" 
                />
                <button type="submit" disabled={hasGuessed || roundState !== 'ACTIVE'} className={`border-[3px] ${bColor} shadow-[4px_4px_0px_${shadowColor}] font-black px-4 md:px-6 rounded-xl uppercase active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none shrink-0 text-sm md:text-base ${sendBtn}`}>
                  SEND
                </button>
              </form>
            </>
          )}
        </div>

        {/* PANEL 3: LEADERBOARD (Middle section on mobile, right on desktop) */}
        <div className="flex flex-col gap-4 overflow-hidden order-2 lg:order-3 h-[50dvh] lg:h-full lg:min-h-0">
          <button onClick={handleLeave} className={`border-[3px] shadow-[4px_4px_0px_#ef4444] py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] active:translate-y-1 active:shadow-none transition-all shrink-0 ${exitRoomBtn}`}>
            EXIT ROOM
          </button>

          <div className={`border-[3px] ${bColor} shadow-[6px_6px_0px_${shadowColor}] rounded-3xl flex-1 flex flex-col min-h-0 overflow-hidden ${panelTexture}`}>
            <div className={`p-3 md:p-4 border-b-[3px] ${bColor} backdrop-blur-sm flex justify-between items-center shrink-0 ${lbHeader}`}>
              <h3 className={`text-[10px] md:text-xs font-black uppercase italic tracking-tighter ${lbTitle}`}>Players</h3>
              <span className={`font-black border-[2px] ${bColor} shadow-[2px_2px_0px_${shadowColor}] px-2 py-0.5 md:px-3 rounded-full text-[8px] md:text-[9px] ${goalBadge}`}>GOAL: {settings?.maxScore ?? 100}</span>
            </div>
            
            <ul className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 custom-scrollbar min-h-0">
              {[...participants].sort((a, b) => b.score - a.score).map((p, index) => (
                <li 
                  key={p.user.id} 
                  className={`flex items-center justify-between p-2 md:p-3 rounded-xl border-[2px] ${bColor} transition-all ${
                    p.justGuessed 
                      ? `${playerItemActive} shadow-[4px_4px_0px_${shadowColor}] -translate-y-0.5` 
                      : `${playerItemInactive} shadow-[2px_2px_0px_${shadowColor}]`
                  }`}
                >
                  <div className="flex items-center space-x-2 md:space-x-3 w-full">
                    <div className={`w-5 md:w-6 text-center font-black text-xs md:text-sm ${p.justGuessed ? playerRankActive : playerRankInactive}`}>
                      #{index + 1}
                    </div>
                    
                    <img 
                      src={p.user.avatarUrl || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-[2px] ${bColor} shrink-0 ${avatarBgPlayer}`} 
                    />
                    
                    <div className="flex flex-col flex-grow overflow-hidden">
                      {/* Name on Left, Points on Right */}
                      <div className="flex items-center justify-between gap-1 md:gap-2">
                        <span className="font-black text-[10px] md:text-sm uppercase truncate flex items-center gap-1 tracking-tight">
                          {p.user.username}
                          {p.user.id === roomDetails?.hostUserId && <span title="Room Host" className="text-[10px] md:text-xs">👑</span>}
                        </span>
                        <span className={`text-xs md:text-sm font-black whitespace-nowrap ${p.justGuessed ? playerScoreActive : playerScoreInactive}`}>
                          {p.score} PTS
                        </span>
                      </div>
                      
                      {/* Timestamp underneath */}
                      {p.justGuessed && p.timeTaken && (
                        <span className={`text-[10px] md:text-sm font-black font-mono mt-0.5 px-1.5 md:px-2 py-0.5 rounded-md w-fit border-[2px] ${bColor} ${correctBadge}`}>
                          {p.timeTaken}s
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        /* CONFETTI ANIMATION LOGIC */
        @keyframes confetti-blast {
          0% { 
            transform: translate(0, 0) rotate(0deg) scale(0); 
            opacity: 1; 
          }
          20% { 
            transform: translate(calc(var(--tx) * 0.6), var(--ty)) rotate(calc(var(--rot) * 0.5)) scale(1.2); 
            opacity: 1; 
          }
          100% { 
            transform: translate(var(--tx), calc(var(--ty) + 80vh)) rotate(var(--rot)) scale(1); 
            opacity: 0; 
          }
        }
      
        .custom-scrollbar::-webkit-scrollbar { width: ${isDarkMode ? '6px' : '4px'}; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#000' : '#1E293B'}; 
          border-radius: 8px; 
          border: 1px solid ${isDarkMode ? '#1e293b' : '#E0F2FE'}; 
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        @keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-slow { animation: bounceSlow 2.2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}