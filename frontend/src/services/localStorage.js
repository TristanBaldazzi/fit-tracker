import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CURRENT_SESSION: 'current_session',
  SESSION_PROGRESS: 'session_progress',
  LAST_SESSION_ID: 'last_session_id',
};

// Sauvegarder la séance en cours
export const saveCurrentSession = async (sessionData) => {
  try {
    const sessionToSave = {
      ...sessionData,
      lastSaved: new Date().toISOString(),
      isInProgress: true,
    };
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_SESSION, 
      JSON.stringify(sessionToSave)
    );
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SESSION_ID, 
      sessionData._id
    );
    
    console.log('Séance sauvegardée localement');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale:', error);
  }
};

// Récupérer la séance en cours
export const getCurrentSession = async () => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la séance:', error);
    return null;
  }
};

// Sauvegarder le progrès de la séance
export const saveSessionProgress = async (progressData) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSION_PROGRESS, 
      JSON.stringify(progressData)
    );
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du progrès:', error);
  }
};

// Récupérer le progrès de la séance
export const getSessionProgress = async () => {
  try {
    const progressData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_PROGRESS);
    if (progressData) {
      return JSON.parse(progressData);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du progrès:', error);
    return null;
  }
};

// Supprimer la séance en cours (quand terminée)
export const clearCurrentSession = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CURRENT_SESSION,
      STORAGE_KEYS.SESSION_PROGRESS,
      STORAGE_KEYS.LAST_SESSION_ID,
    ]);
    console.log('Séance en cours supprimée');
  } catch (error) {
    console.error('Erreur lors de la suppression de la séance:', error);
  }
};

// Vérifier s'il y a une séance en cours
export const hasCurrentSession = async () => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return sessionData !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de la séance:', error);
    return false;
  }
};

// Obtenir l'ID de la dernière séance
export const getLastSessionId = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION_ID);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID de séance:', error);
    return null;
  }
};


