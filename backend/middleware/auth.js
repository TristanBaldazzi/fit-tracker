const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token d\'accès requis' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré' 
      });
    }
    
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ 
      message: 'Erreur d\'authentification' 
    });
  }
};

// Middleware pour vérifier que l'utilisateur est le propriétaire de la ressource
const authorizeOwner = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (!resourceUserId) {
    return res.status(400).json({ 
      message: 'ID utilisateur requis' 
    });
  }
  
  if (!req.user._id.equals(resourceUserId)) {
    return res.status(403).json({ 
      message: 'Accès non autorisé à cette ressource' 
    });
  }
  
  next();
};

// Middleware pour vérifier que l'utilisateur est admin (optionnel pour l'avenir)
const authorizeAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      message: 'Accès administrateur requis' 
    });
  }
  
  next();
};

// Middleware pour vérifier que l'utilisateur a un profil public
const checkPublicProfile = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.params.id;
    
    if (!targetUserId) {
      return res.status(400).json({ 
        message: 'ID utilisateur requis' 
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Si l'utilisateur n'est pas public et que ce n'est pas le propriétaire
    if (!targetUser.settings.isPublic && !req.user._id.equals(targetUserId)) {
      return res.status(403).json({ 
        message: 'Profil privé' 
      });
    }
    
    req.targetUser = targetUser;
    next();
  } catch (error) {
    console.error('Erreur de vérification du profil:', error);
    res.status(500).json({ 
      message: 'Erreur de vérification du profil' 
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeOwner,
  authorizeAdmin,
  checkPublicProfile
};

