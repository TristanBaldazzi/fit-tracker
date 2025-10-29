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
  ActivityIndicator,
} from 'react-native-paper';
import { exerciseService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';

const EditExerciseScreen = ({ route, navigation }) => {
  const { exerciseId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    muscleGroups: [],
  });

  useEffect(() => {
    loadData();
  }, [exerciseId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadExercise(),
        loadCategories(),
        loadMuscleGroups(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'exercice');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercise = async () => {
    try {
      const response = await exerciseService.getExercise(exerciseId);
      const exercise = response.exercise;
      
      setFormData({
        name: exercise.name || '',
        description: exercise.description || '',
        category: exercise.category || '',
        muscleGroups: exercise.muscleGroups || [],
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'exercice:', error);
      throw error;
    }
  };

  const loadCategories = async () => {
    try {
      const response = await exerciseService.getCategories();
      setCategories(response.categories || []);
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category: category
    }));
  };

  const handleMuscleGroupToggle = (muscleGroup) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscleGroup)
        ? prev.muscleGroups.filter(group => group !== muscleGroup)
        : [...prev.muscleGroups, muscleGroup]
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'exercice est requis');
      return false;
    }

    if (formData.name.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de l\'exercice doit contenir au moins 2 caractères');
      return false;
    }

    if (!formData.category) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return false;
    }

    return true;
  };

  const handleUpdateExercise = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      const exerciseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        muscleGroups: formData.muscleGroups,
      };

      await exerciseService.updateExercise(exerciseId, exerciseData);
      
      Alert.alert('Succès', 'Exercice modifié avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de modifier l\'exercice');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'exercice...</Text>
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
              label="Nom de l'exercice *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />
            
            <TextInput
              label="Description (optionnel)"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />
          </Card.Content>
        </Card>

        {/* Catégorie */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Catégorie *</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category, index) => (
                <Chip
                  key={index}
                  mode={formData.category === category ? 'flat' : 'outlined'}
                  selected={formData.category === category}
                  onPress={() => handleCategorySelect(category)}
                  style={styles.categoryChip}
                >
                  {capitalizeFirstLetter(category)}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Groupes musculaires */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Groupes musculaires (optionnel)</Text>
            <View style={styles.muscleGroupsContainer}>
              {muscleGroups.map((muscleGroup, index) => (
                <Chip
                  key={index}
                  mode={formData.muscleGroups.includes(muscleGroup) ? 'flat' : 'outlined'}
                  selected={formData.muscleGroups.includes(muscleGroup)}
                  onPress={() => handleMuscleGroupToggle(muscleGroup)}
                  style={styles.muscleGroupChip}
                >
                  {capitalizeFirstLetter(muscleGroup)}
                </Chip>
              ))}
            </View>
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
          onPress={handleUpdateExercise}
          style={styles.saveButton}
          loading={isSaving}
          disabled={isSaving}
        >
          Sauvegarder
        </Button>
      </View>
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
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
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
});

export default EditExerciseScreen;


