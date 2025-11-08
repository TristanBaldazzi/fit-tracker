import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  ProgressBar,
  Chip,
  IconButton,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { sessionService } from '../../services/api';
import { colors, spacing, typography } from '../../styles/theme';
import TimerModal from '../../components/TimerModal';
import { saveCurrentSession, saveSessionProgress, clearCurrentSession } from '../../services/localStorage';

const SessionInProgressScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [sessionImages, setSessionImages] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    loadSession();
    requestImagePermissions();
  }, [sessionId]);

  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions requises',
          'Les permissions de caméra et de bibliothèque photo sont nécessaires pour ajouter des images à vos séances.'
        );
      }
    }
  };

  // Sauvegarde automatique quand sessionData change
  useEffect(() => {
    if (sessionData) {
      saveSessionToLocal();
    }
  }, [sessionData]);

  // Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionData) {
        saveSessionToLocal();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [sessionData]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si on reprend une séance
      const routeParams = route.params || {};
      const isResuming = routeParams.resumeFromProgress;
      const savedProgress = routeParams.savedProgress;
      
      if (isResuming && savedProgress) {
        // Reprendre depuis le stockage local
        setSessionData(savedProgress.sessionData);
        setCurrentExerciseIndex(savedProgress.currentExerciseIndex);
        setSession(savedProgress.sessionData);
        // Ne pas charger les images depuis le stockage local - elles seront ajoutées à la fin
        setSessionImages([]);
        console.log('🔄 Séance reprise depuis le stockage local');
      } else {
        // Charger une nouvelle séance
        const response = await sessionService.getSession(sessionId);
        setSession(response.session);
        
        // Initialiser les données de séance avec les valeurs par défaut
        const initialData = {
          ...response.session,
          exercises: response.session.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({
              reps: set.reps,
              weight: set.weight,
              duration: set.duration || 0,
              distance: set.distance || 0,
              restTime: set.restTime || 60,
              notes: set.notes || '',
              completed: false,
              _id: set._id
            }))
          }))
        };
        
        setSessionData(initialData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
    } finally {
      setIsLoading(false);
    }
  };

  const currentExercise = sessionData?.exercises[currentExerciseIndex];
  const progress = sessionData ? (currentExerciseIndex + 1) / sessionData.exercises.length : 0;

  // Fonction de sauvegarde locale
  const saveSessionToLocal = async () => {
    if (!sessionData) return;
    
    try {
      const progressData = {
        currentExerciseIndex,
        sessionData,
        // Ne pas sauvegarder les images dans le stockage local - elles seront ajoutées à la fin
        timestamp: new Date().toISOString(),
      };
      
      await saveCurrentSession(sessionData);
      await saveSessionProgress(progressData);
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde locale:', error);
    }
  };

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: true,
        });
      }

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSessionImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeImage = (index) => {
    setSessionImages(prev => prev.filter((_, i) => i !== index));
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateSet = (setIndex, field, value) => {
    if (!sessionData) return;
    
    const updatedSessionData = { ...sessionData };
    const exercise = updatedSessionData.exercises[currentExerciseIndex];
    
    // Mettre à jour directement reps ou weight, pas actualReps/actualWeight
    const realField = field === 'actualReps' ? 'reps' : field === 'actualWeight' ? 'weight' : field;
    
    exercise.sets[setIndex] = {
      ...exercise.sets[setIndex],
      [realField]: value
    };
    
    setSessionData(updatedSessionData);
  };

  const handleToggleSetCompleted = (setIndex) => {
    if (!sessionData) return;
    
    const updatedSessionData = { ...sessionData };
    const exercise = updatedSessionData.exercises[currentExerciseIndex];
    exercise.sets[setIndex] = {
      ...exercise.sets[setIndex],
      completed: !exercise.sets[setIndex].completed
    };
    
    console.log('Toggle completed:', { setIndex, completed: exercise.sets[setIndex].completed, exercise: exercise.sets[setIndex] });
    setSessionData(updatedSessionData);
  };

  const handleAddSet = () => {
    if (!sessionData) return;
    
    const updatedSessionData = { ...sessionData };
    const exercise = updatedSessionData.exercises[currentExerciseIndex];
    
    // Utiliser les valeurs de la dernière série comme référence, ou des valeurs par défaut
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = {
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      duration: lastSet?.duration || 0,
      distance: lastSet?.distance || 0,
      restTime: lastSet?.restTime || 60,
      notes: lastSet?.notes || '',
      completed: false,
      _id: `temp_${Date.now()}` // ID temporaire pour les nouvelles séries
    };
    
    exercise.sets = [...exercise.sets, newSet];
    setSessionData(updatedSessionData);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < sessionData.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const convertImageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Erreur lors de la conversion en base64:', error);
      return null;
    }
  };

  const handleCompleteSession = () => {
    // Ouvrir la modal pour ajouter des photos
    setShowPhotoModal(true);
  };

  const handleFinishSession = async () => {
    console.log('🔥 FONCTION handleFinishSession DÉCLENCHÉE !');
    try {
      setIsSaving(true);
      
      // Fermer la modal
      setShowPhotoModal(false);
      
      // Envoyer les données directement
      const exercisesToSend = sessionData.exercises.map(exercise => ({
        name: exercise.name,
        category: exercise.category,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration || 0,
          distance: set.distance || 0,
          completed: set.completed
        }))
      }));
      
      // Calculer l'XP basé sur les exercices complétés
      const completedSets = sessionData.exercises.reduce((total, exercise) => {
        return total + exercise.sets.filter(set => set.completed).length;
      }, 0);
      
      const xpGained = completedSets * 10; // 10 XP par série complétée
      
      // Convertir les images en base64 (si des photos ont été ajoutées)
      const imagesBase64 = [];
      if (sessionImages.length > 0) {
        for (const imageUri of sessionImages) {
          const base64 = await convertImageToBase64(imageUri);
          if (base64) {
            imagesBase64.push(base64);
          }
        }
      }
      
      // Sauvegarder la séance complétée
      await sessionService.completeSession(sessionId, {
        actualDuration: 45, // TODO: Calculer la vraie durée
        exercises: exercisesToSend,
        xpGained: xpGained,
        images: imagesBase64
      });
      
      // Nettoyer le stockage local
      await clearCurrentSession();
      
      Alert.alert(
        'Séance terminée !',
        `Félicitations ! Vous avez gagné ${xpGained} XP !`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la séance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSession = () => {
    Alert.alert(
      '⚠️ Annuler la séance',
      'Êtes-vous sûr de vouloir annuler cette séance ?\n\nTous vos progrès seront perdus et vous devrez recommencer depuis le début.',
      [
        {
          text: 'Non, continuer',
          style: 'cancel'
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              // Nettoyer le stockage local
              await clearCurrentSession();
              
              Alert.alert(
                'Séance annulée',
                'Votre séance a été annulée. Vous pouvez la reprendre plus tard.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur lors de l\'annulation:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la séance');
            }
          }
        }
      ]
    );
  };

  const isLastExercise = currentExerciseIndex === sessionData?.exercises.length - 1;
  const allSetsCompleted = currentExercise?.sets.every(set => set.completed);
  
  // Debug: voir l'état des boutons
  console.log('🔍 État des boutons:', {
    isLastExercise,
    allSetsCompleted,
    currentExerciseIndex,
    totalExercises: sessionData?.exercises.length,
    currentExerciseSets: currentExercise?.sets.map(set => ({ completed: set.completed }))
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de la séance...</Text>
      </View>
    );
  }

  if (!sessionData || !currentExercise) {
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
    <View style={styles.container}>
      {/* En-tête avec progression */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.sessionName}>{sessionData.name}</Text>
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => setTimerModalVisible(true)}
          >
            <IconButton
              icon="timer-outline"
              size={24}
              iconColor={colors.primary}
              style={styles.timerIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Exercice {currentExerciseIndex + 1} sur {sessionData.exercises.length}
          </Text>
          <ProgressBar 
            progress={progress} 
            color={colors.primary}
            style={styles.progressBar}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercice actuel */}
        <Card style={styles.exerciseCard}>
          <Card.Content>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{currentExercise.name}</Text>
              <Chip mode="outlined" style={styles.categoryChip}>
                {currentExercise.category}
              </Chip>
            </View>
            
            <Text style={styles.exerciseDescription}>
              {currentExercise.muscleGroups?.join(', ')}
            </Text>

            {/* Séries de l'exercice */}
            <View style={styles.setsContainer}>
              <View style={styles.setsHeader}>
                <Text style={styles.setsTitle}>Séries</Text>
                <Button
                  mode="outlined"
                  onPress={handleAddSet}
                  icon="plus"
                  compact
                  style={styles.addSetButton}
                >
                  Ajouter une série
                </Button>
              </View>
              {currentExercise.sets.map((set, setIndex) => (
                <Card 
                  key={setIndex} 
                  style={[
                    styles.setCard,
                    set.completed && styles.completedSetCard
                  ]}
                >
                  <Card.Content style={styles.setContent}>
                    <View style={styles.setHeader}>
                      <Text style={styles.setNumber}>Série {setIndex + 1}</Text>
                      <Button
                        mode={set.completed ? "contained" : "outlined"}
                        onPress={() => handleToggleSetCompleted(setIndex)}
                        compact
                        style={styles.completeButton}
                      >
                        {set.completed ? 'Terminé' : 'Marquer'}
                      </Button>
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
                          disabled={set.completed}
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
                          disabled={set.completed}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation et actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            style={styles.navButton}
          >
            Précédent
          </Button>
          
          {isLastExercise ? (
            <Button
              mode="contained"
              onPress={handleCompleteSession}
              disabled={isSaving}
              loading={isSaving}
              style={styles.completeButton}
            >
              Terminer la séance
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextExercise}
              style={styles.navButton}
            >
              Suivant
            </Button>
          )}
        </View>
        
        {/* Bouton d'annulation */}
        <View style={styles.cancelContainer}>
          <Button
            mode="text"
            onPress={handleCancelSession}
            style={styles.cancelButton}
            textColor={colors.error}
            icon="close"
          >
            Annuler la séance
          </Button>
        </View>
      </View>

          {/* Modal du chronomètre */}
          <TimerModal
            visible={timerModalVisible}
            onClose={() => setTimerModalVisible(false)}
          />

          {/* Modal pour ajouter des photos à la fin de la séance */}
          <Modal
            visible={showPhotoModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowPhotoModal(false)}
          >
            <View style={styles.photoModalOverlay}>
              <Card style={styles.photoModalCard}>
                <Card.Content>
                  <View style={styles.photoModalHeader}>
                    <Text style={styles.photoModalTitle}>📸 Ajouter des photos</Text>
                    <IconButton
                      icon="close"
                      size={24}
                      onPress={() => setShowPhotoModal(false)}
                      disabled={isSaving}
                    />
                  </View>
                  
                  <Text style={styles.photoModalDescription}>
                    Souhaitez-vous ajouter des photos à cette séance ?
                  </Text>

                  {sessionImages.length > 0 && (
                    <View style={styles.imagesContainer}>
                      {sessionImages.map((imageUri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                          <Image source={{ uri: imageUri }} style={styles.sessionImage} />
                          <IconButton
                            icon="close-circle"
                            size={24}
                            iconColor={colors.error}
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                            disabled={isSaving}
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.photoModalButtons}>
                    <Button
                      mode="outlined"
                      onPress={showImagePickerOptions}
                      icon="camera"
                      style={styles.photoButton}
                      disabled={isSaving}
                    >
                      {sessionImages.length > 0 ? 'Ajouter une photo' : 'Prendre/Choisir une photo'}
                    </Button>
                    
                    <Button
                      mode="contained"
                      onPress={() => handleFinishSession(false)}
                      style={styles.finishButton}
                      disabled={isSaving}
                      loading={isSaving}
                      icon="check"
                    >
                      Terminer la séance
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </Modal>
        </View>
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
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionName: {
    ...typography.h3,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },
  timerButton: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  timerIcon: {
    margin: 0,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.body2,
    color: 'white',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  exerciseCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryChip: {
    marginLeft: spacing.sm,
  },
  exerciseDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  setsContainer: {
    marginTop: spacing.md,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  setsTitle: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  addSetButton: {
    marginLeft: spacing.md,
  },
  setCard: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  completedSetCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
    borderWidth: 1,
  },
  setContent: {
    padding: spacing.md,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  setNumber: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  completeButton: {
    minWidth: 100,
  },
  setInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  setInput: {
    backgroundColor: colors.surface,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  cancelContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
  },
  imagesCard: {
    marginBottom: spacing.md,
    elevation: 4,
  },
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  imagesTitle: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
  },
  sessionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    margin: 0,
  },
  noImagesText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontStyle: 'italic',
  },
  // Styles pour la modal de photos
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 500,
    elevation: 8,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoModalTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  photoModalDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  photoModalButtons: {
    marginTop: spacing.md,
  },
  photoButton: {
    marginBottom: spacing.md,
  },
  finishButton: {
    marginTop: spacing.sm,
  },
});

export default SessionInProgressScreen;
