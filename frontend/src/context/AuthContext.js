import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Vérifier si l'utilisateur est connecté au démarrage
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Vérifier si le token est toujours valide
        const userData = await authService.getMe();
        setUser(userData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      // Token invalide, supprimer le token stocké
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      // Stocker le token
      await SecureStore.setItemAsync('authToken', response.token);
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      
      // Stocker le token
      await SecureStore.setItemAsync('authToken', response.token);
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur d\'inscription' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'Apple Sign-In n\'est disponible que sur iOS' };
      }

      setIsLoading(true);
      
      // Vérifier si Apple Sign-In est disponible
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Apple Sign-In n\'est pas disponible' };
      }

      // Demander l'authentification Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Préparer les données pour l'API
      const appleData = {
        appleId: credential.user,
        firstName: credential.fullName?.givenName || 'Utilisateur',
        lastName: credential.fullName?.familyName || 'Apple',
        email: credential.email || null,
      };

      const response = await authService.loginWithApple(appleData);
      
      // Stocker le token
      await SecureStore.setItemAsync('authToken', response.token);
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Erreur Apple Sign-In:', error);
      
      if (error.code === 'ERR_CANCELED') {
        return { success: false, error: 'Connexion annulée' };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion Apple' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Appeler l'API de déconnexion
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer le token et réinitialiser l'état
      await SecureStore.deleteItemAsync('authToken');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData.user);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    token,
    login,
    register,
    loginWithApple,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


