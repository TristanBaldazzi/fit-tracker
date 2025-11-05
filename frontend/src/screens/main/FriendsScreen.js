import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
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
  Divider,
} from 'react-native-paper';
import { friendService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';

const FriendsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, suggestions
  const [comparisonModal, setComparisonModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

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

  const handleFriendPress = (friend) => {
    setSelectedFriend(friend);
    setComparisonModal(true);
  };

  const closeComparisonModal = () => {
    setComparisonModal(false);
    setSelectedFriend(null);
  };

  const getComparisonResult = (myValue, theirValue, type) => {
    const diff = myValue - theirValue;
    if (diff === 0) {
      return <Text style={styles.comparisonEqual}>Égalité</Text>;
    }
    
    const isWinner = diff > 0;
    const difference = Math.abs(diff);
    
    if (type === 'level' || type === 'xp' || type === 'sessions') {
      return (
        <Text style={[styles.comparisonResult, isWinner ? styles.comparisonWinner : styles.comparisonLoser]}>
          {isWinner ? '✅' : '❌'} {difference} {isWinner ? 'de plus' : 'de moins'}
        </Text>
      );
    }
    
    return null;
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleFriendPress(item)}
    >
      <Card style={styles.friendCard}>
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
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('UserProfile', { userId: item._id });
            }}
            compact
          >
            Profil
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
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

      {/* Modal de comparaison */}
      <Modal
        visible={comparisonModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeComparisonModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Card style={styles.comparisonCard}>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Comparaison</Text>
                  <Button
                    mode="text"
                    onPress={closeComparisonModal}
                    icon="close"
                    compact
                  >
                    Fermer
                  </Button>
                </View>

                {selectedFriend && user && (
                  <ScrollView style={styles.comparisonScrollView} showsVerticalScrollIndicator={false}>
                    {/* Profils */}
                    <View style={styles.comparisonProfiles}>
                      {/* Utilisateur actuel */}
                      <View style={styles.comparisonUser}>
                        <Avatar.Text
                          size={60}
                          label={`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                          style={styles.comparisonAvatar}
                        />
                        <Text style={styles.comparisonName}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <Text style={styles.comparisonUsername}>@{user.username}</Text>
                      </View>

                      <Text style={styles.vsText}>VS</Text>

                      {/* Ami sélectionné */}
                      <View style={styles.comparisonUser}>
                        <Avatar.Text
                          size={60}
                          label={`${selectedFriend.firstName[0]}${selectedFriend.lastName[0]}`}
                          style={styles.comparisonAvatar}
                        />
                        <Text style={styles.comparisonName}>
                          {selectedFriend.firstName} {selectedFriend.lastName}
                        </Text>
                        <Text style={styles.comparisonUsername}>@{selectedFriend.username}</Text>
                      </View>
                    </View>

                    <Divider style={styles.comparisonDivider} />

                    {/* Statistiques comparées */}
                    <View style={styles.comparisonStats}>
                      {/* Niveau */}
                      <View style={styles.comparisonStatCard}>
                        <Text style={styles.comparisonStatLabel}>⭐ Niveau</Text>
                        <View style={styles.comparisonStatValues}>
                          <View style={styles.comparisonStatBox}>
                            <Text style={[styles.comparisonStatValue, styles.myValue]}>
                              {user.level || 1}
                            </Text>
                          </View>
                          <Text style={styles.comparisonStatVS}>VS</Text>
                          <View style={styles.comparisonStatBox}>
                            <Text style={[styles.comparisonStatValue, styles.theirValue]}>
                              {selectedFriend.level || 1}
                            </Text>
                          </View>
                        </View>
                        {getComparisonResult(user.level || 1, selectedFriend.level || 1, 'level')}
                      </View>

                      {/* XP */}
                      <View style={styles.comparisonStatCard}>
                        <Text style={styles.comparisonStatLabel}>⚡ XP</Text>
                        <View style={styles.comparisonStatValues}>
                          <View style={styles.comparisonStatBox}>
                            <Text style={[styles.comparisonStatValue, styles.myValue]}>
                              {user.xp || 0}
                            </Text>
                          </View>
                          <Text style={styles.comparisonStatVS}>VS</Text>
                          <View style={styles.comparisonStatBox}>
                            <Text style={[styles.comparisonStatValue, styles.theirValue]}>
                              {selectedFriend.xp || 0}
                            </Text>
                          </View>
                        </View>
                        {getComparisonResult(user.xp || 0, selectedFriend.xp || 0, 'xp')}
                      </View>

                      {/* Séances */}
                      <View style={styles.comparisonStatCard}>
                        <Text style={styles.comparisonStatLabel}>🏋️ Séances</Text>
                        <View style={styles.comparisonStatValues}>
                          <View style={styles.comparisonStatBox}>
                            <Text style={[styles.comparisonStatValue, styles.myValue]}>
                              {user.totalSessionsCompleted || 0}
                            </Text>
                          </View>
                          <Text style={styles.comparisonStatVS}>VS</Text>
                          <View style={styles.comparisonStatBox}>
                            <Text style={[styles.comparisonStatValue, styles.theirValue]}>
                              {selectedFriend.totalSessionsCompleted || 0}
                            </Text>
                          </View>
                        </View>
                        {getComparisonResult(user.totalSessionsCompleted || 0, selectedFriend.totalSessionsCompleted || 0, 'sessions')}
                      </View>
                    </View>
                  </ScrollView>
                )}
              </Card.Content>
            </Card>
          </View>
        </View>
      </Modal>
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
  // Modal de comparaison
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  comparisonCard: {
    borderRadius: 20,
    elevation: 8,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  comparisonScrollView: {
    maxHeight: 500,
  },
  comparisonProfiles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  comparisonUser: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonAvatar: {
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  comparisonName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  comparisonUsername: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vsText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
    marginHorizontal: spacing.md,
  },
  comparisonDivider: {
    marginVertical: spacing.md,
  },
  comparisonStats: {
    gap: spacing.md,
  },
  comparisonStatCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  comparisonStatLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    fontSize: 16,
  },
  comparisonStatValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  comparisonStatBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comparisonStatValue: {
    ...typography.h3,
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 24,
  },
  myValue: {
    color: colors.primary,
  },
  theirValue: {
    color: colors.secondary,
  },
  comparisonStatVS: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
    fontSize: 14,
  },
  comparisonResult: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  comparisonWinner: {
    color: colors.success,
  },
  comparisonLoser: {
    color: colors.error,
  },
  comparisonEqual: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});

export default FriendsScreen;


