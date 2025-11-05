import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  List,
  Switch,
  Button,
  Card,
  Text,
  Divider,
  Avatar,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { userService, authService } from '../../services/api';
import notificationService from '../../services/notificationService';
import { colors, spacing, typography } from '../../styles/theme';

const SettingsScreen = ({ navigation }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);
  const [isPublic, setIsPublic] = useState(user?.settings?.isPublic ?? true);
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState(null);
  const [isRegisteringPushToken, setIsRegisteringPushToken] = useState(false);
  
  // État pour la modification du profil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [usernameError, setUsernameError] = useState(null);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const loadEmailStatus = async () => {
    try {
      console.log('Tentative de chargement du statut email...');
      const status = await authService.getEmailStatus();
      console.log('Statut email chargé:', status);
      setEmailStatus(status);
    } catch (error) {
      console.error('Erreur chargement statut email:', error);
      console.error('Status code:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!emailStatus?.canResendEmail) {
      Alert.alert(
        'Limitation',
        `Vous devez attendre ${emailStatus?.timeLeftMinutes} minutes avant de pouvoir renvoyer un email de vérification.`
      );
      return;
    }

    setIsLoadingEmail(true);
    try {
      await authService.resendVerification();
      Alert.alert(
        'Email envoyé',
        'Un nouveau code de vérification a été envoyé à votre adresse email.'
      );
      // Recharger le statut
      await loadEmailStatus();
    } catch (error) {
      console.error('Erreur renvoi email:', error);
      const errorMessage = error.response?.data?.message || 'Impossible d\'envoyer l\'email';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Charger le statut email au montage du composant
  React.useEffect(() => {
    if (user && (user.emailVerified === false || user.emailVerified === undefined)) {
      loadEmailStatus();
    }
  }, [user]);

  // Vérifier le statut des permissions de notification
  React.useEffect(() => {
    checkNotificationPermissionStatus();
  }, []);

  // Re-vérifier quand l'utilisateur revient sur l'écran
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkNotificationPermissionStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const checkNotificationPermissionStatus = async () => {
    try {
      console.log('🔔 [Settings] Vérification du statut des permissions...');
      const status = await notificationService.checkPermissionStatus();
      console.log('🔔 [Settings] Statut obtenu:', status);
      setNotificationPermissionStatus(status);
    } catch (error) {
      console.error('❌ [Settings] Erreur lors de la vérification des permissions:', error);
      // Mettre un statut par défaut pour afficher le bouton
      setNotificationPermissionStatus({ granted: false, status: 'unknown', canRequest: true });
    }
  };

  const handleEnablePushNotifications = async () => {
    setIsRegisteringPushToken(true);
    try {
      console.log('🔔 [Settings] Début activation notifications push...');
      
      // D'abord, forcer la demande de permissions
      console.log('🔔 [Settings] Étape 1: Demande des permissions...');
      const permissionResult = await notificationService.forceRequestPermissions();
      
      if (!permissionResult.success) {
        Alert.alert(
          'Permissions requises',
          permissionResult.error || 'Les permissions de notification sont nécessaires pour recevoir des alertes. Veuillez les activer dans les paramètres de votre appareil.',
          [
            {
              text: 'Annuler',
              style: 'cancel'
            },
            {
              text: 'Ouvrir les paramètres',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        setIsRegisteringPushToken(false);
        return;
      }

      // Ensuite, enregistrer le token
      console.log('🔔 [Settings] Étape 2: Enregistrement du token...');
      const result = await notificationService.registerPushToken();
      
      if (result.success) {
        Alert.alert(
          'Succès',
          'Les notifications push ont été activées avec succès ! Vous recevrez maintenant des notifications pour les demandes d\'amitié.'
        );
        await checkNotificationPermissionStatus();
        await refreshUser();
      } else {
        Alert.alert(
          'Erreur',
          result.error || 'Impossible d\'enregistrer le token. Vérifiez les logs pour plus de détails.'
        );
      }
    } catch (error) {
      console.error('❌ [Settings] Erreur activation notifications:', error);
      Alert.alert(
        'Erreur',
        `Impossible d'activer les notifications push: ${error.message || 'Erreur inconnue'}`
      );
    } finally {
      setIsRegisteringPushToken(false);
    }
  };

  // Synchroniser isPublic avec les données utilisateur
  React.useEffect(() => {
    if (user?.settings?.isPublic !== undefined) {
      setIsPublic(user.settings.isPublic);
    }
  }, [user?.settings?.isPublic]);

  const handleNotificationToggle = async (value) => {
    setNotifications(value);
    try {
      // Mettre à jour les paramètres sur le serveur
      await userService.updateSettings({ notifications: value });
      updateUser({ settings: { ...user.settings, notifications: value } });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      setNotifications(!value); // Revenir à l'état précédent
    }
  };

  const handlePublicToggle = async (value) => {
    setIsUpdatingPublic(true);
    setIsPublic(value);
    try {
      // Mettre à jour les paramètres sur le serveur
      const result = await userService.updateSettings({ isPublic: value });
      await refreshUser(); // Rafraîchir les données utilisateur
      updateUser({ settings: { ...user.settings, isPublic: value } });
      Alert.alert(
        'Succès',
        value 
          ? 'Votre profil est maintenant public. Les autres utilisateurs peuvent vous voir.'
          : 'Votre profil est maintenant privé. Seuls vos amis peuvent vous voir.'
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la visibilité:', error);
      setIsPublic(!value); // Revenir à l'état précédent
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour le statut de votre profil. Veuillez réessayer.'
      );
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  const openPortfolio = () => {
    Linking.openURL('https://tristan.baldazzi.fr');
  };

  const openEmail = () => {
    Linking.openURL('mailto:tristan.baldazzi@makemydesign.fr');
  };

  // Calculer les jours restants avant de pouvoir changer le username
  const getUsernameChangeInfo = () => {
    if (!user?.lastUsernameChange) {
      return { canChange: true, daysRemaining: 0 };
    }
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastChange = new Date(user.lastUsernameChange);
    
    if (lastChange > sevenDaysAgo) {
      const daysRemaining = Math.ceil(
        (lastChange.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { canChange: false, daysRemaining };
    }
    
    return { canChange: true, daysRemaining: 0 };
  };

  const handleEditProfile = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setUsername(user?.username || '');
    setUsernameError(null);
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setUsername(user?.username || '');
    setUsernameError(null);
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Le prénom est requis');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username.trim())) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur ne peut contenir que des lettres et des chiffres');
      return;
    }

    // Vérifier si le username a changé et s'il peut être changé
    const trimmedUsername = username.trim().toLowerCase();
    const usernameChanged = trimmedUsername !== (user?.username?.toLowerCase() || '');
    const { canChange, daysRemaining } = getUsernameChangeInfo();

    if (usernameChanged && !canChange) {
      Alert.alert(
        'Limitation',
        `Vous ne pouvez changer votre nom d'utilisateur que tous les 7 jours. Réessayez dans ${daysRemaining} jour(s).`
      );
      return;
    }

    setIsUpdatingProfile(true);
    setUsernameError(null);

    try {
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      if (usernameChanged) {
        updateData.username = trimmedUsername;
      }

      const result = await userService.updateProfile(updateData);
      updateUser(result.user);
      await refreshUser();
      setIsEditingProfile(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour du profil';
      
      if (error.response?.status === 400 && errorMessage.includes('déjà utilisé')) {
        setUsernameError('Ce nom d\'utilisateur est déjà utilisé');
      } else if (error.response?.status === 429) {
        const daysRemaining = error.response?.data?.daysRemaining;
        Alert.alert(
          'Limitation',
          `Vous ne pouvez changer votre nom d'utilisateur que tous les 7 jours. Réessayez dans ${daysRemaining} jour(s).`
        );
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profil utilisateur */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.profileInfo}>
            <Avatar.Text
              size={80}
              label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userLevel}>
                Niveau {user?.level} • {user?.xp} XP
              </Text>
              <Text style={styles.userStats}>
                {user?.totalSessionsCompleted} séances complétées
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Vérification d'email */}
      {user && (user.emailVerified === false || user.emailVerified === undefined) && (
        <Card style={styles.emailCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>📧 Vérification d'email</Text>
            <Text style={styles.emailDescription}>
              Votre adresse email n'est pas encore vérifiée. Vérifiez votre email pour accéder à toutes les fonctionnalités.
            </Text>
            
            <View style={styles.emailInfo}>
              <Text style={styles.emailAddress}>{user.email}</Text>
              {emailStatus && !emailStatus.canResendEmail && (
                <Text style={styles.timeLeftText}>
                  ⏰ Prochain envoi possible dans {emailStatus.timeLeftMinutes} minutes
                </Text>
              )}
            </View>

            <View style={styles.emailButtons}>
              <Button
                mode="contained"
                onPress={handleResendVerificationEmail}
                disabled={!emailStatus?.canResendEmail || isLoadingEmail}
                loading={isLoadingEmail}
                style={[styles.emailButton, styles.resendButton]}
                icon="email"
              >
                {emailStatus?.canResendEmail ? 'Renvoyer l\'email' : 'Email envoyé récemment'}
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('EmailVerification', { 
                  email: user.email 
                })}
                style={[styles.emailButton, styles.verifyButton]}
                icon="check-circle"
              >
                Saisir le code
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Paramètres de l'application */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          <List.Item
            title="Notifications"
            description={notificationPermissionStatus?.granted 
              ? "Recevoir des notifications push" 
              : notificationPermissionStatus?.status === 'denied'
              ? "Les notifications sont désactivées. Activez-les dans les paramètres de votre appareil."
              : "Activez les notifications pour recevoir des alertes"}
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                color={colors.primary}
              />
            )}
          />
          
          {/* Afficher le bouton si les permissions ne sont pas accordées OU si le statut n'est pas encore vérifié */}
          {(!notificationPermissionStatus || !notificationPermissionStatus.granted) && (
            <>
              <Divider />
              <List.Item
                title="Activer les notifications push"
                description={
                  notificationPermissionStatus?.status === 'denied'
                    ? "Les notifications ont été refusées. Cliquez pour ouvrir les paramètres de votre appareil."
                    : "Autoriser l'application à vous envoyer des notifications (demandes d'amitié, etc.)"
                }
                left={(props) => <List.Icon {...props} icon="bell-ring" color={colors.warning} />}
                right={() => (
                  <Button
                    mode="contained"
                    onPress={handleEnablePushNotifications}
                    loading={isRegisteringPushToken}
                    disabled={isRegisteringPushToken}
                    compact
                    icon="bell-outline"
                  >
                    {notificationPermissionStatus?.status === 'denied' ? 'Paramètres' : 'Activer'}
                  </Button>
                )}
              />
            </>
          )}
          
          {/* Afficher le bouton d'enregistrement si les permissions sont accordées mais pas de token */}
          {notificationPermissionStatus?.granted && !user?.pushToken && (
            <>
              <Divider />
              <List.Item
                title="Enregistrer le token de notification"
                description="Enregistrer votre appareil pour recevoir des notifications"
                left={(props) => <List.Icon {...props} icon="cellphone" color={colors.primary} />}
                right={() => (
                  <Button
                    mode="outlined"
                    onPress={handleEnablePushNotifications}
                    loading={isRegisteringPushToken}
                    disabled={isRegisteringPushToken}
                    compact
                    icon="refresh"
                  >
                    Enregistrer
                  </Button>
                )}
              />
            </>
          )}
          
          <Divider />
          
          <List.Item
            title="Profil public"
            description={isPublic 
              ? "Votre profil est visible par tous les utilisateurs" 
              : "Seuls vos amis peuvent voir votre profil"}
            left={(props) => <List.Icon {...props} icon={isPublic ? "account" : "account-lock"} />}
            right={() => (
              <View style={styles.switchContainer}>
                {isUpdatingPublic && (
                  <ActivityIndicator 
                    size="small" 
                    color={colors.primary} 
                    style={styles.switchLoader}
                  />
                )}
                <Switch
                  value={isPublic}
                  onValueChange={handlePublicToggle}
                  disabled={isUpdatingPublic}
                  color={colors.primary}
                />
              </View>
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Modifier le profil"
            description="Changer votre nom, prénom ou nom d'utilisateur"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleEditProfile}
          />
          
          <Divider />
          
          <List.Item
            title="Changer le mot de passe"
            description="Modifier votre mot de passe"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </Card.Content>
      </Card>

      {/* Modal de modification du profil */}
      <Modal
        visible={isEditingProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text style={styles.modalTitle}>Modifier le profil</Text>
                
                <TextInput
                  label="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  style={styles.input}
                  disabled={isUpdatingProfile}
                />
                
                <TextInput
                  label="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                  mode="outlined"
                  style={styles.input}
                  disabled={isUpdatingProfile}
                />
                
                <TextInput
                  label="Nom d'utilisateur"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setUsernameError(null);
                  }}
                  mode="outlined"
                  style={styles.input}
                  disabled={isUpdatingProfile}
                  error={!!usernameError}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                {usernameError && (
                  <Text style={styles.errorText}>{usernameError}</Text>
                )}
                
                {(() => {
                  const { canChange, daysRemaining } = getUsernameChangeInfo();
                  const trimmedUsername = username.trim().toLowerCase();
                  const usernameChanged = trimmedUsername !== (user?.username?.toLowerCase() || '');
                  
                  if (usernameChanged && !canChange) {
                    return (
                      <Text style={styles.warningText}>
                        ⏰ Vous pourrez changer votre nom d'utilisateur dans {daysRemaining} jour(s)
                      </Text>
                    );
                  }
                  return null;
                })()}
                
                <View style={styles.modalButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleCancelEdit}
                    disabled={isUpdatingProfile}
                    style={styles.modalButton}
                  >
                    Annuler
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleUpdateProfile}
                    loading={isUpdatingProfile}
                    disabled={isUpdatingProfile}
                    style={styles.modalButton}
                  >
                    Enregistrer
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Informations sur l'application */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>À propos</Text>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <Divider />
          
          <List.Item
            title="Conditions d'utilisation"
            description="Lire les conditions d'utilisation"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert('Info', 'Fonctionnalité à venir');
            }}
          />
          
          <Divider />
          
          <List.Item
            title="Politique de confidentialité"
            description="Lire la politique de confidentialité"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert('Info', 'Fonctionnalité à venir');
            }}
          />
        </Card.Content>
      </Card>

      {/* Contact et support */}
      <Card style={styles.contactCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Contact</Text>
          
          <List.Item
            title="Contacter le développeur"
            description="Envoyer un email"
            left={(props) => <List.Icon {...props} icon="email" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={openEmail}
          />
          
          <Divider />
          
          <List.Item
            title="Portfolio"
            description="Voir mes projets"
            left={(props) => <List.Icon {...props} icon="web" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={openPortfolio}
          />
        </Card.Content>
      </Card>

      {/* Crédits */}
      <Card style={styles.creditsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Crédits</Text>
          <View style={styles.creditsContent}>
            <Text style={styles.creditsText}>
              Développé avec ❤️ par
            </Text>
            <Text style={styles.developerName}>
              Tristan Baldazzi
            </Text>
            <Text style={styles.creditsDescription}>
              Application de suivi fitness complète
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Bouton de déconnexion */}
      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={colors.error}
          textColor="white"
        >
          Se déconnecter
        </Button>
      </View>

      {/* Espacement en bas */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    margin: spacing.md,
    elevation: 4,
  },
  profileContent: {
    padding: spacing.lg,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  userLevel: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userStats: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  emailCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  emailDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  emailInfo: {
    marginBottom: spacing.md,
  },
  emailAddress: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  timeLeftText: {
    ...typography.caption,
    color: colors.warning,
    fontStyle: 'italic',
  },
  emailButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  emailButton: {
    flex: 1,
  },
  resendButton: {
    // Styles spécifiques pour le bouton renvoyer
  },
  verifyButton: {
    // Styles spécifiques pour le bouton vérifier
  },
  settingsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  infoCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  contactCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  creditsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  creditsContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  creditsText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  developerName: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  creditsDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutContainer: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  logoutButton: {
    paddingVertical: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
  },
  modalCard: {
    elevation: 8,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  switchLoader: {
    marginRight: spacing.xs,
  },
});

export default SettingsScreen;
