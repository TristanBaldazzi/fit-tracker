const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Inscription avec email/mot de passe
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('username').trim().isLength({ min: 3 }).isAlphanumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, username } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'Email déjà utilisé' 
          : 'Nom d\'utilisateur déjà utilisé'
      });
    }

    // Générer un code de vérification
    const verificationCode = emailService.generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Créer l'utilisateur
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      username,
      emailVerified: false,
      verificationCode,
      verificationCodeExpires
    });

    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    // Envoyer l'email de vérification en arrière-plan (non bloquant)
    // Avec un timeout pour éviter que ça bloque trop longtemps
    const sendEmailWithTimeout = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email timeout')), 5000)
        );
        const emailPromise = emailService.sendVerificationEmail(email, verificationCode);
        await Promise.race([emailPromise, timeoutPromise]);
      } catch (error) {
        console.error('Erreur envoi email:', error.message);
        // L'utilisateur peut demander un nouveau code plus tard
      }
    };
    
    // Lancer l'envoi d'email en arrière-plan sans attendre
    sendEmailWithTimeout().catch(err => {
      console.error('Erreur lors de l\'envoi asynchrone de l\'email:', err);
    });

    res.status(201).json({
      message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        level: user.level,
        xp: user.xp,
        emailVerified: user.emailVerified
      },
      emailSent: true // On assume que l'email sera envoyé, même si ça échoue l'utilisateur peut demander un nouveau code
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion avec email/mot de passe
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Email et mot de passe requis'
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        level: user.level,
        xp: user.xp,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      message: 'Erreur lors de la connexion'
    });
  }
});

// @route   POST /api/auth/apple
// @desc    Connexion/Inscription avec Apple Sign-In
// @access  Public
router.post('/apple', [
  body('appleId').exists(),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données Apple Sign-In invalides'
      });
    }

    const { appleId, firstName, lastName, email } = req.body;

    // Chercher l'utilisateur existant
    let user = await User.findOne({ appleId });

    if (user) {
      // Utilisateur existant - connexion
      const token = generateToken(user._id);
      
      return res.json({
        message: 'Connexion Apple réussie',
        token,
        user: {
          _id: user._id,
          email: user.email,
          emailVerified: user.emailVerified,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          level: user.level,
          xp: user.xp,
          avatar: user.avatar
        }
      });
    }

    // Nouvel utilisateur - inscription
    // Générer un nom d'utilisateur unique
    const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
    
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    user = new User({
      appleId,
      firstName,
      lastName,
      username,
      email: email || null
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Inscription Apple réussie',
      token,
      user: {
        _id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        level: user.level,
        xp: user.xp
      }
    });
  } catch (error) {
    console.error('Erreur Apple Sign-In:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'authentification Apple'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
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
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Rafraîchir le token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    
    res.json({
      message: 'Token rafraîchi',
      token
    });
  } catch (error) {
    console.error('Erreur rafraîchissement token:', error);
    res.status(500).json({
      message: 'Erreur lors du rafraîchissement du token'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Vérifier l'email avec un code
// @access  Private
router.post('/verify-email', [
  authenticateToken,
  body('code').isLength({ min: 4, max: 4 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Code de vérification invalide'
      });
    }

    const { code } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: 'Email déjà vérifié'
      });
    }

    // Vérifier le code et l'expiration
    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({
        message: 'Code de vérification incorrect'
      });
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: 'Code de vérification expiré'
      });
    }

    // Marquer l'email comme vérifié
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({
      message: 'Email vérifié avec succès',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        level: user.level,
        xp: user.xp,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Erreur de vérification email:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Renvoyer un code de vérification
// @access  Private
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: 'Email déjà vérifié'
      });
    }

    // Vérifier la limitation de temps (1 heure)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (user.lastVerificationEmailSent && user.lastVerificationEmailSent > oneHourAgo) {
      const timeLeft = Math.ceil((user.lastVerificationEmailSent.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000 / 60);
      return res.status(429).json({
        message: `Vous devez attendre ${timeLeft} minutes avant de pouvoir renvoyer un email`,
        timeLeft: timeLeft
      });
    }

    // Générer un nouveau code
    const verificationCode = emailService.generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    user.lastVerificationEmailSent = now;
    await user.save();

    // Envoyer l'email
    const emailResult = await emailService.sendVerificationEmail(user.email, verificationCode);
    
    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }

    res.json({
      message: 'Code de vérification renvoyé',
      nextAvailableTime: new Date(now.getTime() + 60 * 60 * 1000) // 1 heure plus tard
    });
  } catch (error) {
    console.error('Erreur renvoi code:', error);
    res.status(500).json({
      message: 'Erreur lors du renvoi du code'
    });
  }
});

