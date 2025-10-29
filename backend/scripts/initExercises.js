const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const exercises = require('../data/exercises');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker')
  .then(() => console.log('✅ Connexion à MongoDB réussie'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

async function initExercises() {
  try {
    console.log('🔄 Initialisation des exercices...');
    
    // Supprimer les exercices par défaut existants
    await Exercise.deleteMany({ isDefault: true });
    console.log('🗑️ Anciens exercices supprimés');
    
    // Insérer les nouveaux exercices
    const insertedExercises = await Exercise.insertMany(exercises);
    console.log(`✅ ${insertedExercises.length} exercices insérés avec succès`);
    
    // Afficher les statistiques par catégorie
    const stats = await Exercise.aggregate([
      { $match: { isDefault: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Statistiques par catégorie:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} exercices`);
    });
    
    console.log('\n🎉 Initialisation terminée avec succès!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
initExercises();


