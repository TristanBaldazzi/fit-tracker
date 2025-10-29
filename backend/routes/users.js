const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, checkPublicProfile } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:userId
// @desc    Obtenir le profil public d'un utilisateur
// @access  Private
router.get('/profile/:userId', authenticateToken, checkPublicProfile, async (req, res) => {
  try {
    const publicProfile = req.targetUser.getPublicProfile();
    
    res.json({
      user: publicProfile
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('username').optional().trim().isLength({ min: 3 }).isAlphanumeric(),
  body('avatar').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { firstName, lastName, username, avatar } = req.body;
    const userId = req.user._id;

    // Vérifier si le nom d'utilisateur est déjà pris
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          message: 'Nom d\'utilisateur déjà utilisé'
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        totalSessionsCompleted: user.totalSessionsCompleted,
        stats: user.stats,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// @route   PUT /api/users/settings
// @desc    Mettre à jour les paramètres utilisateur
// @access  Private
router.put('/settings', authenticateToken, [
  body('isPublic').optional().isBoolean(),
  body('notifications').optional().isBoolean(),
  body('units').optional().isIn(['metric', 'imperial'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const { isPublic, notifications, units } = req.body;
    const userId = req.user._id;

    console.log('Mise à jour paramètres:', { isPublic, notifications, units, userId });

    const updateData = {};
    if (typeof isPublic === 'boolean') updateData['settings.isPublic'] = isPublic;
    if (typeof notifications === 'boolean') updateData['settings.notifications'] = notifications;
    if (units) updateData['settings.units'] = units;

    console.log('Données à mettre à jour:', updateData);

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('Utilisateur mis à jour:', { 
      id: user._id, 
      settings: user.settings,
      isPublic: user.settings.isPublic 
    });

    res.json({
      message: 'Paramètres mis à jour avec succès',
      settings: user.settings
    });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour des paramètres'
    });
  }
});

// @route   GET /api/users/search
// @desc    Rechercher des utilisateurs
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'Terme de recherche requis (minimum 2 caractères)'
      });
    }

    const searchQuery = {
      $and: [
        { _id: { $ne: req.user._id } }, // Exclure l'utilisateur actuel
        { 'settings.isPublic': true }, // Seulement les profils publics
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    };

    const users = await User.find(searchQuery)
      .select('username firstName lastName avatar level xp')
      .limit(parseInt(limit));

    res.json({
      users: users.map(user => ({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp
      }))
    });
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    res.status(500).json({
      message: 'Erreur lors de la recherche d\'utilisateurs'
    });
  }
});

// @route   GET /api/users/stats/:userId
// @desc    Obtenir les statistiques d'un utilisateur
// @access  Private
router.get('/stats/:userId', authenticateToken, checkPublicProfile, async (req, res) => {
  try {
    const user = req.targetUser;
    
    // Calculer les statistiques avancées
    const stats = {
      level: user.level,
      xp: user.xp,
      totalSessionsCompleted: user.totalSessionsCompleted,
      totalWorkoutTime: user.stats.totalWorkoutTime,
      totalWeightLifted: user.stats.totalWeightLifted,
      favoriteExercise: user.stats.favoriteExercise,
      joinDate: user.stats.joinDate,
      
      // Calculs dérivés
      averageWorkoutTime: user.totalSessionsCompleted > 0 
        ? Math.round(user.stats.totalWorkoutTime / user.totalSessionsCompleted)
        : 0,
      xpToNextLevel: Math.pow(user.level, 2) * 100 - user.xp,
      levelProgress: user.xp % 100
    };

    res.json({
      stats
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// @route   POST /api/users/add-xp
// @desc    Ajouter de l'XP à l'utilisateur
// @access  Private
router.post('/add-xp', authenticateToken, [
  body('xp').isInt({ min: 1 }).withMessage('XP doit être un nombre positif')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'XP invalide',
        errors: errors.array()
      });
    }

    const { xp } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Sauvegarder l'ancien niveau pour détecter le passage de niveau
    const oldLevel = user.level;
    
    // Ajouter l'XP
    user.xp += xp;
    
    // Calculer le nouveau niveau en utilisant la méthode du modèle
    const newLevel = user.calculateLevel();
    
    // Corriger le niveau si nécessaire (au cas où il y aurait des incohérences)
    if (user.level !== newLevel) {
      user.level = newLevel;
    }

    await user.save();

    // Vérifier si l'utilisateur a monté de niveau
    const levelUp = newLevel > oldLevel;
    const levelsGained = newLevel - oldLevel;
    
    let message = `+${xp} XP ajouté !`;
    if (levelUp) {
      if (levelsGained === 1) {
        message += `\n\n🎉 Niveau ${oldLevel} → ${newLevel} ! Tu as monté de niveau !`;
      } else {
        message += `\n\n🚀 Niveau ${oldLevel} → ${newLevel} ! Tu as monté de ${levelsGained} niveaux !`;
      }
    }

    res.json({
      message,
      user: {
        xp: user.xp,
        level: user.level
      },
      levelUp,
      levelsGained,
      oldLevel,
      newLevel
    });
  } catch (error) {
    console.error('Erreur ajout XP:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout d\'XP'
    });
  }
});

