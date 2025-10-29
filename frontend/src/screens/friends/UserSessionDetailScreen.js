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
  Chip,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper';
import { userService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const UserSessionDetailScreen = ({ route, navigation }) => {
  const { sessionId, userId, userName, session: initialSession } = route.params;
  const [session, setSession] = useState(initialSession);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!initialSession) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      // Pour l'instant, on utilise la session passée en paramètre
      // Dans une vraie implémentation, on ferait un appel API pour récupérer les détails
      setSession(initialSession);
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySession = async () => {
    Alert.alert(
      'Copier la séance',
      `Voulez-vous copier la séance "${session.name}" de ${userName} ?\n\nLes exercices personnalisés seront également copiés dans vos exercices.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Copier',
          onPress: copySession,
        },
      ]
    );
  };

  const copySession = async () => {
    try {
      setIsCopying(true);
      const response = await userService.copyUserSession(userId, sessionId);
      
      Alert.alert(
        'Séance copiée !',
        `La séance "${response.session.name}" a été copiée avec succès.\n\n${response.customExercises.length > 0 ? `${response.customExercises.length} exercice(s) personnalisé(s) copié(s).` : ''}`,
        [
          {
            text: 'Voir mes séances',
            onPress: () => navigation.navigate('Sessions'),
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      Alert.alert('Erreur', 'Impossible de copier la séance');
    } finally {
      setIsCopying(false);
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Force': return colors.primary;
      case 'Cardio': return colors.error;
      case 'Flexibilité': return colors.success;
      case 'Mixte': return colors.info;
      default: return colors.gray;
    }
  };

  const formatWeight = (weight) => {
    if (weight === 0) return 'Poids du corps';
    return `${weight}kg`;
  };

  const formatDuration = (duration) => {
    if (duration === 0) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    if (minutes > 0) {
      return `${minutes}min ${seconds}s`;
    }
    return `${seconds}s`;
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
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.sessionCreator}>par {userName}</Text>
              {session.description && (
                <Text style={styles.sessionDescription}>{session.description}</Text>
              )}
            </View>
            <View style={styles.sessionBadges}>
              <Chip
                mode="outlined"
                style={[styles.difficultyChip, { borderColor: getDifficultyColor(session.difficulty) }]}
                textStyle={{ color: getDifficultyColor(session.difficulty) }}
              >
                {getDifficultyLabel(session.difficulty)}
              </Chip>
              <Chip
                mode="outlined"
                style={[styles.categoryChip, { borderColor: getCategoryColor(session.category) }]}
                textStyle={{ color: getCategoryColor(session.category) }}
              >
                {session.category}
              </Chip>
            </View>
          </View>
          
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statText}>{session.estimatedDuration}min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🏋️</Text>
              <Text style={styles.statText}>{session.exercises.length} exercices</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statText}>
                {new Date(session.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleCopySession}
            loading={isCopying}
            disabled={isCopying}
            icon="content-copy"
            style={styles.copyButton}
          >
            {isCopying ? 'Copie en cours...' : 'Copier cette séance'}
          </Button>
        </Card.Content>
      </Card>

      {/* Exercices */}
      <Card style={styles.exercisesCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Exercices</Text>
          {session.exercises.map((exercise, index) => (
            <View key={index}>
              <List.Item
                title={exercise.name}
                description={`${exercise.sets.length} séries • ${exercise.category}`}
                left={(props) => (
                  <List.Icon 
                    {...props} 
                    icon="dumbbell" 
                    color={colors.primary}
                  />
                )}
                right={() => (
                  <Chip
                    mode="outlined"
                    compact
                    style={[styles.exerciseChip, { borderColor: getCategoryColor(exercise.category) }]}
                    textStyle={{ color: getCategoryColor(exercise.category) }}
                  >
                    {exercise.category}
                  </Chip>
                )}
              />
              
              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setItem}>
                  <Text style={styles.setNumber}>Série {setIndex + 1}</Text>
                  <View style={styles.setDetails}>
                    {set.reps > 0 && (
                      <Text style={styles.setDetail}>{set.reps} reps</Text>
                    )}
                    {set.weight > 0 && (
                      <Text style={styles.setDetail}>{formatWeight(set.weight)}</Text>
                    )}
                    {set.duration > 0 && (
                      <Text style={styles.setDetail}>{formatDuration(set.duration)}</Text>
                    )}
                    {set.distance > 0 && (
                      <Text style={styles.setDetail}>{set.distance}m</Text>
                    )}
                    {set.restTime > 0 && (
                      <Text style={styles.setDetail}>Repos: {set.restTime}s</Text>
                    )}
                  </View>
                  {set.notes && (
                    <Text style={styles.setNotes}>{set.notes}</Text>
                  )}
                </View>
              ))}
              
              {index < session.exercises.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <Card style={styles.tagsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {session.tags.map((tag, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  style={styles.tagChip}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

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
  sessionHeader: {
    marginBottom: spacing.md,
  },
  sessionInfo: {
    marginBottom: spacing.sm,
  },
  sessionName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  sessionCreator: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sessionDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  difficultyChip: {
    marginRight: spacing.sm,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  copyButton: {
    marginTop: spacing.sm,
  },
  exercisesCard: {
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
  exerciseChip: {
    marginLeft: spacing.sm,
  },
  setItem: {
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setNumber: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  setDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  setDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  setNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  tagsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default UserSessionDetailScreen;
