const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const Exercise = require('../models/Exercise');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sessions
// @desc    Obtenir les sessions de l'utilisateur
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isTemplate, category, difficulty } = req.query;
    const userId = req.user._id;

    const query = { 
      creator: userId,
      isDeleted: false // Exclure les séances supprimées de la liste
    };
    if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 });

    res.json({
      sessions: sessions.map(session => ({
        _id: session._id,
        name: session.name,
        description: session.description,
        estimatedDuration: session.estimatedDuration,
        difficulty: session.difficulty,
        category: session.category,
        exercises: session.exercises,
        isPublic: session.isPublic,
        isTemplate: session.isTemplate,
        tags: session.tags,
        completions: session.completions.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }))
    });
  } catch (error) {
    console.error('Erreur récupération sessions:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des sessions'
    });
  }
});

// @route   GET /api/sessions/public
// @desc    Obtenir les sessions publiques
// @access  Private
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, limit = 20, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { 
      isPublic: true,
      isDeleted: false, // Exclure les séances supprimées
      creator: { $ne: userId } // Exclure les sessions de l'utilisateur
    };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find(query)
      .populate('creator', 'username firstName lastName avatar level')
      .sort({ 'completions': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      sessions: sessions.map(session => ({
        _id: session._id,
        name: session.name,
        description: session.description,
        estimatedDuration: session.estimatedDuration,
        difficulty: session.difficulty,
        category: session.category,
        exercises: session.exercises,
        tags: session.tags,
        completions: session.completions.length,
        creator: session.creator,
        createdAt: session.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSessions: total,
        hasNext: skip + sessions.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur récupération sessions publiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des sessions publiques'
    });
  }
});

// GET /api/sessions/completed - Récupérer les séances terminées (historique)
router.get('/completed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Trouver toutes les séances qui ont des completions pour cet utilisateur
    const sessionsWithCompletions = await Session.find({
      'completions.user': userId
    })
    .populate('creator', 'username firstName lastName avatar level');

    // Transformer les données pour créer une entrée pour chaque completion
    const completedSessions = [];
    
    sessionsWithCompletions.forEach(session => {
      // Trouver toutes les completions de cet utilisateur pour cette séance
      const userCompletions = session.completions.filter(completion => 
        completion.user.toString() === userId.toString()
      );
      
      // Créer une entrée pour chaque completion
      userCompletions.forEach(completion => {
        completedSessions.push({
          _id: session._id,
          completionId: completion._id, // ID unique de la completion
          name: session.name,
          description: session.description,
          creator: session.creator,
          exercises: session.exercises,
          estimatedDuration: session.estimatedDuration,
          difficulty: session.difficulty,
          category: session.category,
          isPublic: session.isPublic,
          tags: session.tags,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          // Données de completion
          completedAt: completion.completedAt,
          actualDuration: completion.actualDuration,
          notes: completion.notes,
          completedExercises: completion.exercises,
          xpGained: completion.exercises ? 
            completion.exercises.reduce((total, exercise) => 
              total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
            ) * 10 : 0 // 10 XP par série complétée
        });
      });
    });
    
    // Trier par date de completion (plus récentes en premier)
    completedSessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    res.json({
      success: true,
      sessions: completedSessions
    });
  } catch (error) {
    console.error('Erreur récupération séances terminées:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// GET /api/sessions/completed/:id - Récupérer une séance terminée spécifique
router.get('/completed/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Si l'ID contient un completionId (format: sessionId_completionId)
    if (id.includes('_')) {
      const [sessionId, completionId] = id.split('_');
      
      const session = await Session.findOne({
        _id: sessionId,
        'completions.user': userId,
        'completions._id': completionId
      }).populate('creator', 'username firstName lastName avatar level');

      if (!session) {
        return res.status(404).json({
          message: 'Séance terminée non trouvée'
        });
      }

      // Trouver la completion spécifique
      const userCompletion = session.completions.find(completion => 
        completion._id.toString() === completionId
      );

      if (!userCompletion) {
        return res.status(404).json({
          message: 'Séance terminée non trouvée'
        });
      }

      // Transformer les données pour inclure les informations de completion
      const completedSession = {
        _id: session._id,
        completionId: userCompletion._id,
        name: session.name,
        description: session.description,
        creator: session.creator,
        exercises: session.exercises,
        estimatedDuration: session.estimatedDuration,
        difficulty: session.difficulty,
        category: session.category,
        isPublic: session.isPublic,
        tags: session.tags,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        // Données de completion
        completedAt: userCompletion.completedAt,
        actualDuration: userCompletion.actualDuration,
        notes: userCompletion.notes,
        completedExercises: userCompletion.exercises,
        xpGained: userCompletion.exercises ? 
          userCompletion.exercises.reduce((total, exercise) => 
            total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
          ) * 10 : 0 // 10 XP par série complétée
      };

      res.json({
        success: true,
        session: completedSession
      });
    } else {
      // Ancien format - récupérer la completion la plus récente
      const session = await Session.findOne({
        _id: id,
        'completions.user': userId
      }).populate('creator', 'username firstName lastName avatar level');

      if (!session) {
        return res.status(404).json({
          message: 'Séance terminée non trouvée'
        });
      }

      // Trouver la completion la plus récente
      const userCompletions = session.completions.filter(completion => 
        completion.user.toString() === userId.toString()
      );
      
      const userCompletion = userCompletions.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      )[0];

      if (!userCompletion) {
        return res.status(404).json({
          message: 'Séance terminée non trouvée'
        });
      }

      // Transformer les données pour inclure les informations de completion
      const completedSession = {
        _id: session._id,
        completionId: userCompletion._id,
        name: session.name,
        description: session.description,
        creator: session.creator,
        exercises: session.exercises,
        estimatedDuration: session.estimatedDuration,
        difficulty: session.difficulty,
        category: session.category,
        isPublic: session.isPublic,
        tags: session.tags,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        // Données de completion
        completedAt: userCompletion.completedAt,
        actualDuration: userCompletion.actualDuration,
        notes: userCompletion.notes,
        completedExercises: userCompletion.exercises,
        xpGained: userCompletion.exercises ? 
          userCompletion.exercises.reduce((total, exercise) => 
            total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
          ) * 10 : 0 // 10 XP par série complétée
      };

      res.json({
        success: true,
        session: completedSession
      });
    }
  } catch (error) {
    console.error('Erreur récupération séance terminée:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la séance'
    });
  }
});

