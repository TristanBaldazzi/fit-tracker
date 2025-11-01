const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
require('dotenv').config();

async function addCompletedSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker');
    console.log('✅ Connecté à MongoDB');

    // Trouver l'utilisateur de test
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Utilisateur de test non trouvé');
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${testUser.firstName} ${testUser.lastName}`);

    // Récupérer les séances de l'utilisateur
    const sessions = await Session.find({ creator: testUser._id });
    console.log(`📝 ${sessions.length} séances trouvées`);

    // Ajouter des séances complétées avec des dates différentes
    const completedSessions = [
      {
        sessionId: sessions[0]._id,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        actualDuration: 25,
        notes: 'Séance intense, très satisfait !'
      },
      {
        sessionId: sessions[1]._id,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        actualDuration: 20,
        notes: 'Cardio difficile mais efficace'
      },
      {
        sessionId: sessions[2]._id,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 1 semaine
        actualDuration: 45,
        notes: 'Séance de récupération parfaite'
      },
      {
        sessionId: sessions[3]._id,
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        actualDuration: 30,
        notes: 'Full body complet, excellent entraînement'
      },
      {
        sessionId: sessions[4]._id,
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Il y a 2 semaines
        actualDuration: 22,
        notes: 'Triceps bien travaillés'
      }
    ];

    // Ajouter les séances complétées
    for (const completedSession of completedSessions) {
      const session = await Session.findById(completedSession.sessionId);
      if (session) {
        // Créer les données de la séance complétée
        const completionData = {
          user: testUser._id,
          completedAt: completedSession.completedAt,
          actualDuration: completedSession.actualDuration,
          notes: completedSession.notes,
          exercises: session.exercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets.map(set => ({
              reps: set.reps,
              weight: set.weight,
              duration: set.duration,
              distance: set.distance,
              completed: true // Marquer comme complété
            }))
          }))
        };

        // Ajouter la completion à la séance
        session.completions.push(completionData);
        await session.save();

        console.log(`✅ Séance complétée ajoutée: ${session.name} (${completedSession.completedAt.toLocaleDateString()})`);
      }
    }

    // Mettre à jour le nombre de séances complétées de l'utilisateur
    testUser.totalSessionsCompleted = completedSessions.length;
    await testUser.save();

    console.log(`\n🎉 ${completedSessions.length} séances complétées ajoutées !`);
    console.log(`👤 Utilisateur mis à jour: ${testUser.totalSessionsCompleted} séances complétées`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté');
  }
}

addCompletedSessions();

