import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

// Import des écrans
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import EmailVerificationScreen from './src/screens/auth/EmailVerificationScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import SessionsScreen from './src/screens/main/SessionsScreen';
import CalendarScreen from './src/screens/main/CalendarScreen';
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
import EditCompletedSessionScreen from './src/screens/sessions/EditCompletedSessionScreen';
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
// Import du service de notifications
import notificationService from './src/services/notificationService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation principale avec onglets
function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Sessions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 0,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 60 + Math.max(insets.bottom, 10) : 60,
          minHeight: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
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
        name="Calendar" 
        component={CalendarScreen} 
        options={{ title: 'Calendrier' }}
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

  // Configurer les gestionnaires de notifications
  React.useEffect(() => {
    if (isAuthenticated) {
      // Utiliser setTimeout pour s'assurer que la navigation est prête
      setTimeout(() => {
        notificationService.setupNotificationHandlers(navigationRef.current);
      }, 1000);
    }
  }, [isAuthenticated]);

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
            name="EditCompletedSession"
            component={EditCompletedSessionScreen} 
            options={{ 
              title: 'Modifier Séance',
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

// Error Boundary pour capturer les erreurs React
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erreur capturée par ErrorBoundary:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Info erreur:', errorInfo);
    console.error('❌ ComponentStack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oups ! Une erreur est survenue</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Erreur inconnue'}
          </Text>
          <Text style={styles.errorText}>
            {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
          </Text>
          {this.state.errorInfo && (
            <Text style={styles.errorDetails}>
              {JSON.stringify(this.state.errorInfo, null, 2)}
            </Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper pour PaperProvider qui s'assure que React est disponible
function SafePaperProvider({ children, theme }) {
  // S'assurer que React est disponible avant d'utiliser PaperProvider
  if (!React || !React.useState) {
    console.error('❌ [SafePaperProvider] React ou React.useState est null');
    throw new Error('React is not available in SafePaperProvider');
  }
  
  // S'assurer que React est disponible globalement pour PaperProvider
  if (typeof global !== 'undefined') {
    global.React = React;
  }
  
  console.log('✅ [SafePaperProvider] React disponible, rendu de PaperProvider');
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}

// Navigation ref pour les notifications
const navigationRef = React.createRef();

// Composant principal de l'application
export default function App() {
  // S'assurer que React est disponible globalement AVANT tout rendu
  if (typeof global !== 'undefined') {
    global.React = React;
  }
  
  // Logs détaillés avant l'utilisation de PaperProvider
  console.log('🔍 [App] Début du composant App');
  console.log('🔍 [App] React:', React);
  console.log('🔍 [App] React.useState:', React?.useState);
  console.log('🔍 [App] React.version:', React?.version);
  console.log('🔍 [App] PaperProvider:', PaperProvider);
  
  if (!React) {
    console.error('❌ [App] React est null avant PaperProvider');
    throw new Error('React is null in App component');
  }
  
  if (!React.useState) {
    console.error('❌ [App] React.useState est null avant PaperProvider');
    console.error('❌ [App] React keys:', Object.keys(React || {}));
    throw new Error('React.useState is null in App component');
  }
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SafePaperProvider theme={theme}>
          <AuthProvider>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator />
            </NavigationContainer>
            <StatusBar style="light" />
          </AuthProvider>
        </SafePaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 10,
    color: '#999',
    textAlign: 'left',
    marginTop: 10,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