// @route   GET /api/sessions/:id
// @desc    Obtenir une session spécifique
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({
      _id: id,
      isDeleted: false, // Exclure les séances supprimées
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    }).populate('creator', 'username firstName lastName avatar level');

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée ou supprimée'
      });
    }

    res.json({
      session: {
        _id: session._id,
        name: session.name,
        description: session.description,
        estimatedDuration: session.estimatedDuration,
        difficulty: session.difficulty,
        category: session.category,
        exercises: session.exercises,
        isPublic: session.isPublic,
        isTemplate: session.isTemplate,
        tags: session.tags,
        completions: session.completions.length,
        creator: session.creator,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isOwner: session.creator._id.equals(userId)
      }
    });
  } catch (error) {
    console.error('Erreur récupération session:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la session'
    });
  }
});

// @route   POST /api/sessions
// @desc    Créer une nouvelle session
// @access  Private
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('category').optional().isIn(['Force', 'Cardio', 'Flexibilité', 'Mixte']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
  body('exercises').isArray({ min: 1 }),
  body('exercises.*.name').trim().isLength({ min: 1 }),
  body('exercises.*.category').isIn(['Haut du corps', 'Bas du corps', 'Pectoraux', 'Dos', 'Triceps', 'Biceps', 'Épaules', 'Abdominaux', 'Cardio', 'Force', 'Flexibilité', 'Mixte']),
  body('exercises.*.muscleGroups').optional().isArray(),
  body('exercises.*.sets').isArray({ min: 1 }),
  body('exercises.*.sets.*.reps').isInt({ min: 1 }),
  body('exercises.*.sets.*.weight').optional().isFloat({ min: 0 }),
  body('exercises.*.sets.*.duration').optional().isInt({ min: 0 }),
  body('exercises.*.sets.*.distance').optional().isFloat({ min: 0 }),
  body('exercises.*.sets.*.restTime').optional().isInt({ min: 0 }),
  body('exercises.*.order').isInt({ min: 0 }),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation POST session:', errors.array());
      console.log('Données reçues:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      difficulty = 'medium',
      category = 'Mixte',
      estimatedDuration = 60,
      exercises,
      tags = []
    } = req.body;

    // Valider les exercices
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      if (!exercise.name || !exercise.sets || exercise.sets.length === 0) {
        return res.status(400).json({
          message: `Exercice ${i + 1}: nom et séries requis`
        });
      }

      for (let j = 0; j < exercise.sets.length; j++) {
        const set = exercise.sets[j];
        if (typeof set.reps !== 'number' || set.reps <= 0) {
          return res.status(400).json({
            message: `Exercice ${i + 1}, Série ${j + 1}: répétitions requises`
          });
        }
      }
    }

    const session = new Session({
      name,
      description,
      creator: req.user._id,
      difficulty,
      category,
      estimatedDuration,
      exercises: exercises.map((exercise, index) => ({
        name: exercise.name,
        category: exercise.category || 'Force',
        muscleGroups: exercise.muscleGroups || [],
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight || 0,
          duration: set.duration || 0,
          distance: set.distance || 0,
          restTime: set.restTime || 60,
          notes: set.notes || '',
          completed: false
        })),
        order: exercise.order || index + 1,
        isCompleted: false
      })),
      tags
    });

    // Calculer la durée estimée
    session.calculateEstimatedDuration();

    await session.save();

    res.status(201).json({
      message: 'Session créée avec succès',
      session: {
        _id: session._id,
        name: session.name,
        description: session.description,
        estimatedDuration: session.estimatedDuration,
        difficulty: session.difficulty,
        category: session.category,
        exercises: session.exercises,
        isPublic: session.isPublic,
        isTemplate: session.isTemplate,
        tags: session.tags,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur création session:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la session'
    });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Mettre à jour une session
// @access  Private
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('category').optional().isIn(['Force', 'Cardio', 'Flexibilité', 'Mixte']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
  body('exercises').optional().isArray({ min: 1 }),
  body('exercises.*.name').optional().trim().isLength({ min: 1 }),
  body('exercises.*.category').optional().isIn(['Haut du corps', 'Bas du corps', 'Pectoraux', 'Dos', 'Triceps', 'Biceps', 'Épaules', 'Abdominaux', 'Cardio', 'Force', 'Flexibilité', 'Mixte']),
  body('exercises.*.muscleGroups').optional().isArray(),
  body('exercises.*.sets').optional().isArray({ min: 1 }),
  body('exercises.*.sets.*.reps').optional().isInt({ min: 1 }),
  body('exercises.*.sets.*.weight').optional().isFloat({ min: 0 }),
  body('exercises.*.sets.*.duration').optional().isInt({ min: 0 }),
  body('exercises.*.sets.*.distance').optional().isFloat({ min: 0 }),
  body('exercises.*.sets.*.restTime').optional().isInt({ min: 0 }),
  body('exercises.*.order').optional().isInt({ min: 0 }),
  body('isPublic').optional().isBoolean(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({
      _id: id,
      creator: userId,
      isDeleted: false // Empêcher de modifier une séance supprimée
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée, supprimée ou accès non autorisé'
      });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.difficulty) updateData.difficulty = req.body.difficulty;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.estimatedDuration) updateData.estimatedDuration = req.body.estimatedDuration;
    if (req.body.isPublic !== undefined) updateData.isPublic = req.body.isPublic;
    if (req.body.tags) updateData.tags = req.body.tags;
    
    // Mise à jour des exercices si fournis
    if (req.body.exercises) {
      updateData.exercises = req.body.exercises.map((exercise, index) => ({
        name: exercise.name,
        category: exercise.category || 'Force',
        muscleGroups: exercise.muscleGroups || [],
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight || 0,
          duration: set.duration || 0,
          distance: set.distance || 0,
          restTime: set.restTime || 60,
          notes: set.notes || '',
          completed: set.completed || false
        })),
        order: exercise.order || index + 1,
        isCompleted: exercise.isCompleted || false
      }));
    }

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Session mise à jour avec succès',
      session: {
        _id: updatedSession._id,
        name: updatedSession.name,
        description: updatedSession.description,
        estimatedDuration: updatedSession.estimatedDuration,
        difficulty: updatedSession.difficulty,
        category: updatedSession.category,
        exercises: updatedSession.exercises,
        isPublic: updatedSession.isPublic,
        isTemplate: updatedSession.isTemplate,
        tags: updatedSession.tags,
        updatedAt: updatedSession.updatedAt
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour session:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la session'
    });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Supprimer une session (soft delete - conserve l'historique)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({
      _id: id,
      creator: userId
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée ou accès non autorisé'
      });
    }

    // Soft delete : marquer comme supprimée au lieu de supprimer réellement
    // Cela permet de conserver l'historique (completions) pour les stats et le calendrier
    session.isDeleted = true;
    session.deletedAt = new Date();
    await session.save();

    console.log(`✅ [Session Delete] Session "${session.name}" marquée comme supprimée (soft delete)`);
    console.log(`📊 [Session Delete] Historique conservé: ${session.completions.length} complétions préservées`);

    res.json({
      message: 'Session supprimée avec succès',
      note: 'L\'historique de cette session est conservé pour les statistiques et le calendrier'
    });
  } catch (error) {
    console.error('Erreur suppression session:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la session'
    });
  }
});

