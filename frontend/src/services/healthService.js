import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { userService } from './api';

// Simulation des données de santé pour le développement
// En production, utiliser react-native-health pour iOS et Google Fit pour Android

class HealthService {
  constructor() {
    this.STEPS_KEY = 'daily_steps';
    this.XP_KEY = 'user_xp';
    this.LAST_RESET_KEY = 'last_reset_date';
    this.STEP_VALIDATIONS_KEY = 'step_validations';
    this.CURRENT_GOAL_KEY = 'current_daily_goal';
    this.STEPS_PER_LEVEL = 2500; // 2500 pas = 1 niveau
    this.XP_PER_LEVEL = 10; // 10 XP par niveau
    this.BASE_GOAL = 10000; // Objectif de base
    this.GOAL_INCREMENT = 2500; // Augmentation de l'objectif
  }

  // Obtenir les pas du jour
  async getTodaySteps() {
    try {
      const lastReset = await AsyncStorage.getItem(this.LAST_RESET_KEY);
      const today = new Date().toDateString();
      
      // Si c'est un nouveau jour, remettre à zéro
      if (lastReset !== today) {
        await this.resetDailyData();
        return 0;
      }
      
      const steps = await AsyncStorage.getItem(this.STEPS_KEY);
      return steps ? parseInt(steps) : 0;
    } catch (error) {
      console.error('Erreur récupération pas:', error);
      return 0;
    }
  }

  // Simuler l'ajout de pas (en production, récupérer depuis HealthKit/Google Fit)
  async addSteps(steps) {
    try {
      const currentSteps = await this.getCurrentSteps();
      const newTotal = currentSteps + steps;
      await AsyncStorage.setItem(this.STEPS_KEY, newTotal.toString());
      
      // Vérifier si l'objectif a été atteint et l'augmenter automatiquement
      const goalResult = await this.checkAndIncreaseGoal(newTotal);
      
      return {
        newTotal,
        goalIncreased: goalResult.goalIncreased,
        newGoal: goalResult.newGoal,
        bonusXP: goalResult.bonusXP,
        message: goalResult.goalIncreased ? goalResult.message : null,
        levelUp: goalResult.levelUp,
        levelsGained: goalResult.levelsGained,
        oldLevel: goalResult.oldLevel,
        newLevel: goalResult.newLevel
      };
    } catch (error) {
      console.error('Erreur ajout pas:', error);
      return { newTotal: 0, goalIncreased: false };
    }
  }

  // Simuler l'ajout progressif de pas (pour la démo)
  async simulateWalking() {
    try {
      const currentSteps = await this.getCurrentSteps();
      // Ajouter entre 50 et 200 pas aléatoirement
      const stepsToAdd = Math.floor(Math.random() * 150) + 50;
      const newTotal = currentSteps + stepsToAdd;
      await AsyncStorage.setItem(this.STEPS_KEY, newTotal.toString());
      
      // Vérifier si l'objectif a été atteint et l'augmenter automatiquement
      const goalResult = await this.checkAndIncreaseGoal(newTotal);
      
      return {
        newTotal,
        goalIncreased: goalResult.goalIncreased,
        newGoal: goalResult.newGoal,
        bonusXP: goalResult.bonusXP,
        message: goalResult.goalIncreased ? goalResult.message : null,
        levelUp: goalResult.levelUp,
        levelsGained: goalResult.levelsGained,
        oldLevel: goalResult.oldLevel,
        newLevel: goalResult.newLevel
      };
    } catch (error) {
      console.error('Erreur simulation marche:', error);
      return { newTotal: 0, goalIncreased: false };
    }
  }

  // Récupérer les pas actuels (en production, utiliser HealthKit/Google Fit)
  async getCurrentSteps() {
    try {
      // Récupérer les pas stockés
      const storedSteps = await AsyncStorage.getItem(this.STEPS_KEY);
      if (storedSteps) {
        return parseInt(storedSteps);
      }
      
      // Si pas de pas stockés, initialiser à 0
      // En production, récupérer depuis HealthKit (iOS) ou Google Fit (Android)
      await AsyncStorage.setItem(this.STEPS_KEY, '0');
      return 0;
    } catch (error) {
      console.error('Erreur récupération pas actuels:', error);
      return 0;
    }
  }

