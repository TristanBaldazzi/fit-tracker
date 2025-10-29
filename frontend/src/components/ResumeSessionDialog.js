import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Dialog,
  Text,
  Button,
  Card,
  Chip,
} from 'react-native-paper';
import { colors, spacing, typography } from '../styles/theme';

const ResumeSessionDialog = ({ visible, onDismiss, onResume, onStartNew, sessionData }) => {
  if (!sessionData) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExerciseProgress = () => {
    if (!sessionData.exercises) return '0/0';
    const completedExercises = sessionData.exercises.filter(ex => 
      ex.sets && ex.sets.some(set => set.completed)
    ).length;
    return `${completedExercises}/${sessionData.exercises.length}`;
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>🔄 Reprendre la séance</Text>
            <Text style={styles.subtitle}>
              Tu as une séance en cours
            </Text>
          </View>

          {/* Informations de la séance */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{sessionData.name}</Text>
            
            <View style={styles.statsContainer}>
              <Chip
                mode="outlined"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                📅 {formatDate(sessionData.lastSaved)}
              </Chip>
              
              <Chip
                mode="outlined"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                💪 {getExerciseProgress()} exercices
              </Chip>
            </View>

            {sessionData.description && (
              <Text style={styles.description}>{sessionData.description}</Text>
            )}
          </View>

          {/* Message d'encouragement */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              💪 Tu peux reprendre là où tu t'es arrêté !
            </Text>
          </View>

          {/* Boutons d'action */}
          <View style={styles.buttonsContainer}>
            <Button
              mode="contained"
              onPress={onResume}
              style={[styles.button, styles.resumeButton]}
              icon="play"
            >
              Reprendre
            </Button>
            
            <Button
              mode="outlined"
              onPress={onStartNew}
              style={[styles.button, styles.newButton]}
              icon="plus"
            >
              Nouvelle séance
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    margin: spacing.lg,
  },
  card: {
    elevation: 8,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sessionInfo: {
    marginBottom: spacing.lg,
  },
  sessionName: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
  },
  chipText: {
    color: colors.primary,
    fontSize: 12,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageContainer: {
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  message: {
    ...typography.body1,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
  resumeButton: {
    backgroundColor: colors.primary,
  },
  newButton: {
    borderColor: colors.primary,
  },
});

export default ResumeSessionDialog;


