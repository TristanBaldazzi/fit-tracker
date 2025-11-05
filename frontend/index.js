import { registerRootComponent } from 'expo';

// FORCER React à être disponible globalement AVANT tout import
import React from 'react';

// S'assurer que React est disponible globalement pour toutes les dépendances
if (typeof global !== 'undefined') {
  global.React = React;
}

// S'assurer que React.useState est bien disponible
if (!React || !React.useState) {
  throw new Error(`React is not properly loaded. React: ${typeof React}, useState: ${typeof React?.useState}`);
}

// Logs détaillés pour diagnostiquer le problème React
console.log('🔍 [index.js] Démarrage de l\'application');
console.log('🔍 [index.js] React:', React);
console.log('🔍 [index.js] React.useState:', React?.useState);
console.log('🔍 [index.js] React.version:', React?.version);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

