// Base de données d'exercices avec catégories détaillées
const exercises = [
  // === HAUT DU CORPS ===
  {
    name: "Pompes classiques",
    description: "Exercice de base pour les pectoraux, triceps et épaules",
    muscleGroups: ["pectoraux", "triceps", "épaules"],
    category: "Haut du corps",
    difficulty: "easy",
    equipment: "aucun",
    instructions: [
      "Position de planche, mains écartées de la largeur des épaules",
      "Descendre le corps en gardant le dos droit",
      "Pousser pour revenir à la position initiale"
    ]
  },
  {
    name: "Pompes diamant",
    description: "Variante des pompes pour cibler les triceps",
    muscleGroups: ["triceps", "pectoraux"],
    category: "Haut du corps",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Position de pompes avec les mains en forme de diamant",
      "Descendre lentement en gardant les coudes près du corps",
      "Pousser pour revenir à la position initiale"
    ]
  },
  {
    name: "Développé couché",
    description: "Exercice de base pour développer les pectoraux",
    muscleGroups: ["pectoraux", "triceps", "épaules"],
    category: "Pectoraux",
    difficulty: "medium",
    equipment: "barre, banc",
    instructions: [
      "Allongé sur le banc, saisir la barre",
      "Descendre la barre vers la poitrine",
      "Pousser la barre vers le haut"
    ]
  },
  {
    name: "Développé incliné",
    description: "Développé sur banc incliné pour le haut des pectoraux",
    muscleGroups: ["pectoraux", "épaules"],
    category: "Pectoraux",
    difficulty: "medium",
    equipment: "barre, banc incliné",
    instructions: [
      "Banc incliné à 30-45°",
      "Descendre la barre vers le haut de la poitrine",
      "Pousser vers le haut et légèrement vers l'arrière"
    ]
  },
  {
    name: "Écarté couché",
    description: "Isolation des pectoraux avec haltères",
    muscleGroups: ["pectoraux"],
    category: "Pectoraux",
    difficulty: "easy",
    equipment: "haltères, banc",
    instructions: [
      "Allongé, haltères au-dessus de la poitrine",
      "Écarter les bras en arc de cercle",
      "Ramener les haltères au-dessus de la poitrine"
    ]
  },
  {
    name: "Dips",
    description: "Exercice pour triceps et pectoraux inférieurs",
    muscleGroups: ["triceps", "pectoraux"],
    category: "Triceps",
    difficulty: "medium",
    equipment: "barres parallèles",
    instructions: [
      "Saisir les barres parallèles",
      "Descendre le corps en fléchissant les bras",
      "Pousser pour remonter"
    ]
  },
  {
    name: "Extension triceps couché",
    description: "Isolation des triceps avec haltère",
    muscleGroups: ["triceps"],
    category: "Triceps",
    difficulty: "easy",
    equipment: "haltère, banc",
    instructions: [
      "Allongé, haltère au-dessus de la poitrine",
      "Fléchir les coudes pour descendre l'haltère",
      "Étendre les bras pour remonter"
    ]
  },
  {
    name: "Tractions",
    description: "Exercice de base pour le dos et les biceps",
    muscleGroups: ["dos", "biceps", "épaules"],
    category: "Dos",
    difficulty: "hard",
    equipment: "barre de traction",
    instructions: [
      "Suspendu à la barre, mains en pronation",
      "Tirer le corps vers le haut",
      "Descendre lentement"
    ]
  },
  {
    name: "Rowing barre",
    description: "Exercice de base pour le dos",
    muscleGroups: ["dos", "biceps", "épaules"],
    category: "Dos",
    difficulty: "medium",
    equipment: "barre",
    instructions: [
      "Penché en avant, barre en main",
      "Tirer la barre vers le ventre",
      "Contrôler la descente"
    ]
  },
  {
    name: "Tirage vertical",
    description: "Développement de la largeur du dos",
    muscleGroups: ["dos", "biceps"],
    category: "Dos",
    difficulty: "medium",
    equipment: "machine ou barre",
    instructions: [
      "Assis ou debout, tirer vers le bas",
      "Amener la barre vers la poitrine",
      "Contrôler le retour"
    ]
  },
  {
    name: "Développé militaire",
    description: "Exercice pour les épaules",
    muscleGroups: ["épaules", "triceps"],
    category: "Haut du corps",
    difficulty: "medium",
    equipment: "barre",
    instructions: [
      "Debout, barre au niveau des épaules",
      "Pousser la barre vers le haut",
      "Descendre lentement"
    ]
  },
  {
    name: "Élévations latérales",
    description: "Isolation des épaules",
    muscleGroups: ["épaules"],
    category: "Haut du corps",
    difficulty: "easy",
    equipment: "haltères",
    instructions: [
      "Debout, haltères le long du corps",
      "Élever les bras sur les côtés",
      "Descendre lentement"
    ]
  },

  // === BAS DU CORPS ===
  {
    name: "Squats",
    description: "Exercice roi pour les jambes",
    muscleGroups: ["quadriceps", "fessiers", "ischio-jambiers"],
    category: "Bas du corps",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Pieds écartés de la largeur des épaules",
      "Descendre en fléchissant les genoux",
      "Remonter en contractant les fessiers"
    ]
  },
  {
    name: "Squats avec barre",
    description: "Squats chargés pour plus d'intensité",
    muscleGroups: ["quadriceps", "fessiers", "ischio-jambiers"],
    category: "Bas du corps",
    difficulty: "hard",
    equipment: "barre",
    instructions: [
      "Barre sur les épaules",
      "Descendre en gardant le dos droit",
      "Remonter en poussant sur les talons"
    ]
  },
  {
    name: "Fentes",
    description: "Exercice unilatéral pour les jambes",
    muscleGroups: ["quadriceps", "fessiers", "ischio-jambiers"],
    category: "Bas du corps",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Un pied en avant, l'autre en arrière",
      "Descendre en fléchissant les deux genoux",
      "Remonter en poussant sur la jambe avant"
    ]
  },
  {
    name: "Soulevé de terre",
    description: "Exercice complet pour le dos et les jambes",
    muscleGroups: ["dos", "fessiers", "ischio-jambiers", "quadriceps"],
    category: "Bas du corps",
    difficulty: "hard",
    equipment: "barre",
    instructions: [
      "Barre au sol, pieds écartés",
      "Saisir la barre, dos droit",
      "Se relever en contractant les fessiers"
    ]
  },
  {
    name: "Hip Thrust",
    description: "Exercice ciblé pour les fessiers",
    muscleGroups: ["fessiers", "ischio-jambiers"],
    category: "Bas du corps",
    difficulty: "medium",
    equipment: "banc, barre (optionnel)",
    instructions: [
      "Dos contre le banc, barre sur les hanches",
      "Pousser les hanches vers le haut",
      "Contracter les fessiers au sommet"
    ]
  },
  {
    name: "Leg Press",
    description: "Exercice de poussée pour les jambes",
    muscleGroups: ["quadriceps", "fessiers"],
    category: "Bas du corps",
    difficulty: "medium",
    equipment: "machine leg press",
    instructions: [
      "Assis sur la machine, pieds sur la plateforme",
      "Pousser la plateforme avec les jambes",
      "Contrôler la descente"
    ]
  },
  {
    name: "Extensions de jambes",
    description: "Isolation des quadriceps",
    muscleGroups: ["quadriceps"],
    category: "Bas du corps",
    difficulty: "easy",
    equipment: "machine",
    instructions: [
      "Assis sur la machine",
      "Étendre les jambes contre la résistance",
      "Contrôler le retour"
    ]
  },
  {
    name: "Curls ischio-jambiers",
    description: "Isolation des ischio-jambiers",
    muscleGroups: ["ischio-jambiers"],
    category: "Bas du corps",
    difficulty: "easy",
    equipment: "machine",
    instructions: [
      "Allongé sur le ventre",
      "Fléchir les jambes contre la résistance",
      "Contrôler le retour"
    ]
  },

  // === ABDOMINAUX ===
  {
    name: "Crunches",
    description: "Exercice de base pour les abdominaux",
    muscleGroups: ["abdominaux"],
    category: "Abdominaux",
    difficulty: "easy",
    equipment: "aucun",
    instructions: [
      "Allongé sur le dos, genoux fléchis",
      "Relever le buste vers les genoux",
      "Contrôler la descente"
    ]
  },
  {
    name: "Planche",
    description: "Exercice isométrique pour le gainage",
    muscleGroups: ["abdominaux", "épaules", "fessiers"],
    category: "Abdominaux",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Position de pompes sur les avant-bras",
      "Maintenir le corps droit",
      "Contracter les abdominaux"
    ]
  },
  {
    name: "Mountain Climbers",
    description: "Exercice cardio pour les abdominaux",
    muscleGroups: ["abdominaux", "épaules", "jambes"],
    category: "Abdominaux",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Position de planche",
      "Alterner rapidement les genoux vers la poitrine",
      "Maintenir le rythme"
    ]
  },
  {
    name: "Russian Twists",
    description: "Rotation pour les obliques",
    muscleGroups: ["abdominaux", "obliques"],
    category: "Abdominaux",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Assis, genoux fléchis",
      "Tourner le buste de gauche à droite",
      "Maintenir l'équilibre"
    ]
  },
  {
    name: "Leg Raises",
    description: "Relevé de jambes pour les abdominaux inférieurs",
    muscleGroups: ["abdominaux"],
    category: "Abdominaux",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Allongé sur le dos",
      "Relever les jambes à 90°",
      "Descendre lentement sans toucher le sol"
    ]
  },
  {
    name: "Dead Bug",
    description: "Exercice de stabilisation",
    muscleGroups: ["abdominaux", "épaules"],
    category: "Abdominaux",
    difficulty: "easy",
    equipment: "aucun",
    instructions: [
      "Allongé, bras et jambes à 90°",
      "Étendre un bras et la jambe opposée",
      "Revenir à la position initiale"
    ]
  },

  // === CARDIO ===
  {
    name: "Burpees",
    description: "Exercice cardio complet",
    muscleGroups: ["tout le corps"],
    category: "Cardio",
    difficulty: "hard",
    equipment: "aucun",
    instructions: [
      "Position debout",
      "Se baisser, faire une pompe",
      "Sauter les pieds vers les mains, sauter"
    ]
  },
  {
    name: "Jumping Jacks",
    description: "Exercice cardio simple",
    muscleGroups: ["jambes", "épaules"],
    category: "Cardio",
    difficulty: "easy",
    equipment: "aucun",
    instructions: [
      "Debout, bras le long du corps",
      "Sauter en écartant jambes et bras",
      "Revenir à la position initiale"
    ]
  },
  {
    name: "High Knees",
    description: "Course sur place avec genoux hauts",
    muscleGroups: ["jambes", "abdominaux"],
    category: "Cardio",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Courir sur place",
      "Monter les genoux le plus haut possible",
      "Maintenir le rythme"
    ]
  },
  {
    name: "Jump Squats",
    description: "Squats avec saut",
    muscleGroups: ["quadriceps", "fessiers", "mollets"],
    category: "Cardio",
    difficulty: "medium",
    equipment: "aucun",
    instructions: [
      "Position de squat",
      "Sauter le plus haut possible",
      "Atterrir en position de squat"
    ]
  },
  {
    name: "Corde à sauter",
    description: "Cardio classique",
    muscleGroups: ["jambes", "épaules", "abdominaux"],
    category: "Cardio",
    difficulty: "medium",
    equipment: "corde à sauter",
    instructions: [
      "Tenir la corde à deux mains",
      "Sauter en rythme avec la corde",
      "Maintenir la cadence"
    ]
  },
  {
    name: "Sprint",
    description: "Course à haute intensité",
    muscleGroups: ["jambes", "fessiers", "abdominaux"],
    category: "Cardio",
    difficulty: "hard",
    equipment: "aucun",
    instructions: [
      "Courir à vitesse maximale",
      "Maintenir la vitesse sur la distance",
      "Récupérer entre les sprints"
    ]
  },

  // === ÉPAULES ===
  {
    name: "Élévations frontales",
    description: "Isolation des épaules antérieures",
    muscleGroups: ["épaules"],
    category: "épaules",
    difficulty: "easy",
    equipment: "haltères",
    instructions: [
      "Debout, haltères le long du corps",
      "Élever les bras devant soi",
      "Descendre lentement"
    ]
  },
  {
    name: "Oiseau",
    description: "Exercice pour les épaules postérieures",
    muscleGroups: ["épaules", "dos"],
    category: "épaules",
    difficulty: "medium",
    equipment: "haltères",
    instructions: [
      "Penché en avant, haltères en main",
      "Élever les bras sur les côtés",
      "Contracter les omoplates"
    ]
  },
  {
    name: "Développé Arnold",
    description: "Variante du développé pour les épaules",
    muscleGroups: ["épaules", "triceps"],
    category: "épaules",
    difficulty: "medium",
    equipment: "haltères",
    instructions: [
      "Assis, haltères au niveau des épaules",
      "Rotation et élévation des haltères",
      "Contrôler le mouvement"
    ]
  },

  // === BICEPS ===
  {
    name: "Curls biceps",
    description: "Exercice de base pour les biceps",
    muscleGroups: ["biceps"],
    category: "Biceps",
    difficulty: "easy",
    equipment: "haltères",
    instructions: [
      "Debout, haltères le long du corps",
      "Fléchir les bras en contractant les biceps",
      "Descendre lentement"
    ]
  },
  {
    name: "Curls marteau",
    description: "Variante des curls pour biceps et avant-bras",
    muscleGroups: ["biceps", "avant-bras"],
    category: "Biceps",
    difficulty: "easy",
    equipment: "haltères",
    instructions: [
      "Haltères en prise marteau",
      "Fléchir les bras sans rotation",
      "Contrôler la descente"
    ]
  },
  {
    name: "Curls concentré",
    description: "Isolation des biceps assis",
    muscleGroups: ["biceps"],
    category: "Biceps",
    difficulty: "easy",
    equipment: "haltère, banc",
    instructions: [
      "Assis, coude sur la cuisse",
      "Fléchir le bras en isolant le biceps",
      "Contrôler le mouvement"
    ]
  }
];

module.exports = exercises;


