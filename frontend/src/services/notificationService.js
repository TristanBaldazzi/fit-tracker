import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { userService } from './api';

// Vérifier si on est sur un appareil physique
// Note: Constants.isDevice peut être false même sur un vrai appareil en développement
// On vérifie aussi si on n'est pas dans un simulateur/émulateur
const isDevice = Platform.OS !== 'web' && (Constants.isDevice || __DEV__);

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
    // Ne pas bloquer - laisser le système gérer
    try {
      console.log('🔔 [Notifications] Vérification des permissions actuelles...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔔 [Notifications] Statut actuel:', existingStatus);
      
      let finalStatus = existingStatus;

      // Si les permissions ne sont pas accordées, demander
      if (existingStatus !== 'granted') {
        console.log('🔔 [Notifications] Demande des permissions...');
        const response = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        console.log('🔔 [Notifications] Réponse de la demande:', response);
        finalStatus = response.status;
      }

      if (finalStatus !== 'granted') {
        console.warn('🔔 [Notifications] Permission de notification refusée. Statut:', finalStatus);
        return false;
      }

      console.log('✅ [Notifications] Permissions accordées !');
      return true;
    } catch (error) {
      console.error('❌ [Notifications] Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  /**
   * Obtenir le token de notification push
   */
  async getPushToken() {
    try {
      console.log('🔔 [Notifications] Début de getPushToken()');
      console.log('🔔 [Notifications] Platform.OS:', Platform.OS);
      
      // Ne pas bloquer sur la vérification d'appareil - essayer quand même
      
      console.log('🔔 [Notifications] Demande des permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('🔔 [Notifications] Permissions non accordées, impossible d\'obtenir le token');
        return null;
      }

      console.log('🔔 [Notifications] Récupération du token Expo Push...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'c6f319b3-2a03-40a9-9741-72e37d36c484', // Votre EAS project ID depuis app.json
      });

      console.log('🔔 [Notifications] Token reçu:', tokenData.data.substring(0, 30) + '...');
      this.expoPushToken = tokenData.data;
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ [Notifications] Erreur lors de la récupération du token:', error);
      console.error('❌ [Notifications] Détails de l\'erreur:', error.message);
      if (error.stack) {
        console.error('❌ [Notifications] Stack:', error.stack);
      }
      return null;
    }
  }

  /**
   * Enregistrer le token sur le serveur
   */
  async registerPushToken() {
    try {
      console.log('🔔 [Notifications] Tentative d\'enregistrement du token...');
      const token = await this.getPushToken();
      if (!token) {
        console.warn('🔔 [Notifications] Aucun token obtenu - permissions peut-être refusées');
        return { success: false, error: 'Aucun token obtenu. Vérifiez que les permissions de notification sont accordées.' };
      }

      console.log('🔔 [Notifications] Token obtenu:', token.substring(0, 20) + '...');
      await userService.registerPushToken(token);
      console.log('✅ [Notifications] Token de notification enregistré avec succès');
      return { success: true, token };
    } catch (error) {
      console.error('❌ [Notifications] Erreur lors de l\'enregistrement du token:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'enregistrement du token' };
    }
  }

  /**
   * Vérifier le statut des permissions
   */
  async checkPermissionStatus() {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      console.log('🔔 [Notifications] Statut des permissions:', permissions);
      return {
        granted: permissions.status === 'granted',
        status: permissions.status,
        canRequest: permissions.status !== 'granted',
        permissions: permissions
      };
    } catch (error) {
      console.error('❌ [Notifications] Erreur lors de la vérification des permissions:', error);
      return { granted: false, status: 'unknown', canRequest: false };
    }
  }

  /**
   * Forcer la demande de permissions (pour iOS notamment)
   */
  async forceRequestPermissions() {
    try {
      console.log('🔔 [Notifications] Force demande des permissions...');
      console.log('🔔 [Notifications] Platform.OS:', Platform.OS);
      console.log('🔔 [Notifications] Constants.isDevice:', Constants.isDevice);
      
      // Ne pas bloquer sur la vérification d'appareil physique - laisser iOS/Android gérer
      // Les notifications peuvent fonctionner même si isDevice est false
      
      const response = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });

      console.log('🔔 [Notifications] Réponse force demande:', response);

      if (response.status === 'granted') {
        console.log('✅ [Notifications] Permissions accordées !');
        return { success: true, status: response.status };
      } else {
        console.warn('🔔 [Notifications] Permissions refusées. Statut:', response.status);
        return { success: false, status: response.status, error: `Permissions refusées. Statut: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ [Notifications] Erreur lors de la force demande:', error);
      console.error('❌ [Notifications] Stack:', error.stack);
      return { success: false, error: error.message || 'Erreur lors de la demande de permissions' };
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

