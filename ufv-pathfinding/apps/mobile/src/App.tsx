import React, { useEffect } from 'react';
import { StatusBar, Alert, StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import OfflineNavigationService from './services/OfflineNavigationService';

// Import all screens
import HomeScreen from './screens/HomeScreen';
import NavigationScreen from './screens/NavigationScreen';
import MapScreen from './screens/MapScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import detail screens
import RoomDetailScreen from './screens/RoomDetailScreen';
import RouteDetailScreen from './screens/RouteDetailScreen';

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
    console.log('🏢 UFV Indoor Navigation initialized with real shapefile data');
    console.log('🗺️ Using BuildingTRooms.shp coordinate system: EPSG:26910 (NAD83 / UTM zone 10N)');
    
    // Initialize offline navigation service
    const initializeOfflineServices = async () => {
      try {
        await OfflineNavigationService.initialize();
        console.log('✅ Offline navigation service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize offline services:', error);
      }
    };

    initializeOfflineServices();
    
    // Welcome alert
    setTimeout(() => {
      Alert.alert(
        '🎉 Welcome to UFV Pathfinding!',
        'Navigate UFV Building T with your real indoor map data.\n\n✨ Features:\n• Enhanced navigation\n• Offline support\n• Real-time updates\n• Beacon positioning\n• Turn-by-turn directions',
        [{ text: 'Let\'s Explore!' }]
      );
    }, 1000);
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <View style={styles.container}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Navigate') {
                iconName = focused ? 'navigate' : 'navigate-outline';
              } else if (route.name === 'Map') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'Favorites') {
                iconName = focused ? 'heart' : 'heart-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: '#757575',
            tabBarStyle: {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: Platform.OS === 'ios' ? 85 : 70,
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              paddingBottom: Platform.OS === 'ios' ? 25 : 10,
              paddingTop: 8,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 5,
              marginTop: 2,
            },
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
          })}
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
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App; 