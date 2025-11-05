const axios = require('axios');

/**
 * Service pour envoyer des notifications push via Expo Push Notification API
 */
class PushNotificationService {
  /**
   * Envoyer une notification push
   * @param {string|string[]} pushTokens - Token(s) de notification push
   * @param {string} title - Titre de la notification
   * @param {string} body - Corps de la notification
   * @param {object} data - Données supplémentaires pour la notification
   */
  async sendPushNotification(pushTokens, title, body, data = {}) {
    try {
      // S'assurer que pushTokens est un tableau
      const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];
      
      // Filtrer les tokens null/undefined
      const validTokens = tokens.filter(token => token && typeof token === 'string');
      
      if (validTokens.length === 0) {
        console.warn('Aucun token de notification valide fourni');
        return { success: false, error: 'Aucun token valide' };
      }

      // Préparer les messages pour Expo
      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
        channelId: 'default',
      }));

      // Envoyer les notifications via l'API Expo
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        messages,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Notifications push envoyées:', response.data);
      
      // Vérifier s'il y a des erreurs dans la réponse
      const hasErrors = response.data.some(result => 
        result.status === 'error'
      );

      if (hasErrors) {
        console.error('Erreurs lors de l\'envoi des notifications:', response.data);
        return { success: false, errors: response.data };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification push:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de l\'envoi de la notification' 
      };
    }
  }

  /**
   * Envoyer une notification de demande d'amitié
   * @param {string} recipientPushToken - Token de notification du destinataire
   * @param {object} requesterInfo - Informations de l'utilisateur qui envoie la demande
   */
  async sendFriendRequestNotification(recipientPushToken, requesterInfo) {
    console.log('📱 [PushNotification] sendFriendRequestNotification appelé');
    console.log('📱 [PushNotification] Token:', recipientPushToken ? `${recipientPushToken.substring(0, 30)}...` : 'null');
    console.log('📱 [PushNotification] Requester info:', requesterInfo);
    
    if (!recipientPushToken) {
      console.warn('⚠️ [PushNotification] Aucun token de notification pour le destinataire');
      return { success: false, error: 'Aucun token de notification' };
    }

    const title = 'Nouvelle demande d\'amitié';
    const body = `${requesterInfo.firstName} ${requesterInfo.lastName} vous a envoyé une demande d'amitié`;
    
    console.log('📱 [PushNotification] Titre:', title);
    console.log('📱 [PushNotification] Corps:', body);
    
    const data = {
      type: 'friend_request',
      requesterId: requesterInfo._id.toString(),
      requesterUsername: requesterInfo.username,
      requesterFirstName: requesterInfo.firstName,
      requesterLastName: requesterInfo.lastName,
    };

    console.log('📱 [PushNotification] Données:', data);
    
    const result = await this.sendPushNotification(recipientPushToken, title, body, data);
    console.log('📱 [PushNotification] Résultat final:', result);
    
    return result;
  }

  /**
   * Envoyer une notification d'acceptation de demande d'amitié
   * @param {string} recipientPushToken - Token de notification du destinataire
   * @param {object} acceptorInfo - Informations de l'utilisateur qui accepte
   */
  async sendFriendRequestAcceptedNotification(recipientPushToken, acceptorInfo) {
    if (!recipientPushToken) {
      console.warn('Aucun token de notification pour le destinataire');
      return { success: false, error: 'Aucun token de notification' };
    }

    const title = 'Demande d\'amitié acceptée';
    const body = `${acceptorInfo.firstName} ${acceptorInfo.lastName} a accepté votre demande d'amitié`;
    
    const data = {
      type: 'friend_request_accepted',
      acceptorId: acceptorInfo._id.toString(),
      acceptorUsername: acceptorInfo.username,
      acceptorFirstName: acceptorInfo.firstName,
      acceptorLastName: acceptorInfo.lastName,
    };

    return await this.sendPushNotification(recipientPushToken, title, body, data);
  }
}

module.exports = new PushNotificationService();

