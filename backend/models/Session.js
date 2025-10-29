const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Haut du corps',
      'Bas du corps', 
      'Pectoraux',
      'Dos',
      'Triceps',
      'Biceps',
      'Épaules',
      'Abdominaux',
      'Cardio',
      'Force',
      'Flexibilité',
      'Mixte'
    ],
    default: 'Force'
  },
  muscleGroups: [{
    type: String,
    trim: true
  }],
  
  // Paramètres de l'exercice
  sets: [{
    reps: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      default: 0 // en kg
    },
    duration: {
      type: Number,
      default: 0 // en secondes pour les exercices cardio
    },
    distance: {
      type: Number,
      default: 0 // en mètres
    },
    restTime: {
      type: Number,
      default: 60 // en secondes
    },
    notes: {
      type: String,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Métadonnées
  order: {
    type: Number,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Exercices de la séance
  exercises: [exerciseSchema],
  
  // Métadonnées de la séance
  estimatedDuration: {
    type: Number,
    default: 60 // en minutes
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['Force', 'Cardio', 'Flexibilité', 'Mixte'],
    default: 'Mixte'
  },
  
  // Historique des séances
  completions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    actualDuration: {
      type: Number // en minutes
    },
    notes: {
      type: String,
      trim: true
    },
    exercises: [{
      name: String,
      sets: [{
        reps: Number,
        weight: Number,
        duration: Number,
        distance: Number,
        completed: Boolean
      }]
    }]
  }],
  
  // Paramètres
  isPublic: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index pour les recherches
sessionSchema.index({ creator: 1 });
sessionSchema.index({ isPublic: 1, isTemplate: 1 });
sessionSchema.index({ category: 1, difficulty: 1 });
sessionSchema.index({ name: 'text', description: 'text' });

// Méthode pour calculer la durée estimée
sessionSchema.methods.calculateEstimatedDuration = function() {
  let totalDuration = 0;
  
  this.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      // Durée de l'exercice + temps de repos
      totalDuration += (set.duration || 30) + (set.restTime || 60);
    });
  });
  
  this.estimatedDuration = Math.ceil(totalDuration / 60); // Convertir en minutes
  return this.estimatedDuration;
};

// Méthode pour marquer la séance comme complétée
sessionSchema.methods.markAsCompleted = function(userId, actualDuration, notes) {
  const completion = {
    user: userId,
    completedAt: new Date(),
    actualDuration: actualDuration,
    notes: notes,
    exercises: this.exercises.map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        duration: set.duration,
        distance: set.distance,
        completed: set.completed
      }))
    }))
  };
  
  this.completions.push(completion);
  return completion;
};

// Méthode pour dupliquer une séance
sessionSchema.methods.duplicate = function(newCreatorId) {
  const duplicatedSession = new this.constructor({
    name: `${this.name} (Copie)`,
    description: this.description,
    creator: newCreatorId,
    exercises: this.exercises.map(exercise => ({
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      sets: exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        duration: set.duration,
        distance: set.distance,
        restTime: set.restTime,
        notes: set.notes,
        completed: false
      })),
      order: exercise.order,
      isCompleted: false
    })),
    estimatedDuration: this.estimatedDuration,
    difficulty: this.difficulty,
    category: this.category,
    isPublic: false,
    isTemplate: false,
    tags: this.tags
  });
  
  return duplicatedSession;
};

// Méthode pour obtenir la séance publique
sessionSchema.methods.getPublicSession = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    estimatedDuration: this.estimatedDuration,
    difficulty: this.difficulty,
    category: this.category,
    isPublic: this.isPublic,
    tags: this.tags,
    exercises: this.exercises.map(exercise => ({
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      sets: exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        duration: set.duration,
        distance: set.distance,
        restTime: set.restTime
      })),
      order: exercise.order
    })),
    createdAt: this.createdAt,
    creator: this.creator
  };
};

module.exports = mongoose.model('Session', sessionSchema);