// @route   GET /api/users/:userId/sessions
// @desc    Obtenir les séances publiques d'un utilisateur
// @access  Private
router.get('/:userId/sessions', authenticateToken, checkPublicProfile, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Récupérer les séances publiques de l'utilisateur
    const sessions = await Session.find({
      creator: userId,
      isPublic: true
    })
    .select('name description estimatedDuration difficulty category exercises tags createdAt')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    res.json({
      message: 'Séances récupérées avec succès',
      sessions: sessions.map(session => session.getPublicSession())
    });
  } catch (error) {
    console.error('Erreur récupération séances utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des séances'
    });
  }
});

// @route   POST /api/users/:userId/sessions/:sessionId/copy
// @desc    Copier une séance d'un autre utilisateur
// @access  Private
router.post('/:userId/sessions/:sessionId/copy', authenticateToken, checkPublicProfile, async (req, res) => {
  try {
    const Session = require('../models/Session');
    const Exercise = require('../models/Exercise');
    const { userId: ownerId, sessionId } = req.params;
    const currentUserId = req.user._id;

    // Récupérer la séance à copier
    const originalSession = await Session.findOne({
      _id: sessionId,
      creator: ownerId,
      isPublic: true
    });

    if (!originalSession) {
      return res.status(404).json({
        message: 'Séance non trouvée ou non publique'
      });
    }

    // Vérifier s'il y a des exercices personnalisés à copier
    const customExercises = [];
    for (const exercise of originalSession.exercises) {
      // Chercher si c'est un exercice personnalisé de l'utilisateur original
      const customExercise = await Exercise.findOne({
        name: exercise.name,
        creator: ownerId,
        isCustom: true
      });

      if (customExercise) {
        // Créer une copie de l'exercice personnalisé pour l'utilisateur actuel
        const copiedExercise = new Exercise({
          name: customExercise.name,
          description: customExercise.description,
          category: customExercise.category,
          muscleGroups: customExercise.muscleGroups,
          creator: currentUserId,
          isCustom: true
        });

        await copiedExercise.save();
        customExercises.push(copiedExercise);
      }
    }

    // Créer la copie de la séance
    const copiedSession = new Session({
      name: `${originalSession.name} (Copie)`,
      description: originalSession.description,
      creator: currentUserId,
      exercises: originalSession.exercises.map(exercise => ({
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
      estimatedDuration: originalSession.estimatedDuration,
      difficulty: originalSession.difficulty,
      category: originalSession.category,
      isPublic: false,
      isTemplate: false,
      tags: [...(originalSession.tags || []), 'copié']
    });

    await copiedSession.save();

    res.status(201).json({
      message: 'Séance copiée avec succès',
      session: {
        _id: copiedSession._id,
        name: copiedSession.name,
        description: copiedSession.description,
        estimatedDuration: copiedSession.estimatedDuration,
        difficulty: copiedSession.difficulty,
        category: copiedSession.category,
        exercises: copiedSession.exercises.length,
        customExercisesCopied: customExercises.length
      },
      customExercises: customExercises.map(ex => ({
        _id: ex._id,
        name: ex.name,
        category: ex.category
      }))
    });
  } catch (error) {
    console.error('Erreur copie séance:', error);
    res.status(500).json({
      message: 'Erreur lors de la copie de la séance'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Changer le mot de passe
// @access  Private
router.post('/change-password', authenticateToken, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Nouveau mot de passe requis (minimum 6 caractères)'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Vérifier que l'utilisateur a un mot de passe (pas Apple Sign-In)
    if (!req.user.password) {
      return res.status(400).json({
        message: 'Impossible de changer le mot de passe pour un compte Apple'
      });
    }

    const user = await User.findById(userId);
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

module.exports = router;
