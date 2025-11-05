import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { userService } from './api';

// Vérifier si on est sur un appareil physique
const isDevice = Constants.isDevice;

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  /**
   * Demander les permissions de notification
   */
  async requestPermissions() {
    if (!isDevice) {
      console.warn('Les notifications push ne fonctionnent que sur un appareil physique');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission de notification refusée');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  /**
   * Obtenir le token de notification push
   */
  async getPushToken() {
    try {
      if (!isDevice) {
        console.warn('Les notifications push ne fonctionnent que sur un appareil physique');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'c6f319b3-2a03-40a9-9741-72e37d36c484', // Votre EAS project ID depuis app.json
      });

      this.expoPushToken = tokenData.data;
      return this.expoPushToken;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Enregistrer le token sur le serveur
   */
  async registerPushToken() {
    try {
      const token = await this.getPushToken();
      if (!token) {
        return false;
      }

      await userService.registerPushToken(token);
      console.log('Token de notification enregistré avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  /**
   * Configurer les gestionnaires de notifications
   */
  setupNotificationHandlers(navigation) {
    // Gestionnaire pour les notifications reçues quand l'app est au premier plan
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Gestionnaire pour les notifications cliquées
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification cliquée:', response);
      const data = response.notification.request.content.data;
      
      // Navigation selon le type de notification
      if (data?.type === 'friend_request') {
        navigation?.navigate('Friends', { tab: 'requests' });
      }
    });
  }

  /**
   * Programmer une notification locale (pour les tests)
   */
  async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { seconds: 1 },
    });
  }
}

export default new NotificationService();

