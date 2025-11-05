const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Informations de base
  email: {
    type: String,
    required: function() {
      return !this.appleId; // Email requis si pas d'Apple ID
    },
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.appleId; // Mot de passe requis si pas d'Apple ID
    },
    minlength: 6
  },
  
  // Apple Sign-In
  appleId: {
    type: String,
    sparse: true
  },
  
  // Vérification email
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  lastVerificationEmailSent: {
    type: Date,
    default: null
  },
  
  // Réinitialisation de mot de passe
  resetPasswordCode: {
    type: String,
    default: null
  },
  resetPasswordCodeExpires: {
    type: Date,
    default: null
  },
  lastResetPasswordEmailSent: {
    type: Date,
    default: null
  },
  
  // Profil utilisateur
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  lastUsernameChange: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Système de progression
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  totalSessionsCompleted: {
    type: Number,
    default: 0
  },
  
  // Statistiques
  stats: {
    totalWorkoutTime: {
      type: Number,
      default: 0 // en minutes
    },
    totalWeightLifted: {
      type: Number,
      default: 0 // en kg
    },
    favoriteExercise: {
      type: String,
      default: null
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Paramètres
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    }
  },
  
  // Notifications push
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index pour les recherches
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ appleId: 1 });
userSchema.index({ level: -1, xp: -1 }); // Pour le classement

// Middleware pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour calculer le niveau basé sur l'XP
userSchema.methods.calculateLevel = function() {
  // Formule: niveau = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(this.xp / 100)) + 1;
};

// Méthode pour ajouter de l'XP
userSchema.methods.addXP = function(amount) {
  this.xp += amount;
  const newLevel = this.calculateLevel();
  
  if (newLevel > this.level) {
    this.level = newLevel;
    return { levelUp: true, newLevel, xpGained: amount };
  }
  
  return { levelUp: false, xpGained: amount };
};

// Méthode pour obtenir le profil public
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar,
    level: this.level,
    xp: this.xp,
    totalSessionsCompleted: this.totalSessionsCompleted,
    stats: {
      totalWorkoutTime: this.stats.totalWorkoutTime,
      totalWeightLifted: this.stats.totalWeightLifted,
      favoriteExercise: this.stats.favoriteExercise,
      joinDate: this.stats.joinDate
    }
  };
};

module.exports = mongoose.model('User', userSchema);
