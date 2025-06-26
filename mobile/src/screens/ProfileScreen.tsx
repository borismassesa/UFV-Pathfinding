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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileContainer}>
          <LinearGradient
            colors={['#2E7D32', '#4CAF50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradientHeader}
          >
            <View style={styles.profileHeaderContent}>
              {/* Profile Picture and Basic Info */}
              <View style={styles.profileMainSection}>
                <View style={styles.profileAvatarContainer}>
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person" size={40} color="#2E7D32" />
                  </View>
                  <TouchableOpacity style={styles.editAvatarButton}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userName}</Text>
                  <Text style={styles.profileRole}>UFV Student</Text>
                  <View style={styles.profileStatusContainer}>
                    <View style={styles.onlineIndicator} />
                    <Text style={styles.profileStatus}>Active now</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.settingsButton}
                  onPress={() => {
                    hapticFeedback();
                    Alert.alert('⚙️ Settings', 'Settings functionality coming soon!');
                  }}
                >
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Enhanced Navigation Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.routesStatCard]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="navigate" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statNumber}>{routeHistory.length}</Text>
              <Text style={styles.statLabel}>Routes Taken</Text>
              <View style={styles.statProgress}>
                <View style={[styles.progressBar, { width: '80%', backgroundColor: '#4CAF50' }]} />
              </View>
            </View>
            
            <View style={[styles.statCard, styles.distanceStatCard]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="location" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statNumber}>{appStats.totalDistance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
              <View style={styles.statProgress}>
                <View style={[styles.progressBar, { width: '65%', backgroundColor: '#2196F3' }]} />
              </View>
            </View>
            
            <View style={[styles.statCard, styles.successStatCard]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#FF9800" />
              </View>
              <Text style={styles.statNumber}>{appStats.successRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
              <View style={styles.statProgress}>
                <View style={[styles.progressBar, { width: '100%', backgroundColor: '#FF9800' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Achievements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.modernSectionTitle}>🏆 Achievements</Text>
            <View style={styles.achievementProgress}>
              <Text style={styles.progressText}>2/3</Text>
            </View>
          </View>
          
          <View style={styles.achievementsCard}>
            <TouchableOpacity style={styles.enhancedAchievementItem}>
              <LinearGradient
                colors={['#FFD700', '#FFC107']}
                style={styles.premiumAchievementBadge}
              >
                <Ionicons name="walk" size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Explorer</Text>
                <Text style={styles.achievementDesc}>Visited 10+ different rooms</Text>
                <View style={styles.achievementReward}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.rewardText}>+50 XP</Text>
                </View>
              </View>
              <View style={styles.achievementMeta}>
                <Text style={styles.achievementDate}>3 days ago</Text>
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.achievementDivider} />

            <TouchableOpacity style={styles.enhancedAchievementItem}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.premiumAchievementBadge}
              >
                <Ionicons name="navigate" size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Navigator</Text>
                <Text style={styles.achievementDesc}>Completed first route</Text>
                <View style={styles.achievementReward}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.rewardText}>+25 XP</Text>
                </View>
              </View>
              <View style={styles.achievementMeta}>
                <Text style={styles.achievementDate}>1 week ago</Text>
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.achievementDivider} />

            <TouchableOpacity style={[styles.enhancedAchievementItem, styles.lockedAchievement]}>
              <View style={styles.lockedAchievementBadge}>
                <Ionicons name="star" size={22} color="#9E9E9E" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, { color: '#9E9E9E' }]}>Speed Walker</Text>
                <Text style={[styles.achievementDesc, { color: '#BDBDBD' }]}>Complete 5 routes in under 2 minutes</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '60%' }]} />
                  <Text style={styles.progressLabel}>3/5 routes</Text>
                </View>
              </View>
              <View style={styles.achievementMeta}>
                <Text style={[styles.achievementDate, { color: '#9E9E9E' }]}>Locked</Text>
                <View style={styles.lockIcon}>
                  <Ionicons name="lock-closed" size={12} color="#9E9E9E" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.modernSectionTitle}>📅 Recent Activity</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.enhancedActivityCard}>
            <View style={styles.activityList}>
              <TouchableOpacity style={styles.enhancedActivityItem}>
                <LinearGradient
                  colors={['#E8F5E8', '#C8E6C9']}
                  style={styles.activityIconGradient}
                >
                  <Ionicons name="location" size={18} color="#4CAF50" />
                </LinearGradient>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>Navigated to Room T-239</Text>
                  <Text style={styles.activityTime}>2 hours ago • Computer Science Lab</Text>
                </View>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityDistance}>45m</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.activityDivider} />

              <TouchableOpacity style={styles.enhancedActivityItem}>
                <LinearGradient
                  colors={['#FFF3E0', '#FFE0B2']}
                  style={styles.activityIconGradient}
                >
                  <Ionicons name="heart" size={18} color="#FF9800" />
                </LinearGradient>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>Saved Room T-125 to favorites</Text>
                  <Text style={styles.activityTime}>Yesterday • Math Lab</Text>
                </View>
                <View style={styles.favoriteBadge}>
                  <Ionicons name="star" size={12} color="#FF9800" />
                </View>
              </TouchableOpacity>

              <View style={styles.activityDivider} />

              <TouchableOpacity style={styles.enhancedActivityItem}>
                <LinearGradient
                  colors={['#E3F2FD', '#BBDEFB']}
                  style={styles.activityIconGradient}
                >
                  <Ionicons name="share" size={18} color="#2196F3" />
                </LinearGradient>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>Shared route to Library</Text>
                  <Text style={styles.activityTime}>2 days ago • Study Area</Text>
                </View>
                <View style={styles.sharedBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Enhanced Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.modernSectionTitle}>⚡ Quick Actions</Text>
          
          <View style={styles.enhancedQuickActionsGrid}>
            <TouchableOpacity 
              style={[styles.modernActionCard, styles.historyActionCard]} 
              onPress={() => {
                hapticFeedback();
                setShowHistoryModal(true);
              }}
            >
              <View style={styles.actionCardContent}>
                <LinearGradient
                  colors={['#E8F5E8', '#C8E6C9']}
                  style={styles.premiumActionIcon}
                >
                  <Ionicons name="time" size={26} color="#2E7D32" />
                </LinearGradient>
                <Text style={styles.modernActionTitle}>History</Text>
                <Text style={styles.modernActionSubtitle}>{routeHistory.length} routes</Text>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{routeHistory.length}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modernActionCard, styles.favoritesActionCard]} 
              onPress={() => {
                hapticFeedback();
                Alert.alert('🎯 Favorites', 'View your saved favorite rooms and locations.');
              }}
            >
              <View style={styles.actionCardContent}>
                <LinearGradient
                  colors={['#FCE4EC', '#F8BBD9']}
                  style={styles.premiumActionIcon}
                >
                  <Ionicons name="heart" size={26} color="#E91E63" />
                </LinearGradient>
                <Text style={styles.modernActionTitle}>Favorites</Text>
                <Text style={styles.modernActionSubtitle}>3 saved</Text>
                <View style={[styles.actionBadge, { backgroundColor: '#FCE4EC' }]}>
                  <Text style={[styles.actionBadgeText, { color: '#E91E63' }]}>3</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.enhancedQuickActionsGrid}>
            <TouchableOpacity 
              style={[styles.modernActionCard, styles.aboutActionCard]} 
              onPress={() => {
                hapticFeedback();
                setShowAboutModal(true);
              }}
            >
              <View style={styles.actionCardContent}>
                <LinearGradient
                  colors={['#E3F2FD', '#BBDEFB']}
                  style={styles.premiumActionIcon}
                >
                  <Ionicons name="information-circle" size={26} color="#1976D2" />
                </LinearGradient>
                <Text style={styles.modernActionTitle}>About</Text>
                <Text style={styles.modernActionSubtitle}>App info & help</Text>
                <View style={[styles.actionBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.actionBadgeText, { color: '#1976D2' }]}>v1.0</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modernActionCard, styles.settingsActionCard]} 
              onPress={() => {
                hapticFeedback();
                Alert.alert('⚙️ Settings', 'Settings functionality coming soon!');
              }}
            >
              <View style={styles.actionCardContent}>
                <LinearGradient
                  colors={['#F3E5F5', '#E1BEE7']}
                  style={styles.premiumActionIcon}
                >
                  <Ionicons name="settings" size={26} color="#9C27B0" />
                </LinearGradient>
                <Text style={styles.modernActionTitle}>Settings</Text>
                <Text style={styles.modernActionSubtitle}>Preferences</Text>
                <View style={[styles.notificationDot]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Additional Premium Action */}
          <TouchableOpacity 
            style={styles.premiumFullWidthCard} 
            onPress={() => {
              hapticFeedback();
              Alert.alert('📊 Analytics', 'View detailed navigation statistics and insights.');
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.premiumCardGradient}
            >
              <View style={styles.premiumCardContent}>
                <View style={styles.premiumCardIcon}>
                  <Ionicons name="analytics" size={24} color="#fff" />
                </View>
                <View style={styles.premiumCardText}>
                  <Text style={styles.premiumCardTitle}>View Analytics</Text>
                  <Text style={styles.premiumCardSubtitle}>Detailed navigation insights & patterns</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  // Enhanced Compact Header Styles
  compactProfileHeader: {
    paddingTop: getStatusBarHeight() + 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  compactHeaderContent: {
    gap: 16,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userTextSection: {
    flex: 1,
  },
  compactUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  compactStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginLeft: 4,
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  userStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },

  // Legacy header styles (keeping for compatibility)
  profileHeader: {
    paddingTop: getStatusBarHeight() + 20,
    padding: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginLeft: 6,
  },
  buildingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Profile Header Styles
  profileContainer: {
    marginBottom: 16,
  },
  profileGradientHeader: {
    paddingTop: getStatusBarHeight() + 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileHeaderContent: {
    marginBottom: 0,
  },
  profileMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  profileStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  profileStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -15,
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  statProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  routesStatCard: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  distanceStatCard: {
    borderTopWidth: 3,
    borderTopColor: '#2196F3',
  },
  successStatCard: {
    borderTopWidth: 3,
    borderTopColor: '#FF9800',
  },

  // Modern Section Styles
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 12,
  },

  // Enhanced Achievements Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementProgress: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  achievementsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  enhancedAchievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  premiumAchievementBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  lockedAchievementBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  achievementReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  achievementMeta: {
    alignItems: 'flex-end',
  },
  achievementDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 6,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedAchievement: {
    opacity: 0.7,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressLabel: {
    position: 'absolute',
    top: -18,
    right: 0,
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  achievementDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },

  // Enhanced Activity Styles
  enhancedActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700',
    marginRight: 4,
  },
  activityList: {
    gap: 0,
  },
  enhancedActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  activityIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityDistance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  favoriteBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2196F3',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 56,
  },
  
  // Modern Settings Card
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modernSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  modernSettingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernSettingText: {
    flex: 1,
  },
  modernSettingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  modernSettingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  
  // Enhanced Quick Actions
  enhancedQuickActionsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  modernActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    position: 'relative',
  },
  historyActionCard: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  favoritesActionCard: {
    borderTopWidth: 3,
    borderTopColor: '#E91E63',
  },
  aboutActionCard: {
    borderTopWidth: 3,
    borderTopColor: '#2196F3',
  },
  settingsActionCard: {
    borderTopWidth: 3,
    borderTopColor: '#9C27B0',
  },
  actionCardContent: {
    alignItems: 'center',
    position: 'relative',
  },
  premiumActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 4,
  },
  modernActionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  actionBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    right: -8,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    position: 'absolute',
    top: -4,
    right: -4,
  },
  premiumFullWidthCard: {
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  premiumCardGradient: {
    padding: 20,
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumCardText: {
    flex: 1,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  premiumCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  fullWidthActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fullWidthActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  fullWidthActionText: {
    flex: 1,
    marginLeft: 12,
  },
  fullWidthActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  fullWidthActionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Legacy section styles (keeping for compatibility)
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  bottomPadding: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f8fafc',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
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
  
  // Legacy styles (keeping for backward compatibility)
  modalHeader: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  historyList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyIcon: {
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
    backgroundColor: '#f8fafc',
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
  
  // Legacy About Styles (keeping for backward compatibility)
  aboutContent: {
    padding: 24,
  },
  aboutSection: {
    marginBottom: 24,
  },
  aboutSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default ProfileScreen; 