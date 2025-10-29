import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { colors, spacing, typography } from '../../styles/theme';
import { authService } from '../../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']); // Code à 6 chiffres
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const inputRefs = useRef([]);

  // Timer pour le code de réinitialisation
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2 && timeLeft === 0) {
      Alert.alert(
        '⏰ Code expiré',
        'Le code de réinitialisation a expiré. Veuillez en demander un nouveau.',
        [
          {
            text: 'OK',
            onPress: () => setStep(1)
          }
        ]
      );
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep(2);
      setTimeLeft(600); // Reset timer
      Alert.alert(
        '📧 Code envoyé',
        `Un code de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception.`
      );
    } catch (error) {
      console.error('Erreur envoi code:', error);
      let errorMessage = 'Une erreur est survenue lors de l\'envoi du code';
      
      if (error.response?.status === 404) {
        errorMessage = 'Aucun compte trouvé avec cette adresse email';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quand le code est complet
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleVerifyCode = async (codeToVerify = null) => {
    const codeString = codeToVerify || code.join('');
    
    if (codeString.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir le code complet à 6 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyResetCode(email, codeString);
      setStep(3);
      Alert.alert('✅ Code valide', 'Vous pouvez maintenant définir votre nouveau mot de passe');
    } catch (error) {
      console.error('Erreur vérification code:', error);
      let errorMessage = 'Code invalide ou expiré';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nouveau mot de passe');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, code.join(''), newPassword);
      
      Alert.alert(
        '✅ Mot de passe modifié',
        'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      let errorMessage = 'Une erreur est survenue lors de la réinitialisation';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Étape 1/3 : Email</Text>
      <Text style={styles.description}>
        Saisissez votre adresse email pour recevoir un code de réinitialisation.
      </Text>

      <TextInput
        label="Adresse email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="votre@email.com"
      />

      <Button
        mode="contained"
        onPress={handleSendCode}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon="email"
      >
        {isLoading ? 'Envoi...' : 'Envoyer le code'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.cancelButton}
        disabled={isLoading}
      >
        Retour à la connexion
      </Button>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Étape 2/3 : Code de vérification</Text>
      <Text style={styles.description}>
        Saisissez le code à 6 chiffres envoyé à {email}
      </Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          ⏰ Code valide pendant : {formatTime(timeLeft)}
        </Text>
      </View>

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            mode="outlined"
            style={styles.codeInput}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>

      <Button
        mode="contained"
        onPress={() => handleVerifyCode()}
        loading={isLoading}
        disabled={isLoading || code.some(digit => !digit)}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon="check"
      >
        {isLoading ? 'Vérification...' : 'Vérifier le code'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => setStep(1)}
        style={styles.cancelButton}
        disabled={isLoading}
      >
        Changer d'email
      </Button>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Étape 3/3 : Nouveau mot de passe</Text>
      <Text style={styles.description}>
        Définissez votre nouveau mot de passe.
      </Text>

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
        <Text style={styles.requirement}>• Les deux mots de passe doivent correspondre</Text>
      </View>

      <Button
        mode="contained"
        onPress={handleResetPassword}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon="lock-reset"
      >
        {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => setStep(2)}
        style={styles.cancelButton}
        disabled={isLoading}
      >
        Retour au code
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>🔑 Mot de passe oublié</Text>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
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
    marginBottom: spacing.lg,
  },
  stepTitle: {
    ...typography.h6,
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  codeInput: {
    flex: 1,
    backgroundColor: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  timerText: {
    ...typography.subtitle2,
    color: colors.primary,
    fontWeight: '600',
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
  button: {
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

export default ForgotPasswordScreen;


