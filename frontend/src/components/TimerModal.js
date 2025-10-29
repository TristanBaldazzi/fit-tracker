import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  Divider,
} from 'react-native-paper';
import { colors, spacing, typography } from '../styles/theme';

const TimerModal = ({ visible, onClose }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [presetTimes, setPresetTimes] = useState([30, 60, 90, 120, 180, 300]); // en secondes
  const [selectedPreset, setSelectedPreset] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 0) {
            setIsRunning(false);
            setIsPaused(false);
            Alert.alert('⏰ Temps écoulé !', 'Votre chronomètre est terminé !');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (time > 0) {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setSelectedPreset(null);
  };

  const handlePresetSelect = (preset) => {
    setTime(preset);
    setSelectedPreset(preset);
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleCustomTime = () => {
    Alert.prompt(
      'Temps personnalisé',
      'Entrez le temps en secondes :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'OK',
          onPress: (text) => {
            const customTime = parseInt(text);
            if (customTime && customTime > 0) {
              setTime(customTime);
              setSelectedPreset(null);
              setIsRunning(false);
              setIsPaused(false);
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const getTimerColor = () => {
    if (time <= 10 && time > 0) return colors.error;
    if (time <= 30 && time > 10) return colors.warning;
    return colors.primary;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Card.Content style={styles.modalContent}>
            {/* En-tête */}
            <View style={styles.header}>
              <Text style={styles.title}>⏱️ Chronomètre</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Affichage du temps */}
            <View style={styles.timerDisplay}>
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {formatTime(time)}
              </Text>
            </View>

            {/* Boutons de contrôle */}
            <View style={styles.controlsContainer}>
              {!isRunning ? (
                <Button
                  mode="contained"
                  onPress={handleStart}
                  disabled={time === 0}
                  style={[styles.controlButton, { backgroundColor: colors.success }]}
                  icon="play"
                >
                  Démarrer
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handlePause}
                  style={[styles.controlButton, { backgroundColor: colors.warning }]}
                  icon={isPaused ? "play" : "pause"}
                >
                  {isPaused ? 'Reprendre' : 'Pause'}
                </Button>
              )}
              
              <Button
                mode="outlined"
                onPress={handleStop}
                style={styles.controlButton}
                icon="stop"
              >
                Arrêter
              </Button>
              
              <Button
                mode="text"
                onPress={handleReset}
                style={styles.controlButton}
                icon="refresh"
              >
                Reset
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* Temps prédéfinis */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsTitle}>Temps rapides</Text>
              <View style={styles.presetsGrid}>
                {presetTimes.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      selectedPreset === preset && styles.presetButtonSelected
                    ]}
                    onPress={() => handlePresetSelect(preset)}
                  >
                    <Text style={[
                      styles.presetText,
                      selectedPreset === preset && styles.presetTextSelected
                    ]}>
                      {formatTime(preset)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Button
                mode="outlined"
                onPress={handleCustomTime}
                style={styles.customButton}
                icon="plus"
              >
                Temps personnalisé
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 8,
  },
  modalContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  divider: {
    marginVertical: spacing.md,
  },
  timerDisplay: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  controlButton: {
    minWidth: 100,
  },
  presetsContainer: {
    marginTop: spacing.md,
  },
  presetsTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },
  presetTextSelected: {
    color: colors.white,
  },
  customButton: {
    marginTop: spacing.sm,
  },
});

export default TimerModal;
