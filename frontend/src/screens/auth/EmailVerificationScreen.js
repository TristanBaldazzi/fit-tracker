import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import { authService } from '../../services/api';

const EmailVerificationScreen = ({ navigation, route }) => {
  const { user, refreshUser } = useAuth();
  const { email } = route.params || {};
  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes en secondes
  const inputRefs = useRef([]);

  useEffect(() => {
    // Timer de 10 minutes
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (value, index) => {
    if (value.length > 1) return; // Empêcher plus d'un caractère
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur le champ suivant
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit si tous les champs sont remplis
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 4) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeToVerify = null) => {
    const codeString = codeToVerify || code.join('');
    
    if (codeString.length !== 4) {
      Alert.alert('Erreur', 'Veuillez entrer un code à 4 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.verifyEmail(codeString);

      Alert.alert(
        '✅ Email vérifié !',
        'Votre compte est maintenant activé. Vous pouvez profiter pleinement de FitTracker !',
        [
          {
            text: 'Continuer',
            onPress: () => {
              refreshUser();
              navigation.navigate('Home');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur de vérification:', error);
      const errorMessage = error.response?.data?.message || 'Code de vérification incorrect';
      Alert.alert('Erreur', errorMessage);
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await authService.resendVerification();
      
      setTimeLeft(600); // Reset timer
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé à votre email');
    } catch (error) {
      console.error('Erreur renvoi code:', error);
      const errorMessage = error.response?.data?.message || 'Impossible de renvoyer le code';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Passer la vérification',
      'Vous pourrez vérifier votre email plus tard dans les paramètres. Certaines fonctionnalités peuvent être limitées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Passer',
          onPress: () => navigation.navigate('Home')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>📧 Vérification d'email</Text>
            <Text style={styles.subtitle}>
              Nous avons envoyé un code à 4 chiffres à
            </Text>
            <Text style={styles.email}>{email || user?.email}</Text>
          </View>

          {/* Timer */}
          {timeLeft > 0 && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                ⏰ Code valide pendant {formatTime(timeLeft)}
              </Text>
            </View>
          )}

          {/* Champs de code */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {/* Boutons */}
          <View style={styles.buttonsContainer}>
            <Button
              mode="contained"
              onPress={() => handleVerifyCode()}
              disabled={isLoading || code.some(digit => digit === '')}
              loading={isLoading}
              style={styles.verifyButton}
              icon="check"
            >
              Vérifier
            </Button>

            <Button
              mode="outlined"
              onPress={handleResendCode}
              disabled={isResending || timeLeft > 0}
              loading={isResending}
              style={styles.resendButton}
              icon="refresh"
            >
              {timeLeft > 0 ? `Renvoyer (${formatTime(timeLeft)})` : 'Renvoyer le code'}
            </Button>

            <Button
              mode="text"
              onPress={handleSkip}
              style={styles.skipButton}
              textColor={colors.textSecondary}
            >
              Passer pour l'instant
            </Button>
          </View>

          {/* Message d'aide */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 Vérifiez votre boîte de réception et vos spams
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    elevation: 8,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timerText: {
    ...typography.body2,
    color: colors.warning,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: 60,
    height: 60,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  buttonsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  verifyButton: {
    paddingVertical: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;
