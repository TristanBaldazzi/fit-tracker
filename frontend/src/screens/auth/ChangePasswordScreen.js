import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import { authService } from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe actuel');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nouveau mot de passe');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Erreur', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword(currentPassword, newPassword);
      
      Alert.alert(
        '✅ Succès',
        'Votre mot de passe a été modifié avec succès. Vous allez être déconnecté pour des raisons de sécurité.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      
      let errorMessage = 'Une erreur est survenue lors du changement de mot de passe';
      
      if (error.response?.status === 401) {
        errorMessage = 'Mot de passe actuel incorrect';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Données invalides';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>🔒 Changer le mot de passe</Text>
            <Text style={styles.description}>
              Pour des raisons de sécurité, vous devrez vous reconnecter après avoir changé votre mot de passe.
            </Text>

            <View style={styles.form}>
              <TextInput
                label="Mot de passe actuel"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showCurrentPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                }
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Minimum 6 caractères"
              />

              <TextInput
                label="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Exigences du mot de passe :</Text>
                <Text style={styles.requirement}>• Au moins 6 caractères</Text>
                <Text style={styles.requirement}>• Différent du mot de passe actuel</Text>
              </View>

              <Button
                mode="contained"
                onPress={handleChangePassword}
                loading={isLoading}
                disabled={isLoading}
                style={styles.changeButton}
                contentStyle={styles.buttonContent}
                icon="lock-reset"
              >
                {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={isLoading}
              >
                Annuler
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    ...typography.h4,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'white',
  },
  passwordRequirements: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  requirementsTitle: {
    ...typography.subtitle2,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  requirement: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  changeButton: {
    marginTop: spacing.sm,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.sm,
    borderRadius: 8,
  },
});

export default ChangePasswordScreen;