// @route   GET /api/auth/email-status
// @desc    Obtenir le statut de vérification d'email
// @access  Private
router.get('/email-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Calculer le temps restant avant de pouvoir renvoyer un email
    let canResend = true;
    let timeLeft = 0;
    
    if (user.lastVerificationEmailSent) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      if (user.lastVerificationEmailSent > oneHourAgo) {
        canResend = false;
        timeLeft = Math.ceil((user.lastVerificationEmailSent.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000 / 60);
      }
    }

    res.json({
      emailVerified: user.emailVerified,
      canResendEmail: canResend,
      timeLeftMinutes: timeLeft,
      email: user.email
    });
  } catch (error) {
    console.error('Erreur statut email:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du statut'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion (côté client principalement)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Dans une implémentation plus avancée, on pourrait ajouter le token à une blacklist
    res.json({
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({
      message: 'Erreur lors de la déconnexion'
    });
  }
});

// Route pour changer le mot de passe
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Le mot de passe actuel et le nouveau mot de passe sont requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit être différent de l\'actuel'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    user.password = hashedNewPassword;
    await user.save();

    console.log(`Mot de passe modifié pour l'utilisateur ${user.email}`);

    res.json({
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

// Route pour demander une réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'L\'adresse email est requise'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return res.json({
        message: 'Si cette adresse email est associée à un compte, un code de réinitialisation a été envoyé'
      });
    }

    // Vérifier le rate limiting (1 email par heure)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (user.lastResetPasswordEmailSent && user.lastResetPasswordEmailSent > oneHourAgo) {
      const timeLeft = Math.ceil((user.lastResetPasswordEmailSent.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000 / 60);
      return res.status(429).json({
        message: `Vous devez attendre ${timeLeft} minutes avant de pouvoir demander un nouveau code`,
        timeLeft: timeLeft
      });
    }

    // Générer le code de réinitialisation
    const resetCode = emailService.generateResetCode();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Sauvegarder le code dans la base de données
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = resetCodeExpires;
    user.lastResetPasswordEmailSent = now;
    await user.save();

    // Envoyer l'email
    const emailResult = await emailService.sendResetPasswordEmail(email, resetCode);

    if (emailResult.success) {
      console.log(`Code de réinitialisation envoyé à ${email}`);
      res.json({
        message: 'Si cette adresse email est associée à un compte, un code de réinitialisation a été envoyé'
      });
    } else {
      console.error('Erreur envoi email réinitialisation:', emailResult.error);
      res.status(500).json({
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }

  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({
      message: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// Route pour vérifier le code de réinitialisation
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'L\'email et le code sont requis'
      });
    }

    if (code.length !== 6) {
      return res.status(400).json({
        message: 'Le code doit contenir 6 chiffres'
      });
    }

    // Vérifier l'utilisateur et le code
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Code invalide ou expiré'
      });
    }

    res.json({
      message: 'Code valide'
    });

  } catch (error) {
    console.error('Erreur vérification code reset:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification du code'
    });
  }
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: 'L\'email, le code et le nouveau mot de passe sont requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    if (code.length !== 6) {
      return res.status(400).json({
        message: 'Le code doit contenir 6 chiffres'
      });
    }

    // Vérifier l'utilisateur et le code
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Code invalide ou expiré'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe et nettoyer les codes
    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();

    console.log(`Mot de passe réinitialisé pour l'utilisateur ${user.email}`);

    res.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

module.exports = router;