// @route   POST /api/sessions/:id/copy
// @desc    Copier une session
// @access  Private
router.post('/:id/copy', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const originalSession = await Session.findOne({
      _id: id,
      isDeleted: false, // Empêcher de copier une séance supprimée
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    });

    if (!originalSession) {
      return res.status(404).json({
        message: 'Session non trouvée ou supprimée'
      });
    }

    // Dupliquer la session
    const duplicatedSession = originalSession.duplicate(userId);
    
    // Gérer la copie des exercices personnalisés
    const exerciseMapping = new Map(); // Pour mapper les anciens IDs aux nouveaux
    
    for (let i = 0; i < duplicatedSession.exercises.length; i++) {
      const exercise = duplicatedSession.exercises[i];
      
      // Vérifier si c'est un exercice personnalisé (pas un exercice par défaut)
      const originalExercise = await Exercise.findOne({
        name: exercise.name,
        category: exercise.category,
        isCustom: true,
        creator: originalSession.creator
      });
      
      if (originalExercise) {
        // C'est un exercice personnalisé, on le copie
        const copiedExercise = new Exercise({
          name: `${originalExercise.name} (Copié)`,
          description: originalExercise.description,
          category: originalExercise.category,
          muscleGroups: originalExercise.muscleGroups,
          creator: userId,
          isCustom: true,
          isPublic: false
        });
        
        await copiedExercise.save();
        
        // Mapper l'ancien nom au nouveau nom pour la séance
        exerciseMapping.set(exercise.name, copiedExercise.name);
        duplicatedSession.exercises[i].name = copiedExercise.name;
      }
    }
    
    await duplicatedSession.save();

    res.status(201).json({
      message: 'Session copiée avec succès',
      session: {
        _id: duplicatedSession._id,
        name: duplicatedSession.name,
        description: duplicatedSession.description,
        estimatedDuration: duplicatedSession.estimatedDuration,
        difficulty: duplicatedSession.difficulty,
        category: duplicatedSession.category,
        exercises: duplicatedSession.exercises,
        tags: duplicatedSession.tags,
        createdAt: duplicatedSession.createdAt
      },
      copiedExercises: exerciseMapping.size > 0 ? Array.from(exerciseMapping.entries()).map(([oldName, newName]) => ({
        originalName: oldName,
        copiedName: newName
      })) : []
    });
  } catch (error) {
    console.error('Erreur copie session:', error);
    res.status(500).json({
      message: 'Erreur lors de la copie de la session'
    });
  }
});

