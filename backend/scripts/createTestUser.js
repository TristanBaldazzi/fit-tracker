const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fittracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Fonction pour créer un utilisateur de test
const createTestUser = async () => {
  try {
    console.log('🔧 Création d\'un utilisateur de test...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [
        { email: 'test@example.com' },
        { username: 'testuser' }
      ]
    });
    
    if (existingUser) {
      console.log('⚠️  Un utilisateur de test existe déjà:');
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Username: ${existingUser.username}`);
      console.log(`   - Email vérifié: ${existingUser.emailVerified}`);
      console.log(`   - ID: ${existingUser._id}`);
      
      // Mettre à jour pour s'assurer qu'il est vérifié
      if (!existingUser.emailVerified) {
        existingUser.emailVerified = true;
        existingUser.verificationCode = null;
        existingUser.verificationCodeExpires = null;
        await existingUser.save();
        console.log('✅ Email marqué comme vérifié');
      }
      
      return existingUser;
    }
    
    // Créer un nouvel utilisateur de test
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123', // Le mot de passe sera hashé automatiquement
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      emailVerified: true, // Marqué comme vérifié dès la création
      verificationCode: null,
      verificationCodeExpires: null,
      level: 5,
      xp: 250,
      totalSessionsCompleted: 3,
      stats: {
        totalWorkoutTime: 180, // 3 heures en minutes
        totalWeightLifted: 1500, // 1500 kg
        favoriteExercise: 'Squat',
        joinDate: new Date()
      },
      settings: {
        isPublic: true,
        notifications: true,
        units: 'metric'
      }
    });
    
    await testUser.save();
    
    console.log('✅ Utilisateur de test créé avec succès !');
    console.log('📋 Informations de l\'utilisateur:');
    console.log(`   - ID: ${testUser._id}`);
    console.log(`   - Email: ${testUser.email}`);
    console.log(`   - Username: ${testUser.username}`);
    console.log(`   - Nom: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   - Email vérifié: ${testUser.emailVerified}`);
    console.log(`   - Niveau: ${testUser.level}`);
    console.log(`   - XP: ${testUser.xp}`);
    console.log(`   - Séances complétées: ${testUser.totalSessionsCompleted}`);
    console.log(`   - Profil public: ${testUser.settings.isPublic}`);
    
    return testUser;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
};

// Fonction pour créer plusieurs utilisateurs de test
const createMultipleTestUsers = async () => {
  const testUsers = [
    {
      email: 'alice@example.com',
      password: 'password123',
      firstName: 'Alice',
      lastName: 'Dupont',
      username: 'alice_dupont',
      level: 3,
      xp: 150
    },
    {
      email: 'bob@example.com',
      password: 'password123',
      firstName: 'Bob',
      lastName: 'Martin',
      username: 'bob_martin',
      level: 7,
      xp: 400
    },
    {
      email: 'charlie@example.com',
      password: 'password123',
      firstName: 'Charlie',
      lastName: 'Wilson',
      username: 'charlie_wilson',
      level: 2,
      xp: 80
    }
  ];
  
  console.log('🔧 Création de plusieurs utilisateurs de test...');
  
  for (const userData of testUsers) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });
      
      if (existingUser) {
        console.log(`⚠️  Utilisateur ${userData.username} existe déjà`);
        continue;
      }
      
      const user = new User({
        ...userData,
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
        totalSessionsCompleted: Math.floor(Math.random() * 10),
        stats: {
          totalWorkoutTime: Math.floor(Math.random() * 300),
          totalWeightLifted: Math.floor(Math.random() * 2000),
          favoriteExercise: 'Développé couché',
          joinDate: new Date()
        },
        settings: {
          isPublic: true,
          notifications: true,
          units: 'metric'
        }
      });
      
      await user.save();
      console.log(`✅ Utilisateur ${userData.username} créé`);
      
    } catch (error) {
      console.error(`❌ Erreur création ${userData.username}:`, error.message);
    }
  }
};

// Fonction principale
const main = async () => {
  try {
    await connectDB();
    
    // Créer l'utilisateur principal de test
    await createTestUser();
    
    console.log('\n' + '='.repeat(50));
    
    // Demander si on veut créer d'autres utilisateurs
    const args = process.argv.slice(2);
    if (args.includes('--multiple')) {
      await createMultipleTestUsers();
    }
    
    console.log('\n🎉 Script terminé avec succès !');
    console.log('\n📝 Informations de connexion:');
    console.log('   Email: test@example.com');
    console.log('   Mot de passe: password123');
    console.log('   Username: testuser');
    
  } catch (error) {
    console.error('❌ Erreur dans le script:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { createTestUser, createMultipleTestUsers };

