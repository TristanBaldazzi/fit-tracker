import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Avatar,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { leaderboardService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      let response;
      
      if (activeTab === 'friends') {
        response = await leaderboardService.getFriendsLeaderboard();
      } else {
        response = await leaderboardService.getGlobalLeaderboard();
      }
      
      setLeaderboard(response.leaderboard || []);
      setUserPosition(response.userPosition);
      setUserStats(response.userStats);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getLevelBadge = (level) => {
    if (level >= 50) return '🏆';
    if (level >= 25) return '⭐';
    if (level >= 10) return '🔥';
    if (level >= 5) return '💪';
    return '🌱';
  };

  const getPositionBadge = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return colors.warning;
      case 2: return colors.gray;
      case 3: return '#CD7F32'; // Bronze
      default: return colors.textSecondary;
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const position = index + 1;
    const isCurrentUser = item.isCurrentUser;
    
    return (
      <Card 
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem
        ]}
      >
        <Card.Content style={styles.itemContent}>
          <View style={styles.positionContainer}>
            <Text style={[
              styles.positionText,
              { color: getPositionColor(position) }
            ]}>
              {position}
            </Text>
            {getPositionBadge(position) && (
              <Text style={styles.positionBadge}>
                {getPositionBadge(position)}
              </Text>
            )}
          </View>
          
          <Avatar.Text
            size={50}
            label={`${item.firstName[0]}${item.lastName[0]}`}
            style={[
              styles.avatar,
              isCurrentUser && styles.currentUserAvatar
            ]}
          />
          
          <View style={styles.userInfo}>
            <Text style={[
              styles.userName,
              isCurrentUser && styles.currentUserName
            ]}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.userUsername}>@{item.username}</Text>
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>
                Niveau {item.level} {getLevelBadge(item.level)}
              </Text>
              <Text style={styles.xpText}>{item.xp} XP</Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <Text style={styles.sessionsText}>
              {item.totalSessionsCompleted || 0}
            </Text>
            <Text style={styles.sessionsLabel}>séances</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'friends') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Ajoutez vos amis !</Text>
          <Text style={styles.emptyDescription}>
            Ajoutez vos amis pour voir un classement personnalisé et comparer vos progrès.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Friends')}
            style={styles.emptyButton}
          >
            Ajouter des amis
          </Button>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Aucun classement disponible</Text>
        <Text style={styles.emptyDescription}>
          Le classement global sera bientôt disponible.
        </Text>
      </View>
    );
  };

  const renderUserStats = () => {
    if (!userStats) return null;
    
    return (
      <Card style={styles.userStatsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Vos statistiques</Text>
          <View style={styles.userStatsContent}>
            <View style={styles.userStatItem}>
              <Text style={styles.userStatNumber}>
                {userPosition || 'N/A'}
              </Text>
              <Text style={styles.userStatLabel}>Position</Text>
            </View>
            <View style={styles.userStatItem}>
              <Text style={styles.userStatNumber}>
                {userStats.level}
              </Text>
              <Text style={styles.userStatLabel}>Niveau</Text>
            </View>
            <View style={styles.userStatItem}>
              <Text style={styles.userStatNumber}>
                {userStats.xp}
              </Text>
              <Text style={styles.userStatLabel}>XP</Text>
            </View>
            <View style={styles.userStatItem}>
              <Text style={styles.userStatNumber}>
                {userStats.totalSessionsCompleted}
              </Text>
              <Text style={styles.userStatLabel}>Séances</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du classement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sélecteur d'onglets */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: 'friends',
              label: 'Amis',
            },
            {
              value: 'global',
              label: 'Global',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Statistiques de l'utilisateur */}
      {renderUserStats()}

      {/* Liste du classement */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
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
  tabsContainer: {
    padding: spacing.md,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  userStatsCard: {
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
  userStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStatItem: {
    alignItems: 'center',
  },
  userStatNumber: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  userStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  leaderboardItem: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 6,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  positionContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 40,
  },
  positionText: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  positionBadge: {
    fontSize: 16,
    marginTop: spacing.xs,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  currentUserAvatar: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  currentUserName: {
    color: colors.primary,
  },
  userUsername: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  xpText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsContainer: {
    alignItems: 'center',
  },
  sessionsText: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
  },
  sessionsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
});

export default LeaderboardScreen;