// POST /api/sessions/:id/complete - Terminer une séance
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 === DÉBUT TERMINAISON SÉANCE ===');
    const { id } = req.params;
    const userId = req.user._id;
    const { actualDuration, xpGained } = req.body;
    let { exercises } = req.body;

    console.log('📥 Données reçues:', {
      sessionId: id,
      userId: userId,
      actualDuration,
      xpGained,
      exercisesCount: exercises ? exercises.length : 0
    });

    // Vérifier que la séance existe et n'est pas supprimée
    const session = await Session.findOne({
      _id: id,
      isDeleted: false // Empêcher de compléter une séance supprimée
    });

    if (!session) {
      console.log('❌ Session non trouvée ou supprimée');
      return res.status(404).json({
        message: 'Session non trouvée ou supprimée'
      });
    }

    console.log('✅ Session trouvée:', {
      name: session.name,
      exercisesCount: session.exercises.length,
      completionsCount: session.completions.length
    });

    // Debug détaillé des exercices reçus
    console.log('🔍 === ANALYSE DES EXERCICES REÇUS ===');
    console.log('📦 Exercices bruts:', JSON.stringify(exercises, null, 2));
    
    if (exercises && exercises.length > 0) {
      console.log('📊 Exercices reçus du frontend:');
      exercises.forEach((exercise, exerciseIndex) => {
        console.log(`  Exercice ${exerciseIndex + 1}: ${exercise.name}`);
        console.log(`  Sets:`, JSON.stringify(exercise.sets, null, 2));
        exercise.sets.forEach((set, setIndex) => {
          console.log(`    Série ${setIndex + 1}:`, {
            reps: set.reps,
            weight: set.weight,
            completed: set.completed
          });
        });
      });
    } else {
      console.log('⚠️  AUCUN EXERCICE REÇU DU FRONTEND !');
    }

    // Si pas d'exercices fournis, utiliser les exercices originaux
    if (!exercises || exercises.length === 0) {
      console.log('🔄 Pas d\'exercices fournis, utilisation des exercices originaux');
      exercises = session.exercises.map(exercise => ({
        name: exercise.name,
        category: exercise.category,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration || 0,
          distance: set.distance || 0,
          completed: false // Par défaut, pas complété
        }))
      }));
      console.log('📋 Exercices originaux utilisés:', exercises.length);
    }

    // Fonction pour mapper les catégories vers les valeurs enum correctes
    const mapCategoryToEnum = (category) => {
      const categoryMap = {
        'strength': 'Force',
        'dos': 'Dos',
        'haut du corps': 'Haut du corps',
        'bas du corps': 'Bas du corps',
        'pectoraux': 'Pectoraux',
        'triceps': 'Triceps',
        'biceps': 'Biceps',
        'épaules': 'Épaules',
        'abdominaux': 'Abdominaux',
        'cardio': 'Cardio',
        'flexibilité': 'Flexibilité',
        'mixte': 'Mixte'
      };
      return categoryMap[category] || 'Force'; // Valeur par défaut
    };

    // Corriger les catégories des exercices
    console.log('🔧 === MAPPING DES CATÉGORIES ===');
    exercises = exercises.map(exercise => {
      const originalCategory = exercise.category;
      const mappedCategory = mapCategoryToEnum(exercise.category);
      console.log(`📝 ${exercise.name}: "${originalCategory}" → "${mappedCategory}"`);
      return {
        ...exercise,
        category: mappedCategory
      };
    });

    // Corriger la catégorie de la session si nécessaire
    if (session.category && !['Force', 'Cardio', 'Flexibilité', 'Mixte'].includes(session.category)) {
      const originalSessionCategory = session.category;
      session.category = mapCategoryToEnum(session.category);
      console.log(`📝 Session: "${originalSessionCategory}" → "${session.category}"`);
    }

    // Corriger les catégories des exercices existants dans la session
    console.log('🔧 === CORRECTION DES EXERCICES DE LA SESSION ===');
    session.exercises.forEach((exercise, index) => {
      if (exercise.category && !['Haut du corps', 'Bas du corps', 'Pectoraux', 'Dos', 'Triceps', 'Biceps', 'Épaules', 'Abdominaux', 'Cardio', 'Force', 'Flexibilité', 'Mixte'].includes(exercise.category)) {
        const originalCategory = exercise.category;
        exercise.category = mapCategoryToEnum(exercise.category);
        console.log(`📝 Exercice ${index + 1} (${exercise.name}): "${originalCategory}" → "${exercise.category}"`);
      }
    });

    // Créer la completion avec les exercices modifiés
    console.log('🏗️  === CRÉATION DE LA COMPLETION ===');
    const completion = {
      user: userId,
      completedAt: new Date(),
      actualDuration: actualDuration || session.estimatedDuration,
      notes: '',
      exercises: exercises.map(exercise => ({
        name: exercise.name,
        category: exercise.category || 'Mixte', // Inclure la catégorie
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration || 0,
          distance: set.distance || 0,
          completed: set.completed
        }))
      }))
    };

    console.log('💾 Completion créée:', {
      user: completion.user,
      actualDuration: completion.actualDuration,
      exercisesCount: completion.exercises.length,
      firstExercise: completion.exercises[0] ? {
        name: completion.exercises[0].name,
        setsCount: completion.exercises[0].sets.length,
        firstSet: completion.exercises[0].sets[0]
      } : null
    });

    // Ajouter la completion à la séance
    console.log('📝 Ajout de la completion à la séance...');
    session.completions.push(completion);
    await session.save();
    console.log('✅ Completion sauvegardée avec succès !');

    // Calculer l'XP gagné
    console.log('🎯 === CALCUL DE L\'XP ===');
    const calculatedXP = exercises.reduce((total, exercise) => 
      total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
    ) * 10;
    
    console.log('💰 XP calculé:', calculatedXP);

    // Calculer le poids total soulevé
    console.log('🏋️ === CALCUL DU POIDS TOTAL ===');
    const totalWeight = exercises.reduce((total, exercise) => {
      const exerciseWeight = exercise.sets ? exercise.sets.reduce((setTotal, set) => {
        if (set.completed && set.weight && set.reps) {
          return setTotal + (set.weight * set.reps);
        }
        return setTotal;
      }, 0) : 0;
      return total + exerciseWeight;
    }, 0);
    
    console.log('💪 Poids total soulevé:', totalWeight, 'kg');

    // Mettre à jour les statistiques de l'utilisateur
    console.log('👤 Mise à jour des statistiques utilisateur...');
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Sauvegarder l'ancien niveau pour détecter le passage de niveau
    const oldLevel = user.level;

    // Ajouter l'XP
    user.xp += calculatedXP;
    
    // Calculer le nouveau niveau
    const newLevel = user.calculateLevel();
    if (user.level !== newLevel) {
      user.level = newLevel;
    }

    // Incrémenter les sessions complétées
    user.totalSessionsCompleted += 1;

    // Mettre à jour les stats (durée et poids)
    if (actualDuration && actualDuration > 0) {
      user.stats.totalWorkoutTime = (user.stats.totalWorkoutTime || 0) + actualDuration;
      console.log('⏱️ Durée ajoutée:', actualDuration, 'minutes. Total:', user.stats.totalWorkoutTime, 'minutes');
    }

    if (totalWeight > 0) {
      user.stats.totalWeightLifted = (user.stats.totalWeightLifted || 0) + totalWeight;
      console.log('💪 Poids ajouté:', totalWeight, 'kg. Total:', user.stats.totalWeightLifted, 'kg');
    }

    // Sauvegarder l'utilisateur
    await user.save();
    
    console.log('✅ Statistiques utilisateur mises à jour:', {
      xp: user.xp,
      level: user.level,
      totalSessionsCompleted: user.totalSessionsCompleted,
      totalWorkoutTime: user.stats.totalWorkoutTime,
      totalWeightLifted: user.stats.totalWeightLifted
    });

    // Vérifier si l'utilisateur a monté de niveau
    const levelUp = newLevel > oldLevel;
    const levelsGained = newLevel - oldLevel;

    // Récupérer la séance mise à jour
    const updatedSession = await Session.findById(id)
      .populate('creator', 'username firstName lastName avatar level');

    console.log('🎉 === SÉANCE TERMINÉE AVEC SUCCÈS ===');
    console.log('📊 Résumé final:', {
      sessionName: updatedSession.name,
      completionsCount: updatedSession.completions.length,
      xpGained: calculatedXP,
      totalWeight: totalWeight,
      actualDuration: actualDuration,
      levelUp: levelUp,
      oldLevel: oldLevel,
      newLevel: newLevel
    });

    res.json({
      success: true,
      message: 'Séance terminée avec succès',
      session: updatedSession,
      xpGained: calculatedXP,
      totalWeight: totalWeight,
      actualDuration: actualDuration,
      levelUp: levelUp,
      levelsGained: levelsGained,
      oldLevel: oldLevel,
      newLevel: newLevel,
      user: {
        xp: user.xp,
        level: user.level,
        totalSessionsCompleted: user.totalSessionsCompleted,
        stats: {
          totalWorkoutTime: user.stats.totalWorkoutTime,
          totalWeightLifted: user.stats.totalWeightLifted
        }
      }
    });
  } catch (error) {
    console.error('❌ ERREUR completion session:', error);
    res.status(500).json({
      message: 'Erreur lors de la finalisation de la session'
    });
  }
});

