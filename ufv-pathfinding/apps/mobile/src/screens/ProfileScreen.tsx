import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  StatusBar,
  Platform,
  Dimensions,
  Vibration,
  Image,
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
  responsiveValue 
} from '../utils/responsive';
import OfflineSettings from '../components/Settings/OfflineSettings/OfflineSettings';

const { width } = Dimensions.get('window');

// Get status bar height
const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
};

interface UserSettings {
  notifications: boolean;
  voiceGuidance: boolean;
  accessibility: boolean;
  hapticFeedback: boolean;
  autoReroute: boolean;
  showDistance: boolean;
}

interface RouteHistory {
  id: string;
  from: string;
  to: string;
  date: Date;
  distance: string;
  duration: string;
  success: boolean;
}

interface AppStats {
  totalRoutes: number;
  totalDistance: string;
  favoriteRoom: string;
  successRate: number;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notifications: true,
    voiceGuidance: true,
    accessibility: false,
    hapticFeedback: true,
    autoReroute: true,
    showDistance: true,
  });

  const [routeHistory, setRouteHistory] = useState<RouteHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showOfflineSettings, setShowOfflineSettings] = useState(false);
  const [userName] = useState('Student');
  const [appStats, setAppStats] = useState<AppStats>({
    totalRoutes: 0,
    totalDistance: '0m',
    favoriteRoom: 'T001',
    successRate: 100,
  });

  // Initialize with sample data and calculate stats
  useEffect(() => {
    const sampleHistory: RouteHistory[] = [
      {
        id: '1',
        from: 'Main Entrance',
        to: 'T001 - Lecture Hall',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        distance: '45m',
        duration: '3 min',
        success: true,
      },
      {
        id: '2',
        from: 'T001 - Lecture Hall',
        to: 'T033 - Study Area',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000),
        distance: '28m',
        duration: '2 min',
        success: true,
      },
      {
        id: '3',
        from: 'T033 - Study Area',
        to: 'T032 - Classroom',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        distance: '35m',
        duration: '2 min',
        success: true,
      },
      {
        id: '4',
        from: 'T002 - Lab',
        to: 'T001 - Lecture Hall',
        date: new Date(Date.now() - 48 * 60 * 60 * 1000),
        distance: '52m',
        duration: '4 min',
        success: true,
      },
    ];

    setRouteHistory(sampleHistory);
    
    // Calculate stats
    const totalDistance = sampleHistory.reduce((acc, route) => {
      const distance = parseInt(route.distance.replace('m', ''));
      return acc + distance;
    }, 0);
    
    const successfulRoutes = sampleHistory.filter(route => route.success).length;
    const successRate = Math.round((successfulRoutes / sampleHistory.length) * 100);
    
    setAppStats({
      totalRoutes: sampleHistory.length,
      totalDistance: `${totalDistance}m`,
      favoriteRoom: 'T001',
      successRate,
    });
  }, []);

  const hapticFeedback = () => {
    if (userSettings.hapticFeedback && Platform.OS === 'ios') {
      // For iOS, we would use Haptics.impact() but we'll simulate with Vibration
      Vibration.vibrate(50);
    } else if (userSettings.hapticFeedback) {
      Vibration.vibrate(50);
    }
  };

  const handleSettingChange = (setting: keyof UserSettings, value: boolean) => {
    hapticFeedback();
    
    setUserSettings(prev => ({ ...prev, [setting]: value }));

    // Show relevant alerts for important settings
    switch (setting) {
      case 'accessibility':
        Alert.alert(
          value ? '♿ Accessibility Enabled' : '♿ Accessibility Disabled',
          value 
            ? 'Routes will prioritize wheelchair accessible paths and avoid stairs.'
            : 'Standard routing with all paths available.',
          [{ text: 'OK' }]
        );
        break;
      
      case 'voiceGuidance':
        Alert.alert(
          value ? '🔊 Voice Guidance On' : '🔊 Voice Guidance Off',
          value 
            ? 'You will receive spoken turn-by-turn directions during navigation.'
            : 'Navigation will be visual only with on-screen directions.',
          [{ text: 'OK' }]
        );
        break;
      
      case 'autoReroute':
        Alert.alert(
          value ? '🔄 Auto-Reroute Enabled' : '🔄 Auto-Reroute Disabled',
          value 
            ? 'If you deviate from your route, we\'ll automatically find a new path.'
            : 'You\'ll need to manually request a new route if you go off-path.',
          [{ text: 'OK' }]
        );
        break;
        
      case 'notifications':
        if (value) {
          Alert.alert(
            '🔔 Notifications Enabled',
            'You\'ll receive route updates, building alerts, and navigation reminders.',
            [{ text: 'OK' }]
          );
        }
        break;
    }
  };

  const handleClearHistory = () => {
    hapticFeedback();
    Alert.alert(
      '🗑️ Clear Navigation History',
      'This will permanently delete all your navigation history and reset your stats.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            setRouteHistory([]);
            setAppStats({
              totalRoutes: 0,
              totalDistance: '0m',
              favoriteRoom: '-',
              successRate: 0,
            });
            hapticFeedback();
            Alert.alert('✅ History Cleared', 'Navigation history and stats have been reset.');
          }
        }
      ]
    );
  };

  const handleRepeatRoute = (route: RouteHistory) => {
    hapticFeedback();
    Alert.alert(
      '🔄 Repeat Route',
      `Navigate from ${route.from} to ${route.to} again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate', 
          onPress: () => {
            Alert.alert('🧭 Navigation Started', 'Route has been loaded in the Navigate tab.');
          }
        }
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: dimensions.tabBarHeight + dimensions.paddingXL }}
      >
        {/* Modern Profile Header */}
        <View style={[styles.modernProfileHeader, { paddingTop: insets.top + dimensions.paddingM }]}>
          {/* Profile Avatar Section */}
          <View style={styles.profileAvatarSection}>
            <View style={styles.modernAvatarContainer}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.modernAvatarGradient}
              >
                <Text style={styles.avatarInitials}>S</Text>
              </LinearGradient>
              <TouchableOpacity style={styles.modernEditButton}>
                <Ionicons name="camera" size={scaleFontSize(12)} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* User Info */}
            <View style={styles.modernUserInfo}>
              <Text style={styles.modernUserName}>{userName}</Text>
              <Text style={styles.modernUserRole}>UFV Student</Text>
              <View style={styles.modernStatusBadge}>
                <View style={styles.modernStatusDot} />
                <Text style={styles.modernStatusText}>Online</Text>
              </View>
            </View>
            
            {/* Settings Icon */}
            <TouchableOpacity 
              style={styles.modernSettingsButton}
              onPress={() => {
                hapticFeedback();
                navigation.navigate('Settings' as never);
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={dimensions.iconM} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Modern Stats Grid */}
          <View style={styles.modernStatsGrid}>
            <View style={styles.modernStatCard}>
              <View style={styles.statIconBadge}>
                <Ionicons name="navigate" size={dimensions.iconS} color="#4CAF50" />
              </View>
              <Text style={styles.modernStatNumber}>{routeHistory.length}</Text>
              <Text style={styles.modernStatLabel}>Routes</Text>
            </View>
            
            <View style={styles.modernStatCard}>
              <View style={[styles.statIconBadge, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="footsteps" size={dimensions.iconS} color="#2196F3" />
              </View>
              <Text style={styles.modernStatNumber}>{appStats.totalDistance}</Text>
              <Text style={styles.modernStatLabel}>Distance</Text>
            </View>
            
            <View style={styles.modernStatCard}>
              <View style={[styles.statIconBadge, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="trophy" size={dimensions.iconS} color="#FF9800" />
              </View>
              <Text style={styles.modernStatNumber}>{appStats.successRate}%</Text>
              <Text style={styles.modernStatLabel}>Success</Text>
            </View>
          </View>
        </View>

        {/* Community & Social Section */}
        <View style={styles.modernSection}>
          <View style={styles.modernSectionHeader}>
            <Text style={styles.modernSectionTitle}>Community</Text>
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View All</Text>
              <Ionicons name="chevron-forward" size={dimensions.iconXS} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.communityCard}>
            <TouchableOpacity style={styles.communityItem}>
              <View style={styles.communityIcon}>
                <Ionicons name="people" size={dimensions.iconM} color="#4CAF50" />
              </View>
              <View style={styles.communityContent}>
                <Text style={styles.communityTitle}>Study Groups</Text>
                <Text style={styles.communitySubtitle}>Join 3 active groups in Building T</Text>
              </View>
              <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.modernDivider} />
            
            <TouchableOpacity style={styles.communityItem}>
              <View style={[styles.communityIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="star" size={dimensions.iconM} color="#FF9800" />
              </View>
              <View style={styles.communityContent}>
                <Text style={styles.communityTitle}>Achievements</Text>
                <Text style={styles.communitySubtitle}>2 badges earned • 1 pending</Text>
              </View>
              <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
            </TouchableOpacity>
            
            <View style={styles.modernDivider} />
            
            <TouchableOpacity style={styles.communityItem}>
              <View style={[styles.communityIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="share-social" size={dimensions.iconM} color="#2196F3" />
              </View>
              <View style={styles.communityContent}>
                <Text style={styles.communityTitle}>Share Routes</Text>
                <Text style={styles.communitySubtitle}>Help other students navigate</Text>
              </View>
              <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.modernSection}>
          <View style={styles.modernSectionHeader}>
            <Text style={styles.modernSectionTitle}>Achievements</Text>
            <View style={styles.achievementsBadge}>
              <Text style={styles.achievementsBadgeText}>2/5</Text>
            </View>
          </View>
          
          <View style={styles.achievementsScrollContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScrollContent}
            >
              <View style={styles.modernAchievementCard}>
                <LinearGradient
                  colors={['#FFD700', '#FFC107']}
                  style={styles.modernAchievementBadge}
                >
                  <Ionicons name="walk" size={dimensions.iconM} color="#fff" />
                </LinearGradient>
                <Text style={styles.modernAchievementTitle}>Explorer</Text>
                <Text style={styles.modernAchievementDesc}>Visited 10+ rooms</Text>
                <View style={styles.modernCompletedBadge}>
                  <Ionicons name="checkmark" size={scaleFontSize(10)} color="#fff" />
                  <Text style={styles.completedText}>Earned</Text>
                </View>
              </View>
              
              <View style={styles.modernAchievementCard}>
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={styles.modernAchievementBadge}
                >
                  <Ionicons name="navigate" size={dimensions.iconM} color="#fff" />
                </LinearGradient>
                <Text style={styles.modernAchievementTitle}>Navigator</Text>
                <Text style={styles.modernAchievementDesc}>First route completed</Text>
                <View style={styles.modernCompletedBadge}>
                  <Ionicons name="checkmark" size={scaleFontSize(10)} color="#fff" />
                  <Text style={styles.completedText}>Earned</Text>
                </View>
              </View>
              
              <View style={[styles.modernAchievementCard, styles.lockedCard]}>
                <View style={styles.modernLockedBadge}>
                  <Ionicons name="trophy" size={dimensions.iconM} color="#9CA3AF" />
                </View>
                <Text style={[styles.modernAchievementTitle, styles.lockedText]}>Speed Walker</Text>
                <Text style={[styles.modernAchievementDesc, styles.lockedText]}>5 fast routes</Text>
                <View style={styles.modernProgressBadge}>
                  <Text style={styles.progressBadgeText}>3/5</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.modernSection}>
          <View style={styles.modernSectionHeader}>
            <Text style={styles.modernSectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View All</Text>
              <Ionicons name="chevron-forward" size={dimensions.iconXS} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modernActivityCard}>
            <TouchableOpacity style={styles.modernActivityItem}>
              <View style={styles.modernActivityIcon}>
                <Ionicons name="location" size={dimensions.iconS} color="#4CAF50" />
              </View>
              <View style={styles.modernActivityContent}>
                <Text style={styles.modernActivityTitle}>Navigated to T-239</Text>
                <Text style={styles.modernActivityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.modernActivityDistance}>45m</Text>
            </TouchableOpacity>

            <View style={styles.modernDivider} />

            <TouchableOpacity style={styles.modernActivityItem}>
              <View style={[styles.modernActivityIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="heart" size={dimensions.iconS} color="#FF9800" />
              </View>
              <View style={styles.modernActivityContent}>
                <Text style={styles.modernActivityTitle}>Saved T-125 to favorites</Text>
                <Text style={styles.modernActivityTime}>Yesterday</Text>
              </View>
              <View style={styles.modernActivityBadge}>
                <Ionicons name="star" size={scaleFontSize(10)} color="#FF9800" />
              </View>
            </TouchableOpacity>

            <View style={styles.modernDivider} />

            <TouchableOpacity style={styles.modernActivityItem}>
              <View style={[styles.modernActivityIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="share" size={dimensions.iconS} color="#2196F3" />
              </View>
              <View style={styles.modernActivityContent}>
                <Text style={styles.modernActivityTitle}>Shared route to Library</Text>
                <Text style={styles.modernActivityTime}>2 days ago</Text>
              </View>
              <View style={[styles.modernActivityBadge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.modernBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.modernSection}>
          <Text style={styles.modernSectionTitle}>Quick Actions</Text>
          
          <View style={styles.modernQuickActionsGrid}>
            <TouchableOpacity 
              style={styles.modernQuickActionCard} 
              onPress={() => {
                hapticFeedback();
                setShowHistoryModal(true);
              }}
            >
              <View style={styles.modernQuickActionIcon}>
                <Ionicons name="time" size={dimensions.iconM} color="#4CAF50" />
              </View>
              <Text style={styles.modernQuickActionTitle}>History</Text>
              <Text style={styles.modernQuickActionSubtitle}>{routeHistory.length} routes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modernQuickActionCard} 
              onPress={() => {
                hapticFeedback();
                Alert.alert('Favorites', 'View your saved favorite rooms and locations.');
              }}
            >
              <View style={[styles.modernQuickActionIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="heart" size={dimensions.iconM} color="#E91E63" />
              </View>
              <Text style={styles.modernQuickActionTitle}>Favorites</Text>
              <Text style={styles.modernQuickActionSubtitle}>3 saved</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modernQuickActionsGrid}>
            <TouchableOpacity 
              style={styles.modernQuickActionCard} 
              onPress={() => {
                hapticFeedback();
                setShowAboutModal(true);
              }}
            >
              <View style={[styles.modernQuickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="information-circle" size={dimensions.iconM} color="#2196F3" />
              </View>
              <Text style={styles.modernQuickActionTitle}>About</Text>
              <Text style={styles.modernQuickActionSubtitle}>App info</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modernQuickActionCard} 
              onPress={() => {
                hapticFeedback();
                setShowOfflineSettings(true);
              }}
            >
              <View style={[styles.modernQuickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="cloud-offline" size={dimensions.iconM} color="#9C27B0" />
              </View>
              <Text style={styles.modernQuickActionTitle}>Offline</Text>
              <Text style={styles.modernQuickActionSubtitle}>Settings</Text>
              <View style={styles.modernNotificationDot} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Navigation History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Enhanced Header with Stats */}
          <LinearGradient
            colors={['#2E7D32', '#4CAF50']}
            style={styles.enhancedModalHeader}
          >
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  hapticFeedback();
                  setShowHistoryModal(false);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.enhancedModalTitle}>Navigation History</Text>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>{routeHistory.length}</Text>
                <Text style={styles.modalStatLabel}>Total Routes</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>{appStats.totalDistance}</Text>
                <Text style={styles.modalStatLabel}>Distance</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatNumber}>{appStats.successRate}%</Text>
                <Text style={styles.modalStatLabel}>Success Rate</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Search and Filter Bar */}
          <View style={styles.searchFilterBar}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <Text style={styles.searchPlaceholder}>Search routes...</Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          
          {routeHistory.length > 0 ? (
            <ScrollView style={styles.enhancedHistoryList} showsVerticalScrollIndicator={false}>
              {/* Today Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Today</Text>
                <Text style={styles.sectionCount}>2 routes</Text>
              </View>
              
              {routeHistory.slice(0, 2).map((route) => (
                <View key={route.id} style={styles.enhancedHistoryCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.routeStatusBadge}>
                      <Ionicons 
                        name={route.success ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={route.success ? "#4CAF50" : "#F44336"} 
                      />
                      <Text style={[
                        styles.statusText, 
                        { color: route.success ? "#4CAF50" : "#F44336" }
                      ]}>
                        {route.success ? "Completed" : "Failed"}
                      </Text>
                    </View>
                    <Text style={styles.routeTime}>{formatTime(route.date)}</Text>
                  </View>
                  
                  <View style={styles.routeDetails}>
                    <View style={styles.routeEndpoints}>
                      <View style={styles.endpoint}>
                        <View style={styles.fromDot} />
                        <Text style={styles.fromText}>{route.from}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.endpoint}>
                        <View style={styles.toDot} />
                        <Text style={styles.toText}>{route.to}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.routeMetrics}>
                      <View style={styles.metric}>
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.metricValue}>{route.distance}</Text>
                      </View>
                      <View style={styles.metric}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.metricValue}>{route.duration}</Text>
                      </View>
                      <View style={styles.metric}>
                        <Ionicons name="trending-up" size={14} color="#666" />
                        <Text style={styles.metricValue}>Easy</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleRepeatRoute(route)}
                    >
                      <Ionicons name="refresh" size={18} color="#2E7D32" />
                      <Text style={styles.actionButtonText}>Repeat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="share-outline" size={18} color="#2196F3" />
                      <Text style={[styles.actionButtonText, { color: "#2196F3" }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="heart-outline" size={18} color="#E91E63" />
                      <Text style={[styles.actionButtonText, { color: "#E91E63" }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {/* Earlier Section */}
              {routeHistory.length > 2 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>Earlier</Text>
                    <Text style={styles.sectionCount}>{routeHistory.length - 2} routes</Text>
                  </View>
                  
                  {routeHistory.slice(2).map((route) => (
                    <View key={route.id} style={styles.enhancedHistoryCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.routeStatusBadge}>
                          <Ionicons 
                            name={route.success ? "checkmark-circle" : "close-circle"} 
                            size={16} 
                            color={route.success ? "#4CAF50" : "#F44336"} 
                          />
                          <Text style={[
                            styles.statusText, 
                            { color: route.success ? "#4CAF50" : "#F44336" }
                          ]}>
                            {route.success ? "Completed" : "Failed"}
                          </Text>
                        </View>
                        <Text style={styles.routeTime}>{formatDate(route.date)}</Text>
                      </View>
                      
                      <View style={styles.routeDetails}>
                        <View style={styles.routeEndpoints}>
                          <View style={styles.endpoint}>
                            <View style={styles.fromDot} />
                            <Text style={styles.fromText}>{route.from}</Text>
                          </View>
                          <View style={styles.routeLine} />
                          <View style={styles.endpoint}>
                            <View style={styles.toDot} />
                            <Text style={styles.toText}>{route.to}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.routeMetrics}>
                          <View style={styles.metric}>
                            <Ionicons name="location" size={14} color="#666" />
                            <Text style={styles.metricValue}>{route.distance}</Text>
                          </View>
                          <View style={styles.metric}>
                            <Ionicons name="time" size={14} color="#666" />
                            <Text style={styles.metricValue}>{route.duration}</Text>
                          </View>
                          <View style={styles.metric}>
                            <Ionicons name="trending-up" size={14} color="#666" />
                            <Text style={styles.metricValue}>Easy</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.cardActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleRepeatRoute(route)}
                        >
                          <Ionicons name="refresh" size={18} color="#2E7D32" />
                          <Text style={styles.actionButtonText}>Repeat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="share-outline" size={18} color="#2196F3" />
                          <Text style={[styles.actionButtonText, { color: "#2196F3" }]}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="heart-outline" size={18} color="#E91E63" />
                          <Text style={[styles.actionButtonText, { color: "#E91E63" }]}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}
              
              <View style={styles.historyBottomPadding} />
            </ScrollView>
          ) : (
            <View style={styles.enhancedEmptyState}>
              <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                style={styles.emptyStateBackground}
              >
                <Ionicons name="map-outline" size={64} color="#dee2e6" />
                <Text style={styles.enhancedEmptyTitle}>No Navigation History</Text>
                <Text style={styles.enhancedEmptySubtitle}>
                  Start navigating to see your route history here
                </Text>
                <TouchableOpacity 
                  style={styles.startNavigationButton}
                  onPress={() => {
                    setShowHistoryModal(false);
                    // Navigate to Navigation tab would go here
                  }}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.startNavigationButtonText}>Start Your First Route</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>
      </Modal>

      {/* Enhanced About App Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* UFV-Themed About Header */}
          <LinearGradient
            colors={['#2E7D32', '#4CAF50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aboutHeader}
          >
            <View style={styles.aboutHeaderContent}>
              <TouchableOpacity
                style={styles.aboutBackButton}
                onPress={() => {
                  hapticFeedback();
                  setShowAboutModal(false);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              {/* App Logo Section */}
              <View style={styles.appLogoSection}>
                <View style={styles.appIconContainer}>
                  <View style={styles.appIconCircle}>
                    <Ionicons name="school" size={32} color="#2E7D32" />
                  </View>
                </View>
                <Text style={styles.aboutAppName}>UFV Pathfinding</Text>
                <Text style={styles.aboutAppTagline}>Building T Navigation</Text>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionText}>v1.0.0</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          
          <ScrollView style={styles.aboutContentEnhanced} showsVerticalScrollIndicator={false}>
            {/* App Description */}
            <View style={styles.aboutDescriptionCard}>
              <Text style={styles.aboutDescription}>
                Navigate UFV Building T with ease using real architectural data and intelligent pathfinding designed specifically for students, faculty, and visitors.
              </Text>
            </View>

            {/* Core Features */}
            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>🎯 Core Features</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.coreFeatureIcon}>
                    <Ionicons name="navigate" size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Indoor Navigation</Text>
                    <Text style={styles.featureDescription}>Turn-by-turn directions inside Building T</Text>
                  </View>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.coreFeatureIcon}>
                    <Ionicons name="accessibility" size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Accessibility Routes</Text>
                    <Text style={styles.featureDescription}>Wheelchair-accessible path options</Text>
                  </View>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.coreFeatureIcon}>
                    <Ionicons name="map" size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Interactive Map</Text>
                    <Text style={styles.featureDescription}>Visual floor plan with room locations</Text>
                  </View>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.coreFeatureIcon}>
                    <Ionicons name="time" size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Navigation History</Text>
                    <Text style={styles.featureDescription}>Track and repeat your routes</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Building Information */}
            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>🏫 Building T Details</Text>
              <View style={styles.buildingStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Rooms</Text>
                  <Text style={styles.statValue}>34+ mapped rooms</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Room Types</Text>
                  <Text style={styles.statValue}>Classrooms, Labs, Offices</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Data Source</Text>
                  <Text style={styles.statValue}>Official UFV building plans</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Campus</Text>
                  <Text style={styles.statValue}>UFV Abbotsford</Text>
                </View>
              </View>
            </View>

            {/* App Support */}
            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>🛠️ Support & Feedback</Text>
              <View style={styles.supportActions}>
                <TouchableOpacity style={styles.supportButton}>
                  <Ionicons name="help-circle-outline" size={20} color="#4CAF50" />
                  <Text style={styles.supportButtonText}>Help & FAQ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.supportButton}>
                  <Ionicons name="chatbubble-outline" size={20} color="#4CAF50" />
                  <Text style={styles.supportButtonText}>Send Feedback</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Version & Copyright */}
            <View style={styles.aboutCard}>
              <View style={styles.versionInfo}>
                <Text style={styles.versionInfoText}>UFV Pathfinding v1.0.0</Text>
                <Text style={styles.copyrightInfo}>
                  Developed for the UFV community
                </Text>
                <Text style={styles.copyrightInfo}>
                  © 2024 University of the Fraser Valley
                </Text>
              </View>
            </View>

            <View style={styles.aboutBottomPadding} />
          </ScrollView>
        </View>
      </Modal>

      {/* Offline Settings Modal */}
      <Modal
        visible={showOfflineSettings}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowOfflineSettings(false)}
      >
        <OfflineSettings onClose={() => setShowOfflineSettings(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  
  // Modern Profile Header
  modernProfileHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingL,
  },
  profileAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.paddingL,
  },
  modernAvatarContainer: {
    position: 'relative',
    marginRight: dimensions.paddingM,
  },
  modernAvatarGradient: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarInitials: {
    fontSize: dimensions.fontXXL,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  modernUserInfo: {
    flex: 1,
  },
  modernUserName: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#111827',
    marginBottom: moderateScale(2),
  },
  modernUserRole: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginBottom: moderateScale(8),
    fontWeight: '500',
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
  },
  modernStatusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#4CAF50',
    marginRight: moderateScale(6),
  },
  modernStatusText: {
    fontSize: dimensions.fontXS,
    color: '#15803D',
    fontWeight: '600',
  },
  modernSettingsButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  // Modern Stats Grid
  modernStatsGrid: {
    flexDirection: 'row',
    gap: dimensions.paddingM,
  },
  modernStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  modernStatNumber: {
    fontSize: dimensions.fontXL,
    fontWeight: '800',
    color: '#111827',
    marginBottom: moderateScale(4),
  },
  modernStatLabel: {
    fontSize: dimensions.fontXS,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Modern Sections
  modernSection: {
    marginTop: dimensions.paddingL,
    paddingHorizontal: dimensions.paddingM,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  modernSectionTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '800',
    color: '#111827',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  viewMoreText: {
    fontSize: dimensions.fontXS,
    color: '#15803D',
    fontWeight: '600',
    marginRight: moderateScale(4),
  },
  
  // Community Card
  communityCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.paddingM,
  },
  communityIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  communityContent: {
    flex: 1,
  },
  communityTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
    marginBottom: moderateScale(2),
  },
  communitySubtitle: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
  },
  modernDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: dimensions.paddingM,
  },
  
  // Achievements
  achievementsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  achievementsBadgeText: {
    fontSize: dimensions.fontXS,
    color: '#92400E',
    fontWeight: '600',
  },
  achievementsScrollContainer: {
    marginHorizontal: -dimensions.paddingM,
  },
  achievementsScrollContent: {
    paddingHorizontal: dimensions.paddingM,
    gap: dimensions.paddingM,
  },
  modernAchievementCard: {
    width: moderateScale(140),
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  modernAchievementBadge: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modernAchievementTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  modernAchievementDesc: {
    fontSize: dimensions.fontXS,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  modernCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  completedText: {
    fontSize: scaleFontSize(9),
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: moderateScale(4),
  },
  lockedCard: {
    opacity: 0.6,
  },
  modernLockedBadge: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  modernProgressBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
  },
  progressBadgeText: {
    fontSize: scaleFontSize(9),
    color: '#6B7280',
    fontWeight: '600',
  },
  
  // Modern Activity
  modernActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.paddingM,
  },
  modernActivityIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
    marginBottom: moderateScale(2),
  },
  modernActivityTime: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
  },
  modernActivityDistance: {
    fontSize: dimensions.fontS,
    fontWeight: '700',
    color: '#4CAF50',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  modernActivityBadge: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernBadgeText: {
    fontSize: scaleFontSize(9),
    fontWeight: '700',
    color: '#2196F3',
  },
  
  // Modern Quick Actions
  modernQuickActionsGrid: {
    flexDirection: 'row',
    gap: dimensions.paddingM,
    marginBottom: dimensions.paddingM,
  },
  modernQuickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  modernQuickActionIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  modernQuickActionTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  modernQuickActionSubtitle: {
    fontSize: dimensions.fontXS,
    color: '#6B7280',
    textAlign: 'center',
  },
  modernNotificationDot: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#EF4444',
  },
  // Additional spacing
  bottomPadding: {
    height: dimensions.paddingXXL,
  },



  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Enhanced Modal Header Styles
  enhancedModalHeader: {
    paddingTop: getStatusBarHeight() + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  modalStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  
  // Search and Filter Bar
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 16,
    color: '#999',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Enhanced History List
  enhancedHistoryList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
  },
  
  // Enhanced History Cards
  enhancedHistoryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  routeTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Route Details
  routeDetails: {
    marginBottom: 16,
  },
  routeEndpoints: {
    marginBottom: 12,
  },
  endpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  fromDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  toDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginRight: 12,
  },
  fromText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  toText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 3,
    marginVertical: 2,
  },
  routeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Card Actions
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 4,
  },
  
  // Enhanced Empty State
  enhancedEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateBackground: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 60,
    borderRadius: 20,
  },
  enhancedEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#495057',
    marginTop: 20,
    marginBottom: 8,
  },
  enhancedEmptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  startNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startNavigationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyBottomPadding: {
    height: 40,
  },
  

  // Enhanced About Modal Styles
  aboutHeader: {
    paddingTop: getStatusBarHeight() + 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  aboutHeaderContent: {
    alignItems: 'center',
  },
  aboutBackButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  appLogoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  appIconContainer: {
    marginBottom: 16,
  },
  appIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aboutAppName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  aboutAppTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Enhanced Content Styles
  aboutContentEnhanced: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  aboutDescriptionCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  aboutDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  aboutCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  
  // Core Features List (UFV-themed)
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coreFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Building Stats (simplified)
  buildingStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E8',
  },
  statLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // Support Actions (simplified)
  supportActions: {
    gap: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E7D32',
    marginLeft: 12,
  },
  
  // Version Info (simplified)
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  versionInfoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 12,
  },
  copyrightInfo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutBottomPadding: {
    height: 40,
  },
  
});

export default ProfileScreen; 