import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { createRoom, joinRoom } from '../api/services';
import { AuthContext } from '../context/AuthContext'; // Import your context

export default function Lobby() {
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();
  
  // Pull user state and auth functions from context
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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold text-white mb-8">Popsauce Clone</h1>
      
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        
        {/* CONDITIONAL RENDERING BASED ON AUTH STATE */}
        {!user ? (
          <div className="flex flex-col items-center justify-center py-6">
            <h2 className="text-xl text-gray-300 mb-6 text-center">Login to play</h2>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                // Pass the Google JWT to your AuthContext login function
                login(credentialResponse.credential);
              }}
              onError={() => {
                console.log('Login Failed');
              }}
            />
          </div>
        ) : (
          <>
            {/* User Info & Logout */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full" />
                <span className="text-white font-medium">{user.username}</span>
              </div>
              <button 
                onClick={logout}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Room Controls */}
            <button 
              onClick={handleCreateRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mb-6 transition-colors"
            >
              Create Private Room
            </button>

            <div className="flex items-center mb-6">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="px-3 text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter Invite Code" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                maxLength={6}
              />
              <button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Join Room
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}