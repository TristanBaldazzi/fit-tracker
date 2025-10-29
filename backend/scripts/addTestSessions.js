const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker');
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Fonction pour créer des séances personnalisées pour l'utilisateur de test
const addTestSessions = async () => {
  try {
    console.log('🔧 Ajout de séances personnalisées à l\'utilisateur de test...');
    
    // Trouver l'utilisateur de test
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Utilisateur de test non trouvé. Exécutez d\'abord createTestUser.js');
      return;
    }
    
    console.log(`👤 Utilisateur trouvé: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    
    // Supprimer les anciennes séances de test
    await Session.deleteMany({ creator: testUser._id });
    console.log('🧹 Anciennes séances supprimées');
    
    // Séances personnalisées à créer
    const testSessions = [
      {
        name: "Séance Force - Pectoraux",
        description: "Séance intensive pour développer les pectoraux avec des exercices de force",
        category: "Force",
        difficulty: "hard",
        estimatedDuration: 75,
        exercises: [
          {
            name: "Développé couché lourd",
            category: "Force",
            muscleGroups: ["Pectoraux", "Triceps", "Épaules"],
            order: 1,
            sets: [
              { reps: 5, weight: 80, restTime: 180, notes: "Échauffement" },
              { reps: 5, weight: 100, restTime: 180, notes: "Série principale" },
              { reps: 5, weight: 120, restTime: 240, notes: "Série lourde" },
              { reps: 8, weight: 90, restTime: 120, notes: "Série de finition" }
            ]
          },
          {
            name: "Développé incliné",
            category: "Force",
            muscleGroups: ["Pectoraux", "Triceps", "Épaules"],
            order: 2,
            sets: [
              { reps: 8, weight: 60, restTime: 120 },
              { reps: 8, weight: 70, restTime: 120 },
              { reps: 6, weight: 80, restTime: 150 }
            ]
          },
          {
            name: "Dips lestés",
            category: "Force",
            muscleGroups: ["Triceps", "Pectoraux"],
            order: 3,
            sets: [
              { reps: 10, weight: 10, restTime: 90 },
              { reps: 8, weight: 15, restTime: 90 },
              { reps: 6, weight: 20, restTime: 120 }
            ]
          }
        ]
      },
      {
        name: "Séance Cardio Intense",
        description: "Séance de cardio haute intensité pour améliorer l'endurance",
        category: "Cardio",
        difficulty: "hard",
        estimatedDuration: 45,
        exercises: [
          {
            name: "Burpees",
            category: "Mixte",
            muscleGroups: ["Tout le corps"],
            order: 1,
            sets: [
              { reps: 15, duration: 0, restTime: 60 },
              { reps: 20, duration: 0, restTime: 60 },
              { reps: 25, duration: 0, restTime: 60 },
              { reps: 30, duration: 0, restTime: 90 }
            ]
          },
          {
            name: "Mountain climbers",
            category: "Mixte",
            muscleGroups: ["Abdominaux", "Core", "Épaules"],
            order: 2,
            sets: [
              { reps: 30, duration: 30, restTime: 60 },
              { reps: 40, duration: 30, restTime: 60 },
              { reps: 50, duration: 30, restTime: 60 }
            ]
          },
          {
            name: "Corde à sauter",
            category: "Cardio",
            muscleGroups: ["Tout le corps"],
            order: 3,
            sets: [
              { reps: 1, duration: 180, restTime: 60 },
              { reps: 1, duration: 180, restTime: 60 },
              { reps: 1, duration: 180, restTime: 60 }
            ]
          }
        ]
      },
      {
        name: "Séance Flexibilité & Yoga",
        description: "Séance de récupération et d'amélioration de la flexibilité",
        category: "Flexibilité",
        difficulty: "easy",
        estimatedDuration: 60,
        exercises: [
          {
            name: "Yoga flow",
            category: "Flexibilité",
            muscleGroups: ["Tout le corps"],
            order: 1,
            sets: [
              { reps: 1, duration: 600, restTime: 0, notes: "Séquence de 10 minutes" },
              { reps: 1, duration: 600, restTime: 0, notes: "Séquence de 10 minutes" },
              { reps: 1, duration: 600, restTime: 0, notes: "Séquence de 10 minutes" }
            ]
          },
          {
            name: "Étirements des ischio-jambiers",
            category: "Flexibilité",
            muscleGroups: ["Ischio-jambiers", "Fessiers"],
            order: 2,
            sets: [
              { reps: 1, duration: 300, restTime: 30, notes: "Étirement statique" },
              { reps: 1, duration: 300, restTime: 30, notes: "Étirement statique" }
            ]
          },
          {
            name: "Étirements des épaules",
            category: "Flexibilité",
            muscleGroups: ["Épaules", "Pectoraux"],
            order: 3,
            sets: [
              { reps: 1, duration: 180, restTime: 30, notes: "Étirement des deltoïdes" },
              { reps: 1, duration: 180, restTime: 30, notes: "Étirement des pectoraux" }
            ]
          }
        ]
      },
      {
        name: "Séance Mixte - Full Body",
        description: "Séance complète combinant force et cardio pour tout le corps",
        category: "Mixte",
        difficulty: "medium",
        estimatedDuration: 90,
        exercises: [
          {
            name: "Thruster",
            category: "Mixte",
            muscleGroups: ["Quadriceps", "Fessiers", "Épaules", "Triceps"],
            order: 1,
            sets: [
              { reps: 12, weight: 20, restTime: 90 },
              { reps: 10, weight: 25, restTime: 90 },
              { reps: 8, weight: 30, restTime: 120 },
              { reps: 6, weight: 35, restTime: 120 }
            ]
          },
          {
            name: "Kettlebell swing",
            category: "Mixte",
            muscleGroups: ["Dos", "Fessiers", "Ischio-jambiers", "Épaules"],
            order: 2,
            sets: [
              { reps: 15, weight: 16, restTime: 60 },
              { reps: 15, weight: 20, restTime: 60 },
              { reps: 12, weight: 24, restTime: 90 },
              { reps: 10, weight: 28, restTime: 90 }
            ]
          },
          {
            name: "Squat",
            category: "Force",
            muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
            order: 3,
            sets: [
              { reps: 15, weight: 40, restTime: 90 },
              { reps: 12, weight: 50, restTime: 90 },
              { reps: 10, weight: 60, restTime: 120 },
              { reps: 8, weight: 70, restTime: 120 }
            ]
          },
          {
            name: "Tractions",
            category: "Force",
            muscleGroups: ["Dos", "Biceps", "Grands dorsaux"],
            order: 4,
            sets: [
              { reps: 8, weight: 0, restTime: 90 },
              { reps: 6, weight: 5, restTime: 90 },
              { reps: 5, weight: 10, restTime: 120 },
              { reps: 4, weight: 15, restTime: 120 }
            ]
          }
        ]
      },
      {
        name: "Séance Triceps Spécialisée",
        description: "Séance dédiée au développement des triceps",
        category: "Force",
        difficulty: "medium",
        estimatedDuration: 50,
        exercises: [
          {
            name: "Extension triceps",
            category: "Triceps",
            muscleGroups: ["Triceps"],
            order: 1,
            sets: [
              { reps: 12, weight: 15, restTime: 60 },
              { reps: 10, weight: 20, restTime: 60 },
              { reps: 8, weight: 25, restTime: 90 },
              { reps: 6, weight: 30, restTime: 90 }
            ]
          },
          {
            name: "Dips",
            category: "Triceps",
            muscleGroups: ["Triceps", "Pectoraux"],
            order: 2,
            sets: [
              { reps: 15, weight: 0, restTime: 60 },
              { reps: 12, weight: 5, restTime: 60 },
              { reps: 10, weight: 10, restTime: 90 },
              { reps: 8, weight: 15, restTime: 90 }
            ]
          },
          {
            name: "Pompes diamant",
            category: "Triceps",
            muscleGroups: ["Triceps", "Pectoraux"],
            order: 3,
            sets: [
              { reps: 12, weight: 0, restTime: 60 },
              { reps: 10, weight: 0, restTime: 60 },
              { reps: 8, weight: 0, restTime: 90 }
            ]
          },
          {
            name: "Extension triceps couché",
            category: "Triceps",
            muscleGroups: ["Triceps"],
            order: 4,
            sets: [
              { reps: 15, weight: 12, restTime: 60 },
              { reps: 12, weight: 15, restTime: 60 },
              { reps: 10, weight: 18, restTime: 90 }
            ]
          }
        ]
      }
    ];
    
    // Créer les séances
    const createdSessions = [];
    for (const sessionData of testSessions) {
      const session = new Session({
        ...sessionData,
        creator: testUser._id,
      isPublic: false,
      isTemplate: false,
      tags: []
      });
      
      // Calculer la durée estimée
      session.calculateEstimatedDuration();
      
      await session.save();
      createdSessions.push(session);
      console.log(`✅ Séance créée: ${session.name} (${session.estimatedDuration}min)`);
    }
    
    console.log(`\n🎉 ${createdSessions.length} séances personnalisées créées avec succès !`);
    
    // Afficher un résumé
    console.log('\n📊 Résumé des séances créées:');
    createdSessions.forEach(session => {
      console.log(`   - ${session.name}: ${session.category} (${session.difficulty}) - ${session.estimatedDuration}min`);
    });
    
    // Mettre à jour le nombre de séances complétées de l'utilisateur
    testUser.totalSessionsCompleted = createdSessions.length;
    await testUser.save();
    console.log(`\n👤 Utilisateur mis à jour: ${testUser.totalSessionsCompleted} séances`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des séances:', error);
    throw error;
  }
};

// Fonction principale
const main = async () => {
  try {
    await connectDB();
    await addTestSessions();
    console.log('\n🎉 Script terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur dans le script:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { addTestSessions };
