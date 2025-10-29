import { Alert } from 'react-native';

// Fonction pour formater le poids (kg -> tonnes si > 1000kg)
export const formatWeight = (weightInKg) => {
  if (weightInKg >= 1000) {
    const tonnes = (weightInKg / 1000).toFixed(1);
    return `${tonnes}t`;
  }
  return `${Math.round(weightInKg)}kg`;
};

// Fonction pour afficher la popup informative
export const showWeightInfo = (weightInKg) => {
  const comparisons = getWeightComparisons(weightInKg);
  
  Alert.alert(
    '💪 Poids soulevé',
    `Tu as soulevé ${Math.round(weightInKg)}kg au total !\n\n${comparisons}`,
    [{ text: 'Impressionnant !', style: 'default' }]
  );
};

// Fonction pour générer les comparaisons amusantes
const getWeightComparisons = (weightInKg) => {
  const comparisons = [];
  
  // Comparaisons avec des animaux/objets
  if (weightInKg >= 1000) {
    comparisons.push('🐘 C\'est le poids d\'un éléphant !');
  }
  
  if (weightInKg >= 2000) {
    comparisons.push('🚗 C\'est le poids d\'une voiture !');
  }
  
  if (weightInKg >= 5000) {
    comparisons.push('🐋 C\'est le poids d\'un béluga !');
  }
  
  if (weightInKg >= 10000) {
    comparisons.push('🚛 C\'est le poids d\'un camion !');
  }
  
  if (weightInKg >= 50000) {
    comparisons.push('🏗️ C\'est le poids d\'un bâtiment !');
  }
  
  // Comparaisons avec des objets du quotidien
  if (weightInKg >= 100) {
    const smartphones = Math.round(weightInKg / 0.2); // Poids moyen d'un smartphone
    comparisons.push(`📱 C'est ${smartphones} smartphones !`);
  }
  
  if (weightInKg >= 500) {
    const laptops = Math.round(weightInKg / 2); // Poids moyen d'un laptop
    comparisons.push(`💻 C'est ${laptops} ordinateurs portables !`);
  }
  
  if (weightInKg >= 1000) {
    const bikes = Math.round(weightInKg / 12); // Poids moyen d'un vélo
    comparisons.push(`🚲 C'est ${bikes} vélos !`);
  }
  
  // Message motivant
  if (weightInKg >= 10000) {
    comparisons.push('\n🏆 Tu es une machine ! Continue comme ça !');
  } else if (weightInKg >= 5000) {
    comparisons.push('\n💪 Tu es vraiment fort !');
  } else if (weightInKg >= 1000) {
    comparisons.push('\n🔥 Excellent travail !');
  } else {
    comparisons.push('\n💪 Continue tes efforts !');
  }
  
  return comparisons.join('\n');
};