  // Obtenir l'objectif actuel
  async getCurrentGoal() {
    try {
      const lastReset = await AsyncStorage.getItem(this.LAST_RESET_KEY);
      const today = new Date().toDateString();
      
      // Si c'est un nouveau jour, remettre l'objectif à la base
      if (lastReset !== today) {
        await AsyncStorage.setItem(this.CURRENT_GOAL_KEY, this.BASE_GOAL.toString());
        return this.BASE_GOAL;
      }
      
      const goal = await AsyncStorage.getItem(this.CURRENT_GOAL_KEY);
      return goal ? parseInt(goal) : this.BASE_GOAL;
    } catch (error) {
      console.error('Erreur récupération objectif:', error);
      return this.BASE_GOAL;
    }
  }

  // Calculer le pourcentage de progression
  async getProgressPercentage(steps) {
    const dailyGoal = await this.getCurrentGoal();
    return Math.min((steps / dailyGoal) * 100, 100);
  }

  // Calculer les pas restants pour l'objectif
  async getStepsToGoal(steps) {
    const dailyGoal = await this.getCurrentGoal();
    return Math.max(dailyGoal - steps, 0);
  }

  // Augmenter l'objectif si atteint
  async checkAndIncreaseGoal(steps) {
    try {
      const currentGoal = await this.getCurrentGoal();
      
      if (steps >= currentGoal) {
        const newGoal = currentGoal + this.GOAL_INCREMENT;
        await AsyncStorage.setItem(this.CURRENT_GOAL_KEY, newGoal.toString());
        
        // Donner un bonus XP pour avoir atteint l'objectif
        const bonusXP = Math.floor(currentGoal / 1000); // 1 XP par 1000 pas d'objectif
        const xpResult = await this.addXP(bonusXP);
        
        let message = `🎉 Objectif ${currentGoal.toLocaleString()} pas atteint ! Nouvel objectif : ${newGoal.toLocaleString()} pas (+${bonusXP} XP bonus)`;
        
        // Si l'utilisateur a monté de niveau avec le bonus XP, l'ajouter au message
        if (xpResult.levelUp) {
          message += `\n\n${xpResult.message}`;
        }
        
        return {
          goalIncreased: true,
          newGoal,
          bonusXP,
          message,
          levelUp: xpResult.levelUp,
          levelsGained: xpResult.levelsGained,
          oldLevel: xpResult.oldLevel,
          newLevel: xpResult.newLevel
        };
      }
      
      return { goalIncreased: false };
    } catch (error) {
      console.error('Erreur augmentation objectif:', error);
      return { goalIncreased: false };
    }
  }

  // Valider les pas et donner de l'XP (tous les 2500 pas)
  async validateSteps() {
    try {
      const currentSteps = await this.getCurrentSteps();
      const currentMilestone = Math.floor(currentSteps / 2500);
      
      // Vérifier si l'objectif a été atteint et l'augmenter si nécessaire
      const goalResult = await this.checkAndIncreaseGoal(currentSteps);
      
      // Vérifier si l'utilisateur a déjà validé ce palier
      const validations = await this.getStepValidations();
      if (validations.includes(currentMilestone)) {
        // Si l'objectif a été augmenté, on peut quand même donner un message
        if (goalResult.goalIncreased) {
          return {
            success: true,
            message: goalResult.message,
            goalIncreased: true,
            newGoal: goalResult.newGoal,
            bonusXP: goalResult.bonusXP
          };
        }
        
        return { success: false, message: 'Palier déjà validé aujourd\'hui !' };
      }
      
      // Ajouter l'XP (10 XP par palier de 2500 pas)
      const xpGained = currentMilestone * 10;
      const xpResult = await this.addXP(xpGained);
      
      // Marquer le palier comme validé
      await this.markLevelAsValidated(currentMilestone);
      
      let message = `+${xpGained} XP ! ${currentMilestone * 2500} pas validés !`;
      
      // Si l'utilisateur a monté de niveau, l'ajouter au message
      if (xpResult.levelUp) {
        message += `\n\n${xpResult.message}`;
      }
      
      // Si l'objectif a aussi été augmenté, l'ajouter au message
      if (goalResult.goalIncreased) {
        message += `\n\n${goalResult.message}`;
      }
      
      return { 
        success: true, 
        xpGained, 
        milestone: currentMilestone,
        steps: currentSteps,
        message,
        goalIncreased: goalResult.goalIncreased,
        newGoal: goalResult.newGoal,
        bonusXP: goalResult.bonusXP,
        levelUp: xpResult.levelUp,
        levelsGained: xpResult.levelsGained,
        oldLevel: xpResult.oldLevel,
        newLevel: xpResult.newLevel
      };
    } catch (error) {
      console.error('Erreur validation pas:', error);
      return { success: false, message: 'Erreur lors de la validation' };
    }
  }

