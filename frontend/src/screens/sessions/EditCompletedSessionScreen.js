import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { sessionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';

const EditCompletedSessionScreen = ({ route, navigation }) => {
  const { sessionId, completionId, completedSession } = route.params;
  const { refreshUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [actualDuration, setActualDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (completedSession) {
      setActualDuration(completedSession.actualDuration?.toString() || '');
      setNotes(completedSession.notes || '');
      
      // Utiliser completedExercises s'il existe, sinon exercises
      const exercisesData = completedSession.completedExercises || completedSession.exercises || [];
      setExercises(exercisesData.map(exercise => ({
        name: exercise.name,
        category: exercise.category || 'Mixte', // S'assurer qu'une catégorie existe
        sets: exercise.sets.map(set => ({
          reps: set.reps || 0,
          weight: set.weight || 0,
          duration: set.duration || 0,
          distance: set.distance || 0,
          completed: set.completed !== undefined ? set.completed : true
        }))
      })));
    }
  }, [completedSession]);

  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    const updatedExercises = [...exercises];
    const updatedSets = [...updatedExercises[exerciseIndex].sets];
    
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value
    };
    
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedSets
    };
    
    setExercises(updatedExercises);
  };

  const handleToggleSetCompleted = (exerciseIndex, setIndex) => {
    const updatedExercises = [...exercises];
    const updatedSets = [...updatedExercises[exerciseIndex].sets];
    
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      completed: !updatedSets[setIndex].completed
    };
    
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedSets
    };
    
    setExercises(updatedExercises);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updateData = {};
      
      if (actualDuration !== '') {
        const duration = parseInt(actualDuration);
        if (isNaN(duration) || duration < 0) {
          Alert.alert('Erreur', 'La durée doit être un nombre positif');
          setIsSaving(false);
          return;
        }
        updateData.actualDuration = duration;
      }
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      // Inclure les exercices modifiés
      if (exercises.length > 0) {
        updateData.exercises = exercises.map(exercise => ({
          name: exercise.name,
          sets: exercise.sets.map(set => ({
            reps: set.reps || 0,
            weight: set.weight || 0,
            duration: set.duration || 0,
            distance: set.distance || 0,
            completed: set.completed !== undefined ? set.completed : true
          }))
        }));
      }

      await sessionService.updateCompletedSession(sessionId, completionId, updateData);
      
      Alert.alert('Succès', 'Séance modifiée avec succès. Vos statistiques ont été mises à jour.');
      await refreshUser();
      navigation.goBack();
    } catch (error) {
      console.error('Erreur modification:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de modifier la séance');
    } finally {
      setIsSaving(false);
    }
  };

  const renderExercise = (exercise, exerciseIndex) => (
    <Card key={exerciseIndex} style={styles.exerciseCard}>
      <Card.Content>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.category && (
            <Text style={styles.categoryText}>{exercise.category}</Text>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {exercise.sets.map((set, setIndex) => (
          <View key={setIndex} style={styles.setContainer}>
            <View style={styles.setHeader}>
              <Text style={styles.setLabel}>Série {setIndex + 1}</Text>
              <Button
                mode={set.completed ? 'contained' : 'outlined'}
                onPress={() => handleToggleSetCompleted(exerciseIndex, setIndex)}
                disabled={isSaving}
                compact
                icon={set.completed ? 'check-circle' : 'circle-outline'}
                style={styles.completeButton}
                labelStyle={styles.completeButtonLabel}
              >
                {set.completed ? 'Complété' : 'Non complété'}
              </Button>
            </View>
            
            <View style={styles.setInputs}>
              <TextInput
                label="Répétitions"
                value={set.reps?.toString() || '0'}
                onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'reps', parseInt(value) || 0)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.setInput}
                disabled={isSaving}
                dense
              />
              <TextInput
                label="Poids (kg)"
                value={set.weight?.toString() || '0'}
                onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'weight', parseFloat(value) || 0)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.setInput}
                disabled={isSaving}
                dense
              />
            </View>
            
            {!set.completed && (
              <Text style={styles.notCompletedText}>⚠️ Cette série n'est pas marquée comme complétée</Text>
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Modifier la séance complétée</Text>
            
            <Text style={styles.sessionName}>{completedSession?.name}</Text>
            
            <TextInput
              label="Durée réelle (en minutes)"
              value={actualDuration}
              onChangeText={setActualDuration}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              disabled={isSaving}
            />

            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              disabled={isSaving}
            />
          </Card.Content>
        </Card>

        {/* Exercices */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.exercisesTitle}>Exercices</Text>
          <Text style={styles.infoText}>
            💡 Modifiez les séries, répétitions, poids et cochez les séries complétées. Cela mettra à jour vos statistiques (XP, poids total soulevé).
          </Text>
          
          {exercises.map((exercise, index) => renderExercise(exercise, index))}
        </View>

        {/* Boutons d'action */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.buttonsContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                disabled={isSaving}
                style={styles.button}
              >
                Annuler
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
                style={styles.button}
              >
                Enregistrer
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
  scrollView: {
    flex: 1,
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
  card: {
    margin: spacing.md,
    elevation: 4,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sessionName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
  exercisesContainer: {
    padding: spacing.md,
  },
  exercisesTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  exerciseCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    marginVertical: spacing.md,
  },
  setContainer: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  completeButton: {
    marginLeft: spacing.sm,
  },
  completeButtonLabel: {
    fontSize: 12,
  },
  setInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  setInput: {
    flex: 1,
  },
  notCompletedText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default EditCompletedSessionScreen;
