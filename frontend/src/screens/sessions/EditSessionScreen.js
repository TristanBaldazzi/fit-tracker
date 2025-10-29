import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  List,
  Divider,
  ActivityIndicator,
  Modal,
  Portal,
} from 'react-native-paper';
import { sessionService, exerciseService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const EditSessionScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'medium',
    category: 'Force',
    estimatedDuration: 30,
    tags: [],
  });

  // Exercices disponibles
  const [availableExercises, setAvailableExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadSession();
    loadExercises();
    loadCategories();
  }, [sessionId]);

  useEffect(() => {
    filterExercises();
  }, [availableExercises, searchQuery, selectedCategory]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getSession(sessionId);
      const sessionData = response.session;
      
      setSession(sessionData);
      setFormData({
        name: sessionData.name || '',
        description: sessionData.description || '',
        difficulty: sessionData.difficulty || 'medium',
        category: sessionData.category || 'Force',
        estimatedDuration: sessionData.estimatedDuration || 30,
        tags: sessionData.tags || [],
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      setIsLoadingExercises(true);
      const response = await exerciseService.getExercises();
      console.log('🏋️ Réponse exercices:', response);
      if (response && response.exercises) {
        console.log('🏋️ Exercices chargés:', response.exercises.length, 'exercices');
        setAvailableExercises(response.exercises);
        setFilteredExercises(response.exercises);
      } else {
        console.warn('Aucun exercice trouvé dans la réponse');
        setAvailableExercises([]);
        setFilteredExercises([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
      setAvailableExercises([]);
      setFilteredExercises([]);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await exerciseService.getCategories();
      console.log('📋 Réponse catégories:', response);
      if (response && response.categories) {
        console.log('📋 Catégories chargées:', response.categories);
        setCategories(response.categories);
      } else {
        console.warn('Aucune catégorie trouvée dans la réponse');
        setCategories([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    }
  };

  const filterExercises = () => {
    let filtered = [...availableExercises];
    
    // Filtrer par catégorie
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(exercise =>
        (exercise.name && exercise.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exercise.description && exercise.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exercise.muscleGroups && exercise.muscleGroups.some(group => 
          group && group.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }
    
    setFilteredExercises(filtered);
  };

  const capitalizeFirstLetter = (string) => {
    if (!string || typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (formData.tags.length < 5) {
      const newTag = `Tag ${formData.tags.length + 1}`;
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddExercise = (exercise) => {
    const newExercise = {
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      sets: [
        {
          reps: 10,
          weight: 0,
          duration: 0,
          distance: 0,
          restTime: 60,
          notes: '',
          completed: false,
        }
      ],
      order: session.exercises.length + 1,
      isCompleted: false,
    };

    setSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const handleRemoveExercise = (index) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleEditExercise = (exercise, exerciseIndex) => {
    setEditingExercise({ ...exercise, index: exerciseIndex });
    setIsEditingExercise(true);
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

  const handleSaveExercise = () => {
    if (!editingExercise || !session) return;
    
    const updatedSession = { ...session };
    updatedSession.exercises[editingExercise.index] = {
      name: editingExercise.name,
      category: editingExercise.category,
      muscleGroups: editingExercise.muscleGroups,
      sets: editingExercise.sets,
      order: editingExercise.order,
      isCompleted: editingExercise.isCompleted
    };
    
    setSession(updatedSession);
    setIsEditingExercise(false);
    setEditingExercise(null);
  };

  const handleCancelEdit = () => {
    setIsEditingExercise(false);
    setEditingExercise(null);
  };


  const handleSaveSession = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la séance est requis');
      return;
    }

    if (session.exercises.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un exercice à la séance');
      return;
    }

    try {
      setIsSaving(true);
      
      const updatedSession = {
        ...session,
        name: formData.name.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        category: formData.category,
        estimatedDuration: parseInt(formData.estimatedDuration) || 30,
        tags: formData.tags,
        exercises: session.exercises
      };

      await sessionService.updateSession(sessionId, updatedSession);
      
      Alert.alert('Succès', 'Séance modifiée avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la séance');
    } finally {
      setIsSaving(false);
    }
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
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Retour
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Informations de base */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Informations de base</Text>
            
            <TextInput
              label="Nom de la séance *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />
            
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="Durée estimée (min)"
                  value={formData.estimatedDuration.toString()}
                  onChangeText={(value) => handleInputChange('estimatedDuration', value)}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tags */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onClose={() => handleRemoveTag(index)}
                  style={styles.tag}
                >
                  {tag}
                </Chip>
              ))}
              {formData.tags.length < 5 && (
                <Button
                  mode="outlined"
                  onPress={handleAddTag}
                  style={styles.addTagButton}
                  compact
                >
                  + Tag
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Exercices de la séance */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Exercices de la séance</Text>
            {session.exercises.length > 0 ? (
              session.exercises.map((exercise, index) => (
                <View key={index}>
                  <List.Item
                    title={exercise.name}
                    description={`${exercise.sets.length} séries • ${exercise.category}`}
                    left={(props) => <List.Icon {...props} icon="dumbbell" />}
                    right={() => (
                      <View style={styles.exerciseActions}>
                        <Button
                          mode="text"
                          onPress={() => handleEditExercise(exercise, index)}
                          compact
                          textColor={colors.primary}
                        >
                          Modifier
                        </Button>
                        <Button
                          mode="text"
                          onPress={() => handleRemoveExercise(index)}
                          compact
                          textColor={colors.error}
                          icon="delete"
                        />
                      </View>
                    )}
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

        {/* Exercices disponibles */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Exercices disponibles</Text>
            
            {/* Barre de recherche */}
            <TextInput
              label="Rechercher un exercice"
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="magnify" />}
              theme={{ colors: { primary: colors.primary } }}
            />
            
            {/* Filtres par catégorie */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
              <Chip
                mode={selectedCategory === 'all' ? 'flat' : 'outlined'}
                selected={selectedCategory === 'all'}
                onPress={() => setSelectedCategory('all')}
                style={styles.categoryChip}
              >
                Tous
              </Chip>
              {categories.map((category, index) => (
                <Chip
                  key={index}
                  mode={selectedCategory === category ? 'flat' : 'outlined'}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.categoryChip}
                >
                  {capitalizeFirstLetter(category)}
                </Chip>
              ))}
            </ScrollView>
            
            {/* Liste des exercices */}
            <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
              {isLoadingExercises ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Chargement des exercices...</Text>
                </View>
              ) : filteredExercises.length > 0 ? (
                filteredExercises.map((exercise, index) => (
                  <List.Item
                    key={index}
                    title={exercise.name || 'Exercice sans nom'}
                    description={`${exercise.description || 'Aucune description'} • ${capitalizeFirstLetter(exercise.category)}`}
                    left={(props) => <List.Icon {...props} icon="plus-circle" />}
                    onPress={() => handleAddExercise(exercise)}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Aucun exercice trouvé</Text>
                </View>
              )}
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Espacement en bas */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={isSaving}
        >
          Annuler
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveSession}
          style={styles.saveButton}
          loading={isSaving}
          disabled={isSaving}
        >
          Sauvegarder
        </Button>
      </View>

      {/* Modal d'édition des séries */}
      <Portal>
        <Modal
          visible={isEditingExercise}
          onDismiss={handleCancelEdit}
          contentContainerStyle={styles.modalContainer}
        >
          {editingExercise && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier {editingExercise.name}</Text>
                <Button
                  mode="text"
                  onPress={handleCancelEdit}
                  icon="close"
                  textColor={colors.textSecondary}
                  compact
                />
              </View>
              
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
              
              <Button
                mode="outlined"
                onPress={handleAddSet}
                style={styles.addSetButton}
                icon="plus-circle"
              >
                Ajouter une série
              </Button>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleCancelEdit}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  Annuler
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveExercise}
                  style={[styles.modalButton, styles.saveButton]}
                  icon="check"
                >
                  Sauvegarder
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
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
    paddingVertical: spacing.lg,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  card: {
    margin: spacing.md,
    elevation: 4,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    marginBottom: spacing.sm,
  },
  addTagButton: {
    marginBottom: spacing.sm,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  categoryFilter: {
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  exercisesList: {
    maxHeight: 300,
    flexGrow: 0,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  // Styles pour le modal
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '85%',
    elevation: 8,
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
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
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    height: 44,
  },
});

export default EditSessionScreen;
