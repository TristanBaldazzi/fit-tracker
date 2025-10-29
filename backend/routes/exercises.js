const express = require('express');
const { body, validationResult } = require('express-validator');
const Exercise = require('../models/Exercise');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/exercises
// @desc    Obtenir tous les exercices (base + personnalisés de l'utilisateur)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const exercises = await Exercise.getUserExercises(req.user._id);
    
    res.json({
      message: 'Exercices récupérés avec succès',
      exercises: exercises
    });
  } catch (error) {
    console.error('Erreur récupération exercices:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des exercices'
    });
  }
});

// @route   GET /api/exercises/user
// @desc    Obtenir les exercices personnalisés de l'utilisateur
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const exercises = await Exercise.find({ 
      creator: req.user._id,
      isCustom: true 
    }).sort({ name: 1 });
    
    res.json({
      message: 'Exercices personnalisés récupérés avec succès',
      exercises: exercises
    });
  } catch (error) {
    console.error('Erreur récupération exercices personnalisés:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des exercices personnalisés'
    });
  }
});

// @route   GET /api/exercises/categories
// @desc    Obtenir les catégories d'exercices disponibles
// @access  Private
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
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
    ];

    res.json({
      message: 'Catégories récupérées avec succès',
      categories: categories
    });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// @route   GET /api/exercises/muscle-groups
// @desc    Obtenir les groupes musculaires disponibles
// @access  Private
router.get('/muscle-groups', authenticateToken, async (req, res) => {
  try {
    const muscleGroups = [
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
    ];

    res.json({
      message: 'Groupes musculaires récupérés avec succès',
      muscleGroups: muscleGroups
    });
  } catch (error) {
    console.error('Erreur récupération groupes musculaires:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des groupes musculaires'
    });
  }
});

// @route   GET /api/exercises/:id
// @desc    Obtenir un exercice spécifique
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const exercise = await Exercise.findOne({
      _id: req.params.id,
      $or: [
        { creator: req.user._id },
        { isCustom: false }
      ]
    });

    if (!exercise) {
      return res.status(404).json({
        message: 'Exercice non trouvé ou accès non autorisé'
      });
    }

    res.json({
      message: 'Exercice récupéré avec succès',
      exercise: exercise
    });
  } catch (error) {
    console.error('Erreur récupération exercice:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'exercice'
    });
  }
});

// @route   POST /api/exercises
// @desc    Créer un exercice personnalisé
// @access  Private
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('category').isIn([
    'Haut du corps', 'Bas du corps', 'Dos', 'Pectoraux', 'Triceps', 
    'Abdominaux', 'Cardio', 'Force', 'Flexibilité', 'Mixte'
  ]).withMessage('Catégorie invalide'),
  body('muscleGroups').optional().isArray().withMessage('Les groupes musculaires doivent être un tableau'),
  body('muscleGroups.*').optional().isIn([
    'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Avant-bras',
    'Abdominaux', 'Obliques', 'Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Mollets',
    'Trapèzes', 'Grands dorsaux', 'Rhomboïdes', 'Core', 'Tout le corps', 'Cardio'
  ]).withMessage('Groupe musculaire invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { name, description, category, muscleGroups } = req.body;

    // Vérifier si un exercice avec le même nom existe déjà pour cet utilisateur
    const existingExercise = await Exercise.findOne({
      name: name.trim(),
      creator: req.user._id,
      isCustom: true
    });

    if (existingExercise) {
      return res.status(400).json({
        message: 'Un exercice avec ce nom existe déjà'
      });
    }

    const exercise = new Exercise({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      category,
      muscleGroups: muscleGroups || [],
      creator: req.user._id,
      isCustom: true
    });

    await exercise.save();

    res.status(201).json({
      message: 'Exercice créé avec succès',
      exercise: {
        _id: exercise._id,
        name: exercise.name,
        description: exercise.description,
        category: exercise.category,
        muscleGroups: exercise.muscleGroups,
        isCustom: exercise.isCustom,
        createdAt: exercise.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur création exercice:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de l\'exercice'
    });
  }
});

// @route   PUT /api/exercises/:id
// @desc    Mettre à jour un exercice personnalisé
// @access  Private
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('La description ne peut pas dépasser 500 caractères'),
  body('category').optional().isIn([
    'Haut du corps', 'Bas du corps', 'Dos', 'Pectoraux', 'Triceps', 
    'Biceps', 'Épaules', 'Abdominaux', 'Cardio', 'Force', 'Flexibilité', 'Mixte'
  ]).withMessage('Catégorie invalide'),
  body('muscleGroups').optional().isArray().withMessage('Les groupes musculaires doivent être un tableau'),
  body('muscleGroups.*').optional().isIn([
    'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Avant-bras',
    'Abdominaux', 'Obliques', 'Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Mollets',
    'Trapèzes', 'Grands dorsaux', 'Rhomboïdes', 'Core', 'Tout le corps', 'Cardio'
  ]).withMessage('Groupe musculaire invalide')
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

    const exercise = await Exercise.findOne({
      _id: id,
      creator: userId,
      isCustom: true
    });

    if (!exercise) {
      return res.status(404).json({
        message: 'Exercice non trouvé ou accès non autorisé'
      });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description ? req.body.description.trim() : undefined;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.muscleGroups) updateData.muscleGroups = req.body.muscleGroups;

    // Vérifier si un autre exercice avec le même nom existe déjà
    if (updateData.name && updateData.name !== exercise.name) {
      const existingExercise = await Exercise.findOne({
        name: updateData.name,
        creator: userId,
        isCustom: true,
        _id: { $ne: id }
      });

      if (existingExercise) {
        return res.status(400).json({
          message: 'Un exercice avec ce nom existe déjà'
        });
      }
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Exercice mis à jour avec succès',
      exercise: {
        _id: updatedExercise._id,
        name: updatedExercise.name,
        description: updatedExercise.description,
        category: updatedExercise.category,
        muscleGroups: updatedExercise.muscleGroups,
        isCustom: updatedExercise.isCustom,
        updatedAt: updatedExercise.updatedAt
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour exercice:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'exercice'
    });
  }
});

// @route   DELETE /api/exercises/:id
// @desc    Supprimer un exercice personnalisé
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const exercise = await Exercise.findOne({
      _id: id,
      creator: userId,
      isCustom: true
    });

    if (!exercise) {
      return res.status(404).json({
        message: 'Exercice non trouvé ou accès non autorisé'
      });
    }

    await Exercise.findByIdAndDelete(id);

    res.json({
      message: 'Exercice supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression exercice:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'exercice'
    });
  }
});

module.exports = router;