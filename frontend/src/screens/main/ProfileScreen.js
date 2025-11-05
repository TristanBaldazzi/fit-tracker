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
  Avatar,
  ProgressBar,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';
import { formatWeight, showWeightInfo } from '../../utils/weightUtils';

const ProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      await refreshUser();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
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

  const getXPToNextLevel = () => {
    if (!user) return 0;
    const nextLevelXP = Math.pow(user.level, 2) * 100;
    return nextLevelXP - user.xp;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* En-tête du profil */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={80}
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
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userUsername}>@{user?.username}</Text>
              <View style={styles.levelContainer}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeEmoji}>
                    {getLevelBadge(user?.level || 1)}
                  </Text>
                  <Text style={styles.levelBadgeText}>
                    Niveau {user?.level || 1}
                  </Text>
                </View>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpBadgeEmoji}>⚡</Text>
                  <Text style={styles.xpBadgeText}>
                    {user?.xp || 0} XP
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Barre de progression du niveau */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {getXPToNextLevel()} XP jusqu'au niveau {user?.level + 1 || 2}
              </Text>
            </View>
            <ProgressBar
              progress={calculateLevelProgress()}
              color={colors.primary}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Statistiques principales - Compact */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <Text style={styles.sectionTitle}>🔥 Statistiques</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statItemCompact}
              onPress={() => showWeightInfo(user?.stats?.totalWeightLifted || 0)}
            >
              <View style={[styles.statIconContainer, styles.statIcon1]}>
                <Text style={styles.statIcon}>🏋️</Text>
              </View>
              <Text style={styles.statNumberCompact}>{user?.totalSessionsCompleted || 0}</Text>
              <Text style={styles.statLabelCompact}>Séances</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItemCompact}
            >
              <View style={[styles.statIconContainer, styles.statIcon2]}>
                <Text style={styles.statIcon}>⏱️</Text>
              </View>
              <Text style={styles.statNumberCompact}>
                {Math.round((user?.stats?.totalWorkoutTime || 0) / 60)}h
              </Text>
              <Text style={styles.statLabelCompact}>Temps</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItemCompact}
              onPress={() => showWeightInfo(user?.stats?.totalWeightLifted || 0)}
            >
              <View style={[styles.statIconContainer, styles.statIcon3]}>
                <Text style={styles.statIcon}>💪</Text>
              </View>
              <Text style={styles.statNumberCompact}>
                {formatWeight(user?.stats?.totalWeightLifted || 0)}
              </Text>
              <Text style={styles.statLabelCompact}>Poids</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItemCompact}
            >
              <View style={[styles.statIconContainer, styles.statIcon4]}>
                <Text style={styles.statIcon}>📊</Text>
              </View>
              <Text style={styles.statNumberCompact}>
                {user?.stats?.averageWorkoutTime || 0}min
              </Text>
              <Text style={styles.statLabelCompact}>Moyenne</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Exercice favori */}
      {user?.stats?.favoriteExercise && (
        <Card style={styles.favoriteCard}>
          <Card.Content style={styles.favoriteContentCard}>
            <Text style={styles.sectionTitle}>⭐ Exercice favori</Text>
            <View style={styles.favoriteContent}>
              <Chip
                mode="outlined"
                style={styles.favoriteChip}
                textStyle={styles.favoriteChipText}
                icon="star"
              >
                {user.stats.favoriteExercise}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Informations du compte */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📋 Informations</Text>
          
          <List.Item
            title="Membre depuis"
            description={formatDate(user?.stats?.joinDate || new Date())}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          
          <Divider />
          
          <List.Item
            title="Email"
            description={user?.email || 'Non renseigné'}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          
          <Divider />
          
          <List.Item
            title="Profil"
            description={user?.settings?.isPublic ? 'Public' : 'Privé'}
            left={(props) => <List.Icon {...props} icon="account" />}
            right={() => (
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.visibilityChip,
                  { 
                    backgroundColor: user?.settings?.isPublic 
                      ? colors.success + '20' 
                      : colors.warning + '20',
                    borderColor: user?.settings?.isPublic 
                      ? colors.success 
                      : colors.warning
                  }
                ]}
                textStyle={{
                  color: user?.settings?.isPublic 
                    ? colors.success 
                    : colors.warning
                }}
              >
                {user?.settings?.isPublic ? 'Public' : 'Privé'}
              </Chip>
            )}
          />
        </Card.Content>
      </Card>

      {/* Actions rapides */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>⚙️ Actions rapides</Text>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Settings')}
            style={styles.actionButton}
            icon="cog"
          >
            Paramètres
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Friends')}
            style={styles.actionButton}
            icon="account-group"
          >
            Mes amis
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Leaderboard')}
            style={styles.actionButton}
            icon="trophy"
          >
            Classement
          </Button>
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
  profileHeader: {
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
    fontSize: 32,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 3,
  },
  avatarBadgeText: {
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 20,
  },
  userUsername: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  levelBadgeEmoji: {
    fontSize: 14,
  },
  levelBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  xpBadgeEmoji: {
    fontSize: 14,
  },
  xpBadgeText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressInfo: {
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  statsCard: {
    marginHorizontal: spacing.md,
    marginTop: 0,
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
  statsContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  statItemCompact: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.lightGray + '40',
    borderRadius: 16,
    marginBottom: spacing.xs,
    minHeight: 100,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statIcon1: {
    backgroundColor: '#FF6B6B' + '30',
  },
  statIcon2: {
    backgroundColor: '#4ECDC4' + '30',
  },
  statIcon3: {
    backgroundColor: '#FFE66D' + '30',
  },
  statIcon4: {
    backgroundColor: '#95E1D3' + '30',
  },
  statIcon: {
    fontSize: 24,
  },
  statNumberCompact: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  statLabelCompact: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteCard: {
    marginHorizontal: spacing.md,
    marginTop: 0,
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
  favoriteContentCard: {
    padding: spacing.md,
  },
  favoriteContent: {
    alignItems: 'center',
  },
  favoriteChip: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  favoriteChipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginTop: 0,
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
  actionsCard: {
    marginHorizontal: spacing.md,
    marginTop: 0,
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
  visibilityChip: {
    alignSelf: 'center',
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default ProfileScreen;
