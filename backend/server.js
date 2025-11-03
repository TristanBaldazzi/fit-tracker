const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true, // Accepte toutes les origines/IPs
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker';

// Options MongoDB pour Atlas (timeouts plus longs pour Vercel)
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // 30 secondes (augmenté pour Vercel)
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000, // 30 secondes
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
};

// Fonction pour connecter MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Tentative de connexion à MongoDB...');
    console.log('📍 URI (masqué):', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Masque le mot de passe
    
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    
    console.log('✅ Connexion à MongoDB réussie');
    console.log(`📊 Base de données: ${mongoose.connection.db?.databaseName || 'inconnue'}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Écouter les événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté');
    });
    
    return true;
  } catch (err) {
    console.error('❌ ERREUR DE CONNEXION MONGODB:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Nom:', err.name);
    
    if (err.message.includes('authentication') || err.message.includes('bad auth')) {
      console.error('💡 PROBLÈME D\'AUTHENTIFICATION:');
      console.error('   - Vérifiez votre nom d\'utilisateur et mot de passe MongoDB');
      console.error('   - Vérifiez que l\'utilisateur existe dans MongoDB Atlas');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.code === 'ENOTFOUND') {
      console.error('💡 PROBLÈME DE RÉSEAU:');
      console.error('   - Vérifiez la whitelist IP dans MongoDB Atlas (Network Access)');
      console.error('   - Assurez-vous d\'avoir ajouté 0.0.0.0/0');
      console.error('   - Attendez 2-3 minutes après avoir modifié la whitelist');
    } else if (err.message.includes('timeout') || err.message.includes('serverSelectionTimeoutMS')) {
      console.error('💡 TIMEOUT DE CONNEXION:');
      console.error('   - MongoDB Atlas ne répond pas');
      console.error('   - Vérifiez votre cluster MongoDB Atlas');
      console.error('   - Vérifiez votre connexion internet');
    }
    
    throw err;
  }
};

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

// Route de debug MongoDB
app.get('/api/debug/mongodb', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: states[mongoState] || 'unknown',
    readyState: mongoState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    hasDb: !!mongoose.connection.db,
    uriConfigured: !!process.env.MONGODB_URI,
    uriMasked: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@') : 'not set'
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

// Démarrer le serveur seulement après la connexion MongoDB
const startServer = async () => {
  try {
    // Connecter MongoDB d'abord
    await connectDB();
    
    // Ensuite démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur FitTrack démarré sur le port ${PORT}`);
      console.log(`📱 API disponible sur http://localhost:${PORT}/api`);
      console.log(`👨‍💻 Développé par Tristan Baldazzi`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
};

// Démarrer l'application
startServer();

module.exports = app;
