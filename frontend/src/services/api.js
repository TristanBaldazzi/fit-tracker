import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Configuration de base de l'API
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5001/api' 
  : 'https://fit-tracker-o7mr.onrender.com/api';

// Secret pour bypasser la protection Vercel
// À obtenir depuis les paramètres du projet Vercel > Protection > Protection Bypass for Automation
// Puis ajouter dans app.json > extra > vercelAutomationBypassSecret
const VERCEL_PROTECTION_BYPASS_SECRET = Constants.expoConfig?.extra?.vercelAutomationBypassSecret || '';

// Créer une instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification et le bypass Vercel
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    
    // Ajouter les en-têtes pour bypasser la protection Vercel
    if (VERCEL_PROTECTION_BYPASS_SECRET) {
      config.headers['x-vercel-protection-bypass'] = VERCEL_PROTECTION_BYPASS_SECRET;
      config.headers['x-vercel-set-bypass-cookie'] = 'true';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log détaillé des erreurs en production pour déboguer
    console.error('❌ Erreur API:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      // Token expiré ou invalide
      try {
        await SecureStore.deleteItemAsync('authToken');
      } catch (e) {
        console.error('Erreur lors de la suppression du token:', e);
      }
      // Rediriger vers la page de connexion
      // Cette logique sera gérée par le contexte d'authentification
    }

    // Gérer les erreurs réseau
    if (!error.response && error.message) {
      console.error('❌ Erreur réseau:', error.message);
    }

    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  // Inscription avec email/mot de passe
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Connexion avec email/mot de passe
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Connexion avec Apple Sign-In
  loginWithApple: async (appleData) => {
    const response = await api.post('/auth/apple', appleData);
    return response.data;
  },

  // Vérification d'email
  verifyEmail: async (code) => {
    const response = await api.post('/auth/verify-email', { code });
    return response.data;
  },

  // Renvoyer le code de vérification
  resendVerification: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  // Obtenir le statut de vérification d'email
  getEmailStatus: async () => {
    const response = await api.get('/auth/email-status');
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Mot de passe oublié - envoyer le code
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Vérifier le code de réinitialisation
  verifyResetCode: async (email, code) => {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response.data;
  },

  // Réinitialiser le mot de passe
  resetPassword: async (email, code, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      code,
      newPassword
    });
    return response.data;
  },

  // Obtenir les informations de l'utilisateur connecté
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Rafraîchir le token
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // Déconnexion
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Services des utilisateurs
export const userService = {
  // Obtenir le profil d'un utilisateur
  getProfile: async (userId) => {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  // Ajouter de l'XP à l'utilisateur
  addXP: async (xpAmount) => {
    const response = await api.post('/users/add-xp', { xp: xpAmount });
    return response.data;
  },

  // Mettre à jour les paramètres
  updateSettings: async (settings) => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  },

  // Rechercher des utilisateurs
  searchUsers: async (query, limit = 10) => {
    const response = await api.get('/users/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Obtenir les statistiques d'un utilisateur
  getUserStats: async (userId) => {
    const response = await api.get(`/users/stats/${userId}`);
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  },

  // Obtenir les séances publiques d'un utilisateur
  getUserSessions: async (userId, limit = 10, offset = 0) => {
    const response = await api.get(`/users/${userId}/sessions`, {
      params: { limit, offset }
    });
    return response.data;
  },

  // Copier une séance d'un autre utilisateur
  copyUserSession: async (userId, sessionId) => {
    const response = await api.post(`/users/${userId}/sessions/${sessionId}/copy`);
    return response.data;
  },

  // Enregistrer le token de notification push
  registerPushToken: async (pushToken) => {
    const response = await api.post('/users/push-token', { pushToken });
    return response.data;
  },
};


// Services des séances
export const sessionService = {
  // Obtenir les séances de l'utilisateur
  getSessions: async (filters = {}) => {
    const response = await api.get('/sessions', { params: filters });
    return response.data;
  },

  // Obtenir les séances publiques
  getPublicSessions: async (filters = {}) => {
    const response = await api.get('/sessions/public', { params: filters });
    return response.data;
  },

  // Obtenir une séance spécifique
  getSession: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Créer une séance
  createSession: async (sessionData) => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },

  // Mettre à jour une séance
  updateSession: async (sessionId, sessionData) => {
    const response = await api.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  },

  // Supprimer une séance
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  // Marquer une séance comme complétée
  completeSession: async (sessionId, completionData) => {
    console.log('🌐 === APPEL API COMPLETE SESSION ===');
    console.log('📡 URL complète:', `${API_BASE_URL}/sessions/${sessionId}/complete`);
    console.log('📦 Données envoyées:', completionData);
    
    try {
      const response = await api.post(`/sessions/${sessionId}/complete`, completionData);
      console.log('✅ Réponse reçue:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur API:', error);
      console.error('❌ Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Obtenir les séances terminées (historique)
  getCompletedSessions: async () => {
    const response = await api.get('/sessions/completed');
    return response.data;
  },

  // Obtenir une séance terminée spécifique
  getCompletedSession: async (sessionId) => {
    const response = await api.get(`/sessions/completed/${sessionId}`);
    return response.data;
  },

  // Copier une séance
  copySession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/copy`);
    return response.data;
  },

  // Supprimer une séance complétée
  deleteCompletedSession: async (sessionId, completionId) => {
    const response = await api.delete(`/sessions/${sessionId}/completions/${completionId}`);
    return response.data;
  },

  // Modifier une séance complétée
  updateCompletedSession: async (sessionId, completionId, data) => {
    const response = await api.put(`/sessions/${sessionId}/completions/${completionId}`, data);
    return response.data;
  },
};

// Services des exercices
export const exerciseService = {
  // Obtenir tous les exercices (base + personnalisés de l'utilisateur)
  getExercises: async (filters = {}) => {
    const response = await api.get('/exercises', { params: filters });
    return response.data;
  },

  // Obtenir les exercices personnalisés de l'utilisateur
  getUserExercises: async () => {
    const response = await api.get('/exercises/user');
    return response.data;
  },

  // Obtenir un exercice spécifique
  getExercise: async (exerciseId) => {
    const response = await api.get(`/exercises/${exerciseId}`);
    return response.data;
  },

  // Créer un exercice personnalisé
  createExercise: async (exerciseData) => {
    const response = await api.post('/exercises', exerciseData);
    return response.data;
  },

  // Mettre à jour un exercice
  updateExercise: async (exerciseId, exerciseData) => {
    const response = await api.put(`/exercises/${exerciseId}`, exerciseData);
    return response.data;
  },

  // Supprimer un exercice
  deleteExercise: async (exerciseId) => {
    const response = await api.delete(`/exercises/${exerciseId}`);
    return response.data;
  },

  // Obtenir les catégories d'exercices
  getCategories: async () => {
    const response = await api.get('/exercises/categories');
    return response.data;
  },

  // Obtenir les groupes musculaires
  getMuscleGroups: async () => {
    const response = await api.get('/exercises/muscle-groups');
    return response.data;
  },

  // Obtenir les exercices populaires
  getPopularExercises: async (limit = 10) => {
    const response = await api.get('/exercises/popular', { params: { limit } });
    return response.data;
  },
};

// Services des amis
export const friendService = {
  // Obtenir la liste des amis
  getFriends: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  // Obtenir les demandes d'amitié en attente
  getPendingRequests: async () => {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  // Envoyer une demande d'amitié
  sendFriendRequest: async (recipientId) => {
    const response = await api.post('/friends/request', { recipientId });
    return response.data;
  },

  // Accepter une demande d'amitié
  acceptFriendRequest: async (requestId) => {
    const response = await api.put(`/friends/accept/${requestId}`);
    return response.data;
  },

  // Refuser/supprimer une demande d'amitié
  removeFriendRequest: async (requestId) => {
    const response = await api.delete(`/friends/request/${requestId}`);
    return response.data;
  },

  // Supprimer un ami
  removeFriend: async (friendId) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },

  // Vérifier le statut d'amitié
  checkFriendshipStatus: async (userId) => {
    const response = await api.get(`/friends/check/${userId}`);
    return response.data;
  },

  // Obtenir des suggestions d'amis
  getFriendSuggestions: async (limit = 5) => {
    const response = await api.get('/friends/suggestions', { params: { limit } });
    return response.data;
  },

  // Obtenir les demandes d'amitié envoyées
  getSentRequests: async () => {
    const response = await api.get('/friends/sent-requests');
    return response.data;
  },
};

// Services du classement
export const leaderboardService = {
  // Obtenir le classement des amis
  getFriendsLeaderboard: async () => {
    const response = await api.get('/leaderboard/friends');
    return response.data;
  },

  // Obtenir le classement global
  getGlobalLeaderboard: async (limit = 50) => {
    const response = await api.get('/leaderboard/global', { params: { limit } });
    return response.data;
  },

  // Obtenir les statistiques du classement
  getLeaderboardStats: async () => {
    const response = await api.get('/leaderboard/stats');
    return response.data;
  },
};


export default api;
