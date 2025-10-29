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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithApple } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    const result = await login({ email: email.trim(), password });
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
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
          <Text style={styles.title}>FitTrack</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              disabled={isLoading}
            />

            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={styles.input}
              disabled={isLoading}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? <ActivityIndicator color="white" /> : 'Se connecter'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordButton}
              disabled={isLoading}
              textColor={colors.primary}
            >
              Mot de passe oublié ?
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
            Vous n'avez pas de compte ?{' '}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('Register')}
            >
              S'inscrire
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
  input: {
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  forgotPasswordButton: {
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

export default LoginScreen;
