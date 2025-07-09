import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  dimensions, 
  scale, 
  moderateScale, 
  verticalScale,
  scaleFontSize,
  isTablet,
  responsiveValue,
  responsiveStyles 
} from '../utils/responsive';

interface QuickAccessItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  description: string;
  roomId?: string;
}

interface RecentRoute {
  id: string;
  from: string;
  to: string;
  timestamp: Date;
  duration: string;
  distance: string;
}

interface PopularDestination {
  id: string;
  name: string;
  roomNumber: string;
  visits: number;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [greeting, setGreeting] = useState('Good Morning');
  const [currentTime, setCurrentTime] = useState(new Date());

  const quickAccessItems: QuickAccessItem[] = [
    { 
      id: '1', 
      name: 'Washrooms', 
      icon: 'water-outline', 
      gradient: ['#6DD5FA', '#2980B9'],
      description: 'Find nearest washroom',
      roomId: 'washroom'
    },
    { 
      id: '2', 
      name: 'Emergency Exit', 
      icon: 'exit-outline', 
      gradient: ['#FC466B', '#3F5EFB'],
      description: 'Quickest way out',
      roomId: 'emergency'
    },
    { 
      id: '3', 
      name: 'Cafeteria', 
      icon: 'cafe-outline', 
      gradient: ['#FDBB2D', '#22C1C3'],
      description: 'Food & beverages',
      roomId: 'T137'
    },
    { 
      id: '4', 
      name: 'Library', 
      icon: 'library-outline', 
      gradient: ['#8E2DE2', '#4A00E0'],
      description: 'Study spaces',
      roomId: 'T125'
    },
    { 
      id: '5', 
      name: 'Student Services', 
      icon: 'school-outline', 
      gradient: ['#00B4DB', '#0083B0'],
      description: 'Help & information',
      roomId: 'T110'
    },
    { 
      id: '6', 
      name: 'Parking', 
      icon: 'car-outline', 
      gradient: ['#F953C6', '#B91D73'],
      description: 'Find parking spots',
      roomId: 'parking'
    },
  ];

  const [recentRoutes] = useState<RecentRoute[]>([
    { id: '1', from: 'Main Entrance', to: 'T125 - Computer Lab', timestamp: new Date(Date.now() - 3600000), duration: '3 min', distance: '120m' },
    { id: '2', from: 'T105 - Classroom', to: 'Cafeteria', timestamp: new Date(Date.now() - 7200000), duration: '2 min', distance: '85m' },
    { id: '3', from: 'Parking Lot B', to: 'T201 - Office', timestamp: new Date(Date.now() - 86400000), duration: '5 min', distance: '210m' },
  ]);

