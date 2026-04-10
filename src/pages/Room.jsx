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
  const isHost = user?.id && roomDetails?.hostUserId && user.id === roomDetails.hostUserId;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

  // Local Timer
  useEffect(() => {
    let timer;
    if (roundState === 'ACTIVE' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [roundState, timeLeft]);

  // ==========================================
  // SOCKET LISTENERS
  // ==========================================
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join_game_room', { roomId });

    const fetchFreshParticipants = async () => {
      try {
        const res = await getRoomParticipants(roomId);
        if (res.success) {
          setParticipants(prev => {
            const guessedIds = new Set(prev.filter(p => p.justGuessed).map(p => p.user.id));
            return res.data.map(newP => ({ ...newP, justGuessed: guessedIds.has(newP.user.id) }));
          });
        }
      } catch (e) {}
    };

    const onRoomSettingsUpdated = (data) => { if (data.settings) setSettings(data.settings); };
    const onRoomCategoriesUpdated = (data) => setRoomDetails(prev => ({...prev, categories: data.categories}));
    const onGameStarted = (data) => setRoomDetails(prev => ({ ...prev, status: data.status }));
    
    const onRoundStarted = (data) => {
      setRoundState('ACTIVE');
      setCurrentPrompt(data);
      setTimeLeft(data.duration);
      setHasGuessed(false);
      setRevealedAnswers([]);
      setParticipants(prev => prev.map(p => ({ ...p, justGuessed: false })));
    };

    const onRoundEnded = (data) => {
      setRoundState('ENDED');
      setTimeLeft(0);
      setRevealedAnswers(data.correctAnswers);
    };

const onPlayerGuessedCorrectly = (data) => {
      setParticipants(prev => prev.map(p => 
        p.user.id === data.userId ? { ...p, score: data.newTotalScore, justGuessed: true } : p
      ));
      // UPDATE: Now displays the exact time taken!
      setChatLog(log => [...log, { system: true, text: `✅ ${data.username} guessed correctly in ${data.timeTaken}s! (+${data.pointsEarned} pts)` }]);
    };

    const onPlayerLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.user.id !== data.userId));
    };

    const onHostUpdated = (data) => {
      setRoomDetails(prev => ({ ...prev, hostUserId: data.newHostId }));
      setChatLog(log => [...log, { system: true, text: `👑 The host has left. A new host has been assigned!` }]);
    };

    const onGuessResult = (data) => { if (data.success) { setHasGuessed(true); setGuessInput(''); } };
    
    const onChatMessage = (data) => {
      // BUG FIX 1: Clean separation. Uses explicitly sent username.
      setChatLog(log => [...log, { userId: data.userId, username: data.username, text: data.text }]);
    };

    const onGameOver = (data) => {
      setRoundState('GAME_OVER');
      setRoomDetails(prev => ({...prev, status: 'FINISHED'}));
      setWinnerInfo(data);
      setChatLog(log => [...log, { system: true, text: `🏆 Game Over! Winner: ${data.winnerName}` }]);
    };

    // BUG FIX 2: Handle restart trigger
    const onGameRestarted = () => {
      setRoundState('IDLE');
      setRoomDetails(prev => ({ ...prev, status: 'WAITING' }));
      setChatLog([]);
      setWinnerInfo(null);
      setParticipants(prev => prev.map(p => ({ ...p, score: 0, justGuessed: false })));
    };

    socket.on('room_settings_updated', onRoomSettingsUpdated);
    socket.on('room_categories_updated', onRoomCategoriesUpdated);
    socket.on('game_started', onGameStarted);
    socket.on('round_started', onRoundStarted);
    socket.on('round_ended', onRoundEnded);
    socket.on('player_guessed_correctly', onPlayerGuessedCorrectly);
    socket.on('guess_result', onGuessResult);
    socket.on('chat_message', onChatMessage);
    socket.on('game_over', onGameOver);
    socket.on('game_restarted', onGameRestarted);
    socket.on('player_connected', fetchFreshParticipants); 
    socket.on('player_left', onPlayerLeft);
    socket.on('host_updated', onHostUpdated);

    // Robust explicit cleanup
    return () => {
      socket.off('room_settings_updated');
      socket.off('room_categories_updated');
      socket.off('game_started');
      socket.off('round_started');
      socket.off('round_ended');
      socket.off('player_guessed_correctly');
      socket.off('guess_result');
      socket.off('chat_message');
      socket.off('game_over');
      socket.off('game_restarted');
      socket.off('player_connected');
      socket.off('player_left', onPlayerLeft);
      socket.off('host_updated', onHostUpdated);
    };
  }, [socket, roomId]);

  // ==========================================
  // INITIAL DATA FETCHING
  // ==========================================
  useEffect(() => {
    getCategories().then(res => { if (res.success) setAllCategories(res.data); }).catch(()=>{});
    getRoomDetails(roomId).then(res => {
      if (res.success) {
        setRoomDetails(res.data);
        if (res.data.settingsJson) setSettings(res.data.settingsJson);
      }
    }).catch(() => navigate('/'));
    getRoomParticipants(roomId).then(res => { if (res.success) setParticipants(res.data); }).catch(()=>{});
  }, [roomId, navigate]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLeave = async () => { try { await leaveRoom(roomId); navigate('/'); } catch (e) {} };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomDetails.inviteCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const currentCategoryIds = roomDetails?.categories?.map(c => c.categoryId) || [];
  const unselectedCategories = allCategories.filter(cat => !currentCategoryIds.includes(cat.id));

  const handleAddCategory = async (id) => {
    setIsUpdating(true); setIsDropdownOpen(false); 
    try { 
      const res = await updateRoomCategories(roomId, [...currentCategoryIds, id]); 
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } catch (e) { } finally { setIsUpdating(false); }
  };

  const handleRemoveCategory = async (id) => {
    setIsUpdating(true);
    try { 
      const res = await updateRoomCategories(roomId, currentCategoryIds.filter(catId => catId !== id)); 
      if (res.success) setRoomDetails(prev => ({...prev, categories: res.data.categories}));
    } catch (e) { } finally { setIsUpdating(false); }
  };

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try { await updateRoomSettings(roomId, settings); alert('Settings Synced!'); } catch (e) {} finally { setIsUpdating(false); }
  };

  const handleStartGame = async () => {
    try {
      await startGame(roomId);
      socket.emit('request_next_round', { roomId });
    } catch (error) { alert(error.response?.data?.message || 'Failed to start game'); }
  };

  const handleRestartGame = () => {
    socket.emit('restart_game', { roomId });
  };

  const submitGuess = (e) => {
    e.preventDefault();
    const currentGuess = guessInput.trim();
    if (!currentGuess || hasGuessed || roundState !== 'ACTIVE') return;
    socket.emit('submit_guess', { roomId, guess: currentGuess });
    setGuessInput(''); 
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 overflow-hidden flex flex-col">
      
      {/* TOP HEADER */}
      <div className="max-w-[1600px] w-full mx-auto flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg mb-6 flex-shrink-0">
         <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <h1 className="text-2xl font-bold text-white">Trivia Room</h1>
            {roomDetails?.inviteCode && (
               <div className="flex items-center bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-600">
                  <span className="text-sm text-gray-400 mr-2">Code:</span>
                  <span className="font-mono text-lg font-bold text-blue-400 tracking-widest">{roomDetails.inviteCode}</span>
                  <button onClick={copyToClipboard} className="ml-4 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">
                     {copied ? 'Copied!' : 'Copy'}
                  </button>
               </div>
            )}
         </div>
         <button 
           onClick={() => setIsLeftPaneOpen(!isLeftPaneOpen)} 
           className="bg-blue-600 hover:bg-blue-700 font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-md"
         >
            {isLeftPaneOpen ? 'Hide Settings ◀' : 'Show Settings ▶'}
         </button>
      </div>

      <div className={`max-w-[1600px] w-full mx-auto grid grid-cols-1 ${isLeftPaneOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 flex-grow overflow-hidden`}>
        
        {/* LEFT SECTION: Settings */}
        {isLeftPaneOpen && (
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-gray-800 rounded-xl p-5 shadow-lg flex-grow">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Configuration</h3>
              
              <div className="mb-6">
                <span className="block text-sm text-gray-400 mb-3">Selected Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {roomDetails?.categories?.length > 0 ? (
                    roomDetails.categories.map(c => (
                      <div key={c.categoryId} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                        <span className="truncate max-w-[120px]">{c.category?.name || "Unknown"}</span>
                        {isHost && roomDetails?.status !== 'PLAYING' && (
                          <button onClick={() => handleRemoveCategory(c.categoryId)} disabled={isUpdating} className="ml-2 pl-2 border-l border-blue-500 hover:text-red-300 transition-colors">✕</button>
                        )}
                      </div>
                    ))
                  ) : <span className="text-gray-500 italic text-sm">No categories selected.</span>}
                </div>
              </div>

              {isHost && roomDetails?.status !== 'PLAYING' && (
                <div className="pt-4 border-t border-gray-700 relative">
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} disabled={isUpdating || unselectedCategories.length === 0} className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2.5 rounded-lg flex items-center justify-between text-sm mb-4">
                    {unselectedCategories.length === 0 ? "All categories added" : "+ Add Category"}
                    <span className="ml-2 text-xs">{isDropdownOpen ? '▲' : '▼'}</span>
                  </button>

                  {isDropdownOpen && unselectedCategories.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                      <ul className="max-h-48 overflow-y-auto custom-scrollbar">
                        {unselectedCategories.map(cat => (
                          <li key={cat.id}>
                            <button onClick={() => handleAddCategory(cat.id)} className="w-full text-left px-4 py-2 hover:bg-blue-600 text-sm border-b border-gray-600">{cat.name}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mt-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-gray-300">Points to Win:</label>
                      <input type="number" value={settings.maxScore} onChange={(e) => setSettings({...settings, maxScore: parseInt(e.target.value) || 100})} className="w-16 bg-gray-700 rounded px-2 py-1 text-center text-sm outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-gray-300">Time per Round:</label>
                      <input type="number" value={settings.timePerRound} onChange={(e) => setSettings({...settings, timePerRound: parseInt(e.target.value) || 15})} className="w-16 bg-gray-700 rounded px-2 py-1 text-center text-sm outline-none" />
                    </div>
                    <button onClick={handleSaveSettings} disabled={isUpdating} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded">Save & Sync Settings</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MIDDLE SECTION: Gameplay Area */}
        <div className={`bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden shadow-xl h-full lg:col-span-2`}>
          
          {roomDetails?.status === 'WAITING' ? (
            <div className="flex flex-col items-center justify-center flex-grow p-6">
              <h2 className="text-3xl font-bold text-gray-600 mb-4">Lobby Setup</h2>
              <p className="text-gray-500 italic mb-4">Waiting for the host to start the game...</p>
              <div className="flex gap-4 justify-center text-sm text-gray-400 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-700">
                <span>🎯 To Win: {settings.maxScore} pts</span>
                <span>⏱️ Time: {settings.timePerRound}s</span>
              </div>
              {isHost && (
                <button onClick={handleStartGame} disabled={!roomDetails?.categories?.length} className="mt-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-lg">
                  {!roomDetails?.categories?.length ? 'Add a category to start' : 'Start Game'}
                </button>
              )}
            </div>
          ) : roundState === 'GAME_OVER' ? (
            <div className="flex flex-col items-center justify-center flex-grow p-6 bg-gradient-to-b from-gray-800 to-gray-900 text-center">
              <h1 className="text-6xl text-yellow-400 mb-6 animate-bounce">🏆</h1>
              <h2 className="text-5xl font-extrabold text-white mb-4">{winnerInfo?.winnerName} Wins!</h2>
              <p className="text-2xl text-blue-400 font-bold mb-10">Total Score: {winnerInfo?.finalScore}</p>
              
              {/* BUG FIX 2: Added Restart Game button for Host */}
              {isHost ? (
                <button 
                  onClick={handleRestartGame} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-full shadow-lg transition-transform hover:scale-105 text-lg"
                >
                  Play Again
                </button>
              ) : (
                <p className="text-gray-500 italic">Waiting for host to restart the game...</p>
              )}
            </div>
          ) : (
            <>
              {/* Timer Bar */}
              <div className="w-full bg-gray-900 h-1.5 relative">
                <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${currentPrompt ? (timeLeft / currentPrompt.duration) * 100 : 0}%` }}></div>
              </div>

              {/* Prompt Box */}
              <div className="h-64 md:h-80 bg-gray-900/50 flex flex-col items-center justify-center p-6 relative border-b border-gray-700">
                <div className="absolute top-4 right-4 bg-gray-800 px-3 py-1 rounded-lg text-xl font-bold font-mono text-gray-300 border border-gray-700">⏱️ {timeLeft}s</div>

                {roundState === 'IDLE' && <p className="text-xl text-gray-500 animate-pulse">Loading next round...</p>}
                
                {roundState === 'ACTIVE' && currentPrompt && (
                  <div className="w-full h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center">
                    {currentPrompt.type === 'IMAGE' && <img src={currentPrompt.mediaUrl} alt="Trivia Prompt" className="max-h-full max-w-full rounded-lg shadow-md object-contain" />}
                    {currentPrompt.type === 'QUOTE' && <blockquote className="text-2xl md:text-3xl italic font-serif text-gray-300">"{currentPrompt.textContent}"</blockquote>}
                    {currentPrompt.type === 'TEXT' && <p className="text-2xl md:text-3xl font-bold text-blue-300">{currentPrompt.textContent}</p>}
                  </div>
                )}

                {roundState === 'ENDED' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                    <h2 className="text-3xl font-bold text-red-400 mb-4">Round Over!</h2>
                    <p className="text-gray-400 mb-2">The correct answer was:</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {revealedAnswers.map((ans, idx) => <span key={idx} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg text-lg">{ans}</span>)}
                    </div>
                    <p className="text-gray-500 text-sm animate-pulse">Next round starting soon...</p>
                  </div>
                )}
              </div>

              {/* Chat Log */}
              <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-800 custom-scrollbar h-48">
                {chatLog.map((msg, index) => (
                  <div key={index} className={`px-3 py-1.5 rounded-lg text-sm max-w-[85%] ${msg.system ? 'bg-green-900/30 text-green-400 border border-green-800/50 mx-auto text-center' : 'bg-gray-700/50 text-gray-200'}`}>
                    {!msg.system && <span className="font-bold text-blue-400 mr-2">{msg.username}:</span>}
                    <span>{msg.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={submitGuess} className="p-4 bg-gray-900 border-t border-gray-700 flex gap-3">
                <input 
                  type="text" value={guessInput} onChange={(e) => setGuessInput(e.target.value)} disabled={hasGuessed || roundState !== 'ACTIVE'}
                  placeholder={hasGuessed ? "✅ You guessed correctly! Wait for next round..." : "Type your guess here..."}
                  className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 disabled:bg-gray-800/50 disabled:text-green-400 disabled:font-bold" autoComplete="off"
                />
                <button type="submit" disabled={hasGuessed || roundState !== 'ACTIVE' || !guessInput.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold px-6 py-3 rounded-lg">Send</button>
              </form>
            </>
          )}
        </div>

        {/* RIGHT SECTION: Players */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <button onClick={handleLeave} className="w-full flex-shrink-0 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white py-3 rounded-xl font-bold transition-all duration-200">
            Leave Room
          </button>

<div className="bg-gray-800 rounded-xl shadow-lg flex-grow flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-300">
                Leaderboard <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">{participants.length}</span>
              </h3>
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/30">
                🎯 Target: {settings.maxScore}
              </span>
            </div>
            
            <ul className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {[...participants].sort((a, b) => b.score - a.score).map((p, index) => (
                <li key={p.user.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${p.justGuessed ? 'bg-green-900/40 border-green-500/80 shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'bg-gray-700/50 border-gray-600/50'}`}>
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-6 text-center font-bold text-gray-400 text-sm">#{index + 1}</div>
                    <img src={p.user.avatarUrl || 'https://via.placeholder.com/40'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-gray-600" />
                    <div className="flex flex-col flex-grow overflow-hidden">
                      <span className="font-medium truncate flex items-center gap-2">
                        {p.user.username}
                        {p.user.id === roomDetails?.hostUserId && <span title="Room Host" className="text-xs">👑</span>}
                        {p.justGuessed && <span className="text-xs animate-bounce">✅</span>}
                      </span>
                      <span className="text-sm text-blue-400 font-bold">{p.score} pts</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}