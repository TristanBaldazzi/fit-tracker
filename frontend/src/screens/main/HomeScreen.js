import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ProgressBar,
  Avatar,
  Chip,
  FAB,
  Surface,
  Divider,
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
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Avatar.Text
                  size={56}
                  label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>
                    {getLevelBadge(user?.level || 1)}
                  </Text>
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>
                  Salut {user?.firstName || 'Utilisateur'} ! 👋
                </Text>
                <View style={styles.statsRowCompact}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeEmoji}>
                      {getLevelBadge(user?.level || 1)}
                    </Text>
                    <Text style={styles.statBadgeText}>
                      Niveau {user?.level || 1}
                    </Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeEmoji}>⚡</Text>
                    <Text style={styles.statBadgeText}>
                      {user?.xp || 0} XP
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Niveau {user?.level + 1 || 2}
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(calculateLevelProgress() * 100)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <ProgressBar
                  progress={calculateLevelProgress()}
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>🔥 Tes stats</Text>
          <View style={styles.statsRow}>
            <TouchableOpacity activeOpacity={0.8} style={styles.statCardWrapper}>
              <View style={[styles.statCard, styles.statCard1]}>
                <View style={styles.statCardGradient} />
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Text style={styles.statIcon}>🏋️</Text>
                  </View>
                  <Text style={styles.statNumber}>{user?.totalSessionsCompleted || 0}</Text>
                  <Text style={styles.statLabel}>Séances</Text>
                </View>
                <View style={styles.statCardAccent} />
                <View style={styles.statCardAccent2} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity activeOpacity={0.8} style={styles.statCardWrapper}>
              <View style={[styles.statCard, styles.statCard2]}>
                <View style={styles.statCardGradient} />
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Text style={styles.statIcon}>⏱️</Text>
                  </View>
                  <Text style={styles.statNumber}>
                    {Math.round((user?.stats?.totalWorkoutTime || 0) / 60)}h
                  </Text>
                  <Text style={styles.statLabel}>Entraînement</Text>
                </View>
                <View style={styles.statCardAccent} />
                <View style={styles.statCardAccent2} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.statCardWrapper}
              onPress={() => showWeightInfo(user?.stats?.totalWeightLifted || 0)}
            >
              <View style={[styles.statCard, styles.statCard3]}>
                <View style={styles.statCardGradient} />
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Text style={styles.statIcon}>💪</Text>
                  </View>
                  <Text style={styles.statNumber}>
                    {formatWeight(user?.stats?.totalWeightLifted || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Poids soulevé</Text>
                </View>
                <View style={styles.statCardAccent} />
                <View style={styles.statCardAccent2} />
              </View>
            </TouchableOpacity>
          </View>
        </View>


        {/* Séances récentes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Tes dernières séances</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Sessions')}
              activeOpacity={0.7}
            >
              <View style={styles.seeAllButtonContainer}>
                <Text style={styles.seeAllButton}>Voir tout</Text>
                <Text style={styles.seeAllArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
          {recentSessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {recentSessions.map((session, index) => (
                <TouchableOpacity
                  key={session._id}
                  onPress={() => navigation.navigate('SessionDetail', { sessionId: session._id })}
                  activeOpacity={0.7}
                  style={styles.sessionCardWrapper}
                >
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionLeft}>
                      <View style={styles.sessionIconContainer}>
                        <Text style={styles.sessionIcon}>💪</Text>
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionName}>{session.name}</Text>
                        <View style={styles.sessionMeta}>
                          <View style={styles.sessionMetaItem}>
                            <Text style={styles.sessionMetaIcon}>⏱️</Text>
                            <Text style={styles.sessionMetaText}>
                              {session.estimatedDuration}min
                            </Text>
                          </View>
                          <Text style={styles.sessionMetaDot}>•</Text>
                          <View style={styles.sessionMetaItem}>
                            <Text style={styles.sessionMetaIcon}>🏋️</Text>
                            <Text style={styles.sessionMetaText}>
                              {session.exercises.length} exos
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyBadgeColor(session.difficulty) }]}>
                      <Text style={styles.difficultyBadgeText}>
                        {getDifficultyLabel(session.difficulty)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyText}>
                  Pas encore de séances ?
                </Text>
                <Text style={styles.emptySubtext}>
                  Crée ta première séance et commence ton parcours ! 💪
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('CreateSession')}
                  style={styles.emptyButton}
                  icon="plus"
                  buttonColor={colors.primary}
                  contentStyle={styles.emptyButtonContent}
                  labelStyle={styles.emptyButtonLabel}
                >
                  Créer une séance
                </Button>
              </View>
            </View>
          )}
        </View>

      </ScrollView>

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

const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty) {
    case 'easy': return colors.success;
    case 'medium': return colors.warning;
    case 'hard': return colors.error;
    default: return colors.gray;
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  // Profile Card Styles
  profileCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  profileContent: {
    padding: spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarLabel: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 24,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 3,
  },
  avatarBadgeText: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  statsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  statBadgeEmoji: {
    fontSize: 14,
  },
  statBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  progressContainer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
  },
  progressPercent: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  progressBarContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 8,
    backgroundColor: colors.lightGray,
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  // Stats Section Styles
  statsContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 20,
    minHeight: 140,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  statCard1: {
    backgroundColor: '#FF6B6B',
  },
  statCard2: {
    backgroundColor: '#4ECDC4',
  },
  statCard3: {
    backgroundColor: '#FFE66D',
  },
  statCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  statContent: {
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
  },
  statCardAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statCardAccent2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 30,
  },
  statNumber: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '900',
    marginBottom: spacing.xs,
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 11,
    opacity: 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Section Card Styles
  sectionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontSize: 19,
  },
  seeAllButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '15',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  seeAllArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  sessionsList: {
    gap: spacing.sm,
  },
  sessionCardWrapper: {
    marginBottom: spacing.sm,
  },
  sessionCard: {
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  sessionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight + '30',
  },
  sessionIcon: {
    fontSize: 26,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 16,
    lineHeight: 22,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionMetaIcon: {
    fontSize: 13,
  },
  sessionMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  sessionMetaDot: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  difficultyBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyStateCard: {
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 22,
  },
  emptySubtext: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: spacing.sm,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
  },
  emptyButtonContent: {
    paddingVertical: spacing.sm,
  },
  emptyButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
