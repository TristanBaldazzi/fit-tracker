import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { userService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const UserSessionsScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getUserSessions(userId, 20);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
      Alert.alert('Erreur', 'Impossible de charger les séances');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleViewSession = (session) => {
    navigation.navigate('UserSessionDetail', {
      sessionId: session._id,
      userId,
      userName,
      session
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Force': return colors.primary;
      case 'Cardio': return colors.error;
      case 'Flexibilité': return colors.success;
      case 'Mixte': return colors.info;
      default: return colors.gray;
    }
  };

  const renderSession = ({ item }) => (
    <TouchableOpacity onPress={() => handleViewSession(item)}>
      <Card style={styles.sessionCard}>
        <Card.Content>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionName}>{item.name}</Text>
            <View style={styles.sessionBadges}>
              <Chip
                mode="outlined"
                style={[styles.difficultyChip, { borderColor: getDifficultyColor(item.difficulty) }]}
                textStyle={{ color: getDifficultyColor(item.difficulty) }}
                compact
              >
                {getDifficultyLabel(item.difficulty)}
              </Chip>
              <Chip
                mode="outlined"
                style={[styles.categoryChip, { borderColor: getCategoryColor(item.category) }]}
                textStyle={{ color: getCategoryColor(item.category) }}
                compact
              >
                {item.category}
              </Chip>
            </View>
          </View>
          
          {item.description && (
            <Text style={styles.sessionDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.sessionInfo}>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailIcon}>⏱️</Text>
              <Text style={styles.sessionDetailText}>{item.estimatedDuration}min</Text>
            </View>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailIcon}>🏋️</Text>
              <Text style={styles.sessionDetailText}>{item.exercises.length} exercices</Text>
            </View>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailIcon}>📅</Text>
              <Text style={styles.sessionDetailText}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={styles.tagChip}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Aucune séance publique</Text>
      <Text style={styles.emptyDescription}>
        {userName} n'a pas encore partagé de séances publiques
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des séances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
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
  listContainer: {
    padding: spacing.md,
  },
  sessionCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sessionName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  difficultyChip: {
    marginLeft: spacing.xs,
  },
  categoryChip: {
    marginLeft: spacing.xs,
  },
  sessionDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionDetailIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  sessionDetailText: {
    ...typography.caption,
    color: colors.textSecondary,
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
    paddingHorizontal: spacing.lg,
  },
});

export default UserSessionsScreen;
