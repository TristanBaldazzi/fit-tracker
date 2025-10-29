import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// Import des écrans
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import EmailVerificationScreen from './src/screens/auth/EmailVerificationScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import SessionsScreen from './src/screens/main/SessionsScreen';
import ExercisesScreen from './src/screens/main/ExercisesScreen';
import FriendsScreen from './src/screens/main/FriendsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';
import CreateSessionScreen from './src/screens/sessions/CreateSessionScreen';
import EditSessionScreen from './src/screens/sessions/EditSessionScreen';
import SessionDetailScreen from './src/screens/sessions/SessionDetailScreen';
import SessionInProgressScreen from './src/screens/sessions/SessionInProgressScreen';
import SessionHistoryScreen from './src/screens/sessions/SessionHistoryScreen';
import SessionHistoryDetailScreen from './src/screens/sessions/SessionHistoryDetailScreen';
import CreateExerciseScreen from './src/screens/exercises/CreateExerciseScreen';
import EditExerciseScreen from './src/screens/exercises/EditExerciseScreen';
import UserProfileScreen from './src/screens/friends/UserProfileScreen';
import UserSessionsScreen from './src/screens/friends/UserSessionsScreen';
import UserSessionDetailScreen from './src/screens/friends/UserSessionDetailScreen';
import LeaderboardScreen from './src/screens/friends/LeaderboardScreen';

// Import du thème
import { theme } from './src/styles/theme';

// Import du contexte d'authentification
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation principale avec onglets
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Sessions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Sessions" 
        component={SessionsScreen} 
        options={{ title: 'Séances' }}
      />
      <Tab.Screen 
        name="Exercises" 
        component={ExercisesScreen} 
        options={{ title: 'Exercices' }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen} 
        options={{ title: 'Amis' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// Navigation d'authentification
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Connexion' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Inscription' }}
      />
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen} 
        options={{ title: 'Vérification Email' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Mot de passe oublié' }}
      />
    </Stack.Navigator>
  );
}

// Navigation principale de l'application
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Ou un écran de chargement
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CreateSession" 
            component={CreateSessionScreen} 
            options={{ 
              title: 'Nouvelle Séance',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="EditSession" 
            component={EditSessionScreen} 
            options={{ 
              title: 'Modifier Séance',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="SessionDetail" 
            component={SessionDetailScreen} 
            options={{ 
              title: 'Détails Séance',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="SessionInProgress" 
            component={SessionInProgressScreen} 
            options={{ 
              title: 'Séance en cours',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="SessionHistory" 
            component={SessionHistoryScreen} 
            options={{ 
              title: 'Historique',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="SessionHistoryDetail" 
            component={SessionHistoryDetailScreen} 
            options={{ 
              title: 'Détails Séance',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="CreateExercise" 
            component={CreateExerciseScreen} 
            options={{ 
              title: 'Nouvel Exercice',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="EditExercise" 
            component={EditExerciseScreen} 
            options={{ 
              title: 'Modifier Exercice',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="UserProfile"
            component={UserProfileScreen} 
            options={{ 
              title: 'Profil Utilisateur',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="UserSessions"
            component={UserSessionsScreen} 
            options={({ route }) => ({ 
              title: `Séances de ${route.params?.userName || 'Utilisateur'}`,
              headerBackTitle: 'Retour'
            })}
          />
          <Stack.Screen 
            name="UserSessionDetail"
            component={UserSessionDetailScreen} 
            options={({ route }) => ({ 
              title: route.params?.session?.name || 'Détails Séance',
              headerBackTitle: 'Retour'
            })}
          />
          <Stack.Screen 
            name="Leaderboard" 
            component={LeaderboardScreen} 
            options={{ 
              title: 'Classement',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ 
              title: 'Paramètres',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="EmailVerification" 
            component={EmailVerificationScreen} 
            options={{ 
              title: 'Vérification Email',
              headerBackTitle: 'Retour'
            }}
          />
          <Stack.Screen 
            name="ChangePassword" 
            component={ChangePasswordScreen} 
            options={{ 
              title: 'Changer le mot de passe',
              headerBackTitle: 'Retour'
            }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator} 
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

// Composant principal de l'application
export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </AuthProvider>
    </PaperProvider>
  );
}
