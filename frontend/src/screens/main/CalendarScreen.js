import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Surface,
  Divider,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { sessionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../styles/theme';

const CalendarScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const { refreshUser } = useAuth();

  useEffect(() => {
    loadCompletedSessions();
  }, []);

  const loadCompletedSessions = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getCompletedSessions();
      setSessions(response.sessions || []);
      
      // Créer les dates marquées pour le calendrier
      const marked = {};
      response.sessions?.forEach(session => {
        const date = new Date(session.completedAt).toISOString().split('T')[0];
        marked[date] = {
          marked: true,
          dotColor: getSessionColor(session.category),
          selectedColor: getSessionColor(session.category),
          selected: selectedDate === date,
        };
      });
      
      // Marquer la date sélectionnée
      if (marked[selectedDate]) {
        marked[selectedDate].selected = true;
      }
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
      Alert.alert('Erreur', 'Impossible de charger les séances');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompletedSessions();
    await refreshUser(); // Rafraîchir les stats utilisateur
    setRefreshing(false);
  };

  const getSessionColor = (category) => {
    switch (category) {
      case 'Force': return colors.primary;
      case 'Cardio': return colors.error;
      case 'Flexibilité': return colors.success;
      case 'Mixte': return colors.info;
      default: return colors.gray;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'Force': return 'Force';
      case 'Cardio': return 'Cardio';
      case 'Flexibilité': return 'Flexibilité';
      case 'Mixte': return 'Mixte';
      default: return category;
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.gray;
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    
    // Mettre à jour les dates marquées pour sélectionner la nouvelle date
    const updatedMarked = { ...markedDates };
    Object.keys(updatedMarked).forEach(date => {
      updatedMarked[date].selected = date === day.dateString;
    });
    setMarkedDates(updatedMarked);
  };

  const getSessionsForDate = (date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.completedAt).toISOString().split('T')[0];
      return sessionDate === date;
    });
  };

  const handleSessionPress = (session) => {
    navigation.navigate('SessionHistoryDetail', { 
      sessionId: session._id,
      completedSession: session
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteSession = (session) => {
    Alert.alert(
      'Supprimer la séance',
      `Êtes-vous sûr de vouloir supprimer "${session.name}" ? Cette action mettra à jour vos statistiques.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const completionId = session.completionId || session._id;
              await sessionService.deleteCompletedSession(session._id, completionId);
              Alert.alert('Succès', 'Séance supprimée avec succès');
              await loadCompletedSessions();
              await refreshUser();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de supprimer la séance');
            }
          },
        },
      ]
    );
  };

  const handleEditSession = (session) => {
    navigation.navigate('EditCompletedSession', {
      sessionId: session._id,
      completionId: session.completionId,
      completedSession: session
    });
  };

  const renderSession = (session) => (
    <Card key={session._id || session.completionId} style={styles.sessionCard}>
      <Card.Content>
        <TouchableOpacity onPress={() => handleSessionPress(session)} activeOpacity={0.7}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionHeaderLeft}>
              <View style={[styles.categoryIndicator, { backgroundColor: getSessionColor(session.category) }]} />
              <View style={styles.sessionTitleContainer}>
                <Text style={styles.sessionName}>{session.name}</Text>
                <Text style={styles.sessionTime}>{formatTime(session.completedAt)}</Text>
              </View>
            </View>
            <View style={styles.sessionBadges}>
              <Chip
                mode="flat"
                style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(session.difficulty) + '20' }]}
                textStyle={{ color: getDifficultyColor(session.difficulty), fontSize: 11, fontWeight: '600' }}
                compact
              >
                {getDifficultyLabel(session.difficulty)}
              </Chip>
            </View>
          </View>
          
          <View style={styles.sessionInfo}>
            <Surface style={[styles.sessionInfoItem, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.sessionInfoIcon}>⏱️</Text>
              <Text style={styles.sessionInfoText}>
                {session.actualDuration ? `${session.actualDuration}min` : 'N/A'}
              </Text>
            </Surface>
            <Surface style={[styles.sessionInfoItem, { backgroundColor: colors.success + '15' }]}>
              <Text style={styles.sessionInfoIcon}>🏋️</Text>
              <Text style={styles.sessionInfoText}>
                {session.exercises?.length || 0} exercices
              </Text>
            </Surface>
            <Surface style={[styles.sessionInfoItem, { backgroundColor: getSessionColor(session.category) + '15' }]}>
              <Text style={styles.sessionInfoIcon}>📊</Text>
              <Text style={styles.sessionInfoText}>
                {getCategoryLabel(session.category)}
              </Text>
            </Surface>
          </View>

          {session.notes && (
            <Surface style={styles.sessionNotesContainer}>
              <Text style={styles.sessionNotes} numberOfLines={2}>
                💬 {session.notes}
              </Text>
            </Surface>
          )}
        </TouchableOpacity>
        
        <Divider style={styles.divider} />
        
        {/* Boutons d'action */}
        <View style={styles.sessionActions}>
          <Button
            mode="contained-tonal"
            onPress={() => handleEditSession(session)}
            icon="pencil"
            compact
            style={styles.editButton}
            buttonColor={colors.primary + '20'}
            textColor={colors.primary}
          >
            Modifier
          </Button>
          <Button
            mode="contained-tonal"
            onPress={() => handleDeleteSession(session)}
            icon="delete"
            compact
            style={styles.deleteButton}
            buttonColor={colors.error + '20'}
            textColor={colors.error}
          >
            Supprimer
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📅</Text>
      <Text style={styles.emptyTitle}>Aucune séance ce jour</Text>
      <Text style={styles.emptyDescription}>
        Vous n'avez pas complété de séance le {formatDate(selectedDate)}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Sessions')}
        style={styles.emptyButton}
        icon="dumbbell"
        buttonColor={colors.primary}
      >
        Voir mes séances
      </Button>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du calendrier...</Text>
      </View>
    );
  }

  const sessionsForSelectedDate = getSessionsForDate(selectedDate);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calendrier */}
        <Card style={styles.calendarCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Calendrier</Text>
            </View>
            <Calendar
              onDayPress={onDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textLight,
                dotColor: colors.primary,
                selectedDotColor: colors.white,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '600',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '700',
                textDayFontSize: 16,
                textMonthFontSize: 20,
                textDayHeaderFontSize: 13,
                'stylesheet.calendar.header': {
                  week: {
                    marginTop: 5,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  },
                },
              }}
              style={styles.calendar}
            />
          </Card.Content>
        </Card>

        {/* Séances du jour sélectionné */}
        <Card style={styles.sessionsCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🏋️ Séances du {formatDate(selectedDate)}
              </Text>
            </View>
            
            {sessionsForSelectedDate.length > 0 ? (
              sessionsForSelectedDate.map(renderSession)
            ) : (
              renderEmptyState()
            )}
          </Card.Content>
        </Card>

        {/* Statistiques du mois */}
        <Card style={styles.statsCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Statistiques du mois</Text>
            </View>
            <View style={styles.statsGrid}>
              <Surface style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.statEmoji}>💪</Text>
                <Text style={styles.statNumber}>
                  {sessions.filter(session => {
                    const sessionDate = new Date(session.completedAt);
                    const now = new Date();
                    return sessionDate.getMonth() === now.getMonth() && 
                           sessionDate.getFullYear() === now.getFullYear();
                  }).length}
                </Text>
                <Text style={styles.statLabel}>Séances</Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statNumber}>
                  {sessions.filter(session => {
                    const sessionDate = new Date(session.completedAt);
                    const now = new Date();
                    return sessionDate.getMonth() === now.getMonth() && 
                           sessionDate.getFullYear() === now.getFullYear();
                  }).reduce((total, session) => total + (session.actualDuration || 0), 0)}min
                </Text>
                <Text style={styles.statLabel}>Temps total</Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        {/* Espacement en bas */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  calendarCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    fontSize: 20,
  },
  sessionsCard: {
    margin: spacing.md,
    marginTop: 0,
    marginBottom: spacing.sm,
    borderRadius: 16,
  },
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: 16,
  },
  sessionCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  sessionTitleContainer: {
    flex: 1,
  },
  sessionName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  sessionTime: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  difficultyChip: {
    marginLeft: spacing.xs,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sessionInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
  },
  sessionInfoIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  sessionInfoText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
  },
  sessionNotesContainer: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  sessionNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 12,
  },
  divider: {
    marginVertical: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  statNumber: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});

export default CalendarScreen;

