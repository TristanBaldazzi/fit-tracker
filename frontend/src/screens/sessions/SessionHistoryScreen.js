import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
  FAB,
} from 'react-native-paper';
import { sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const SessionHistoryScreen = ({ navigation }) => {
  const [completedSessions, setCompletedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompletedSessions();
  }, []);

  const loadCompletedSessions = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getCompletedSessions();
      setCompletedSessions(response.sessions || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des séances');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompletedSessions();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
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

  const handleViewSession = (session) => {
    // Utiliser le completionId pour identifier la completion spécifique
    const sessionId = session.completionId ? `${session._id}_${session.completionId}` : session._id;
    navigation.navigate('SessionHistoryDetail', { sessionId: sessionId });
  };

  const handleRepeatSession = async (sessionId) => {
    try {
      const result = await sessionService.copySession(sessionId);
      
      let message = 'Séance copiée ! Vous pouvez la retrouver dans vos séances.';
      if (result.copiedExercises && result.copiedExercises.length > 0) {
        message += `\n\nExercices personnalisés copiés :\n${result.copiedExercises.map(ex => `• ${ex.originalName} → ${ex.copiedName}`).join('\n')}`;
      }
      
      Alert.alert('Succès', message);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      Alert.alert('Erreur', 'Impossible de copier la séance');
    }
  };

  const getTotalSets = (session) => {
    // Utiliser completedExercises si disponible (avec les vraies valeurs)
    const exercisesToCount = session.completedExercises || session.exercises;
    return exercisesToCount.reduce((total, exercise) => {
      return total + (exercise.sets ? exercise.sets.filter(set => set.completed).length : 0);
    }, 0);
  };

  const getTotalDuration = (session) => {
    return session.actualDuration || session.estimatedDuration || 0;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {completedSessions.length > 0 ? (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Historique des Séances</Text>
              <Text style={styles.headerSubtitle}>
                {completedSessions.length} séance{completedSessions.length > 1 ? 's' : ''} terminée{completedSessions.length > 1 ? 's' : ''}
              </Text>
            </View>

            {completedSessions.map((session, index) => (
              <Card key={session._id} style={styles.sessionCard} elevation={2}>
                <Card.Content>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName}>{session.name}</Text>
                      <Text style={styles.sessionDate}>
                        {formatDate(session.completedAt)}
                      </Text>
                    </View>
                    <Chip
                      mode="outlined"
                      style={[styles.difficultyChip, { borderColor: getDifficultyColor(session.difficulty) }]}
                      textStyle={{ color: getDifficultyColor(session.difficulty) }}
                    >
                      {getDifficultyLabel(session.difficulty)}
                    </Chip>
                  </View>

                  <View style={styles.sessionStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{getTotalSets(session)}</Text>
                      <Text style={styles.statLabel}>Séries</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{getTotalDuration(session)}</Text>
                      <Text style={styles.statLabel}>Minutes</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{session.xpGained || 0}</Text>
                      <Text style={styles.statLabel}>XP</Text>
                    </View>
                  </View>

                  <View style={styles.sessionActions}>
                    <Button
                      mode="outlined"
                      onPress={() => handleViewSession(session)}
                      style={styles.actionButton}
                      compact
                    >
                      Voir détails
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => handleRepeatSession(session._id)}
                      style={styles.actionButton}
                      compact
                    >
                      Répéter
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucune séance terminée</Text>
            <Text style={styles.emptySubtitle}>
              Commencez une séance pour voir votre historique ici !
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Sessions')}
              style={styles.emptyButton}
            >
              Voir mes séances
            </Button>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Sessions')}
        label="Nouvelle séance"
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
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  sessionCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sessionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  sessionName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sessionDate: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  difficultyChip: {
    alignSelf: 'flex-start',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default SessionHistoryScreen;
