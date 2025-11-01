import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
import { Calendar } from 'react-native-calendars';
import { sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const CalendarScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});

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

  const renderSession = (session) => (
    <TouchableOpacity 
      key={session._id} 
      onPress={() => handleSessionPress(session)}
    >
      <Card style={styles.sessionCard}>
        <Card.Content>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionName}>{session.name}</Text>
            <View style={styles.sessionBadges}>
              <Chip
                mode="outlined"
                style={[styles.difficultyChip, { borderColor: getDifficultyColor(session.difficulty) }]}
                textStyle={{ color: getDifficultyColor(session.difficulty) }}
                compact
              >
                {getDifficultyLabel(session.difficulty)}
              </Chip>
              <Chip
                mode="outlined"
                style={[styles.categoryChip, { borderColor: getSessionColor(session.category) }]}
                textStyle={{ color: getSessionColor(session.category) }}
                compact
              >
                {getCategoryLabel(session.category)}
              </Chip>
            </View>
          </View>
          
          <View style={styles.sessionInfo}>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailIcon}>⏱️</Text>
              <Text style={styles.sessionDetailText}>
                {session.actualDuration ? `${session.actualDuration}min` : 'Durée non enregistrée'}
              </Text>
            </View>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailIcon}>🏋️</Text>
              <Text style={styles.sessionDetailText}>
                {session.exercises?.length || 0} exercices
              </Text>
            </View>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailIcon}>🕐</Text>
              <Text style={styles.sessionDetailText}>
                {formatTime(session.completedAt)}
              </Text>
            </View>
          </View>

          {session.notes && (
            <Text style={styles.sessionNotes} numberOfLines={2}>
              💬 {session.notes}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Aucune séance ce jour</Text>
      <Text style={styles.emptyDescription}>
        Vous n'avez pas complété de séance le {formatDate(selectedDate)}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Sessions')}
        style={styles.emptyButton}
        icon="dumbbell"
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
      <ScrollView style={styles.scrollView}>
        {/* Calendrier */}
        <Card style={styles.calendarCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Calendrier des séances</Text>
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
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </Card.Content>
        </Card>

        {/* Séances du jour sélectionné */}
        <Card style={styles.sessionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Séances du {formatDate(selectedDate)}
            </Text>
            
            {sessionsForSelectedDate.length > 0 ? (
              sessionsForSelectedDate.map(renderSession)
            ) : (
              renderEmptyState()
            )}
          </Card.Content>
        </Card>

        {/* Statistiques du mois */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistiques du mois</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {sessions.filter(session => {
                    const sessionDate = new Date(session.completedAt);
                    const now = new Date();
                    return sessionDate.getMonth() === now.getMonth() && 
                           sessionDate.getFullYear() === now.getFullYear();
                  }).length}
                </Text>
                <Text style={styles.statLabel}>Séances ce mois</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {sessions.filter(session => {
                    const sessionDate = new Date(session.completedAt);
                    const now = new Date();
                    return sessionDate.getMonth() === now.getMonth() && 
                           sessionDate.getFullYear() === now.getFullYear();
                  }).reduce((total, session) => total + (session.actualDuration || 0), 0)}min
                </Text>
                <Text style={styles.statLabel}>Temps total</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Espacement en bas */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bouton d'action flottant */}
      <FAB
        style={styles.fab}
        icon="dumbbell"
        onPress={() => navigation.navigate('Sessions')}
      />
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
    elevation: 4,
  },
  calendar: {
    borderRadius: 8,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sessionsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  sessionCard: {
    marginBottom: spacing.md,
    elevation: 2,
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
  sessionNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  emptyState: {
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
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default CalendarScreen;