  // Obtenir l'XP total de l'utilisateur (depuis le contexte d'auth)
  async getTotalXP() {
    try {
      // L'XP sera récupéré depuis le contexte d'authentification
      // Pour l'instant, on retourne 0 et l'XP sera affiché depuis le contexte
      return 0;
    } catch (error) {
      console.error('Erreur récupération XP:', error);
      return 0;
    }
  }

  // Ajouter de l'XP au profil utilisateur
  async addXP(amount) {
    try {
      // Ajouter l'XP via l'API (qui met à jour le profil utilisateur)
      const result = await userService.addXP(amount);
      return {
        xp: result.user.xp,
        level: result.user.level,
        levelUp: result.levelUp,
        levelsGained: result.levelsGained,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
        message: result.message
      };
    } catch (error) {
      console.error('Erreur ajout XP:', error);
      return { xp: 0, level: 1, levelUp: false };
    }
  }

  // Obtenir les niveaux validés aujourd'hui
  async getStepValidations() {
    try {
      const today = new Date().toDateString();
      const key = `${this.STEP_VALIDATIONS_KEY}_${today}`;
      const validations = await AsyncStorage.getItem(key);
      return validations ? JSON.parse(validations) : [];
    } catch (error) {
      console.error('Erreur récupération validations:', error);
      return [];
    }
  }

  // Marquer un niveau comme validé
  async markLevelAsValidated(level) {
    try {
      const today = new Date().toDateString();
      const key = `${this.STEP_VALIDATIONS_KEY}_${today}`;
      const validations = await this.getStepValidations();
      validations.push(level);
      await AsyncStorage.setItem(key, JSON.stringify(validations));
    } catch (error) {
      console.error('Erreur marquage validation:', error);
    }
  }

  // Remettre à zéro les données quotidiennes
  async resetDailyData() {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(this.LAST_RESET_KEY, today);
      await AsyncStorage.setItem(this.STEPS_KEY, '0');
      // Les validations se remettent à zéro automatiquement avec la nouvelle date
    } catch (error) {
      console.error('Erreur reset quotidien:', error);
    }
  }

  // Obtenir les statistiques du jour
  async getDailyStats() {
    try {
      const steps = await this.getCurrentSteps();
      const currentGoal = await this.getCurrentGoal();
      const progress = await this.getProgressPercentage(steps);
      const stepsToGoal = await this.getStepsToGoal(steps);
      const validations = await this.getStepValidations();
      const totalXP = await this.getTotalXP();
      const currentMilestone = Math.floor(steps / 2500);
      
      return {
        steps,
        progress,
        stepsToGoal,
        currentGoal,
        validations,
        totalXP,
        currentMilestone,
        canValidate: currentMilestone > 0 && !validations.includes(currentMilestone)
      };
    } catch (error) {
      console.error('Erreur stats quotidiennes:', error);
      return {
        steps: 0,
        progress: 0,
        stepsToGoal: 10000,
        currentGoal: 10000,
        validations: [],
        totalXP: 0,
        currentMilestone: 0,
        canValidate: false
      };
    }
  }

  // Obtenir un message de motivation
  getMotivationMessage(stats) {
    const { steps, stepsToGoal, progress } = stats;
    
    if (progress >= 100) {
      return `🎉 Objectif atteint ! ${steps.toLocaleString()} pas aujourd'hui !`;
    } else if (progress >= 75) {
      return `Presque là ! Plus que ${stepsToGoal} pas pour l'objectif ! 🔥`;
    } else if (progress >= 50) {
      return `Super ! Tu es à ${Math.round(progress)}% de ton objectif ! 💪`;
    } else if (progress >= 25) {
      return `Continue ! ${steps.toLocaleString()} pas, c'est un bon début ! ⭐`;
    } else {
      return `Allez, on y va ! Objectif : 10 000 pas aujourd'hui ! 🚀`;
    }
  }
}

export default new HealthService();
