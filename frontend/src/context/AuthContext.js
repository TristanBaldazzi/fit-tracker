import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { authService } from '../services/api';

// S'assurer que React est disponible depuis global si nécessaire
if (typeof global !== 'undefined' && !global.React) {
  global.React = React;
}

// Vérification critique
if (!React) {
  console.error('❌ [AuthContext] React est null');
  throw new Error('React is not loaded in AuthContext');
}

// Vérifier que useState est disponible - utiliser React.useState si useState importé n'est pas disponible
const finalUseState = useState || React?.useState;
const finalUseEffect = useEffect || React?.useEffect;
const finalCreateContext = createContext || React?.createContext;
const finalUseContext = useContext || React?.useContext;

if (!finalUseState) {
  console.error('❌ [AuthContext] useState et React.useState sont null');
  console.error('❌ [AuthContext] React keys:', Object.keys(React || {}));
  throw new Error('useState is not available. React keys: ' + Object.keys(React || {}).join(', '));
}

console.log('✅ [AuthContext] React disponible:', !!React);
console.log('✅ [AuthContext] useState disponible:', !!finalUseState);
console.log('✅ [AuthContext] React.useState disponible:', !!React?.useState);

const AuthContext = finalCreateContext({});

export const useAuth = () => {
  const context = finalUseContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('🔍 [AuthProvider] Début du composant');
  console.log('🔍 [AuthProvider] React:', React);
  console.log('🔍 [AuthProvider] finalUseState disponible:', !!finalUseState);
  console.log('🔍 [AuthProvider] React.useState disponible:', !!React?.useState);
  
  // UTILISER finalUseState au lieu de useState directement
  console.log('🔍 [AuthProvider] Tentative d\'utilisation de finalUseState...');
  const [user, setUser] = finalUseState(null);
  console.log('✅ [AuthProvider] finalUseState(user) réussi');
  
  const [isAuthenticated, setIsAuthenticated] = finalUseState(false);
  console.log('✅ [AuthProvider] finalUseState(isAuthenticated) réussi');
  
  const [isLoading, setIsLoading] = finalUseState(true);
  console.log('✅ [AuthProvider] finalUseState(isLoading) réussi');
  
  const [token, setToken] = finalUseState(null);
  console.log('✅ [AuthProvider] finalUseState(token) réussi');

  // Vérifier si l'utilisateur est connecté au démarrage
  finalUseEffect(() => {
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

      // Logger toutes les données reçues d'Apple pour debug
      console.log('📱 [Apple Sign-In] Credential complet:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken ? 'présent' : 'absent',
        authorizationCode: credential.authorizationCode ? 'présent' : 'absent',
        realUserStatus: credential.realUserStatus,
      });

      // Préparer les données pour l'API
      // Apple peut ne pas renvoyer fullName lors des connexions suivantes
      // On envoie null si les données ne sont pas disponibles (pas de valeurs par défaut)
      const firstName = credential.fullName?.givenName?.trim() || null;
      const lastName = credential.fullName?.familyName?.trim() || null;
      const email = credential.email || null;

      const appleData = {
        appleId: credential.user,
        firstName: firstName,
        lastName: lastName,
        email: email,
        // Envoyer l'identityToken au backend pour qu'il puisse extraire l'email si nécessaire
        identityToken: credential.identityToken || null,
      };
      
      console.log('📱 [Apple Sign-In] Données envoyées au backend:', {
        appleId: appleData.appleId,
        firstName: appleData.firstName || 'null',
        lastName: appleData.lastName || 'null',
        email: appleData.email || 'null',
        identityToken: appleData.identityToken ? 'présent' : 'absent',
      });

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

  console.log('✅ [AuthProvider] Composant initialisé avec succès');
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


