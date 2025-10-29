const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'tristan.baldazzi.fr',
      port: 465,
      secure: true, // true pour 465, false pour autres ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  // Générer un code de vérification à 4 chiffres
  generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Générer un code de réinitialisation à 6 chiffres
  generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Envoyer un email de réinitialisation de mot de passe
  async sendResetPasswordEmail(email, resetCode) {
    try {
      const mailOptions = {
        from: `"FitTracker" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🔑 Réinitialisation de votre mot de passe FitTracker',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0;">💪 FitTracker</h1>
              <p style="color: #666; margin: 10px 0;">Votre compagnon fitness</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
              <p style="color: #666; margin-bottom: 30px;">
                Vous avez demandé à réinitialiser votre mot de passe. 
                Entrez le code suivant dans l'application pour continuer :
              </p>
              
              <div style="background: #FF9800; color: white; font-size: 32px; font-weight: bold; 
                          padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                ${resetCode}
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Ce code est valide pendant 10 minutes.
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⚠️ Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, 
                  ignorez cet email. Votre mot de passe ne sera pas modifié.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2024 FitTracker - Tous droits réservés</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de réinitialisation envoyé à ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi email réinitialisation:', error);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email de vérification
  async sendVerificationEmail(email, verificationCode) {
    try {
      const mailOptions = {
        from: `"FitTracker" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🔐 Vérification de votre compte FitTracker',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0;">💪 FitTracker</h1>
              <p style="color: #666; margin: 10px 0;">Votre compagnon fitness</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Vérification de votre compte</h2>
              <p style="color: #666; margin-bottom: 30px;">
                Merci de vous être inscrit sur FitTracker ! Pour activer votre compte, 
                veuillez entrer le code de vérification suivant dans l'application :
              </p>
              
              <div style="background: #4CAF50; color: white; font-size: 32px; font-weight: bold; 
                          padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                ${verificationCode}
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Ce code est valide pendant 10 minutes.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>Si vous n'avez pas créé de compte sur FitTracker, ignorez cet email.</p>
              <p>© 2024 FitTracker - Tous droits réservés</p>
            </div>
          </div>
        `,
        text: `
          FitTracker - Vérification de votre compte
          
          Merci de vous être inscrit sur FitTracker !
          
          Votre code de vérification est : ${verificationCode}
          
          Ce code est valide pendant 10 minutes.
          
          Si vous n'avez pas créé de compte sur FitTracker, ignorez cet email.
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de vérification envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email de réinitialisation de mot de passe
  async sendPasswordResetEmail(email, resetCode) {
    try {
      const mailOptions = {
        from: `"FitTracker" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🔑 Réinitialisation de votre mot de passe FitTracker',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0;">💪 FitTracker</h1>
              <p style="color: #666; margin: 10px 0;">Votre compagnon fitness</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
              <p style="color: #666; margin-bottom: 30px;">
                Vous avez demandé une réinitialisation de votre mot de passe. 
                Entrez le code suivant dans l'application :
              </p>
              
              <div style="background: #FF9800; color: white; font-size: 32px; font-weight: bold; 
                          padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                ${resetCode}
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Ce code est valide pendant 15 minutes.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              <p>© 2024 FitTracker - Tous droits réservés</p>
            </div>
          </div>
        `,
        text: `
          FitTracker - Réinitialisation de mot de passe
          
          Vous avez demandé une réinitialisation de votre mot de passe.
          
          Votre code de réinitialisation est : ${resetCode}
          
          Ce code est valide pendant 15 minutes.
          
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de réinitialisation envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      return { success: false, error: error.message };
    }
  }

  // Tester la connexion email
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Connexion email configurée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur de configuration email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
