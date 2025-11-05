import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  List,
  Divider,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { sessionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';

const SessionHistoryDetailScreen = ({ route, navigation }) => {
  const { sessionId, completedSession } = route.params;
  const [session, setSession] = useState(completedSession || null);
  const [isLoading, setIsLoading] = useState(!completedSession);
  const { refreshUser } = useAuth();

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getCompletedSession(sessionId);
      setSession(response.session);
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.gray;
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  };

  const handleRepeatSession = async () => {
    try {
      const result = await sessionService.copySession(sessionId);
      
      let message = 'Séance copiée ! Vous pouvez la retrouver dans vos séances.';
      if (result.copiedExercises && result.copiedExercises.length > 0) {
        message += `\n\nExercices personnalisés copiés :\n${result.copiedExercises.map(ex => `• ${ex.originalName} → ${ex.copiedName}`).join('\n')}`;
      }
      
      Alert.alert('Succès', message);
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      Alert.alert('Erreur', 'Impossible de copier la séance');
    }
  };

  const handleDeleteSession = () => {
    const completionId = session?.completionId || session?._id;
    if (!completionId) {
      Alert.alert('Erreur', 'Impossible d\'identifier la séance complétée');
      return;
    }

    Alert.alert(
      'Supprimer la séance',
      `Êtes-vous sûr de vouloir supprimer "${session.name}" ? Cette action mettra à jour vos statistiques.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionService.deleteCompletedSession(sessionId, completionId);
              Alert.alert('Succès', 'Séance supprimée avec succès');
              await refreshUser();
              navigation.goBack();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de supprimer la séance');
            }
          },
        },
      ]
    );
  };

  const handleEditSession = () => {
    const completionId = session?.completionId || session?._id;
    navigation.navigate('EditCompletedSession', {
      sessionId: sessionId,
      completionId: completionId,
      completedSession: session
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de la séance...</Text>
      </View>
    );
  }

  if (!session) {
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
    <ScrollView style={styles.container}>
      {/* En-tête de la séance */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Text style={styles.sessionName}>{session.name}</Text>
            <View style={styles.badgesContainer}>
              <Chip
                mode="outlined"
                style={[styles.difficultyChip, { borderColor: getDifficultyColor(session.difficulty) }]}
                textStyle={{ color: getDifficultyColor(session.difficulty) }}
              >
                {getDifficultyLabel(session.difficulty)}
              </Chip>
              <Chip mode="outlined" style={styles.categoryChip}>
                {session.category}
              </Chip>
            </View>
          </View>
          
          <Text style={styles.completionDate}>
            Terminée le {formatDate(session.completedAt)}
          </Text>
          
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{session.actualDuration || session.estimatedDuration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{session.completedExercises?.length || session.exercises.length}</Text>
              <Text style={styles.statLabel}>Exercices</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{session.xpGained || 0}</Text>
              <Text style={styles.statLabel}>XP Gagné</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Exercices de la séance */}
      <Card style={styles.exercisesCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Exercices réalisés</Text>
          {(session.completedExercises || session.exercises).map((exercise, index) => (
            <View key={index}>
              <List.Item
                title={exercise.name}
                description={`${exercise.sets.filter(set => set.completed).length} séries complétées • ${exercise.category || 'Mixte'}`}
                left={(props) => <List.Icon {...props} icon="dumbbell" />}
                right={() => (
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseSets}>
                      {exercise.sets.filter(set => set.completed).length}/{exercise.sets.length}
                    </Text>
                  </View>
                )}
              />
              {index < session.exercises.length - 1 && <Divider />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Détails des performances */}
      <Card style={styles.performanceCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Performances détaillées</Text>
          {(session.completedExercises || session.exercises).map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exercisePerformance}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setPerformance}>
                  <Text style={styles.setNumber}>Série {setIndex + 1}:</Text>
                  <Text style={styles.setDetails}>
                    {set.reps} répétitions • {set.weight}kg
                    {set.completed ? ' ✅' : ' ❌'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Button
            mode="contained"
            onPress={handleRepeatSession}
            style={styles.actionButton}
            icon="content-copy"
          >
            Copier la séance
          </Button>
          <View style={styles.actionButtonsRow}>
            <Button
              mode="outlined"
              onPress={handleEditSession}
              style={[styles.actionButton, styles.editButton]}
              icon="pencil"
            >
              Modifier
            </Button>
            <Button
              mode="outlined"
              onPress={handleDeleteSession}
              style={[styles.actionButton, styles.deleteButton]}
              icon="delete"
              textColor={colors.error}
            >
              Supprimer
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Espacement en bas */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  headerCard: {
    margin: spacing.md,
    elevation: 4,
  },
  headerContent: {
    marginBottom: spacing.md,
  },
  sessionName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  difficultyChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  completionDate: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  exercisesCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  performanceCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  actionsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  exerciseDetails: {
    alignItems: 'flex-end',
  },
  exerciseSets: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  exercisePerformance: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  setPerformance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  setNumber: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  setDetails: {
    ...typography.body2,
    color: colors.text,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default SessionHistoryDetailScreen;
