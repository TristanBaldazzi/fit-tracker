const express = require('express');
const Friend = require('../models/Friend');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/leaderboard/friends
// @desc    Obtenir le classement des amis
// @access  Private
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtenir les amis
    const friends = await Friend.getFriends(userId);

    if (friends.length === 0) {
      return res.json({
        message: 'Ajoutez vos amis pour voir un classement personnalisé !',
        leaderboard: [],
        userPosition: null,
        totalFriends: 0
      });
    }

    // Ajouter l'utilisateur actuel à la liste
    const currentUser = await User.findById(userId).select('username firstName lastName avatar level xp');
    const allUsers = [
      {
        _id: currentUser._id,
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatar: currentUser.avatar,
        level: currentUser.level,
        xp: currentUser.xp,
        isCurrentUser: true
      },
      ...friends.map(friend => ({
        ...friend,
        isCurrentUser: false
      }))
    ];

    // Trier par niveau puis par XP
    allUsers.sort((a, b) => {
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      return b.xp - a.xp;
    });

    // Trouver la position de l'utilisateur actuel
    const userPosition = allUsers.findIndex(user => user.isCurrentUser) + 1;

    // Ajouter les positions et les badges
    const leaderboard = allUsers.map((user, index) => {
      const position = index + 1;
      let badge = null;

      // Système de badges basé sur la position
      if (position === 1) badge = '🥇';
      else if (position === 2) badge = '🥈';
      else if (position === 3) badge = '🥉';
      else if (position <= 5) badge = '🏆';
      else if (position <= 10) badge = '⭐';

      return {
        ...user,
        position,
        badge
      };
    });

    res.json({
      leaderboard,
      userPosition,
      totalFriends: friends.length,
      userStats: {
        level: currentUser.level,
        xp: currentUser.xp,
        position: userPosition
      }
    });
  } catch (error) {
    console.error('Erreur classement amis:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du classement des amis'
    });
  }
});

// @route   GET /api/leaderboard/global
// @desc    Obtenir le classement global (top utilisateurs publics)
// @access  Private
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Obtenir les top utilisateurs publics
    const topUsers = await User.find({
      'settings.isPublic': true
    })
    .select('username firstName lastName avatar level xp totalSessionsCompleted')
    .sort({ level: -1, xp: -1 })
    .limit(parseInt(limit));

    // Trouver la position de l'utilisateur actuel dans le classement global
    const currentUser = await User.findById(req.user._id);
    const userGlobalPosition = await User.countDocuments({
      'settings.isPublic': true,
      $or: [
        { level: { $gt: currentUser.level } },
        { 
          level: currentUser.level,
          xp: { $gt: currentUser.xp }
        }
      ]
    }) + 1;

    const leaderboard = topUsers.map((user, index) => {
      const position = index + 1;
      let badge = null;

      if (position === 1) badge = '👑';
      else if (position === 2) badge = '🥈';
      else if (position === 3) badge = '🥉';
      else if (position <= 10) badge = '🏆';
      else if (position <= 25) badge = '⭐';

      return {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        totalSessionsCompleted: user.totalSessionsCompleted,
        position,
        badge,
        isCurrentUser: user._id.equals(req.user._id)
      };
    });

    res.json({
      leaderboard,
      userGlobalPosition,
      totalUsers: await User.countDocuments({ 'settings.isPublic': true }),
      userStats: {
        level: currentUser.level,
        xp: currentUser.xp,
        position: userGlobalPosition
      }
    });
  } catch (error) {
    console.error('Erreur classement global:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du classement global'
    });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Obtenir les statistiques du classement
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    // Statistiques des amis
    const friends = await Friend.getFriends(userId);
    const friendsCount = friends.length;

    let friendsPosition = null;
    let friendsStats = null;

    if (friendsCount > 0) {
      // Calculer la position parmi les amis
      const friendsWithUser = [
        { level: currentUser.level, xp: currentUser.xp },
        ...friends.map(friend => ({ level: friend.level, xp: friend.xp }))
      ];

      friendsWithUser.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      });

      friendsPosition = friendsWithUser.findIndex(user => 
        user.level === currentUser.level && user.xp === currentUser.xp
      ) + 1;

      friendsStats = {
        totalFriends: friendsCount,
        position: friendsPosition,
        betterThan: friendsCount - friendsPosition,
        worseThan: friendsPosition - 1
      };
    }

    // Statistiques globales
    const totalPublicUsers = await User.countDocuments({ 'settings.isPublic': true });
    const globalPosition = await User.countDocuments({
      'settings.isPublic': true,
      $or: [
        { level: { $gt: currentUser.level } },
        { 
          level: currentUser.level,
          xp: { $gt: currentUser.xp }
        }
      ]
    }) + 1;

    const globalStats = {
      totalUsers: totalPublicUsers,
      position: globalPosition,
      percentile: Math.round(((totalPublicUsers - globalPosition + 1) / totalPublicUsers) * 100)
    };

    res.json({
      friends: friendsStats,
      global: globalStats,
      user: {
        level: currentUser.level,
        xp: currentUser.xp,
        totalSessionsCompleted: currentUser.totalSessionsCompleted
      }
    });
  } catch (error) {
    console.error('Erreur statistiques classement:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques du classement'
    });
  }
});

module.exports = router;

