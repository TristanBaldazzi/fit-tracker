const express = require('express');
const { body, validationResult } = require('express-validator');
const Friend = require('../models/Friend');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotificationService');

const router = express.Router();

// @route   GET /api/friends
// @desc    Obtenir la liste des amis de l'utilisateur
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user._id);
    
    res.json({
      friends
    });
  } catch (error) {
    console.error('Erreur récupération amis:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des amis'
    });
  }
});

// @route   GET /api/friends/requests
// @desc    Obtenir les demandes d'amitié en attente
// @access  Private
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const pendingRequests = await Friend.getPendingRequests(req.user._id);
    
    res.json({
      requests: pendingRequests.map(request => ({
        _id: request._id,
        requester: {
          _id: request.requester._id,
          username: request.requester.username,
          firstName: request.requester.firstName,
          lastName: request.requester.lastName,
          avatar: request.requester.avatar,
          level: request.requester.level,
          xp: request.requester.xp
        },
        requestedAt: request.requestedAt
      }))
    });
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes d\'amitié'
    });
  }
});

// @route   POST /api/friends/request
// @desc    Envoyer une demande d'amitié
// @access  Private
router.post('/request', authenticateToken, [
  body('recipientId').isMongoId().withMessage('ID du destinataire invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { recipientId } = req.body;
    const requesterId = req.user._id;

    // Vérifier que l'utilisateur destinataire existe
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que le profil du destinataire est public
    if (!recipient.settings.isPublic) {
      return res.status(403).json({
        message: 'Impossible d\'envoyer une demande à cet utilisateur'
      });
    }

    const friendRequest = await Friend.sendFriendRequest(requesterId, recipientId);
    
    // Récupérer les informations de l'utilisateur qui envoie la demande
    const requester = await User.findById(requesterId)
      .select('username firstName lastName avatar');
    
    // Envoyer une notification push si le destinataire a un token et les notifications activées
    if (recipient.pushToken && recipient.settings.notifications) {
      try {
        await pushNotificationService.sendFriendRequestNotification(
          recipient.pushToken,
          {
            _id: requester._id,
            username: requester.username,
            firstName: requester.firstName,
            lastName: requester.lastName,
            avatar: requester.avatar
          }
        );
        console.log('Notification push envoyée pour la demande d\'amitié');
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification push:', error);
        // Ne pas faire échouer la requête si la notification échoue
      }
    }
    
    res.status(201).json({
      message: 'Demande d\'amitié envoyée avec succès',
      request: {
        _id: friendRequest._id,
        recipient: {
          _id: recipient._id,
          username: recipient.username,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          avatar: recipient.avatar
        },
        requestedAt: friendRequest.requestedAt
      }
    });
  } catch (error) {
    console.error('Erreur envoi demande:', error);
    
    if (error.message.includes('déjà')) {
      return res.status(409).json({
        message: error.message
      });
    }
    
    if (error.message.includes('vous-même')) {
      return res.status(400).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Erreur lors de l\'envoi de la demande d\'amitié'
    });
  }
});

// @route   PUT /api/friends/accept/:requestId
// @desc    Accepter une demande d'amitié
// @access  Private
router.put('/accept/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendship = await Friend.acceptFriendRequest(requestId, userId);
    
    // Récupérer les informations du nouvel ami
    const friend = await User.findById(friendship.requester)
      .select('username firstName lastName avatar level xp');
    
    // Récupérer les informations de l'utilisateur qui accepte
    const acceptor = await User.findById(userId)
      .select('username firstName lastName avatar pushToken settings');
    
    // Envoyer une notification push si le demandeur a un token et les notifications activées
    const requester = await User.findById(friendship.requester)
      .select('pushToken settings');
    
    if (requester && requester.pushToken && requester.settings.notifications) {
      try {
        await pushNotificationService.sendFriendRequestAcceptedNotification(
          requester.pushToken,
          {
            _id: acceptor._id,
            username: acceptor.username,
            firstName: acceptor.firstName,
            lastName: acceptor.lastName,
            avatar: acceptor.avatar
          }
        );
        console.log('Notification push envoyée pour l\'acceptation de la demande d\'amitié');
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification push:', error);
        // Ne pas faire échouer la requête si la notification échoue
      }
    }
    
    res.json({
      message: 'Demande d\'amitié acceptée avec succès',
      friend: {
        _id: friend._id,
        username: friend.username,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar,
        level: friend.level,
        xp: friend.xp,
        friendshipId: friendship._id,
        acceptedAt: friendship.acceptedAt
      }
    });
  } catch (error) {
    console.error('Erreur acceptation demande:', error);
    
    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Erreur lors de l\'acceptation de la demande d\'amitié'
    });
  }
});