// DELETE /api/sessions/:sessionId/completions/:completionId - Supprimer une completion
router.delete('/:sessionId/completions/:completionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId, completionId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ [Delete Completion] Suppression completion:', { sessionId, completionId, userId });

    // Trouver la séance avec la completion
    const session = await Session.findOne({
      _id: sessionId,
      'completions._id': completionId,
      'completions.user': userId
    });

    if (!session) {
      return res.status(404).json({
        message: 'Completion non trouvée ou accès non autorisé'
      });
    }

    // Trouver la completion spécifique
    const completion = session.completions.find(c => 
      c._id.toString() === completionId && c.user.toString() === userId.toString()
    );

    if (!completion) {
      return res.status(404).json({
        message: 'Completion non trouvée'
      });
    }

    // Calculer les valeurs à retirer des stats
    const xpToRemove = completion.exercises ? 
      completion.exercises.reduce((total, exercise) => 
        total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
      ) * 10 : 0;

    const weightToRemove = completion.exercises ? 
      completion.exercises.reduce((total, exercise) => {
        const exerciseWeight = exercise.sets ? exercise.sets.reduce((setTotal, set) => {
          if (set.completed && set.weight && set.reps) {
            return setTotal + (set.weight * set.reps);
          }
          return setTotal;
        }, 0) : 0;
        return total + exerciseWeight;
      }, 0) : 0;

    const durationToRemove = completion.actualDuration || 0;

    console.log('📊 [Delete Completion] Valeurs à retirer:', {
      xp: xpToRemove,
      weight: weightToRemove,
      duration: durationToRemove
    });

    // Retirer la completion de la séance
    session.completions = session.completions.filter(c => c._id.toString() !== completionId);
    await session.save();

    // Mettre à jour les stats de l'utilisateur
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (user) {
      // Retirer l'XP
      user.xp = Math.max(0, user.xp - xpToRemove);
      
      // Recalculer le niveau
      const newLevel = user.calculateLevel();
      user.level = newLevel;

      // Décrémenter les sessions complétées
      user.totalSessionsCompleted = Math.max(0, user.totalSessionsCompleted - 1);

      // Retirer la durée et le poids
      if (durationToRemove > 0) {
        user.stats.totalWorkoutTime = Math.max(0, (user.stats.totalWorkoutTime || 0) - durationToRemove);
      }

      if (weightToRemove > 0) {
        user.stats.totalWeightLifted = Math.max(0, (user.stats.totalWeightLifted || 0) - weightToRemove);
      }

      await user.save();

      console.log('✅ [Delete Completion] Stats utilisateur mises à jour:', {
        xp: user.xp,
        level: user.level,
        totalSessionsCompleted: user.totalSessionsCompleted,
        totalWorkoutTime: user.stats.totalWorkoutTime,
        totalWeightLifted: user.stats.totalWeightLifted
      });
    }

    res.json({
      success: true,
      message: 'Completion supprimée avec succès',
      statsUpdated: {
        xpRemoved: xpToRemove,
        weightRemoved: weightToRemove,
        durationRemoved: durationToRemove
      }
    });
  } catch (error) {
    console.error('❌ Erreur suppression completion:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la completion'
    });
  }
});

