import { useState, useEffect } from 'react';
import { hasCurrentSession, getCurrentSession, getSessionProgress } from '../services/localStorage';

export const useSessionResume = () => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    checkForSavedSession();
  }, []);

  const checkForSavedSession = async () => {
    try {
      const hasSession = await hasCurrentSession();
      if (hasSession) {
        const sessionData = await getCurrentSession();
        const progressData = await getSessionProgress();
        
        if (sessionData && progressData) {
          setSavedSession(sessionData);
          setSavedProgress(progressData);
          setShowResumeDialog(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la séance sauvegardée:', error);
    }
  };

  const handleResumeSession = (navigation) => {
    if (savedSession && savedProgress) {
      setShowResumeDialog(false);
      navigation.navigate('SessionInProgress', { 
        sessionId: savedSession._id,
        resumeFromProgress: true,
        savedProgress: savedProgress
      });
    }
  };

  const handleStartNewSession = (navigation) => {
    setShowResumeDialog(false);
    // L'utilisateur peut maintenant naviguer vers une nouvelle séance
  };

  const dismissDialog = () => {
    setShowResumeDialog(false);
  };

  return {
    showResumeDialog,
    savedSession,
    savedProgress,
    handleResumeSession,
    handleStartNewSession,
    dismissDialog,
  };
};


