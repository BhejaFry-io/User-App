import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomParticipants, getRoomDetails, leaveRoom } from '../api/services';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [roomDetails, setRoomDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch room details exactly ONCE when the component mounts
    const fetchDetails = async () => {
      try {
        const response = await getRoomDetails(roomId);
        if (response.success) {
          setRoomDetails(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch room details", error);
        navigate('/'); // Kick them out if the room doesn't exist
      }
    };
    fetchDetails();
  }, [roomId, navigate]);

  useEffect(() => {
    // Keep polling participants
    const fetchParticipants = async () => {
      try {
        const response = await getRoomParticipants(roomId);
        if (response.success) {
          setParticipants(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch participants", error);
      }
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-3xl font-bold">Waiting Room</h2>
          <button 
            onClick={handleLeave}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Leave Room
          </button>
        </div>

        {/* Use the invite code from our new backend fetch */}
        {roomDetails?.inviteCode && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-gray-400 mb-1">Room Invite Code</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-blue-400">
                {roomDetails.inviteCode}
              </p>
            </div>
            <button 
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                copied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-300">
            Players ({participants.length})
          </h3>
          <ul className="space-y-3">
            {participants.map((p) => (
              <li key={p.user.id} className="flex items-center space-x-4 bg-gray-700 p-3 rounded-lg">
                <img 
                  src={p.user.avatarUrl || 'https://via.placeholder.com/40'} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium text-lg">{p.user.username}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}