import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  List,
  Divider,
  ActivityIndicator,
  Modal,
  Portal,
  TextInput,
} from 'react-native-paper';
import { sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const SessionDetailScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getSession(sessionId);
      setSession(response.session);
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
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

  const handleStartSession = () => {
    navigation.navigate('SessionInProgress', { sessionId: sessionId });
  };

  const handleEditSession = () => {
    navigation.navigate('EditSession', { sessionId: sessionId });
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Supprimer la séance',
      'Êtes-vous sûr de vouloir supprimer cette séance ?',
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
              await sessionService.deleteSession(sessionId);
              Alert.alert('Succès', 'Séance supprimée avec succès');
              navigation.goBack();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la séance');
            }
          },
        },
      ]
    );
  };

  const handleCopySession = async () => {
    try {
      const result = await sessionService.copySession(sessionId);
      
      let message = 'Séance copiée avec succès !';
      if (result.copiedExercises && result.copiedExercises.length > 0) {
        message += `\n\nExercices personnalisés copiés :\n${result.copiedExercises.map(ex => `• ${ex.originalName} → ${ex.copiedName}`).join('\n')}`;
      }
      
      Alert.alert('Succès', message);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      Alert.alert('Erreur', 'Impossible de copier la séance');
    }
  };

  const handleEditExercise = (exercise, exerciseIndex) => {
    setEditingExercise({ ...exercise, index: exerciseIndex });
    setIsEditing(true);
  };

  const handleUpdateSet = (setIndex, field, value) => {
    if (!editingExercise) return;
    
    const updatedSets = [...editingExercise.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value
    };
    
    setEditingExercise({
      ...editingExercise,
      sets: updatedSets
    });
  };

  const handleAddSet = () => {
    if (!editingExercise) return;
    
    const newSet = {
      reps: 10,
      weight: 0,
      restTime: 60,
      completed: false
    };
    
    setEditingExercise({
      ...editingExercise,
      sets: [...editingExercise.sets, newSet]
    });
  };

  const handleRemoveSet = (setIndex) => {
    if (!editingExercise || editingExercise.sets.length <= 1) return;
    
    const updatedSets = editingExercise.sets.filter((_, index) => index !== setIndex);
    setEditingExercise({
      ...editingExercise,
      sets: updatedSets
    });
  };

  const handleSaveExercise = async () => {
    if (!editingExercise || !session) return;
    
    try {
      setIsSaving(true);
      
      // Mettre à jour la séance avec l'exercice modifié
      const updatedSession = { ...session };
      updatedSession.exercises[editingExercise.index] = {
        name: editingExercise.name,
        category: editingExercise.category,
        muscleGroups: editingExercise.muscleGroups,
        sets: editingExercise.sets,
        order: editingExercise.order,
        isCompleted: editingExercise.isCompleted
      };
      
      // Sauvegarder via l'API
      await sessionService.updateSession(sessionId, updatedSession);
      
      // Mettre à jour l'état local
      setSession(updatedSession);
      setIsEditing(false);
      setEditingExercise(null);
      
      Alert.alert('Succès', 'Exercice modifié avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingExercise(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de la séance...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Séance non trouvée</Text>
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
      {/* En-tête de la séance */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Text style={styles.sessionName}>{session.name}</Text>
            <View style={styles.badgesContainer}>
              <Chip
                mode="outlined"
                style={[styles.difficultyChip, { borderColor: getDifficultyColor(session.difficulty) }]}
                textStyle={{ color: getDifficultyColor(session.difficulty) }}
              >
                {getDifficultyLabel(session.difficulty)}
              </Chip>
              <Chip
                mode="outlined"
                style={[styles.categoryChip, { borderColor: getCategoryColor(session.category) }]}
                textStyle={{ color: getCategoryColor(session.category) }}
              >
                {getCategoryLabel(session.category)}
              </Chip>
            </View>
          </View>
          
          {session.description && (
            <Text style={styles.sessionDescription}>{session.description}</Text>
          )}
          
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{session.estimatedDuration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{session.exercises.length}</Text>
              <Text style={styles.statLabel}>Exercices</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{session.completions}</Text>
              <Text style={styles.statLabel}>Complétions</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <Card style={styles.tagsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {session.tags.map((tag, index) => (
                <Chip key={index} mode="outlined" style={styles.tag}>
                  {tag}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          {session.isOwner ? (
            <>
              <Button
                mode="contained"
                onPress={handleStartSession}
                style={styles.actionButton}
                icon="play"
              >
                Commencer la séance
              </Button>
              <Button
                mode="outlined"
                onPress={handleEditSession}
                style={styles.actionButton}
                icon="pencil"
              >
                Modifier la séance
              </Button>
              <Button
                mode="outlined"
                onPress={handleDeleteSession}
                style={styles.actionButton}
                icon="delete"
                textColor={colors.error}
              >
                Supprimer la séance
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handleStartSession}
                style={styles.actionButton}
                icon="play"
              >
                Commencer cette séance
              </Button>
              <Button
                mode="outlined"
                onPress={handleCopySession}
                style={styles.actionButton}
                icon="content-copy"
              >
                Copier la séance
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Exercices de la séance */}
      <Card style={styles.exercisesCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Exercices</Text>
          {session.exercises.length > 0 ? (
            session.exercises.map((exercise, index) => (
              <View key={index}>
                <List.Item
                  title={exercise.name}
                  description={`${exercise.sets.length} séries • ${exercise.category}`}
                  left={(props) => <List.Icon {...props} icon="dumbbell" />}
                  right={() => (
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseSets}>
                        {exercise.sets.length} séries
                      </Text>
                      <Button
                        mode="text"
                        onPress={() => handleEditExercise(exercise, index)}
                        compact
                        textColor={colors.primary}
                      >
                        Modifier
                      </Button>
                    </View>
                  )}
                  onPress={() => handleEditExercise(exercise, index)}
                />
                {index < session.exercises.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun exercice dans cette séance</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Informations du créateur - seulement si ce n'est pas l'utilisateur actuel */}
      {session.creator && !session.isOwner && (
        <Card style={styles.creatorCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Créateur</Text>
            <List.Item
              title={`${session.creator.firstName} ${session.creator.lastName}`}
              description={`@${session.creator.username} • Niveau ${session.creator.level}`}
              left={(props) => <List.Icon {...props} icon="account" />}
              onPress={() => navigation.navigate('UserProfile', { userId: session.creator._id })}
            />
          </Card.Content>
        </Card>
      )}

      {/* Espacement en bas */}
      <View style={styles.bottomSpacing} />

      {/* Modal d'édition des séries */}
      <Portal>
        <Modal
          visible={isEditing}
          onDismiss={handleCancelEdit}
          contentContainerStyle={styles.modalContainer}
        >
          {editingExercise && (
            <View style={styles.modalContent}>
               {/* Bouton de fermeture */}
               <View style={styles.modalHeader}>
                 <Button
                   mode="text"
                   onPress={handleCancelEdit}
                   icon="close"
                   textColor={colors.textSecondary}
                   compact
                   style={styles.closeButton}
                 />
               </View>
              
              {/* Liste des séries avec design amélioré */}
              <ScrollView style={styles.setsContainer} showsVerticalScrollIndicator={false}>
                {editingExercise.sets.map((set, setIndex) => (
                  <Card key={setIndex} style={styles.setCard} elevation={2}>
                    <Card.Content style={styles.setCardContent}>
                      <View style={styles.setHeader}>
                        <View style={styles.setNumber}>
                          <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                        </View>
                        <Text style={styles.setLabel}>Série {setIndex + 1}</Text>
                        {editingExercise.sets.length > 1 && (
                          <Button
                            mode="text"
                            onPress={() => handleRemoveSet(setIndex)}
                            compact
                            textColor={colors.error}
                            icon="delete-outline"
                            style={styles.removeButton}
                          />
                        )}
                      </View>
                      
                      <View style={styles.setInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Répétitions</Text>
                          <TextInput
                            value={set.reps.toString()}
                            onChangeText={(value) => handleUpdateSet(setIndex, 'reps', parseInt(value) || 0)}
                            mode="outlined"
                            keyboardType="numeric"
                            style={styles.setInput}
                            dense
                            theme={{ colors: { primary: colors.primary } }}
                          />
                        </View>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Poids (kg)</Text>
                          <TextInput
                            value={set.weight.toString()}
                            onChangeText={(value) => handleUpdateSet(setIndex, 'weight', parseFloat(value) || 0)}
                            mode="outlined"
                            keyboardType="numeric"
                            style={styles.setInput}
                            dense
                            theme={{ colors: { primary: colors.primary } }}
                          />
                        </View>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Repos (sec)</Text>
                          <TextInput
                            value={set.restTime.toString()}
                            onChangeText={(value) => handleUpdateSet(setIndex, 'restTime', parseInt(value) || 0)}
                            mode="outlined"
                            keyboardType="numeric"
                            style={styles.setInput}
                            dense
                            theme={{ colors: { primary: colors.primary } }}
                          />
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
              
              {/* Bouton d'ajout avec design amélioré */}
              <Button
                mode="outlined"
                onPress={handleAddSet}
                style={styles.addSetButton}
                icon="plus-circle"
                labelStyle={styles.addSetButtonLabel}
              >
                Ajouter une série
              </Button>
              
              {/* Actions avec design amélioré */}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleCancelEdit}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={isSaving}
                  labelStyle={styles.cancelButtonLabel}
                >
                  Annuler
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveExercise}
                  style={[styles.modalButton, styles.saveButton]}
                  disabled={isSaving}
                  loading={isSaving}
                  labelStyle={styles.saveButtonLabel}
                  icon="check"
                >
                  Sauvegarder
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
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
  headerCard: {
    margin: spacing.md,
    elevation: 4,
  },
  headerContent: {
    marginBottom: spacing.md,
  },
  sessionName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  difficultyChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  sessionDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tagsCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  exercisesCard: {
    margin: spacing.md,
    marginTop: 0,
    elevation: 4,
  },
  creatorCard: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  exerciseDetails: {
    alignItems: 'flex-end',
  },
  exerciseSets: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  // Styles pour le modal d'édition - Design clean
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    padding: 0,
    zIndex: 1000,
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  setsContainer: {
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  setCard: {
    marginBottom: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
    elevation: 1,
  },
  setCardContent: {
    padding: spacing.md,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  setNumberText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  setLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    marginLeft: 'auto',
  },
  setInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontSize: 11,
  },
  setInput: {
    backgroundColor: colors.surface,
    height: 36,
  },
  addSetButton: {
    marginBottom: spacing.lg,
    borderRadius: 8,
  },
  addSetButtonLabel: {
    ...typography.body2,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    zIndex: 1001,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    height: 44,
  },
  cancelButton: {
    borderColor: colors.textSecondary,
  },
  cancelButtonLabel: {
    ...typography.body2,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonLabel: {
    ...typography.body2,
    fontWeight: '500',
    color: 'white',
  },
});

export default SessionDetailScreen;
