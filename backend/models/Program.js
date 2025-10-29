const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
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
  
  // Informations du programme
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'mixed'],
    default: 'mixed'
  },
  estimatedDuration: {
    type: Number, // en semaines
    default: 4
  },
  
  // Sessions du programme
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  
  // Métadonnées
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
  }],
  
  // Statistiques
  stats: {
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index pour les recherches
programSchema.index({ creator: 1 });
programSchema.index({ isPublic: 1, isTemplate: 1 });
programSchema.index({ category: 1, difficulty: 1 });
programSchema.index({ name: 'text', description: 'text' });

// Middleware pour calculer la durée estimée
programSchema.pre('save', function(next) {
  if (this.sessions && this.sessions.length > 0) {
    // Estimation basée sur le nombre de sessions (4 sessions = 1 semaine)
    this.estimatedDuration = Math.ceil(this.sessions.length / 4);
  }
  next();
});

// Méthode pour ajouter une session
programSchema.methods.addSession = function(sessionId) {
  if (!this.sessions.includes(sessionId)) {
    this.sessions.push(sessionId);
  }
};

// Méthode pour supprimer une session
programSchema.methods.removeSession = function(sessionId) {
  this.sessions = this.sessions.filter(id => !id.equals(sessionId));
};

// Méthode pour obtenir le programme public
programSchema.methods.getPublicProgram = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    difficulty: this.difficulty,
    category: this.category,
    estimatedDuration: this.estimatedDuration,
    isPublic: this.isPublic,
    tags: this.tags,
    stats: this.stats,
    createdAt: this.createdAt,
    creator: this.creator
  };
};

module.exports = mongoose.model('Program', programSchema);

