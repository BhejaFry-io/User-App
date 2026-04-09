import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRoomParticipants, 
  getRoomDetails, 
  leaveRoom, 
  updateRoomCategories,
  getCategories
} from '../api/services';
import { AuthContext } from '../context/AuthContext';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  
  const [roomDetails, setRoomDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [allCategories, setAllCategories] = useState([]); 
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

  const isHost = user?.id && roomDetails?.hostUserId && user.id === roomDetails.hostUserId;

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success) setAllCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch global categories", error);
      }
    };
    fetchAllCategories();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await getRoomDetails(roomId);
        if (response.success) setRoomDetails(response.data);
      } catch (error) {
        navigate('/'); 
      }
    };
    fetchDetails();
  }, [roomId, navigate]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await getRoomParticipants(roomId);
        if (response.success) setParticipants(response.data);
      } catch (error) {}
    };
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleLeave = async () => {
    try {
      await leaveRoom(roomId);
      navigate('/');
    } catch (error) {
      console.error("Failed to leave room", error);
    }
  };

  const copyToClipboard = () => {
    if (roomDetails?.inviteCode) {
      navigator.clipboard.writeText(roomDetails.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentCategoryIds = roomDetails?.categories?.map(c => c.categoryId) || [];

  const handleAddCategory = async (categoryIdToAdd) => {
    setIsUpdating(true);
    setIsDropdownOpen(false); 
    try {
      const newCategoryArray = [...currentCategoryIds, categoryIdToAdd];
      const response = await updateRoomCategories(roomId, newCategoryArray);
      if (response.success) {
        setRoomDetails(prev => ({ ...prev, categories: response.data.categories }));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add category");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveCategory = async (categoryIdToRemove) => {
    setIsUpdating(true);
    try {
      const newCategoryArray = currentCategoryIds.filter(id => id !== categoryIdToRemove);
      const response = await updateRoomCategories(roomId, newCategoryArray);
      if (response.success) {
        setRoomDetails(prev => ({ ...prev, categories: response.data.categories }));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove category");
    } finally {
      setIsUpdating(false);
    }
  };

  const unselectedCategories = allCategories.filter(
    globalCat => !currentCategoryIds.includes(globalCat.id)
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 overflow-hidden">
      
      {/* 3-Column Layout using CSS Grid */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-3rem)]">
        
        {/* ==========================================
            LEFT SECTION: Invite & Host Controls (1/4 Width)
            ========================================== */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Invite Code */}
          {roomDetails?.inviteCode && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg flex flex-col items-center text-center">
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Room Invite Code</p>
              <p className="text-4xl font-mono font-bold tracking-widest text-blue-400 mb-4">
                {roomDetails.inviteCode}
              </p>
              <button 
                onClick={copyToClipboard}
                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                  copied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Code'}
              </button>
            </div>
          )}

          {/* Room Categories & Host Controls */}
          <div className="bg-gray-800 rounded-xl p-5 shadow-lg flex-grow">
            <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Room Settings</h3>
            
            <div className="mb-6">
              <span className="block text-sm text-gray-400 mb-3">Selected Categories:</span>
              <div className="flex flex-wrap gap-2">
                {roomDetails?.categories?.length > 0 ? (
                  roomDetails.categories.map(c => (
                    <div 
                      key={c.categoryId} 
                      className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm"
                    >
                      <span className="truncate max-w-[120px]">{c.category?.name || "Unknown"}</span>
                      {isHost && (
                        <button 
                          onClick={() => handleRemoveCategory(c.categoryId)}
                          disabled={isUpdating}
                          className="ml-2 pl-2 border-l border-blue-500 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 italic text-sm">No categories selected.</span>
                )}
              </div>
            </div>

            {/* Host Controls Dropdown */}
            {isHost && (
              <div className="pt-4 border-t border-gray-700 relative">
                <p className="text-sm text-gray-400 mb-2">Host Controls:</p>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isUpdating || unselectedCategories.length === 0}
                  className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between text-sm font-medium"
                >
                  {unselectedCategories.length === 0 ? "All categories added" : "+ Add Category"}
                  <span className="ml-2 text-xs">{isDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {isDropdownOpen && unselectedCategories.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto custom-scrollbar">
                      {unselectedCategories.map(cat => (
                        <li key={cat.id}>
                          <button
                            onClick={() => handleAddCategory(cat.id)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-600 transition-colors text-sm border-b border-gray-600 last:border-0"
                          >
                            {cat.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            MIDDLE SECTION: Gameplay Area (2/4 Width)
            ========================================== */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 p-6 flex flex-col items-center justify-center relative shadow-inner">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-600 mb-4">Game Area</h2>
            <p className="text-gray-500 italic">Waiting for the host to start the game...</p>
            
            {/* Future Start Game Button Placeholder */}
            {isHost && (
              <button className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 opacity-50 cursor-not-allowed">
                Start Game
              </button>
            )}
          </div>
        </div>

        {/* ==========================================
            RIGHT SECTION: Leave & Players (1/4 Width)
            ========================================== */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          
          {/* Leave Button */}
          <button 
            onClick={handleLeave}
            className="w-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white py-3 rounded-xl font-bold transition-all duration-200"
          >
            Leave Room
          </button>

          {/* Players List */}
          <div className="bg-gray-800 rounded-xl shadow-lg flex-grow flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-lg font-semibold text-gray-300">
                Players <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">{participants.length}</span>
              </h3>
            </div>
            
            <ul className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {participants.map((p) => (
                <li key={p.user.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={p.user.avatarUrl || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full border-2 border-gray-600"
                    />
                    <span className="font-medium">
                      {p.user.username} 
                    </span>
                  </div>
                  {p.user.id === roomDetails?.hostUserId && (
                    <span title="Room Host" className="text-xl">👑</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}