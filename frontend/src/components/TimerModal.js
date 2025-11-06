import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  Divider,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../styles/theme';

const TIMER_STORAGE_KEY = 'timer_state';

const TimerModal = ({ visible, onClose }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [presetTimes, setPresetTimes] = useState([30, 60, 90, 120, 180, 300]); // en secondes
  const [selectedPreset, setSelectedPreset] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const initialTimeRef = useRef(0); // Temps initial au démarrage
  const pausedTimeRef = useRef(0);
  const pauseStartTimeRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Charger l'état du timer depuis le stockage au montage
  useEffect(() => {
    loadTimerState();
  }, []);

  // Gérer les changements d'état de l'application (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isRunning &&
        !isPaused
      ) {
        // L'app revient au premier plan, recalculer le temps
        recalculateTime();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [isRunning, isPaused]);

  // Timer principal qui se met à jour toutes les secondes
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        updateTime();
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  // Sauvegarder l'état du timer dans AsyncStorage
  useEffect(() => {
    if (visible) {
      saveTimerState();
    }
  }, [time, isRunning, isPaused, visible]);

  const loadTimerState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        const { savedTime, savedIsRunning, savedIsPaused, savedStartTime, savedInitialTime, savedPausedTime } = state;
        
        if (savedIsRunning && !savedIsPaused && savedStartTime && savedInitialTime) {
          // Le timer était en cours, recalculer le temps écoulé
          const now = Date.now();
          const elapsed = Math.floor((now - savedStartTime) / 1000) - (savedPausedTime || 0);
          const remaining = Math.max(0, savedInitialTime - elapsed);
          
          if (remaining > 0) {
            setTime(remaining);
            setIsRunning(true);
            setIsPaused(false);
            startTimeRef.current = savedStartTime;
            initialTimeRef.current = savedInitialTime;
            pausedTimeRef.current = savedPausedTime || 0;
          } else {
            // Le temps est écoulé
            setTime(0);
            setIsRunning(false);
            setIsPaused(false);
            await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
          }
        } else {
          setTime(savedTime || 0);
          setIsRunning(savedIsRunning || false);
          setIsPaused(savedIsPaused || false);
          startTimeRef.current = savedStartTime || null;
          initialTimeRef.current = savedInitialTime || savedTime || 0;
          pausedTimeRef.current = savedPausedTime || 0;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état du timer:', error);
    }
  };

  const saveTimerState = async () => {
    try {
      const state = {
        savedTime: time,
        savedIsRunning: isRunning,
        savedIsPaused: isPaused,
        savedStartTime: startTimeRef.current,
        savedInitialTime: initialTimeRef.current,
        savedPausedTime: pausedTimeRef.current,
      };
      await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état du timer:', error);
    }
  };

  const recalculateTime = () => {
    if (startTimeRef.current && initialTimeRef.current > 0 && isRunning && !isPaused) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000) - pausedTimeRef.current;
      const remaining = Math.max(0, initialTimeRef.current - elapsed);
      
      if (remaining > 0) {
        setTime(remaining);
      } else {
        // Le temps est écoulé
        setTime(0);
        setIsRunning(false);
        setIsPaused(false);
        startTimeRef.current = null;
        initialTimeRef.current = 0;
        pausedTimeRef.current = 0;
        Alert.alert('⏰ Temps écoulé !', 'Votre chronomètre est terminé !');
        AsyncStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }
  };

  const updateTime = () => {
    if (startTimeRef.current && initialTimeRef.current > 0 && isRunning && !isPaused) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000) - pausedTimeRef.current;
      const remaining = Math.max(0, initialTimeRef.current - elapsed);
      
      if (remaining > 0) {
        setTime(remaining);
      } else {
        // Le temps est écoulé
        setTime(0);
        setIsRunning(false);
        setIsPaused(false);
        startTimeRef.current = null;
        initialTimeRef.current = 0;
        pausedTimeRef.current = 0;
        Alert.alert('⏰ Temps écoulé !', 'Votre chronomètre est terminé !');
        AsyncStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (time > 0) {
      const now = Date.now();
      startTimeRef.current = now;
      initialTimeRef.current = time; // Sauvegarder le temps initial
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      setIsRunning(true);
      setIsPaused(false);
      saveTimerState();
    }
  };

  const handlePause = () => {
    if (isPaused) {
      // Reprendre
      const now = Date.now();
      if (pauseStartTimeRef.current) {
        const pauseDuration = Math.floor((now - pauseStartTimeRef.current) / 1000);
        pausedTimeRef.current += pauseDuration;
        pauseStartTimeRef.current = null;
      }
      startTimeRef.current = now;
      setIsPaused(false);
    } else {
      // Mettre en pause
      pauseStartTimeRef.current = Date.now();
      setIsPaused(true);
    }
    saveTimerState();
  };

  const handleStop = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    startTimeRef.current = null;
    initialTimeRef.current = 0;
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const handleReset = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setSelectedPreset(null);
    startTimeRef.current = null;
    initialTimeRef.current = 0;
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const handlePresetSelect = (preset) => {
    setTime(preset);
    setSelectedPreset(preset);
    setIsRunning(false);
    setIsPaused(false);
    startTimeRef.current = null;
    initialTimeRef.current = 0;
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    AsyncStorage.removeItem(TIMER_STORAGE_KEY);
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
              startTimeRef.current = null;
              initialTimeRef.current = 0;
              pausedTimeRef.current = 0;
              pauseStartTimeRef.current = null;
              AsyncStorage.removeItem(TIMER_STORAGE_KEY);
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
