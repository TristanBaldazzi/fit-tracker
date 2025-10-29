const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Haut du corps',
      'Bas du corps', 
      'Dos',
      'Pectoraux',
      'Triceps',
      'Abdominaux',
      'Cardio',
      'Force',
      'Flexibilité',
      'Mixte'
    ]
  },
  muscleGroups: [{
    type: String,
    enum: [
      'Pectoraux',
      'Dos',
      'Épaules',
      'Biceps',
      'Triceps',
      'Avant-bras',
      'Abdominaux',
      'Obliques',
      'Quadriceps',
      'Ischio-jambiers',
      'Fessiers',
      'Mollets',
      'Trapèzes',
      'Grands dorsaux',
      'Rhomboïdes',
      'Core',
      'Tout le corps',
      'Cardio'
    ]
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isCustom: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour les recherches
exerciseSchema.index({ name: 'text', description: 'text' });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ creator: 1 });
exerciseSchema.index({ isPublic: 1 });

// Méthode pour incrémenter le compteur d'utilisation
exerciseSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Méthode statique pour obtenir les exercices de base
exerciseSchema.statics.getBaseExercises = function() {
  return this.find({ isCustom: false });
};

// Méthode statique pour obtenir les exercices de l'utilisateur
exerciseSchema.statics.getUserExercises = function(userId) {
  return this.find({ 
    $or: [
      { creator: userId },
      { isCustom: false }
    ]
  }).sort({ isCustom: 1, name: 1 });
};

// Méthode statique pour obtenir les exercices publics
exerciseSchema.statics.getPublicExercises = function() {
  return this.find({ 
    $or: [
      { isPublic: true },
      { isCustom: false }
    ]
  }).sort({ isCustom: 1, name: 1 });
};

module.exports = mongoose.model('Exercise', exerciseSchema);