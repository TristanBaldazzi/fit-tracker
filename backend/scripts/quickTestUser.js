const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createQuickTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker');
    console.log('✅ Connecté à MongoDB');

    // Supprimer l'ancien utilisateur de test s'il existe
    await User.deleteOne({ email: 'test@example.com' });
    console.log('🧹 Ancien utilisateur de test supprimé');

    // Créer un nouvel utilisateur de test
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      emailVerified: true,
      level: 5,
      xp: 250,
      totalSessionsCompleted: 3,
      stats: {
        totalWorkoutTime: 180,
        totalWeightLifted: 1500,
        favoriteExercise: 'Squat',
        joinDate: new Date()
      },
      settings: {
        isPublic: true,
        notifications: true,
        units: 'metric'
      }
    });

    await user.save();
    console.log('✅ Utilisateur de test créé !');
    console.log(`📧 Email: test@example.com`);
    console.log(`🔑 Mot de passe: password123`);
    console.log(`👤 Username: testuser`);
    console.log(`✅ Email vérifié: ${user.emailVerified}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté');
  }
}

createQuickTestUser();

