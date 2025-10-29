const express = require('express');
const { body, validationResult } = require('express-validator');
const Program = require('../models/Program');
const Session = require('../models/Session');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/programs
// @desc    Obtenir les programmes de l'utilisateur
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isTemplate } = req.query;
    const userId = req.user._id;

    const query = { creator: userId };
    if (isTemplate !== undefined) {
      query.isTemplate = isTemplate === 'true';
    }

    const programs = await Program.find(query)
      .populate('sessions', 'name estimatedDuration difficulty category')
      .sort({ createdAt: -1 });

    res.json({
      programs: programs.map(program => ({
        _id: program._id,
        name: program.name,
        description: program.description,
        difficulty: program.difficulty,
        category: program.category,
        estimatedDuration: program.estimatedDuration,
        sessions: program.sessions,
        isPublic: program.isPublic,
        isTemplate: program.isTemplate,
        tags: program.tags,
        stats: program.stats,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt
      }))
    });
  } catch (error) {
    console.error('Erreur récupération programmes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des programmes'
    });
  }
});

// @route   GET /api/programs/public
// @desc    Obtenir les programmes publics
// @access  Private
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, limit = 20, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { 
      isPublic: true,
      creator: { $ne: userId } // Exclure les programmes de l'utilisateur
    };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const programs = await Program.find(query)
      .populate('creator', 'username firstName lastName avatar level')
      .populate('sessions', 'name estimatedDuration difficulty category')
      .sort({ 'stats.totalCompletions': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Program.countDocuments(query);

    res.json({
      programs: programs.map(program => ({
        _id: program._id,
        name: program.name,
        description: program.description,
        difficulty: program.difficulty,
        category: program.category,
        estimatedDuration: program.estimatedDuration,
        sessions: program.sessions,
        tags: program.tags,
        stats: program.stats,
        creator: program.creator,
        createdAt: program.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPrograms: total,
        hasNext: skip + programs.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur récupération programmes publics:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des programmes publics'
    });
  }
});

// @route   GET /api/programs/:id
// @desc    Obtenir un programme spécifique
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const program = await Program.findOne({
      _id: id,
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    })
    .populate('creator', 'username firstName lastName avatar level')
    .populate('sessions');

    if (!program) {
      return res.status(404).json({
        message: 'Programme non trouvé'
      });
    }

    res.json({
      program: {
        _id: program._id,
        name: program.name,
        description: program.description,
        difficulty: program.difficulty,
        category: program.category,
        estimatedDuration: program.estimatedDuration,
        sessions: program.sessions,
        isPublic: program.isPublic,
        isTemplate: program.isTemplate,
        tags: program.tags,
        stats: program.stats,
        creator: program.creator,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
        isOwner: program.creator._id.equals(userId)
      }
    });
  } catch (error) {
    console.error('Erreur récupération programme:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du programme'
    });
  }
});

// @route   POST /api/programs
// @desc    Créer un nouveau programme
// @access  Private
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('category').optional().isIn(['strength', 'cardio', 'flexibility', 'mixed']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
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

    const {
      name,
      description,
      difficulty = 'beginner',
      category = 'mixed',
      estimatedDuration = 4,
      tags = []
    } = req.body;

    const program = new Program({
      name,
      description,
      creator: req.user._id,
      difficulty,
      category,
      estimatedDuration,
      tags
    });

    await program.save();

    res.status(201).json({
      message: 'Programme créé avec succès',
      program: {
        _id: program._id,
        name: program.name,
        description: program.description,
        difficulty: program.difficulty,
        category: program.category,
        estimatedDuration: program.estimatedDuration,
        sessions: program.sessions,
        isPublic: program.isPublic,
        isTemplate: program.isTemplate,
        tags: program.tags,
        stats: program.stats,
        createdAt: program.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur création programme:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du programme'
    });
  }
});

// @route   PUT /api/programs/:id
// @desc    Mettre à jour un programme
// @access  Private
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('category').optional().isIn(['strength', 'cardio', 'flexibility', 'mixed']),
  body('estimatedDuration').optional().isInt({ min: 1 }),
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

    const program = await Program.findOne({
      _id: id,
      creator: userId
    });

    if (!program) {
      return res.status(404).json({
        message: 'Programme non trouvé ou accès non autorisé'
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

    const updatedProgram = await Program.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sessions');

    res.json({
      message: 'Programme mis à jour avec succès',
      program: {
        _id: updatedProgram._id,
        name: updatedProgram.name,
        description: updatedProgram.description,
        difficulty: updatedProgram.difficulty,
        category: updatedProgram.category,
        estimatedDuration: updatedProgram.estimatedDuration,
        sessions: updatedProgram.sessions,
        isPublic: updatedProgram.isPublic,
        isTemplate: updatedProgram.isTemplate,
        tags: updatedProgram.tags,
        stats: updatedProgram.stats,
        updatedAt: updatedProgram.updatedAt
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour programme:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du programme'
    });
  }
});

// @route   DELETE /api/programs/:id
// @desc    Supprimer un programme
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const program = await Program.findOne({
      _id: id,
      creator: userId
    });

    if (!program) {
      return res.status(404).json({
        message: 'Programme non trouvé ou accès non autorisé'
      });
    }

    // Supprimer les sessions associées si elles n'appartiennent qu'à ce programme
    for (const sessionId of program.sessions) {
      const session = await Session.findById(sessionId);
      if (session && session.creator.equals(userId)) {
        await Session.findByIdAndDelete(sessionId);
      }
    }

    await Program.findByIdAndDelete(id);

    res.json({
      message: 'Programme supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression programme:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du programme'
    });
  }
});

// @route   POST /api/programs/:id/sessions/:sessionId
// @desc    Ajouter une session à un programme
// @access  Private
router.post('/:id/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const userId = req.user._id;

    const program = await Program.findOne({
      _id: id,
      creator: userId
    });

    if (!program) {
      return res.status(404).json({
        message: 'Programme non trouvé ou accès non autorisé'
      });
    }

    const session = await Session.findOne({
      _id: sessionId,
      creator: userId
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée ou accès non autorisé'
      });
    }

    program.addSession(sessionId);
    await program.save();

    res.json({
      message: 'Session ajoutée au programme avec succès'
    });
  } catch (error) {
    console.error('Erreur ajout session:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout de la session au programme'
    });
  }
});

// @route   DELETE /api/programs/:id/sessions/:sessionId
// @desc    Supprimer une session d'un programme
// @access  Private
router.delete('/:id/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const userId = req.user._id;

    const program = await Program.findOne({
      _id: id,
      creator: userId
    });

    if (!program) {
      return res.status(404).json({
        message: 'Programme non trouvé ou accès non autorisé'
      });
    }

    program.removeSession(sessionId);
    await program.save();

    res.json({
      message: 'Session supprimée du programme avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression session:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la session du programme'
    });
  }
});

module.exports = router;


