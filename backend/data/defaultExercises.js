const defaultExercises = [
  // Pectoraux
  {
    name: "Développé couché",
    description: "Exercice de base pour les pectoraux avec barre",
    category: "Pectoraux",
    muscleGroups: ["Pectoraux", "Triceps", "Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Développé incliné",
    description: "Développé couché sur banc incliné",
    category: "Pectoraux",
    muscleGroups: ["Pectoraux", "Triceps", "Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Pompes",
    description: "Exercice au poids du corps pour les pectoraux",
    category: "Pectoraux",
    muscleGroups: ["Pectoraux", "Triceps", "Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Écarté couché",
    description: "Isolation des pectoraux avec haltères",
    category: "Pectoraux",
    muscleGroups: ["Pectoraux"],
    isCustom: false,
    isPublic: true
  },

  // Dos
  {
    name: "Tractions",
    description: "Exercice au poids du corps pour le dos",
    category: "Dos",
    muscleGroups: ["Dos", "Biceps", "Grands dorsaux"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Rowing barre",
    description: "Tirage horizontal pour le dos",
    category: "Dos",
    muscleGroups: ["Dos", "Grands dorsaux", "Rhomboïdes"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Tirage vertical",
    description: "Tirage vers le bas pour les dorsaux",
    category: "Dos",
    muscleGroups: ["Grands dorsaux", "Biceps"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Soulevé de terre",
    description: "Exercice complet pour le dos et les jambes",
    category: "Dos",
    muscleGroups: ["Dos", "Fessiers", "Ischio-jambiers", "Trapèzes"],
    isCustom: false,
    isPublic: true
  },

  // Jambes
  {
    name: "Squat",
    description: "Exercice de base pour les jambes",
    category: "Bas du corps",
    muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Fentes",
    description: "Exercice unilatéral pour les jambes",
    category: "Bas du corps",
    muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Soulevé de terre roumain",
    description: "Exercice pour les ischio-jambiers et fessiers",
    category: "Bas du corps",
    muscleGroups: ["Ischio-jambiers", "Fessiers", "Dos"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Extensions de jambes",
    description: "Isolation des quadriceps",
    category: "Bas du corps",
    muscleGroups: ["Quadriceps"],
    isCustom: false,
    isPublic: true
  },

  // Épaules
  {
    name: "Développé militaire",
    description: "Développé debout pour les épaules",
    category: "Haut du corps",
    muscleGroups: ["Épaules", "Triceps"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Élévations latérales",
    description: "Isolation des épaules",
    category: "Haut du corps",
    muscleGroups: ["Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Élévations frontales",
    description: "Isolation des deltoïdes antérieurs",
    category: "Haut du corps",
    muscleGroups: ["Épaules"],
    isCustom: false,
    isPublic: true
  },

  // Biceps
  {
    name: "Curl biceps",
    description: "Flexion des biceps avec haltères",
    category: "Haut du corps",
    muscleGroups: ["Biceps"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Curl marteau",
    description: "Curl avec prise neutre",
    category: "Haut du corps",
    muscleGroups: ["Biceps", "Avant-bras"],
    isCustom: false,
    isPublic: true
  },

  // Triceps
  {
    name: "Dips",
    description: "Exercice au poids du corps pour les triceps",
    category: "Triceps",
    muscleGroups: ["Triceps", "Pectoraux"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Extension triceps",
    description: "Isolation des triceps",
    category: "Triceps",
    muscleGroups: ["Triceps"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Pompes diamant",
    description: "Pompes avec les mains en diamant pour cibler les triceps",
    category: "Triceps",
    muscleGroups: ["Triceps", "Pectoraux"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Extension triceps couché",
    description: "Extension des triceps allongé avec haltères",
    category: "Triceps",
    muscleGroups: ["Triceps"],
    isCustom: false,
    isPublic: true
  },

  // Abdominaux
  {
    name: "Planche",
    description: "Exercice isométrique pour le core",
    category: "Abdominaux",
    muscleGroups: ["Abdominaux", "Core"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Crunch",
    description: "Flexion des abdominaux",
    category: "Abdominaux",
    muscleGroups: ["Abdominaux"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Mountain climbers",
    description: "Exercice cardio pour les abdominaux",
    category: "Abdominaux",
    muscleGroups: ["Abdominaux", "Core"],
    isCustom: false,
    isPublic: true
  },

  // Cardio
  {
    name: "Course à pied",
    description: "Cardio de base",
    category: "Cardio",
    muscleGroups: ["Tout le corps"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Vélo",
    description: "Cardio à faible impact",
    category: "Cardio",
    muscleGroups: ["Quadriceps", "Fessiers"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Corde à sauter",
    description: "Cardio intense",
    category: "Cardio",
    muscleGroups: ["Tout le corps"],
    isCustom: false,
    isPublic: true
  },

  // Force
  {
    name: "Soulevé de terre lourd",
    description: "Exercice de force pour le dos et les jambes",
    category: "Force",
    muscleGroups: ["Dos", "Fessiers", "Ischio-jambiers", "Trapèzes"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Développé couché lourd",
    description: "Exercice de force pour les pectoraux",
    category: "Force",
    muscleGroups: ["Pectoraux", "Triceps", "Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Squat lourd",
    description: "Exercice de force pour les jambes",
    category: "Force",
    muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Développé militaire lourd",
    description: "Exercice de force pour les épaules",
    category: "Force",
    muscleGroups: ["Épaules", "Triceps", "Core"],
    isCustom: false,
    isPublic: true
  },

  // Flexibilité
  {
    name: "Étirements des ischio-jambiers",
    description: "Étirements pour améliorer la flexibilité des jambes",
    category: "Flexibilité",
    muscleGroups: ["Ischio-jambiers", "Fessiers"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Étirements des épaules",
    description: "Étirements pour améliorer la mobilité des épaules",
    category: "Flexibilité",
    muscleGroups: ["Épaules", "Pectoraux"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Étirements du dos",
    description: "Étirements pour soulager la tension du dos",
    category: "Flexibilité",
    muscleGroups: ["Dos", "Trapèzes"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Yoga flow",
    description: "Séquence de yoga pour la flexibilité générale",
    category: "Flexibilité",
    muscleGroups: ["Tout le corps"],
    isCustom: false,
    isPublic: true
  },

  // Mixte
  {
    name: "Burpees",
    description: "Exercice complet combinant force et cardio",
    category: "Mixte",
    muscleGroups: ["Tout le corps"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Mountain climbers",
    description: "Exercice cardio et core",
    category: "Mixte",
    muscleGroups: ["Abdominaux", "Core", "Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Kettlebell swing",
    description: "Exercice explosif pour le dos et les jambes",
    category: "Mixte",
    muscleGroups: ["Dos", "Fessiers", "Ischio-jambiers", "Épaules"],
    isCustom: false,
    isPublic: true
  },
  {
    name: "Thruster",
    description: "Squat + développé militaire combinés",
    category: "Mixte",
    muscleGroups: ["Quadriceps", "Fessiers", "Épaules", "Triceps"],
    isCustom: false,
    isPublic: true
  }
];

module.exports = defaultExercises;


