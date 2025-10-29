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

const CreateExerciseScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
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
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadMuscleGroups(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
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

  const handleCreateExercise = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const exerciseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        muscleGroups: formData.muscleGroups,
      };

      await exerciseService.createExercise(exerciseData);
      
      Alert.alert('Succès', 'Exercice créé avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };

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
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          mode="contained"
          onPress={handleCreateExercise}
          style={styles.createButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Créer l'exercice
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
  createButton: {
    flex: 1,
  },
});

export default CreateExerciseScreen;


