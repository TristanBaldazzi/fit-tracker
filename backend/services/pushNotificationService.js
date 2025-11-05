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
      console.log('📤 [Push Service] Début de l\'envoi de notification push');
      console.log('📤 [Push Service] Tokens reçus:', pushTokens);
      console.log('📤 [Push Service] Titre:', title);
      console.log('📤 [Push Service] Corps:', body);
      console.log('📤 [Push Service] Données:', data);
      
      // S'assurer que pushTokens est un tableau
      const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];
      
      // Filtrer les tokens null/undefined
      const validTokens = tokens.filter(token => token && typeof token === 'string');
      
      console.log('📤 [Push Service] Tokens valides:', validTokens.length);
      
      if (validTokens.length === 0) {
        console.warn('⚠️ [Push Service] Aucun token de notification valide fourni');
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

      console.log('📤 [Push Service] Messages préparés:', JSON.stringify(messages, null, 2));
      console.log('📤 [Push Service] Envoi à l\'API Expo...');

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

      console.log('📱 [Push Service] Réponse de l\'API Expo:', JSON.stringify(response.data, null, 2));
      
      // La réponse de l'API Expo est un tableau directement ou un objet avec une propriété data
      const results = Array.isArray(response.data) ? response.data : (response.data?.data || [response.data]);
      
      console.log('📱 [Push Service] Résultats parsés:', JSON.stringify(results, null, 2));
      
      // Vérifier s'il y a des erreurs dans la réponse
      const hasErrors = results.some(result => 
        result.status === 'error'
      );

      if (hasErrors) {
        const errors = results.filter(r => r.status === 'error');
        console.error('❌ [Push Service] Erreurs lors de l\'envoi des notifications:', JSON.stringify(errors, null, 2));
        
        // Extraire les messages d'erreur pour les logs
        errors.forEach(err => {
          console.error('❌ [Push Service] Erreur:', err.message || err.error);
          if (err.details) {
            console.error('❌ [Push Service] Détails:', err.details);
          }
        });
        
        return { success: false, errors: results };
      }

      console.log('✅ [Push Service] Notifications envoyées avec succès');
      return { success: true, data: results };
    } catch (error) {
      console.error('❌ [Push Service] Erreur lors de l\'envoi de la notification push:', error);
      console.error('❌ [Push Service] Message:', error.message);
      console.error('❌ [Push Service] Response:', error.response?.data);
      console.error('❌ [Push Service] Status:', error.response?.status);
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
    if (!recipientPushToken) {
      console.warn('Aucun token de notification pour le destinataire');
      return { success: false, error: 'Aucun token de notification' };
    }

    const title = 'Nouvelle demande d\'amitié';
    const body = `${requesterInfo.firstName} ${requesterInfo.lastName} vous a envoyé une demande d'amitié`;
    
    const data = {
      type: 'friend_request',
      requesterId: requesterInfo._id.toString(),
      requesterUsername: requesterInfo.username,
      requesterFirstName: requesterInfo.firstName,
      requesterLastName: requesterInfo.lastName,
    };

    return await this.sendPushNotification(recipientPushToken, title, body, data);
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

