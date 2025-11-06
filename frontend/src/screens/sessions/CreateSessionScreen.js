import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  List,
  Divider,
  Searchbar,
  IconButton,
} from 'react-native-paper';
import { sessionService, exerciseService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const CreateSessionScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'medium',
    category: 'Mixte',
    estimatedDuration: 60,
    exercises: [],
  });
  const [availableExercises, setAvailableExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState([]);
  
  // Formulaire de création d'exercice
  const [exerciseFormData, setExerciseFormData] = useState({
    name: '',
    description: '',
    category: '',
    muscleGroups: [],
  });

  const difficulties = [
    { key: 'easy', label: 'Facile' },
    { key: 'medium', label: 'Moyen' },
    { key: 'hard', label: 'Difficile' },
  ];

  const sessionCategories = [
    { key: 'Force', label: 'Force' },
    { key: 'Cardio', label: 'Cardio' },
    { key: 'Flexibilité', label: 'Flexibilité' },
    { key: 'Mixte', label: 'Mixte' },
  ];


  React.useEffect(() => {
    loadExercises();
    loadCategories();
    loadMuscleGroups();
  }, []);

  // Recharger les exercices quand le modal se ferme (en cas de création)
  React.useEffect(() => {
    if (!showCreateExerciseModal) {
      loadExercises();
    }
  }, [showCreateExerciseModal]);

  React.useEffect(() => {
    filterExercises();
  }, [availableExercises, searchQuery, selectedCategory]);

  const filterExercises = () => {
    let filtered = [...availableExercises];
    
    // Filtrer par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroups.some(group => 
          group.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    setFilteredExercises(filtered);
  };

  const loadExercises = async () => {
    try {
      setIsLoadingExercises(true);
      console.log('🏋️ [CreateSession] Chargement des exercices...');
      const response = await exerciseService.getExercises();
      console.log('🏋️ [CreateSession] Réponse reçue:', {
        hasResponse: !!response,
        hasExercises: !!response?.exercises,
        exercisesCount: response?.exercises?.length || 0
      });
      
      if (response && response.exercises) {
        console.log('✅ [CreateSession]', response.exercises.length, 'exercices chargés');
        setAvailableExercises(response.exercises);
        setFilteredExercises(response.exercises);
      } else {
        console.warn('⚠️ [CreateSession] Aucun exercice dans la réponse');
        setAvailableExercises([]);
        setFilteredExercises([]);
      }
    } catch (error) {
      console.error('❌ [CreateSession] Erreur lors du chargement des exercices:', error);
      console.error('Erreur détails:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert(
        'Erreur',
        'Impossible de charger les exercices. Veuillez réessayer.'
      );
      setAvailableExercises([]);
      setFilteredExercises([]);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await exerciseService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadMuscleGroups = async () => {
    try {
      const response = await exerciseService.getMuscleGroups();
      setMuscleGroups(response.muscleGroups || []);
    } catch (error) {
      console.error('Erreur lors du chargement des groupes musculaires:', error);
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string || typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Gestion du formulaire de création d'exercice
  const handleExerciseInputChange = (field, value) => {
    setExerciseFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExerciseCategorySelect = (category) => {
    setExerciseFormData(prev => ({
      ...prev,
      category: category
    }));
  };

  const handleExerciseMuscleGroupToggle = (muscleGroup) => {
    setExerciseFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscleGroup)
        ? prev.muscleGroups.filter(group => group !== muscleGroup)
        : [...prev.muscleGroups, muscleGroup]
    }));
  };

  const validateExerciseForm = () => {
    if (!exerciseFormData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'exercice est requis');
      return false;
    }

    if (exerciseFormData.name.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de l\'exercice doit contenir au moins 2 caractères');
      return false;
    }

    if (!exerciseFormData.category) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return false;
    }

    return true;
  };

  const handleCreateExercise = async () => {
    if (!validateExerciseForm()) return;

    try {
      setIsCreatingExercise(true);
      
      const exerciseData = {
        name: exerciseFormData.name.trim(),
        description: exerciseFormData.description.trim() || undefined,
        category: exerciseFormData.category,
        muscleGroups: exerciseFormData.muscleGroups,
      };

      await exerciseService.createExercise(exerciseData);
      
      // Réinitialiser le formulaire
      setExerciseFormData({
        name: '',
        description: '',
        category: '',
        muscleGroups: [],
      });
      
      // Fermer le modal
      setShowCreateExerciseModal(false);
      
      // Recharger les exercices
      await loadExercises();
      
      Alert.alert('Succès', 'Exercice créé avec succès ! Il est maintenant disponible dans la liste.');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'exercice');
    } finally {
      setIsCreatingExercise(false);
    }
  };

  const handleCloseCreateExerciseModal = () => {
    setShowCreateExerciseModal(false);
    // Réinitialiser le formulaire
    setExerciseFormData({
      name: '',
      description: '',
      category: '',
      muscleGroups: [],
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      order: formData.exercises.length + 1,
      isCompleted: false,
    };

    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const handleRemoveExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === exerciseIndex 
          ? {
              ...exercise,
              sets: exercise.sets.map((set, j) => 
                j === setIndex ? { ...set, [field]: value } : set
              )
            }
          : exercise
      )
    }));
  };

  const handleAddSet = (exerciseIndex) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === exerciseIndex 
          ? {
              ...exercise,
              sets: [...exercise.sets, {
                reps: 10,
                weight: 0,
                duration: 0,
                distance: 0,
                restTime: 60,
                notes: '',
                completed: false,
              }]
            }
          : exercise
      )
    }));
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === exerciseIndex 
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, j) => j !== setIndex)
            }
          : exercise
      )
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la séance est requis');
      return false;
    }

    if (formData.name.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom de la séance doit contenir au moins 3 caractères');
      return false;
    }

    if (formData.exercises.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un exercice à la séance');
      return false;
    }

    // Vérifier que chaque exercice a au moins une série
    for (const exercise of formData.exercises) {
      if (exercise.sets.length === 0) {
        Alert.alert('Erreur', `L'exercice "${exercise.name}" doit avoir au moins une série`);
        return false;
      }
    }

    return true;
  };

  const handleCreateSession = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await sessionService.createSession(formData);
      Alert.alert(
        'Succès',
        'Séance créée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la création de la séance:', error);
      Alert.alert('Erreur', 'Impossible de créer la séance');
    } finally {
      setIsLoading(false);
    }
  };

  const renderExercise = (exercise, exerciseIndex) => (
    <Card key={exerciseIndex} style={styles.exerciseCard}>
      <Card.Content>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Button
            mode="text"
            onPress={() => handleRemoveExercise(exerciseIndex)}
            textColor={colors.error}
            compact
          >
            Supprimer
          </Button>
        </View>
        
        <Text style={styles.exerciseCategory}>{exercise.category}</Text>
        
        {exercise.sets.map((set, setIndex) => (
          <View key={setIndex} style={styles.setContainer}>
            <View style={styles.setHeader}>
              <Text style={styles.setLabel}>Série {setIndex + 1}</Text>
            </View>
            <View style={styles.setInputs}>
              <TextInput
                label="Rép"
                value={set.reps.toString()}
                onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'reps', parseInt(value) || 0)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.setInput}
                disabled={isLoading}
                dense
              />
              <TextInput
                label="Poids"
                value={set.weight.toString()}
                onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'weight', parseFloat(value) || 0)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.setInput}
                disabled={isLoading}
                dense
              />
              <TextInput
                label="Repos"
                value={set.restTime.toString()}
                onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'restTime', parseInt(value) || 0)}
                mode="outlined"
                keyboardType="numeric"
                style={styles.setInput}
                disabled={isLoading}
                dense
              />
            </View>
            {exercise.sets.length > 1 && (
              <Button
                mode="text"
                onPress={() => handleRemoveSet(exerciseIndex, setIndex)}
                textColor={colors.error}
                compact
              >
                Supprimer cette série
              </Button>
            )}
          </View>
        ))}
        
        <Button
          mode="outlined"
          onPress={() => handleAddSet(exerciseIndex)}
          style={styles.addSetButton}
          disabled={isLoading}
        >
          Ajouter une série
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
              disabled={isLoading}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              disabled={isLoading}
            />

            <Text style={styles.inputLabel}>Difficulté</Text>
            <View style={styles.chipContainer}>
              {difficulties.map((difficulty) => (
                <Chip
                  key={difficulty.key}
                  selected={formData.difficulty === difficulty.key}
                  onPress={() => handleInputChange('difficulty', difficulty.key)}
                  style={styles.chip}
                  disabled={isLoading}
                >
                  {difficulty.label}
                </Chip>
              ))}
            </View>

            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.chipContainer}>
              {sessionCategories.map((category) => (
                <Chip
                  key={category.key}
                  selected={formData.category === category.key}
                  onPress={() => handleInputChange('category', category.key)}
                  style={styles.chip}
                  disabled={isLoading}
                >
                  {category.label}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Durée estimée (minutes)"
              value={formData.estimatedDuration.toString()}
              onChangeText={(value) => handleInputChange('estimatedDuration', parseInt(value) || 60)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              disabled={isLoading}
            />
          </Card.Content>
        </Card>

        {/* Exercices disponibles */}
        <View style={styles.exercisesSection}>
          <View style={styles.exercisesSectionHeader}>
            <Text style={styles.sectionTitle}>Exercices disponibles</Text>
            <Button
              mode="contained"
              onPress={() => setShowCreateExerciseModal(true)}
              icon="plus"
              compact
              style={styles.createExerciseButton}
            >
              Créer un exercice
            </Button>
          </View>
          
          {/* Filtres par catégorie */}
          <View style={styles.filtersContainer}>
            <Chip
              selected={selectedCategory === ''}
              onPress={() => setSelectedCategory('')}
              style={styles.filterChip}
            >
              Tous
            </Chip>
            {categories.map((category, index) => (
              <Chip
                key={index}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.filterChip}
              >
                {capitalizeFirstLetter(category)}
              </Chip>
            ))}
          </View>
          
          {/* Barre de recherche */}
          <Searchbar
            placeholder="Rechercher un exercice..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          {isLoadingExercises ? (
            <View style={styles.exercisesContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.exercisesContainer}>
              <ScrollView 
                style={styles.exercisesList} 
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise, index) => (
                    <List.Item
                      key={index}
                      title={exercise.name}
                      description={exercise.description}
                      left={(props) => <List.Icon {...props} icon="dumbbell" />}
                      right={(props) => (
                        <Button
                          mode="outlined"
                          onPress={() => handleAddExercise(exercise)}
                          compact
                          disabled={isLoading}
                        >
                          Ajouter
                        </Button>
                      )}
                    />
                  ))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      {searchQuery.trim() || selectedCategory
                        ? `Aucun exercice trouvé${searchQuery.trim() ? ` pour "${searchQuery}"` : ''}${selectedCategory ? ` dans la catégorie "${selectedCategory}"` : ''}`
                        : 'Aucun exercice disponible. Veuillez réessayer dans quelques instants.'}
                    </Text>
                    {!searchQuery.trim() && !selectedCategory && (
                      <Button
                        mode="outlined"
                        onPress={loadExercises}
                        style={{ marginTop: spacing.md }}
                      >
                        Recharger les exercices
                      </Button>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Exercices ajoutés */}
        {formData.exercises.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Exercices de la séance</Text>
              {formData.exercises.map((exercise, index) => renderExercise(exercise, index))}
            </Card.Content>
          </Card>
        )}

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateSession}
            style={styles.createButton}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : 'Créer la séance'}
          </Button>
        </View>
      </ScrollView>

      {/* Modal de création d'exercice */}
      <Modal
        visible={showCreateExerciseModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseCreateExerciseModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Créer un exercice</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={handleCloseCreateExerciseModal}
            />
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Informations de base */}
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Informations de base</Text>
                
                <TextInput
                  label="Nom de l'exercice *"
                  value={exerciseFormData.name}
                  onChangeText={(value) => handleExerciseInputChange('name', value)}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                  disabled={isCreatingExercise}
                />
                
                <TextInput
                  label="Description (optionnel)"
                  value={exerciseFormData.description}
                  onChangeText={(value) => handleExerciseInputChange('description', value)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                  disabled={isCreatingExercise}
                />
              </Card.Content>
            </Card>

            {/* Catégorie */}
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Catégorie *</Text>
                <View style={styles.categoriesContainer}>
                  {categories.map((category, index) => (
                    <Chip
                      key={index}
                      mode={exerciseFormData.category === category ? 'flat' : 'outlined'}
                      selected={exerciseFormData.category === category}
                      onPress={() => handleExerciseCategorySelect(category)}
                      style={styles.categoryChip}
                      disabled={isCreatingExercise}
                    >
                      {capitalizeFirstLetter(category)}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* Groupes musculaires */}
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Groupes musculaires (optionnel)</Text>
                <View style={styles.muscleGroupsContainer}>
                  {muscleGroups.map((muscleGroup, index) => (
                    <Chip
                      key={index}
                      mode={exerciseFormData.muscleGroups.includes(muscleGroup) ? 'flat' : 'outlined'}
                      selected={exerciseFormData.muscleGroups.includes(muscleGroup)}
                      onPress={() => handleExerciseMuscleGroupToggle(muscleGroup)}
                      style={styles.muscleGroupChip}
                      disabled={isCreatingExercise}
                    >
                      {capitalizeFirstLetter(muscleGroup)}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Boutons d'action du modal */}
          <View style={styles.modalActionButtons}>
            <Button
              mode="outlined"
              onPress={handleCloseCreateExerciseModal}
              style={styles.modalCancelButton}
              disabled={isCreatingExercise}
            >
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateExercise}
              style={styles.modalCreateButton}
              loading={isCreatingExercise}
              disabled={isCreatingExercise}
            >
              Créer l'exercice
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  content: {
    padding: spacing.md,
    paddingBottom: 120, // Espace pour les boutons d'action
  },
  card: {
    marginBottom: spacing.md,
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
  inputLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  exercisesSection: {
    marginBottom: spacing.md,
  },
  exercisesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createExerciseButton: {
    marginLeft: spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchBar: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  exercisesContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.surface,
    height: 300,
    elevation: 2,
  },
  exercisesList: {
    flex: 1,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noResultsText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  exerciseCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  exerciseCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  setContainer: {
    marginBottom: spacing.sm,
    padding: spacing.xs,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  setLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  setInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  setInput: {
    flex: 1,
    height: 40,
  },
  addSetButton: {
    marginTop: spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  createButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  // Styles pour le modal de création d'exercice
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalCard: {
    margin: spacing.md,
    elevation: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    marginBottom: spacing.sm,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleGroupChip: {
    marginBottom: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  modalActionButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalCreateButton: {
    flex: 1,
  },
});

export default CreateSessionScreen;