  const [popularDestinations] = useState<PopularDestination[]>([
    { id: '1', name: 'Student Services', roomNumber: 'T110', visits: 342, category: 'Services', icon: 'school-outline', color: '#3498db' },
    { id: '2', name: 'Main Auditorium', roomNumber: 'T120', visits: 289, category: 'Event Space', icon: 'people-outline', color: '#e74c3c' },
    { id: '3', name: 'Computer Lab 1', roomNumber: 'T125', visits: 256, category: 'Lab', icon: 'desktop-outline', color: '#2ecc71' },
    { id: '4', name: 'Health Services', roomNumber: 'T108', visits: 198, category: 'Services', icon: 'medical-outline', color: '#f39c12' },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleQuickAccess = (item: QuickAccessItem) => {
    navigation.navigate('Navigate', { destination: item.roomId });
  };

  const handleRecentRoute = (route: RecentRoute) => {
    Alert.alert(
      'Navigate Again?',
      `Do you want to navigate from ${route.from} to ${route.to}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Navigate', onPress: () => navigation.navigate('Navigate', { route }) }
      ]
    );
  };

  const handlePopularDestination = (destination: PopularDestination) => {
    navigation.navigate('Navigate', { destination: destination.roomNumber });
  };

  // Responsive calculations - Force 3 columns for Quick Access
  const numColumns = 3; // Fixed 3 columns for 2x3 grid
  const cardWidth = (width - dimensions.paddingM * 2 - dimensions.paddingS * (numColumns - 1)) / numColumns;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: dimensions.tabBarHeight + dimensions.paddingL }}
    >
      {/* Header Section */}
      <LinearGradient
        colors={['#2E7D32', '#4CAF50']}
        style={[styles.header, { paddingTop: insets.top + dimensions.paddingM }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{greeting}! 👋</Text>
            <Text style={styles.subGreeting}>Welcome to UFV Building T</Text>
            <Text style={styles.dateTime}>
              {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.headerIconContainer}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="notifications-outline" size={dimensions.iconM} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={[styles.quickAccessGrid, { marginHorizontal: -dimensions.paddingS / 2 }]}>
            {quickAccessItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleQuickAccess(item)}
                style={[styles.quickAccessCard, { width: cardWidth, margin: dimensions.paddingS / 2 }]}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.quickAccessGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={item.icon} size={dimensions.iconL} color="#fff" />
                  <Text style={styles.quickAccessName}>{item.name}</Text>
                  <Text style={styles.quickAccessDescription}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Routes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Routes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.recentRouteCard}
              onPress={() => handleRecentRoute(route)}
            >
              <View style={styles.routeIcon}>
                <Ionicons name="navigate" size={dimensions.iconM} color="#2E7D32" />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeText} numberOfLines={1}>
                  {route.from} → {route.to}
                </Text>
                <View style={styles.routeMetadata}>
                  <Text style={styles.routeMetaText}>
                    <Ionicons name="time-outline" size={dimensions.iconXS} /> {route.duration}
                  </Text>
                  <Text style={styles.routeMetaText}>
                    <Ionicons name="footsteps-outline" size={dimensions.iconXS} /> {route.distance}
                  </Text>
                  <Text style={styles.routeMetaText}>
                    {new Date(route.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={dimensions.iconS} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View Map</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScrollContent}
          >
            {popularDestinations.map((destination) => (
              <TouchableOpacity
                key={destination.id}
                style={[styles.popularCard, { width: responsiveValue({ tablet: scale(200), default: scale(160) }) }]}
                onPress={() => handlePopularDestination(destination)}
              >
                <View style={[styles.popularIcon, { backgroundColor: destination.color }]}>
                  <Ionicons name={destination.icon} size={dimensions.iconM} color="#fff" />
                </View>
                <Text style={styles.popularName} numberOfLines={1}>{destination.name}</Text>
                <Text style={styles.popularRoom}>{destination.roomNumber}</Text>
                <Text style={styles.popularCategory}>{destination.category}</Text>
                <View style={styles.popularStats}>
                  <Ionicons name="people-outline" size={dimensions.iconXS} color="#666" />
                  <Text style={styles.popularVisits}>{destination.visits} visits</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Building Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={styles.infoGradient}
          >
            <Ionicons name="information-circle-outline" size={dimensions.iconL} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Building T Hours</Text>
              <Text style={styles.infoText}>Monday - Friday: 7:00 AM - 10:00 PM</Text>
              <Text style={styles.infoText}>Saturday - Sunday: 8:00 AM - 6:00 PM</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingL,
    borderBottomLeftRadius: dimensions.radiusXL,
    borderBottomRightRadius: dimensions.radiusXL,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: dimensions.fontXXL,
    fontWeight: '700',
    color: '#fff',
    marginBottom: moderateScale(4),
  },
  subGreeting: {
    fontSize: dimensions.fontL,
    color: '#fff',
    opacity: 0.9,
    marginBottom: moderateScale(8),
  },
  dateTime: {
    fontSize: dimensions.fontS,
    color: '#fff',
    opacity: 0.7,
  },
  headerIconContainer: {
    flexDirection: 'row',
    marginLeft: dimensions.paddingM,
  },
  headerIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.paddingM,
  },
  section: {
    marginTop: dimensions.paddingL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  sectionTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: dimensions.fontM,
    color: '#2E7D32',
    fontWeight: '500',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickAccessCard: {
    aspectRatio: isTablet ? 1.2 : 1,
  },
  quickAccessGradient: {
    flex: 1,
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessName: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#fff',
    marginTop: dimensions.paddingS,
    textAlign: 'center',
  },
  quickAccessDescription: {
    fontSize: dimensions.fontXS,
    color: '#fff',
    opacity: 0.9,
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  recentRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
    marginBottom: dimensions.paddingS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  routeIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: dimensions.fontM,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: moderateScale(4),
  },
  routeMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  routeMetaText: {
    fontSize: dimensions.fontS,
    color: '#666',
    marginRight: dimensions.paddingM,
  },
  popularScrollContent: {
    paddingRight: dimensions.paddingM,
  },
  popularCard: {
    backgroundColor: '#fff',
    borderRadius: dimensions.radiusM,
    padding: dimensions.paddingM,
    marginRight: dimensions.paddingM,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  popularIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.paddingS,
  },
  popularName: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: moderateScale(2),
  },
  popularRoom: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: moderateScale(4),
  },
  popularCategory: {
    fontSize: dimensions.fontS,
    color: '#666',
    marginBottom: dimensions.paddingS,
  },
  popularStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularVisits: {
    fontSize: dimensions.fontXS,
    color: '#666',
    marginLeft: moderateScale(4),
  },
  infoCard: {
    marginTop: dimensions.paddingL,
    marginBottom: dimensions.paddingM,
  },
  infoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
  },
  infoContent: {
    flex: 1,
    marginLeft: dimensions.paddingM,
  },
  infoTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: moderateScale(4),
  },
  infoText: {
    fontSize: dimensions.fontS,
    color: '#666',
    lineHeight: scaleFontSize(20),
  },
});

export default HomeScreen;