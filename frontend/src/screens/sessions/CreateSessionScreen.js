import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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
  }, []);

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
      const response = await exerciseService.getExercises();
      setAvailableExercises(response.exercises);
      setFilteredExercises(response.exercises);
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
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

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
          <Text style={styles.sectionTitle}>Exercices disponibles</Text>
          
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
                      Aucun exercice trouvé pour "{searchQuery}"
                    </Text>
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
});

export default CreateSessionScreen;