// PUT /api/sessions/:sessionId/completions/:completionId - Modifier une completion
router.put('/:sessionId/completions/:completionId', authenticateToken, [
  body('actualDuration').optional().isInt({ min: 0 }),
  body('notes').optional().trim(),
  body('exercises').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { sessionId, completionId } = req.params;
    const userId = req.user._id;
    const { actualDuration, notes, exercises } = req.body;

    console.log('✏️ [Update Completion] Modification completion:', { sessionId, completionId, userId });

    // Trouver la séance avec la completion
    const session = await Session.findOne({
      _id: sessionId,
      'completions._id': completionId,
      'completions.user': userId
    });

    if (!session) {
      return res.status(404).json({
        message: 'Completion non trouvée ou accès non autorisé'
      });
    }

    // Trouver la completion spécifique
    const completionIndex = session.completions.findIndex(c => 
      c._id.toString() === completionId && c.user.toString() === userId.toString()
    );

    if (completionIndex === -1) {
      return res.status(404).json({
        message: 'Completion non trouvée'
      });
    }

    const oldCompletion = session.completions[completionIndex];

    // Calculer les anciennes valeurs pour les retirer des stats
    const oldXP = oldCompletion.exercises ? 
      oldCompletion.exercises.reduce((total, exercise) => 
        total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
      ) * 10 : 0;

    const oldWeight = oldCompletion.exercises ? 
      oldCompletion.exercises.reduce((total, exercise) => {
        const exerciseWeight = exercise.sets ? exercise.sets.reduce((setTotal, set) => {
          if (set.completed && set.weight && set.reps) {
            return setTotal + (set.weight * set.reps);
          }
          return setTotal;
        }, 0) : 0;
        return total + exerciseWeight;
      }, 0) : 0;

    const oldDuration = oldCompletion.actualDuration || 0;

    // Mettre à jour la completion
    if (actualDuration !== undefined) {
      session.completions[completionIndex].actualDuration = actualDuration;
    }
    if (notes !== undefined) {
      session.completions[completionIndex].notes = notes;
    }
    if (exercises !== undefined) {
      session.completions[completionIndex].exercises = exercises.map(exercise => ({
        name: exercise.name,
        category: exercise.category || 'Mixte', // Inclure la catégorie
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration || 0,
          distance: set.distance || 0,
          completed: set.completed
        }))
      }));
    }

    await session.save();

    // Recharger la session pour obtenir les données réellement sauvegardées
    const updatedSessionForStats = await Session.findById(sessionId);
    const updatedCompletion = updatedSessionForStats.completions.find(c => 
      c._id.toString() === completionId
    );

    // Calculer les nouvelles valeurs à partir de la completion mise à jour
    const newExercises = updatedCompletion.exercises || [];
    const newXP = newExercises.reduce((total, exercise) => 
      total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0), 0
    ) * 10;

    const newWeight = newExercises.reduce((total, exercise) => {
      const exerciseWeight = exercise.sets ? exercise.sets.reduce((setTotal, set) => {
        if (set.completed && set.weight && set.reps) {
          return setTotal + (set.weight * set.reps);
        }
        return setTotal;
      }, 0) : 0;
      return total + exerciseWeight;
    }, 0);

    const newDuration = updatedCompletion.actualDuration || 0;

    // Calculer les différences
    const xpDiff = newXP - oldXP;
    const weightDiff = newWeight - oldWeight;
    const durationDiff = newDuration - oldDuration;

    console.log('📊 [Update Completion] Différences:', {
      xpDiff,
      weightDiff,
      durationDiff
    });

    // Mettre à jour les stats de l'utilisateur
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (user) {
      // Ajuster l'XP
      user.xp = Math.max(0, user.xp + xpDiff);
      
      // Recalculer le niveau
      const newLevel = user.calculateLevel();
      user.level = newLevel;

      // Ajuster la durée et le poids
      if (durationDiff !== 0) {
        user.stats.totalWorkoutTime = Math.max(0, (user.stats.totalWorkoutTime || 0) + durationDiff);
      }

      if (weightDiff !== 0) {
        user.stats.totalWeightLifted = Math.max(0, (user.stats.totalWeightLifted || 0) + weightDiff);
      }

      await user.save();

      console.log('✅ [Update Completion] Stats utilisateur mises à jour:', {
        xp: user.xp,
        level: user.level,
        totalWorkoutTime: user.stats.totalWorkoutTime,
        totalWeightLifted: user.stats.totalWeightLifted
      });
    }

    // Récupérer la séance mise à jour
    const updatedSession = await Session.findById(sessionId)
      .populate('creator', 'username firstName lastName avatar level');

    res.json({
      success: true,
      message: 'Completion modifiée avec succès',
      session: updatedSession,
      statsUpdated: {
        xpDiff,
        weightDiff,
        durationDiff
      }
    });
  } catch (error) {
    console.error('❌ Erreur modification completion:', error);
    res.status(500).json({
      message: 'Erreur lors de la modification de la completion'
    });
  }
});

module.exports = router;
