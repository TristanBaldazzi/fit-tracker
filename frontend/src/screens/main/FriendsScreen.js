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
  FAB,
  Searchbar,
  ActivityIndicator,
} from 'react-native-paper';
import { friendService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const FriendsScreen = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, suggestions

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadSuggestions(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendService.getFriends();
      setFriends(response.friends);
    } catch (error) {
      console.error('Erreur lors du chargement des amis:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await friendService.getPendingRequests();
      setPendingRequests(response.requests);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await friendService.getFriendSuggestions();
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendService.sendFriendRequest(userId);
      // Recharger les suggestions
      await loadSuggestions();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      // Recharger les données
      await loadData();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendService.removeFriendRequest(requestId);
      // Recharger les demandes
      await loadPendingRequests();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
    }
  };

  const getLevelBadge = (level) => {
    if (level >= 50) return '🏆';
    if (level >= 25) return '⭐';
    if (level >= 10) return '🔥';
    if (level >= 5) return '💪';
    return '🌱';
  };

  const renderFriend = ({ item }) => (
    <Card style={styles.friendCard} onPress={() => navigation.navigate('UserProfile', { userId: item._id })}>
      <Card.Content style={styles.friendContent}>
        <Avatar.Text
          size={50}
          label={`${item.firstName[0]}${item.lastName[0]}`}
          style={styles.avatar}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>
              Niveau {item.level} {getLevelBadge(item.level)}
            </Text>
            <Text style={styles.xpText}>{item.xp} XP</Text>
          </View>
        </View>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Leaderboard')}
          compact
        >
          Classement
        </Button>
      </Card.Content>
    </Card>
  );

  const renderPendingRequest = ({ item }) => (
    <Card style={styles.requestCard}>
      <Card.Content style={styles.requestContent}>
        <Avatar.Text
          size={50}
          label={`${item.requester.firstName[0]}${item.requester.lastName[0]}`}
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>
            {item.requester.firstName} {item.requester.lastName}
          </Text>
          <Text style={styles.requestUsername}>@{item.requester.username}</Text>
          <Text style={styles.requestDate}>
            Demande envoyée le {new Date(item.requestedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.requestActions}>
          <Button
            mode="contained"
            onPress={() => handleAcceptRequest(item._id)}
            style={styles.acceptButton}
            compact
          >
            Accepter
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleRejectRequest(item._id)}
            style={styles.rejectButton}
            compact
          >
            Refuser
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSuggestion = ({ item }) => (
    <Card style={styles.suggestionCard}>
      <Card.Content style={styles.suggestionContent}>
        <Avatar.Text
          size={50}
          label={`${item.firstName[0]}${item.lastName[0]}`}
          style={styles.avatar}
        />
        <View style={styles.suggestionInfo}>
          <Text style={styles.suggestionName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.suggestionUsername}>@{item.username}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>
              Niveau {item.level} {getLevelBadge(item.level)}
            </Text>
            <Text style={styles.xpText}>{item.xp} XP</Text>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={() => handleSendFriendRequest(item._id)}
          compact
        >
          Ajouter
        </Button>
      </Card.Content>
    </Card>
  );

  const renderTabButton = (tab, label, count) => (
    <Button
      mode={activeTab === tab ? 'contained' : 'outlined'}
      onPress={() => setActiveTab(tab)}
      style={styles.tabButton}
      compact
    >
      {label} {count > 0 && `(${count})`}
    </Button>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'friends':
        return friends.filter(friend =>
          friend.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case 'requests':
        return pendingRequests.filter(request =>
          request.requester.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.requester.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.requester.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case 'suggestions':
        return suggestions.filter(suggestion =>
          suggestion.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          suggestion.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          suggestion.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  const renderEmptyState = () => {
    const emptyMessages = {
      friends: {
        title: 'Aucun ami trouvé',
        description: 'Ajoutez des amis pour partager vos séances et comparer vos progrès',
        action: 'Voir les suggestions'
      },
      requests: {
        title: 'Aucune demande en attente',
        description: 'Vous n\'avez pas de demandes d\'amitié en attente',
        action: 'Voir les suggestions'
      },
      suggestions: {
        title: 'Aucune suggestion',
        description: 'Nous n\'avons pas de suggestions d\'amis pour le moment',
        action: 'Rechercher des utilisateurs'
      }
    };

    const message = emptyMessages[activeTab];

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptyDescription}>{message.description}</Text>
        <Button
          mode="contained"
          onPress={() => setActiveTab('suggestions')}
          style={styles.emptyButton}
        >
          {message.action}
        </Button>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Onglets */}
      <View style={styles.tabsContainer}>
        {renderTabButton('friends', 'Amis', friends.length)}
        {renderTabButton('requests', 'Demandes', pendingRequests.length)}
        {renderTabButton('suggestions', 'Suggestions', suggestions.length)}
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={`Rechercher ${activeTab === 'friends' ? 'des amis' : activeTab === 'requests' ? 'des demandes' : 'des suggestions'}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Liste */}
      <FlatList
        data={getCurrentData()}
        renderItem={({ item }) => {
          switch (activeTab) {
            case 'friends':
              return renderFriend({ item });
            case 'requests':
              return renderPendingRequest({ item });
            case 'suggestions':
              return renderSuggestion({ item });
            default:
              return null;
          }
        }}
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
        icon="trophy"
        onPress={() => navigation.navigate('Leaderboard')}
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
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  searchContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  searchbar: {
    elevation: 2,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  friendCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  requestInfo: {
    flex: 1,
  },
  suggestionInfo: {
    flex: 1,
  },
  friendName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requestName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  suggestionName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  friendUsername: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  requestUsername: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  suggestionUsername: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  requestDate: {
    ...typography.caption,
    color: colors.textLight,
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
  requestActions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  acceptButton: {
    marginBottom: spacing.xs,
    minWidth: 80,
  },
  rejectButton: {
    minWidth: 80,
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

export default FriendsScreen;


