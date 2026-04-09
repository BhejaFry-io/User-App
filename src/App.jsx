import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      {/* The :roomId parameter is extracted by the useParams hook in the Room component */}
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
}

export default App;