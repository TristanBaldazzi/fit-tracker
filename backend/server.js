const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker')
.then(() => console.log('✅ Connexion à MongoDB réussie'))
.catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'FitTrack API is running!', 
    author: 'Tristan Baldazzi',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur FitTrack démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}/api`);
  console.log(`👨‍💻 Développé par Tristan Baldazzi`);
});

module.exports = app;
