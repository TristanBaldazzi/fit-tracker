import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Divider,
  ActivityIndicator,
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
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté FitTrack</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.nameRow}>
              <TextInput
                label="Prénom"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                disabled={isLoading}
              />
              <TextInput
                label="Nom"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                disabled={isLoading}
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
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
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
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? <ActivityIndicator color="white" /> : 'S\'inscrire'}
            </Button>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OU</Text>
              <Divider style={styles.divider} />
            </View>

            <Button
              mode="outlined"
              onPress={handleAppleLogin}
              style={styles.appleButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              icon="apple"
            >
              Continuer avec Apple
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vous avez déjà un compte ?{' '}
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
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.lg,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  input: {
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  appleButton: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
