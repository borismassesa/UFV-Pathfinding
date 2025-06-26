import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Get status bar height
const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
};

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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName] = useState('Student');

  // Motivational quotes that change based on time of day
  const getMotivationalQuote = () => {
    const hour = currentTime.getHours();
    const morningQuotes = [
      "Ready to navigate your academic journey",
      "Every great achievement begins with a first step",
      "Today is full of new learning opportunities",
      "Knowledge is the compass that guides your path"
    ];
    
    const afternoonQuotes = [
      "Keep exploring, keep discovering",
      "Your potential is limitless",
      "Progress happens one step at a time",
      "Navigate your way to success"
    ];
    
    const eveningQuotes = [
      "Reflect on today's achievements",
      "Tomorrow brings new possibilities",
      "Knowledge lights the way forward",
      "End your day with purpose"
    ];
    
    let quotes;
    if (hour < 12) quotes = morningQuotes;
    else if (hour < 17) quotes = afternoonQuotes;
    else quotes = eveningQuotes;
    
    // Use the hour to consistently pick the same quote for the day
    return quotes[Math.floor(hour / 6) % quotes.length];
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Modern quick access items with gradients
  const quickAccessItems: QuickAccessItem[] = [
    {
      id: '1',
      name: 'Lecture Hall',
      icon: 'school',
      gradient: ['#2E7D32', '#4CAF50'],
      description: 'T001 - Main Lecture Hall',
      roomId: 'T001'
    },
    {
      id: '2',
      name: 'Study Area',
      icon: 'library',
      gradient: ['#388E3C', '#66BB6A'],
      description: 'T033 - Quiet Study Space',
      roomId: 'T033'
    },
    {
      id: '3',
      name: 'Facilities',
      icon: 'business',
      gradient: ['#1976D2', '#42A5F5'],
      description: 'Restrooms & Services',
      roomId: 'facilities'
    },
    {
      id: '4',
      name: 'Emergency',
      icon: 'medical',
      gradient: ['#D32F2F', '#F44336'],
      description: 'Emergency Exits',
      roomId: 'emergency'
    },
  ];

  // Recent routes with modern styling
  const recentRoutes: RecentRoute[] = [
    {
      id: '1',
      from: 'Main Entrance',
      to: 'T001 - Lecture Hall',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: '3 min',
      distance: '45m'
    },
    {
      id: '2',
      from: 'T001 - Lecture Hall',
      to: 'T033 - Study Area',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      duration: '2 min',
      distance: '28m'
    },
  ];

  // Popular destinations with UFV colors
  const popularDestinations: PopularDestination[] = [
    {
      id: '1',
      name: 'Large Lecture Hall',
      roomNumber: 'T001',
      visits: 45,
      category: 'Academic',
      icon: 'school',
      color: '#2E7D32'
    },
    {
      id: '2',
      name: 'Study Area',
      roomNumber: 'T033',
      visits: 32,
      category: 'Study',
      icon: 'library',
      color: '#388E3C'
    },
    {
      id: '3',
      name: 'Computer Lab',
      roomNumber: 'T032',
      visits: 28,
      category: 'Academic',
      icon: 'desktop',
      color: '#1976D2'
    },
  ];

  const handleQuickAccess = (item: QuickAccessItem) => {
    // Navigate to Room Detail screen with room data
    const roomData = {
      id: item.roomId || 'T001',
      name: item.name,
      description: item.description,
      type: item.name.toLowerCase().includes('lecture') ? 'academic' : 
            item.name.toLowerCase().includes('study') ? 'study' : 
            item.name.toLowerCase().includes('emergency') ? 'utility' : 'academic',
      area: item.name.includes('T001') ? 372.48 : item.name.includes('T033') ? 28.3 : 50,
      capacity: item.name.includes('T001') ? 150 : item.name.includes('T033') ? 25 : 30,
      coordinates: { x: 552312.848251, y: 5430800.48876 },
      facilities: ['Projector', 'Audio System', 'WiFi'],
      accessibility: ['Wheelchair Access', 'Elevator Access'],
      hours: '7:00 AM - 10:00 PM',
      floor: 1,
    };
    
    navigation.navigate('RoomDetail' as never, { room: roomData } as never);
  };

  const handleRecentRoute = (route: RecentRoute) => {
    Alert.alert(
      '🔄 Repeat Route',
      `Navigate from ${route.from} to ${route.to}?\n\nPrevious: ${route.distance} in ${route.duration}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Navigation', 
          onPress: () => navigation.navigate('Navigate' as never)
        }
      ]
    );
  };

  const handlePopularDestination = (destination: PopularDestination) => {
    Alert.alert(
      `📍 ${destination.name}`,
      `Room ${destination.roomNumber} - ${destination.category}\n\n${destination.visits} recent visits`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate', 
          onPress: () => navigation.navigate('Navigate' as never)
        }
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Modern Professional Banner */}
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#2E7D32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernBanner}
      >
        {/* Decorative Background Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* Main Banner Content */}
        <View style={styles.bannerContent}>
          {/* Greeting Only */}
          <View style={styles.greetingSection}>
            <View>
              <Text style={styles.greetingText}>{getGreeting()}, {userName}!</Text>
              <Text style={styles.greetingSubtitle}>{getMotivationalQuote()}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Quick Access Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Quick Access</Text>
            <Text style={styles.sectionSubtitle}>Navigate to popular destinations</Text>
          </View>
          
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.quickAccessCard, { marginLeft: index % 2 === 1 ? 12 : 0 }]}
                onPress={() => handleQuickAccess(item)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.quickAccessGradient}
                >
                  <View style={styles.quickAccessIconContainer}>
                    <Ionicons name={item.icon} size={28} color="#fff" />
                  </View>
                  <Text style={styles.quickAccessTitle}>{item.name}</Text>
                  <Text style={styles.quickAccessDescription}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Routes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🕐 Recent Routes</Text>
            <Text style={styles.sectionSubtitle}>Your navigation history</Text>
          </View>
          
          {recentRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.recentRouteCard}
              onPress={() => handleRecentRoute(route)}
              activeOpacity={0.8}
            >
              <View style={styles.routeIconContainer}>
                <Ionicons name="navigate" size={24} color="#2E7D32" />
              </View>
              
              <View style={styles.routeInfo}>
                <View style={styles.routePath}>
                  <Text style={styles.routeFrom}>{route.from}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#999" style={styles.routeArrow} />
                  <Text style={styles.routeTo}>{route.to}</Text>
                </View>
                
                <View style={styles.routeMetrics}>
                  <View style={styles.metric}>
                    <Ionicons name="time" size={12} color="#2E7D32" />
                    <Text style={styles.metricText}>{route.duration}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="location" size={12} color="#388E3C" />
                    <Text style={styles.metricText}>{route.distance}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="calendar" size={12} color="#1976D2" />
                    <Text style={styles.metricText}>{formatDate(route.timestamp)}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.repeatButton}>
                <Ionicons name="refresh" size={20} color="#2E7D32" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Popular This Week</Text>
            <Text style={styles.sectionSubtitle}>Trending destinations</Text>
          </View>
          
          {popularDestinations.map((destination) => (
            <TouchableOpacity
              key={destination.id}
              style={styles.popularCard}
              onPress={() => handlePopularDestination(destination)}
              activeOpacity={0.8}
            >
              <View style={[styles.popularIcon, { backgroundColor: destination.color + '20' }]}>
                <Ionicons name={destination.icon} size={24} color={destination.color} />
              </View>
              
              <View style={styles.popularInfo}>
                <Text style={styles.popularName}>{destination.name}</Text>
                <Text style={styles.popularDetails}>{destination.roomNumber} • {destination.category}</Text>
              </View>
              
              <View style={styles.popularStats}>
                <Text style={styles.popularVisits}>{destination.visits}</Text>
                <Text style={styles.popularVisitsLabel}>visits</Text>
              </View>
              
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={14} color="#FF9800" />
              </View>
            </TouchableOpacity>
          ))}
        </View>



        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
     modernBanner: {
     paddingTop: getStatusBarHeight() + 10,
     paddingBottom: 20,
   },
   bannerContent: {
     paddingHorizontal: 24,
   },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 15,
  },
  greetingText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
     timeText: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.9)',
     fontWeight: '600',
     marginLeft: 6,
   },
  buildingStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
     buildingCardGradient: {
     flex: 1,
     padding: 16,
     borderRadius: 16,
   },
   buildingCardContent: {
     flexDirection: 'row',
     alignItems: 'center',
     width: '100%',
   },
  buildingIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buildingIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingInfo: {
    flex: 1,
  },
     buildingTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: '#1a202c',
   },
   buildingSubtitle: {
     fontSize: 14,
     color: '#718096',
     marginTop: 2,
   },
   buildingTitleWhite: {
     fontSize: 18,
     fontWeight: '700',
     color: '#fff',
     marginBottom: 4,
   },
   buildingSubtitleWhite: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.9)',
     marginBottom: 8,
   },
     statsRow: {
     flexDirection: 'row',
     marginTop: 4,
   },
   statItem: {
     flexDirection: 'row',
     alignItems: 'center',
     marginRight: 16,
   },
   statText: {
     fontSize: 12,
     color: 'rgba(255, 255, 255, 0.8)',
     fontWeight: '600',
     marginLeft: 4,
   },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
     quickStats: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginTop: 20,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 12,
     padding: 16,
   },
   quickStatItem: {
     alignItems: 'center',
     flex: 1,
   },
   quickStatNumber: {
     fontSize: 18,
     fontWeight: '700',
     color: '#fff',
     marginBottom: 2,
   },
   quickStatLabel: {
     fontSize: 11,
     color: 'rgba(255, 255, 255, 0.8)',
     textAlign: 'center',
   },
   quickStatDivider: {
     width: 1,
     height: 30,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     alignSelf: 'center',
   },
  contentContainer: {
    flex: 1,
    marginTop: -20,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickAccessCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  quickAccessGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  quickAccessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickAccessDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  recentRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routePath: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeFrom: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: 8,
  },
  routeTo: {
    fontSize: 14,
    color: '#1a202c',
    fontWeight: '700',
    flex: 1,
  },
  routeMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  repeatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  popularIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  popularInfo: {
    flex: 1,
  },
  popularName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  popularDetails: {
    fontSize: 14,
    color: '#718096',
  },
  popularStats: {
    alignItems: 'center',
    marginRight: 16,
  },
  popularVisits: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  popularVisitsLabel: {
    fontSize: 12,
    color: '#718096',
  },
  trendingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef5e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: width / 4,
    right: width / 4,
    width: width / 2,
    height: width / 2,
    borderRadius: width / 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default HomeScreen; 