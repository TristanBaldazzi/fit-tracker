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
            <Avatar.Text
              size={100}
              label={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userUsername}>@{user?.username}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>
                  Niveau {user?.level || 1} {getLevelBadge(user?.level || 1)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Barre de progression du niveau */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {user?.xp || 0} XP
              </Text>
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

      {/* Statistiques principales */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.totalSessionsCompleted || 0}</Text>
              <Text style={styles.statLabel}>Séances complétées</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round((user?.stats?.totalWorkoutTime || 0) / 60)}h
              </Text>
              <Text style={styles.statLabel}>Temps d'entraînement</Text>
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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user?.stats?.averageWorkoutTime || 0}min
              </Text>
              <Text style={styles.statLabel}>Durée moyenne</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Exercice favori */}
      {user?.stats?.favoriteExercise && (
        <Card style={styles.favoriteCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Exercice favori</Text>
            <View style={styles.favoriteContent}>
              <Chip
                mode="outlined"
                style={styles.favoriteChip}
                textStyle={styles.favoriteChipText}
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
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
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
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
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
    margin: spacing.md,
    elevation: 4,
  },
  profileContent: {
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  userUsername: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: {
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
  favoriteCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  infoCard: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  favoriteContent: {
    alignItems: 'center',
  },
  favoriteChip: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  favoriteChipText: {
    color: colors.primary,
    fontWeight: '600',
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
