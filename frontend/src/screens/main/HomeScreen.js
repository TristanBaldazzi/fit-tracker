import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ProgressBar,
  Avatar,
  Chip,
  FAB,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import { sessionService } from '../../services/api';
import useDailyReset from '../../hooks/useDailyReset';
import { formatWeight, showWeightInfo } from '../../utils/weightUtils';
import { useSessionResume } from '../../hooks/useSessionResume';
import ResumeSessionDialog from '../../components/ResumeSessionDialog';

const HomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [recentSessions, setRecentSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Hook pour la remise à zéro quotidienne
  useDailyReset();
  
  // Hook pour la reprise de séance
  const {
    showResumeDialog,
    savedSession,
    handleResumeSession,
    handleStartNewSession,
    dismissDialog,
  } = useSessionResume();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadRecentSessions(),
        refreshUser(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const response = await sessionService.getSessions({ limit: 3 });
      setRecentSessions(response.sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateLevelProgress = () => {
    if (!user) return 0;
    const currentLevelXP = Math.pow(user.level - 1, 2) * 100;
    const nextLevelXP = Math.pow(user.level, 2) * 100;
    const progress = (user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
    return Math.max(0, Math.min(1, progress));
  };

  const getLevelBadge = (level) => {
    if (level >= 50) return '🏆';
    if (level >= 25) return '⭐';
    if (level >= 10) return '🔥';
    if (level >= 5) return '💪';
    return '🌱';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* En-tête avec profil utilisateur */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <Avatar.Text
                size={60}
                label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>
                  Bonjour, {user?.firstName || 'Utilisateur'} !
                </Text>
                <View style={styles.levelContainer}>
                  <Text style={styles.levelText}>
                    Niveau {user?.level || 1} {getLevelBadge(user?.level || 1)}
                  </Text>
                  <Text style={styles.xpText}>
                    {user?.xp || 0} XP
                  </Text>
                </View>
                <ProgressBar
                  progress={calculateLevelProgress()}
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Statistiques rapides */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Vos statistiques</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.totalSessionsCompleted || 0}</Text>
                <Text style={styles.statLabel}>Séances</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.round((user?.stats?.totalWorkoutTime || 0) / 60)}h
                </Text>
                <Text style={styles.statLabel}>Entraînement</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => showWeightInfo(user?.stats?.totalWeightLifted || 0)}
              >
                <Text style={styles.statNumber}>
                  {formatWeight(user?.stats?.totalWeightLifted || 0)}
                </Text>
                <Text style={styles.statLabel}>Poids soulevé</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>


        {/* Séances récentes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Séances récentes</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Sessions')}
                compact
              >
                Voir tout
              </Button>
            </View>
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <View key={session._id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    <Text style={styles.sessionDetails}>
                      {session.estimatedDuration}min • {session.exercises.length} exercices
                    </Text>
                  </View>
                  <Chip
                    mode="outlined"
                    compact
                    style={[
                      styles.difficultyChip,
                      { backgroundColor: getDifficultyColor(session.difficulty) }
                    ]}
                  >
                    {getDifficultyLabel(session.difficulty)}
                  </Chip>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Aucune séance récente
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('CreateSession')}
                  style={styles.emptyButton}
                >
                  Créer une séance
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Bouton d'action flottant */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateSession')}
      />

      {/* Dialogue de reprise de séance */}
      <ResumeSessionDialog
        visible={showResumeDialog}
        onDismiss={dismissDialog}
        onResume={() => handleResumeSession(navigation)}
        onStartNew={() => handleStartNewSession(navigation)}
        sessionData={savedSession}
      />
    </View>
  );
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy': return colors.success + '20';
    case 'medium': return colors.warning + '20';
    case 'hard': return colors.error + '20';
    default: return colors.gray + '20';
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'Force': return colors.primary + '20';
    case 'Cardio': return colors.error + '20';
    case 'Flexibilité': return colors.success + '20';
    case 'Mixte': return colors.info + '20';
    default: return colors.gray + '20';
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

const getCategoryLabel = (category) => {
  switch (category) {
    case 'Force': return 'Force';
    case 'Cardio': return 'Cardio';
    case 'Flexibilité': return 'Flexibilité';
    case 'Mixte': return 'Mixte';
    // Gestion des anciennes valeurs pour compatibilité
    case 'strength': return 'Force';
    case 'cardio': return 'Cardio';
    case 'flexibility': return 'Flexibilité';
    case 'mixed': return 'Mixte';
    default: return category;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: spacing.md,
    elevation: 4,
  },
  profileContent: {
    padding: spacing.lg,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  xpText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  sectionCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  statsRow: {
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
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  sessionDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  difficultyChip: {
    marginLeft: spacing.sm,
  },
  categoryChip: {
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default HomeScreen;