// @route   DELETE /api/friends/request/:requestId
// @desc    Refuser/supprimer une demande d'amitié
// @access  Private
router.delete('/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    await Friend.removeFriendRequest(requestId, userId);
    
    res.json({
      message: 'Demande d\'amitié supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression demande:', error);
    
    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        message: error.message
      });
    }
    
    res.status(500).json({
      message: 'Erreur lors de la suppression de la demande d\'amitié'
    });
  }
});

// @route   DELETE /api/friends/:friendshipId
// @desc    Supprimer un ami
// @access  Private
router.delete('/:friendshipId', authenticateToken, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user._id;

    // Vérifier que l'utilisateur fait partie de cette amitié
    const friendship = await Friend.findOne({
      _id: friendshipId,
      $or: [
        { requester: userId },
        { recipient: userId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.status(404).json({
        message: 'Amitié non trouvée'
      });
    }

    await Friend.findByIdAndDelete(friendshipId);
    
    res.json({
      message: 'Ami supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression ami:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'ami'
    });
  }
});

// @route   GET /api/friends/check/:userId
// @desc    Vérifier si deux utilisateurs sont amis
// @access  Private
router.get('/check/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const areFriends = await Friend.areFriends(currentUserId, userId);
    
    res.json({
      areFriends
    });
  } catch (error) {
    console.error('Erreur vérification amitié:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification de l\'amitié'
    });
  }
});

// @route   GET /api/friends/sent-requests
// @desc    Obtenir les demandes d'amitié envoyées par l'utilisateur
// @access  Private
router.get('/sent-requests', authenticateToken, async (req, res) => {
  try {
    const sentRequests = await Friend.find({
      requester: req.user._id,
      status: 'pending'
    }).populate('recipient', 'username firstName lastName avatar level xp');
    
    res.json({
      requests: sentRequests.map(request => ({
        _id: request._id,
        recipient: {
          _id: request.recipient._id,
          username: request.recipient.username,
          firstName: request.recipient.firstName,
          lastName: request.recipient.lastName,
          avatar: request.recipient.avatar,
          level: request.recipient.level,
          xp: request.recipient.xp
        },
        requestedAt: request.requestedAt
      }))
    });
  } catch (error) {
    console.error('Erreur récupération demandes envoyées:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes envoyées'
    });
  }
});

// @route   GET /api/friends/suggestions
// @desc    Obtenir des suggestions d'amis pour l'utilisateur
// @access  Private
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user._id;

    // Obtenir les IDs des amis existants et des demandes en cours
    const existingFriendships = await Friend.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).select('requester recipient');

    const existingUserIds = existingFriendships.map(friendship => 
      friendship.requester.equals(userId) ? friendship.recipient : friendship.requester
    );
    existingUserIds.push(userId); // Exclure l'utilisateur lui-même

    // Trouver des utilisateurs avec des profils publics qui ne sont pas déjà amis
    const suggestions = await User.find({
      _id: { $nin: existingUserIds },
      'settings.isPublic': true,
      emailVerified: true
    })
    .select('username firstName lastName avatar level xp')
    .limit(parseInt(limit))
    .sort({ level: -1, xp: -1 }); // Trier par niveau et XP décroissants

    res.json({
      suggestions: suggestions.map(user => ({
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
    console.error('Erreur récupération suggestions:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des suggestions d\'amis'
    });
  }
});

module.exports = router;

