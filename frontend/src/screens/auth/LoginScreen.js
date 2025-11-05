import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FitFlow</Text>
          <Text style={styles.subtitle}>Ton coach fitness personnel</Text>
        </View>

          {/* Form Card */}
          <Surface style={styles.card} elevation={8}>
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
              contentStyle={styles.inputContent}
              outlineColor={colors.primary + '40'}
              activeOutlineColor={colors.primary}
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

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? <ActivityIndicator color="white" /> : 'Se connecter'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordButton}
              disabled={isLoading}
              textColor={colors.primary}
              labelStyle={styles.linkLabel}
            >
              Mot de passe oublié ?
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
              Pas encore de compte ?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('Register')}
              >
                S'inscrire
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 42,
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
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  inputContent: {
    fontSize: 16,
  },
  loginButton: {
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
  forgotPasswordButton: {
    marginBottom: spacing.md,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
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

export default LoginScreen;
