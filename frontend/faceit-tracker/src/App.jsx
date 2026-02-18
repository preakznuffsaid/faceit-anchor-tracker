import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Team selection
  const [showTeamSelection, setShowTeamSelection] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const ADMIN_PASSWORD = 'bot123';

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/players`);
      setPlayers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const updateAnchor = async (playerId, amount) => {
    if (!isAdmin) {
      setShowPasswordModal(true);
      return;
    }
    try {
      await axios.post(`${API_URL}/api/anchor-count/${playerId}/update`, { amount });
      fetchPlayers();
    } catch (error) {
      console.error('Error updating anchor count:', error);
    }
  };

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllPlayers = () => {
    setSelectedPlayers(players.map(p => p.playerId));
  };

  const startSession = () => {
    if (selectedPlayers.length >= 4) {
      setShowTeamSelection(false);
    }
  };

  // Filter players based on selection
  const activePlayers = showTeamSelection 
    ? players 
    : players.filter(p => selectedPlayers.includes(p.playerId));

  // Find the lowest anchor count among active players
  const lowestAnchorCount = activePlayers.length > 0 
    ? Math.min(...activePlayers.map(p => p.anchorCount))
    : 0;

  if (loading) return <div className="text-center mt-10 text-xl text-white">Loading...</div>;

  // Team Selection Screen
  if (showTeamSelection) {
    return (
      <div className="min-h-screen bg-gray-900 py-10">
        <h1 className="text-4xl font-bold text-center mb-6 text-white">vælg stacken</h1>
        <p className="text-center text-gray-400 mb-8">skal være 4-5</p>

        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={selectAllPlayers}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded transition"
            >
              Vælg alle ({players.length})
            </button>
            <button
              onClick={() => setSelectedPlayers([])}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded transition"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {players.map((player) => {
              const isSelected = selectedPlayers.includes(player.playerId);
              return (
                <div
                  key={player.playerId}
                  onClick={() => togglePlayerSelection(player.playerId)}
                  className={`cursor-pointer bg-gray-800 rounded-lg p-4 transition ${
                    isSelected ? 'ring-4 ring-orange-500' : 'hover:bg-gray-700'
                  }`}
                >
                  <img
                    src={player.avatar || 'https://via.placeholder.com/150'}
                    alt={player.nickname}
                    className="w-20 h-20 rounded-full mx-auto mb-2 border-2 border-orange-500"
                  />
                  <h3 className="text-lg font-semibold text-center text-white">
                    {player.nickname}
                  </h3>
                  <p className="text-gray-400 text-center text-sm">
                    {player.anchorCount} pts
                  </p>
                  {isSelected && (
                    <div className="text-center mt-2">
                      <span className="text-orange-500 text-2xl">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">
              {selectedPlayers.length} / {players.length}
            </p>
            <button
              onClick={startSession}
              disabled={selectedPlayers.length < 4}
              className={`font-semibold py-3 px-8 rounded transition text-lg ${
                selectedPlayers.length >= 4
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Start →
            </button>
            {selectedPlayers.length < 4 && (
              <p className="text-red-500 text-sm mt-2">
                mindst 4 spillere
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main App (after team selection)
  return (
    <div className="min-h-screen bg-gray-900 py-10">
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center px-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md border-2 border-orange-500">
            <h2 className="text-2xl font-bold text-white text-center mb-6">🔒 haha nej</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:outline-none"
                  placeholder="Password"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-4 mb-6">
        <button
          onClick={() => setShowTeamSelection(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-semibold"
        >
          ← Nyt hold
        </button>
        <h1 className="text-4xl font-bold text-center flex-1 text-white">Anchor Tracker</h1>
        {isAdmin ? (
          <button
            onClick={() => setIsAdmin(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-semibold"
          >
            Login
          </button>
        )}
      </div>

      <p className="text-center text-gray-400 mb-6">
        stacken: {activePlayers.map(p => p.nickname).join(', ')}
      </p>
      
      {/* Rules Box */}
      <div className="max-w-md mx-auto mb-10 bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-orange-500">
        <h2 className="text-2xl font-bold text-orange-500 mb-4 text-center">📋 Rules</h2>
        <div className="space-y-2 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔴</span>
            <p><span className="font-semibold">Start T-side:</span> +3 points</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔵</span>
            <p><span className="font-semibold">Start CT-side:</span> +5 points</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <p><span className="font-semibold">20+ rounds played:</span> +10 points</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <p><span className="font-semibold">After each game:</span> -1 point</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
             <span className="text-red-500 font-bold">lowest score</span> anchors next
          </p>
        </div>
      </div>

      {/* Players Grid */}
      <div className="flex gap-6 justify-center flex-wrap px-4">
        {activePlayers.map((player) => {
          const isLowest = player.anchorCount === lowestAnchorCount;
          
          return (
            <div 
              key={player.playerId} 
              className={`bg-gray-800 rounded-lg shadow-lg p-6 w-72 ${
                isLowest ? 'ring-4 ring-red-500' : ''
              }`}
            >
              <img 
                src={player.avatar || 'https://via.placeholder.com/150'} 
                alt={player.nickname} 
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-orange-500"
              />
              <h3 className="text-xl font-semibold text-center text-white">{player.nickname}</h3>
              <p className="text-gray-400 text-center uppercase mb-4">{player.country}</p>
              
              <div className="text-center mb-4">
                <p className="text-gray-300 text-sm">Points</p>
                <p className="text-3xl font-bold text-white">{player.anchorCount}</p>
                {isLowest && <p className="text-red-500 text-sm font-bold mt-1">🎯 NÆSTE ANCHOR</p>}
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => updateAnchor(player.playerId, 3)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded transition text-sm"
                  >
                    🔴 +3
                  </button>
                  <button
                    onClick={() => updateAnchor(player.playerId, 5)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded transition text-sm"
                  >
                    🔵 +5
                  </button>
                  <button
                    onClick={() => updateAnchor(player.playerId, 10)}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded transition text-sm"
                  >
                    ⏱️ +10
                  </button>
                </div>
                <button
                  onClick={() => updateAnchor(player.playerId, -1)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
                >
                  🎮 Game Played (-1)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;