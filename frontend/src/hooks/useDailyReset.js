import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useDailyReset = () => {
  useEffect(() => {
    const checkAndResetDaily = async () => {
      try {
        const lastReset = await AsyncStorage.getItem('last_reset_date');
        const today = new Date().toDateString();
        
        if (lastReset !== today) {
          // C'est un nouveau jour, remettre à zéro les données quotidiennes
          await AsyncStorage.setItem('last_reset_date', today);
          await AsyncStorage.setItem('daily_steps', '0');
          
          console.log('🔄 Données quotidiennes remises à zéro pour le nouveau jour');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du reset quotidien:', error);
      }
    };

    // Vérifier au chargement
    checkAndResetDaily();

    // Vérifier toutes les minutes pour s'assurer que le reset se fait à 00h
    const interval = setInterval(checkAndResetDaily, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, []);
};

export default useDailyReset;


