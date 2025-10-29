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
  Chip,
  FAB,
  Searchbar,
  Menu,
  ActivityIndicator,
} from 'react-native-paper';
import { sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';
import { hasCurrentSession, getCurrentSession, getSessionProgress } from '../../services/localStorage';

const SessionsScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState(null);

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'Force', label: 'Force' },
    { key: 'Cardio', label: 'Cardio' },
    { key: 'Flexibilité', label: 'Flexibilité' },
    { key: 'Mixte', label: 'Mixte' },
  ];

  useEffect(() => {
    loadSessions();
    checkForSavedSession();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, selectedFilter]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getSessions();
      setSessions(response.sessions);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    await checkForSavedSession();
    setRefreshing(false);
  };

  const checkForSavedSession = async () => {
    try {
      const hasSession = await hasCurrentSession();
      if (hasSession) {
        const sessionData = await getCurrentSession();
        const progressData = await getSessionProgress();
        
        if (sessionData && progressData) {
          setHasSavedSession(true);
          setSavedSessionData({ sessionData, progressData });
        }
      } else {
        setHasSavedSession(false);
        setSavedSessionData(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la séance sauvegardée:', error);
    }
  };

  const handleResumeSession = async () => {
    if (savedSessionData) {
      navigation.navigate('SessionInProgress', { 
        sessionId: savedSessionData.sessionData._id,
        resumeFromProgress: true,
        savedProgress: savedSessionData.progressData
      });
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Filtrer par catégorie
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(session => session.category === selectedFilter);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.gray;
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

  const renderSession = ({ item }) => (
    <Card style={styles.sessionCard} onPress={() => navigation.navigate('SessionDetail', { sessionId: item._id })}>
      <Card.Content>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionName}>{item.name}</Text>
          <Chip
            mode="outlined"
            compact
            style={[styles.difficultyChip, { borderColor: getDifficultyColor(item.difficulty) }]}
            textStyle={{ color: getDifficultyColor(item.difficulty) }}
          >
            {getDifficultyLabel(item.difficulty)}
          </Chip>
        </View>
        
        {item.description && (
          <Text style={styles.sessionDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée</Text>
            <Text style={styles.detailValue}>{item.estimatedDuration}min</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Exercices</Text>
            <Text style={styles.detailValue}>{item.exercises.length}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Catégorie</Text>
            <Chip
              mode="outlined"
              compact
              style={[styles.categoryChip, { borderColor: getCategoryColor(item.category) }]}
              textStyle={{ color: getCategoryColor(item.category) }}
            >
              {getCategoryLabel(item.category)}
            </Chip>
          </View>
        </View>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} mode="outlined" compact style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Aucune séance trouvée</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery || selectedFilter !== 'all'
          ? 'Essayez de modifier vos critères de recherche'
          : 'Créez votre première séance d\'entraînement'
        }
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('CreateSession')}
        style={styles.emptyButton}
      >
        Créer une séance
      </Button>
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
      {/* Barre de recherche et filtres */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher une séance..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        {/* Bouton Reprendre si séance sauvegardée */}
        {hasSavedSession && savedSessionData && (
          <Button
            mode="contained"
            onPress={handleResumeSession}
            style={styles.resumeButton}
            icon="play"
            buttonColor={colors.success}
          >
            🔄 Reprendre "{savedSessionData.sessionData.name}"
          </Button>
        )}

        <View style={styles.filterRow}>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setFilterMenuVisible(true)}
                style={styles.filterButton}
                icon="filter"
              >
                {filters.find(f => f.key === selectedFilter)?.label}
              </Button>
            }
          >
            {filters.map((filter) => (
              <Menu.Item
                key={filter.key}
                onPress={() => {
                  setSelectedFilter(filter.key);
                  setFilterMenuVisible(false);
                }}
                title={filter.label}
              />
            ))}
          </Menu>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('SessionHistory')}
            style={styles.historyButton}
            icon="history"
          >
            Historique
          </Button>
        </View>
      </View>

      {/* Liste des séances */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Bouton d'action flottant */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateSession')}
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
  searchContainer: {
    padding: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.sm,
  },
  resumeButton: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
  },
  historyButton: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
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
  difficultyChip: {
    alignSelf: 'flex-start',
  },
  sessionDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  categoryChip: {
    alignSelf: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tag: {
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
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default SessionsScreen;
