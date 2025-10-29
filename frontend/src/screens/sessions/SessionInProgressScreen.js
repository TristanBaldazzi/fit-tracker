import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  ProgressBar,
  Chip,
  IconButton,
} from 'react-native-paper';
import { sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';
import TimerModal from '../../components/TimerModal';
import { saveCurrentSession, saveSessionProgress, clearCurrentSession } from '../../services/localStorage';

const SessionInProgressScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Sauvegarde automatique quand sessionData change
  useEffect(() => {
    if (sessionData) {
      saveSessionToLocal();
    }
  }, [sessionData]);

  // Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionData) {
        saveSessionToLocal();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [sessionData]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si on reprend une séance
      const routeParams = route.params || {};
      const isResuming = routeParams.resumeFromProgress;
      const savedProgress = routeParams.savedProgress;
      
      if (isResuming && savedProgress) {
        // Reprendre depuis le stockage local
        setSessionData(savedProgress.sessionData);
        setCurrentExerciseIndex(savedProgress.currentExerciseIndex);
        setSession(savedProgress.sessionData);
        console.log('🔄 Séance reprise depuis le stockage local');
      } else {
        // Charger une nouvelle séance
        const response = await sessionService.getSession(sessionId);
        setSession(response.session);
        
        // Initialiser les données de séance avec les valeurs par défaut
        const initialData = {
          ...response.session,
          exercises: response.session.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({
              reps: set.reps,
              weight: set.weight,
              duration: set.duration || 0,
              distance: set.distance || 0,
              restTime: set.restTime || 60,
              notes: set.notes || '',
              completed: false,
              _id: set._id
            }))
          }))
        };
        
        setSessionData(initialData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
    } finally {
      setIsLoading(false);
    }
  };

  const currentExercise = sessionData?.exercises[currentExerciseIndex];
  const progress = sessionData ? (currentExerciseIndex + 1) / sessionData.exercises.length : 0;

  // Fonction de sauvegarde locale
  const saveSessionToLocal = async () => {
    if (!sessionData) return;
    
    try {
      const progressData = {
        currentExerciseIndex,
        sessionData,
        timestamp: new Date().toISOString(),
      };
      
      await saveCurrentSession(sessionData);
      await saveSessionProgress(progressData);
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde locale:', error);
    }
  };

  const handleUpdateSet = (setIndex, field, value) => {
    if (!sessionData) return;
    
    const updatedSessionData = { ...sessionData };
    const exercise = updatedSessionData.exercises[currentExerciseIndex];
    
    // Mettre à jour directement reps ou weight, pas actualReps/actualWeight
    const realField = field === 'actualReps' ? 'reps' : field === 'actualWeight' ? 'weight' : field;
    
    exercise.sets[setIndex] = {
      ...exercise.sets[setIndex],
      [realField]: value
    };
    
    setSessionData(updatedSessionData);
  };

  const handleToggleSetCompleted = (setIndex) => {
    if (!sessionData) return;
    
    const updatedSessionData = { ...sessionData };
    const exercise = updatedSessionData.exercises[currentExerciseIndex];
    exercise.sets[setIndex] = {
      ...exercise.sets[setIndex],
      completed: !exercise.sets[setIndex].completed
    };
    
    console.log('Toggle completed:', { setIndex, completed: exercise.sets[setIndex].completed, exercise: exercise.sets[setIndex] });
    setSessionData(updatedSessionData);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < sessionData.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleCompleteSession = async () => {
    console.log('🔥 FONCTION handleCompleteSession DÉCLENCHÉE !');
    try {
      setIsSaving(true);
      
      // Envoyer les données directement
      const exercisesToSend = sessionData.exercises.map(exercise => ({
        name: exercise.name,
        category: exercise.category,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration || 0,
          distance: set.distance || 0,
          completed: set.completed
        }))
      }));
      
      // Calculer l'XP basé sur les exercices complétés
      const completedSets = sessionData.exercises.reduce((total, exercise) => {
        return total + exercise.sets.filter(set => set.completed).length;
      }, 0);
      
      const xpGained = completedSets * 10; // 10 XP par série complétée
      
      // Sauvegarder la séance complétée
      await sessionService.completeSession(sessionId, {
        actualDuration: 45, // TODO: Calculer la vraie durée
        exercises: exercisesToSend,
        xpGained: xpGained
      });
      
      // Nettoyer le stockage local
      await clearCurrentSession();
      
      Alert.alert(
        'Séance terminée !',
        `Félicitations ! Vous avez gagné ${xpGained} XP !`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la séance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSession = () => {
    Alert.alert(
      '⚠️ Annuler la séance',
      'Êtes-vous sûr de vouloir annuler cette séance ?\n\nTous vos progrès seront perdus et vous devrez recommencer depuis le début.',
      [
        {
          text: 'Non, continuer',
          style: 'cancel'
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              // Nettoyer le stockage local
              await clearCurrentSession();
              
              Alert.alert(
                'Séance annulée',
                'Votre séance a été annulée. Vous pouvez la reprendre plus tard.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur lors de l\'annulation:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la séance');
            }
          }
        }
      ]
    );
  };

  const isLastExercise = currentExerciseIndex === sessionData?.exercises.length - 1;
  const allSetsCompleted = currentExercise?.sets.every(set => set.completed);
  
  // Debug: voir l'état des boutons
  console.log('🔍 État des boutons:', {
    isLastExercise,
    allSetsCompleted,
    currentExerciseIndex,
    totalExercises: sessionData?.exercises.length,
    currentExerciseSets: currentExercise?.sets.map(set => ({ completed: set.completed }))
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de la séance...</Text>
      </View>
    );
  }

  if (!sessionData || !currentExercise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Séance non trouvée</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
        >
          Retour
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec progression */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.sessionName}>{sessionData.name}</Text>
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => setTimerModalVisible(true)}
          >
            <IconButton
              icon="timer-outline"
              size={24}
              iconColor={colors.primary}
              style={styles.timerIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Exercice {currentExerciseIndex + 1} sur {sessionData.exercises.length}
          </Text>
          <ProgressBar 
            progress={progress} 
            color={colors.primary}
            style={styles.progressBar}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercice actuel */}
        <Card style={styles.exerciseCard}>
          <Card.Content>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{currentExercise.name}</Text>
              <Chip mode="outlined" style={styles.categoryChip}>
                {currentExercise.category}
              </Chip>
            </View>
            
            <Text style={styles.exerciseDescription}>
              {currentExercise.muscleGroups?.join(', ')}
            </Text>

            {/* Séries de l'exercice */}
            <View style={styles.setsContainer}>
              <Text style={styles.setsTitle}>Séries</Text>
              {currentExercise.sets.map((set, setIndex) => (
                <Card 
                  key={setIndex} 
                  style={[
                    styles.setCard,
                    set.completed && styles.completedSetCard
                  ]}
                >
                  <Card.Content style={styles.setContent}>
                    <View style={styles.setHeader}>
                      <Text style={styles.setNumber}>Série {setIndex + 1}</Text>
                      <Button
                        mode={set.completed ? "contained" : "outlined"}
                        onPress={() => handleToggleSetCompleted(setIndex)}
                        compact
                        style={styles.completeButton}
                      >
                        {set.completed ? 'Terminé' : 'Marquer'}
                      </Button>
                    </View>
                    
                    <View style={styles.setInputs}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Répétitions</Text>
                        <TextInput
                          value={set.reps.toString()}
                          onChangeText={(value) => handleUpdateSet(setIndex, 'reps', parseInt(value) || 0)}
                          mode="outlined"
                          keyboardType="numeric"
                          style={styles.setInput}
                          disabled={set.completed}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Poids (kg)</Text>
                        <TextInput
                          value={set.weight.toString()}
                          onChangeText={(value) => handleUpdateSet(setIndex, 'weight', parseFloat(value) || 0)}
                          mode="outlined"
                          keyboardType="numeric"
                          style={styles.setInput}
                          disabled={set.completed}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation et actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            style={styles.navButton}
          >
            Précédent
          </Button>
          
          {isLastExercise ? (
            <Button
              mode="contained"
              onPress={handleCompleteSession}
              disabled={isSaving}
              loading={isSaving}
              style={styles.completeButton}
            >
              Terminer la séance
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextExercise}
              style={styles.navButton}
            >
              Suivant
            </Button>
          )}
        </View>
        
        {/* Bouton d'annulation */}
        <View style={styles.cancelContainer}>
          <Button
            mode="text"
            onPress={handleCancelSession}
            style={styles.cancelButton}
            textColor={colors.error}
            icon="close"
          >
            Annuler la séance
          </Button>
        </View>
      </View>

      {/* Modal du chronomètre */}
      <TimerModal
        visible={timerModalVisible}
        onClose={() => setTimerModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionName: {
    ...typography.h3,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },
  timerButton: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  timerIcon: {
    margin: 0,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.body2,
    color: 'white',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  exerciseCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryChip: {
    marginLeft: spacing.sm,
  },
  exerciseDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  setsContainer: {
    marginTop: spacing.md,
  },
  setsTitle: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  setCard: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  completedSetCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
    borderWidth: 1,
  },
  setContent: {
    padding: spacing.md,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  setNumber: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  completeButton: {
    minWidth: 100,
  },
  setInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  setInput: {
    backgroundColor: colors.surface,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  cancelContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
  },
});

export default SessionInProgressScreen;
