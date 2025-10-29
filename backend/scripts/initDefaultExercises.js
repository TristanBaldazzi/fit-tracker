const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const defaultExercises = require('../data/defaultExercises');

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Fonction pour initialiser les exercices par défaut
const initDefaultExercises = async () => {
  try {
    console.log('Initialisation des exercices par défaut...');
    
    // Vérifier si des exercices par défaut existent déjà
    const existingExercises = await Exercise.find({ isCustom: false });
    
    if (existingExercises.length > 0) {
      console.log(`${existingExercises.length} exercices par défaut existent déjà.`);
      console.log('Suppression des anciens exercices par défaut...');
      await Exercise.deleteMany({ isCustom: false });
    }
    
    // Créer un utilisateur système pour les exercices par défaut
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000000');
    
    // Ajouter l'ID système à chaque exercice
    const exercisesWithSystemUser = defaultExercises.map(exercise => ({
      ...exercise,
      creator: systemUserId
    }));
    
    // Insérer les exercices par défaut
    const createdExercises = await Exercise.insertMany(exercisesWithSystemUser);
    
    console.log(`${createdExercises.length} exercices par défaut créés avec succès !`);
    
    // Afficher un résumé par catégorie
    const categories = {};
    createdExercises.forEach(exercise => {
      if (!categories[exercise.category]) {
        categories[exercise.category] = 0;
      }
      categories[exercise.category]++;
    });
    
    console.log('\nRésumé par catégorie :');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} exercices`);
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des exercices:', error);
  }
};

// Fonction principale
const main = async () => {
  await connectDB();
  await initDefaultExercises();
  await mongoose.connection.close();
  console.log('\nInitialisation terminée !');
  process.exit(0);
};

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { initDefaultExercises };


