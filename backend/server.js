const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

const PLAYER_NAMES = [
  'soeholt',
  'preak-',
  'nachtm0nkeyy',
  'rinor_D',
  'tingzg0d',
  'StorkeN1'
];

app.get('/api/players', async (req, res) => {
  try {
    const allPlayers = await Promise.all(
      PLAYER_NAMES.map(async (playerName) => {
        const response = await axios.get(
          `https://open.faceit.com/data/v4/players?nickname=${playerName}`,
          { headers: { Authorization: `Bearer ${FACEIT_API_KEY}` }}
        );

        const playerId = response.data.player_id;
        
        // Get anchor count from database (or 0 if doesn't exist)
        let anchorData = db.prepare('SELECT count FROM anchor_counts WHERE player_id = ?').get(playerId);
        
        // If player doesn't exist in database yet, create them with count 0
        if (!anchorData) {
          db.prepare('INSERT INTO anchor_counts (player_id, count) VALUES (?, 0)').run(playerId);
          anchorData = { count: 0 };
        }

        return {
          playerId: response.data.player_id,
          nickname: response.data.nickname,
          avatar: response.data.avatar,
          country: response.data.country,
          anchorCount: anchorData.count
        };
      })
    );
    res.json(allPlayers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/anchor-count/:playerId/decrement', (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Get current count
    const current = db.prepare('SELECT count FROM anchor_counts WHERE player_id = ?').get(playerId);
    
    // Only decrement if count is greater than 0
    if (current && current.count > 0) {
      db.prepare('UPDATE anchor_counts SET count = count - 1 WHERE player_id = ?').run(playerId);
    }
    
    // Get the updated count
    const updated = db.prepare('SELECT * FROM anchor_counts WHERE player_id = ?').get(playerId);
    
    res.json(updated);
  } catch (error) {
    console.error('Error decrementing anchor count:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/anchor-count/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Increment the count by 1
    db.prepare('UPDATE anchor_counts SET count = count + 1 WHERE player_id = ?').run(playerId);
    
    // Get the updated count
    const updated = db.prepare('SELECT * FROM anchor_counts WHERE player_id = ?').get(playerId);
    
    res.json(updated);
  } catch (error) {
    console.error('Error incrementing anchor count:', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/anchor-count/:playerId/update', (req, res) => {
  try {
    const { playerId } = req.params;
    const { amount } = req.body;
    
    // Get current count
    const current = db.prepare('SELECT count FROM anchor_counts WHERE player_id = ?').get(playerId);
    
    // Calculate new count (don't go below 0)
    const newCount = Math.max(0, (current?.count || 0) + amount);
    
    // Update the count
    db.prepare('UPDATE anchor_counts SET count = ? WHERE player_id = ?').run(newCount, playerId);
    
    // Get the updated count
    const updated = db.prepare('SELECT * FROM anchor_counts WHERE player_id = ?').get(playerId);
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating anchor count:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('Server running on port' + ` ${PORT}`);
});

