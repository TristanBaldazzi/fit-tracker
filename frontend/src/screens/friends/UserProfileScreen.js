import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
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
  ActivityIndicator,
} from 'react-native-paper';
import { userService, friendService, sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';
import { formatWeight, showWeightInfo } from '../../utils/weightUtils';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadUserProfile(),
        loadUserStats(),
        loadRecentSessions(),
        checkFriendshipStatus(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await userService.getProfile(userId);
      setUser(response.user);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats(userId);
      setUserStats(response.stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const response = await userService.getUserSessions(userId, 5);
      setRecentSessions(response.sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
      setRecentSessions([]);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      const response = await friendService.checkFriendshipStatus(userId);
      setFriendshipStatus(response.status);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'amitié:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleSendFriendRequest = async () => {
    try {
      await friendService.sendFriendRequest(userId);
      setFriendshipStatus('pending');
      Alert.alert('Succès', 'Demande d\'amitié envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande d\'amitié');
    }
  };

  const handleViewSessions = () => {
    navigation.navigate('UserSessions', { 
      userId, 
      userName: `${user.firstName} ${user.lastName}` 
    });
  };

  const getLevelBadge = (level) => {
    if (level >= 50) return '🏆';
    if (level >= 25) return '⭐';
    if (level >= 10) return '🔥';
    if (level >= 5) return '💪';
    return '🌱';
  };

  const getFriendshipButton = () => {
    switch (friendshipStatus) {
      case 'none':
        return (
          <Button
            mode="contained"
            onPress={handleSendFriendRequest}
            icon="account-plus"
          >
            Ajouter comme ami
          </Button>
        );
      case 'pending':
        return (
          <Button
            mode="outlined"
            disabled
            icon="clock"
          >
            Demande en attente
          </Button>
        );
      case 'accepted':
        return (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Leaderboard')}
            icon="trophy"
          >
            Voir le classement
          </Button>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profil non trouvé</Text>
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
              label={`${user.firstName[0]}${user.lastName[0]}`}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.userUsername}>@{user.username}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>
                  Niveau {user.level} {getLevelBadge(user.level)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            {getFriendshipButton()}
            <Button
              mode="outlined"
              onPress={handleViewSessions}
              icon="dumbbell"
              style={styles.sessionsButton}
            >
              Voir séances
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Statistiques */}
      {userStats && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.totalSessionsCompleted}</Text>
                <Text style={styles.statLabel}>Séances</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.round(userStats.totalWorkoutTime / 60)}h
                </Text>
                <Text style={styles.statLabel}>Entraînement</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => showWeightInfo(userStats.totalWeightLifted)}
              >
                <Text style={styles.statNumber}>
                  {formatWeight(userStats.totalWeightLifted)}
                </Text>
                <Text style={styles.statLabel}>Poids soulevé</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userStats.averageWorkoutTime}min
                </Text>
                <Text style={styles.statLabel}>Durée moyenne</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Exercice favori */}
      {userStats?.favoriteExercise && (
        <Card style={styles.favoriteCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Exercice favori</Text>
            <View style={styles.favoriteContent}>
              <Chip
                mode="outlined"
                style={styles.favoriteChip}
                textStyle={styles.favoriteChipText}
              >
                {userStats.favoriteExercise}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Informations du compte */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <List.Item
            title="Membre depuis"
            description={formatDate(userStats?.joinDate || new Date())}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          
          <Divider />
          
          <List.Item
            title="Niveau actuel"
            description={`${user.level} (${user.xp} XP)`}
            left={(props) => <List.Icon {...props} icon="trophy" />}
          />
          
          <Divider />
          
          <List.Item
            title="Séances complétées"
            description={`${user.totalSessionsCompleted} séances`}
            left={(props) => <List.Icon {...props} icon="check-circle" />}
          />
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionsButton: {
    marginLeft: spacing.sm,
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
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default UserProfileScreen;
