import React, { useEffect } from 'react';
import { StatusBar, Alert, StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { initializeMapbox } from './config/mapbox';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTabBar from './components/CustomTabBar';

// Import all screens
import HomeScreen from './screens/HomeScreen';
import NavigationScreen from './screens/NavigationScreen';
import MapScreen from './screens/MapScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import detail screens
import RoomDetailScreen from './screens/RoomDetailScreen';
import RouteDetailScreen from './screens/RouteDetailScreen';

// Initialize Mapbox when the app starts
initializeMapbox();

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const NavigationStack = createStackNavigator();
const MapStack = createStackNavigator();
const FavoritesStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Stack Navigators for each tab
const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen 
      name="RoomDetail" 
      component={RoomDetailScreen}
      options={{
        headerShown: true,
        title: 'Room Details',
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  </HomeStack.Navigator>
);

const NavigationStackScreen = () => (
  <NavigationStack.Navigator screenOptions={{ headerShown: false }}>
    <NavigationStack.Screen name="NavigationMain" component={NavigationScreen} />
    <NavigationStack.Screen 
      name="RouteDetail" 
      component={RouteDetailScreen}
      options={{
        headerShown: true,
        title: 'Route Details',
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  </NavigationStack.Navigator>
);

const MapStackScreen = () => (
  <MapStack.Navigator screenOptions={{ headerShown: false }}>
    <MapStack.Screen name="MapMain" component={MapScreen} />
    <MapStack.Screen 
      name="RoomDetail" 
      component={RoomDetailScreen}
      options={{
        headerShown: true,
        title: 'Room Details',
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  </MapStack.Navigator>
);

const FavoritesStackScreen = () => (
  <FavoritesStack.Navigator screenOptions={{ headerShown: false }}>
    <FavoritesStack.Screen name="FavoritesMain" component={FavoritesScreen} />
    <FavoritesStack.Screen 
      name="RoomDetail" 
      component={RoomDetailScreen}
      options={{
        headerShown: true,
        title: 'Room Details',
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  </FavoritesStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="ProfileMain"
  >
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
    />
  </ProfileStack.Navigator>
);

const App: React.FC = () => {
  useEffect(() => {
    console.log('🏢 UFV Pathfinding App - Enhanced Version Started');
    
    // Welcome alert
    setTimeout(() => {
      Alert.alert(
        '🎉 Welcome to UFV Pathfinding!',
        'Navigate UFV Building T with your real indoor map data.\n\n✨ New Features:\n• Enhanced navigation\n• Proper back buttons\n• Detail screens\n• Better UI/UX\n• Quick access features',
        [{ text: 'Let\'s Explore!' }]
      );
    }, 1000);
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              color: '#1976D2',
            },
            headerTintColor: '#1976D2',
          }}
        >
        <Tab.Screen 
          name="Home" 
          component={HomeStackScreen}
          options={{
            title: '🏠 Home',
            headerTitle: '🏢 UFV Pathfinding'
          }}
        />
        <Tab.Screen 
          name="Navigate" 
          component={NavigationStackScreen}
          options={{
            title: '🧭 Navigate',
            headerTitle: '🧭 Navigation'
          }}
        />
        <Tab.Screen 
          name="Map" 
          component={MapStackScreen}
          options={{
            title: '🗺️ Map',
            headerTitle: '🗺️ Building Map'
          }}
        />
        <Tab.Screen 
          name="Favorites" 
          component={FavoritesStackScreen}
          options={{
            title: '⭐ Favorites',
            headerTitle: '⭐ My Favorites'
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStackScreen}
          options={{
            title: '👤 Profile',
            headerTitle: '👤 Settings & Profile'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    padding: 0,
    backgroundColor: '#f5f5f5',
    // Force edge-to-edge layout with aggressive constraints
    width: '100%',
    height: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginHorizontal: 0,
    marginVertical: 0,
  },
});

export default App; 