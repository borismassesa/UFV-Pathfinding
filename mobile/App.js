import React, { useEffect } from 'react';
import { StatusBar, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { initializeMapbox } from './src/config/mapbox';

// Import all screens
import HomeScreen from './src/screens/HomeScreen';
import NavigationScreen from './src/screens/NavigationScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Initialize Mapbox when the app starts
initializeMapbox();

const Tab = createBottomTabNavigator();

const App = () => {
  useEffect(() => {
    console.log('🏢 UFV Indoor Navigation initialized with real shapefile data');
    console.log('🗺️ Using BuildingTRooms.shp coordinate system: EPSG:26910 (NAD83 / UTM zone 10N)');
    
    // Welcome alert
    setTimeout(() => {
      Alert.alert(
        '🎉 UFV Pathfinding Ready!',
        'Navigate UFV Building T with your real indoor map data!\n\n✨ Features:\n• Modern 5-tab navigation\n• Real A* pathfinding\n• 34 mapped rooms\n• Interactive floor plan\n• Favorites & history',
        [{ text: 'Let\'s Navigate!' }]
      );
    }, 1500);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Navigate') {
              iconName = focused ? 'navigate' : 'navigate-outline';
            } else if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={focused ? 26 : 22} color={color} />;
          },
          tabBarActiveTintColor: '#2E7D32',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 25 : 15,
            left: 20,
            right: 20,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 15,
            height: Platform.OS === 'ios' ? 85 : 75,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.05)',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
            marginBottom: Platform.OS === 'ios' ? 0 : 5,
          },
          tabBarItemStyle: {
            paddingVertical: 5,
          },
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowColor: 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#1f2937',
          },
          headerTintColor: '#2E7D32',
          tabBarHideOnKeyboard: true,
        })}
        sceneContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 110 : 90,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        <Tab.Screen 
          name="Navigate" 
          component={NavigationScreen}
          options={{
            title: 'Navigate',
            headerTitle: '🧭 A* Navigation',
            headerTitleAlign: 'center',
          }}
        />
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            title: 'Map',
            headerTitle: '🗺️ Floor Plan',
            headerTitleAlign: 'center',
            tabBarBadge: '34',
            tabBarBadgeStyle: {
              backgroundColor: '#2E7D32',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '700',
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              marginTop: -2,
            },
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            title: 'Profile',
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App; 