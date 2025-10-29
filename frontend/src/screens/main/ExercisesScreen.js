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
  TextInput,
  Chip,
  List,
  Divider,
  ActivityIndicator,
  FAB,
  Searchbar,
} from 'react-native-paper';
import { exerciseService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const ExercisesScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadExercises(),
        loadCategories(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const response = await exerciseService.getUserExercises();
      setExercises(response.exercises || []);
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
      setExercises([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await exerciseService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    }
  };

  const filterExercises = () => {
    let filtered = [...exercises];
    
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteExercise = (exerciseId) => {
    Alert.alert(
      'Supprimer l\'exercice',
      'Êtes-vous sûr de vouloir supprimer cet exercice ?',
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
              await exerciseService.deleteExercise(exerciseId);
              await loadExercises();
              Alert.alert('Succès', 'Exercice supprimé avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'exercice');
            }
          },
        },
      ]
    );
  };

  const handleEditExercise = (exercise) => {
    navigation.navigate('EditExercise', { exerciseId: exercise._id });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des exercices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Rechercher un exercice..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

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
        <View style={styles.exercisesContainer}>
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise, index) => (
              <Card key={exercise._id} style={styles.exerciseCard} elevation={2}>
                <Card.Content>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseCategory}>
                        {capitalizeFirstLetter(exercise.category)}
                      </Text>
                      {exercise.description && (
                        <Text style={styles.exerciseDescription}>
                          {exercise.description}
                        </Text>
                      )}
                      {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                        <View style={styles.muscleGroupsContainer}>
                          {exercise.muscleGroups.map((group, groupIndex) => (
                            <Chip
                              key={groupIndex}
                              mode="outlined"
                              compact
                              style={styles.muscleGroupChip}
                            >
                              {capitalizeFirstLetter(group)}
                            </Chip>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={styles.exerciseActions}>
                      <Button
                        mode="text"
                        onPress={() => handleEditExercise(exercise)}
                        compact
                        textColor={colors.primary}
                        icon="pencil"
                      >
                        Modifier
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => handleDeleteExercise(exercise._id)}
                        compact
                        textColor={colors.error}
                        icon="delete"
                      >
                        Supprimer
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Aucun exercice trouvé' 
                  : 'Aucun exercice personnalisé'
                }
              </Text>
              {!searchQuery && selectedCategory === 'all' && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('CreateExercise')}
                  style={styles.emptyButton}
                >
                  Créer votre premier exercice
                </Button>
              )}
            </View>
          )}
        </View>

        {/* Espacement en bas */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bouton d'action flottant */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateExercise')}
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
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchbar: {
    elevation: 2,
  },
  categoryFilter: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  exercisesContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  exerciseCard: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  exerciseName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  exerciseCategory: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  exerciseDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muscleGroupChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  exerciseActions: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default ExercisesScreen;


