import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'Navigate':
        return focused ? 'navigate' : 'navigate-outline';
      case 'Map':
        return focused ? 'map' : 'map-outline';
      case 'Favorites':
        return focused ? 'heart' : 'heart-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'help-outline';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Home':
        return 'Home';
      case 'Navigate':
        return 'Navigate';
      case 'Map':
        return 'Map';
      case 'Favorites':
        return 'Favorites';
      case 'Profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View style={[
      styles.tabBar,
      {
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 15,
        height: Platform.OS === 'ios' ? 85 + insets.bottom : 70,
        width: screenWidth,
        left: 0,
        right: 0,
        bottom: 0,
        // Override any parent constraints
        position: 'absolute',
        zIndex: 1000,
        elevation: 1000,
        transform: [{ translateX: 0 }], // Force exact positioning
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.6}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={getIconName(route.name, isFocused)}
              size={24}
              color={isFocused ? '#2196F3' : '#757575'}
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? '#2196F3' : '#757575' }
            ]}>
              {getTabLabel(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    // Force edge-to-edge with aggressive styling
    marginHorizontal: 0,
    marginVertical: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 0,
    // Use exact positioning
    alignSelf: 'stretch',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 8,
    // Debug: temporary red background to see exact positioning
    backgroundColor: '#ff0000', // Red background to see boundaries - REMOVE AFTER TESTING
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default CustomTabBar; 