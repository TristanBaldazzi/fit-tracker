import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, loginWithApple } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, username, email, password, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return false;
    }

    if (username.length < 3) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
    setIsLoading(false);

    if (result.success) {
      // Rediriger vers la vérification d'email
      navigation.navigate('EmailVerification', { 
        email: formData.email.trim().toLowerCase() 
      });
    } else {
      Alert.alert('Erreur d\'inscription', result.error);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    const result = await loginWithApple();
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoins la communauté FitFlow</Text>
        </View>

          {/* Form Card */}
          <Surface style={styles.card} elevation={8}>
            <View style={styles.nameRow}>
              <TextInput
                label="Prénom"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                disabled={isLoading}
                contentStyle={styles.inputContent}
                outlineColor={colors.primary + '40'}
                activeOutlineColor={colors.primary}
              />
              <TextInput
                label="Nom"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                disabled={isLoading}
                contentStyle={styles.inputContent}
                outlineColor={colors.primary + '40'}
                activeOutlineColor={colors.primary}
              />
            </View>

            <TextInput
              label="Nom d'utilisateur"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              mode="outlined"
              autoCapitalize="none"
              autoComplete="username"
              style={styles.input}
              disabled={isLoading}
              contentStyle={styles.inputContent}
              outlineColor={colors.primary + '40'}
              activeOutlineColor={colors.primary}
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              disabled={isLoading}
              contentStyle={styles.inputContent}
              outlineColor={colors.primary + '40'}
              activeOutlineColor={colors.primary}
            />

            <TextInput
              label="Mot de passe"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              style={styles.input}
              disabled={isLoading}
              contentStyle={styles.inputContent}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              outlineColor={colors.primary + '40'}
              activeOutlineColor={colors.primary}
            />

            <TextInput
              label="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              style={styles.input}
              disabled={isLoading}
              contentStyle={styles.inputContent}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              outlineColor={colors.primary + '40'}
              activeOutlineColor={colors.primary}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? <ActivityIndicator color="white" /> : 'S\'inscrire'}
            </Button>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <Button
              mode="contained-tonal"
              onPress={handleAppleLogin}
              style={styles.appleButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              icon="apple"
              buttonColor={colors.surface}
              textColor={colors.text}
              labelStyle={styles.appleButtonLabel}
            >
              Continuer avec Apple
            </Button>
          </Surface>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Déjà un compte ?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('Login')}
              >
                Se connecter
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    color: colors.primary,
    fontWeight: '800',
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body1,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    marginBottom: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  inputContent: {
    fontSize: 15,
  },
  registerButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 12,
    elevation: 0,
  },
  buttonContent: {
    paddingVertical: spacing.sm + 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textLight + '30',
  },
  dividerText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  appleButton: {
    marginBottom: spacing.xs,
    borderRadius: 12,
    borderWidth: 0,
  },
  appleButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body2,
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
