import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Platform,
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

interface SettingsSection {
  id: string;
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  iconColor?: string;
  iconBgColor?: string;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    voiceGuidance: true,
    accessibility: false,
    hapticFeedback: true,
    autoReroute: true,
    offlineMode: false,
    locationTracking: true,
    analytics: true,
    darkMode: false,
    saveBattery: false,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Show relevant feedback for important settings
    if (key === 'accessibility' && value) {
      Alert.alert(
        '♿ Accessibility Enabled',
        'Routes will prioritize wheelchair accessible paths and avoid stairs.',
        [{ text: 'OK' }]
      );
    } else if (key === 'voiceGuidance' && value) {
      Alert.alert(
        '🔊 Voice Guidance Enabled',
        'You will receive spoken turn-by-turn directions during navigation.',
        [{ text: 'OK' }]
      );
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'navigation',
      title: 'Navigation',
      items: [
        {
          id: 'voiceGuidance',
          title: 'Voice Guidance',
          subtitle: 'Spoken turn-by-turn directions',
          icon: 'volume-high',
          type: 'toggle',
          value: settings.voiceGuidance,
          iconColor: '#2196F3',
          iconBgColor: '#E3F2FD',
        },
        {
          id: 'autoReroute',
          title: 'Auto-Reroute',
          subtitle: 'Automatically find new path when off-route',
          icon: 'sync',
          type: 'toggle',
          value: settings.autoReroute,
          iconColor: '#4CAF50',
          iconBgColor: '#E8F5E8',
        },
        {
          id: 'offlineMode',
          title: 'Offline Mode',
          subtitle: 'Use cached maps when no internet',
          icon: 'cloud-offline',
          type: 'toggle',
          value: settings.offlineMode,
          iconColor: '#9C27B0',
          iconBgColor: '#F3E5F5',
        },
        {
          id: 'saveBattery',
          title: 'Battery Saver',
          subtitle: 'Reduce GPS accuracy to save battery',
          icon: 'battery-charging',
          type: 'toggle',
          value: settings.saveBattery,
          iconColor: '#FF9800',
          iconBgColor: '#FFF3E0',
        },
      ],
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      items: [
        {
          id: 'accessibility',
          title: 'Wheelchair Accessible Routes',
          subtitle: 'Prioritize accessible paths',
          icon: 'accessibility',
          type: 'toggle',
          value: settings.accessibility,
          iconColor: '#2196F3',
          iconBgColor: '#E3F2FD',
        },
        {
          id: 'hapticFeedback',
          title: 'Haptic Feedback',
          subtitle: 'Vibration for navigation cues',
          icon: 'phone-portrait',
          type: 'toggle',
          value: settings.hapticFeedback,
          iconColor: '#4CAF50',
          iconBgColor: '#E8F5E8',
        },
        {
          id: 'textSize',
          title: 'Text Size',
          subtitle: 'Adjust font size for readability',
          icon: 'text',
          type: 'navigation',
          iconColor: '#FF9800',
          iconBgColor: '#FFF3E0',
          onPress: () => Alert.alert('Text Size', 'Font size settings coming soon!'),
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      items: [
        {
          id: 'locationTracking',
          title: 'Location Tracking',
          subtitle: 'Allow app to track your location',
          icon: 'location',
          type: 'toggle',
          value: settings.locationTracking,
          iconColor: '#E91E63',
          iconBgColor: '#FCE4EC',
        },
        {
          id: 'analytics',
          title: 'Usage Analytics',
          subtitle: 'Help improve the app',
          icon: 'analytics',
          type: 'toggle',
          value: settings.analytics,
          iconColor: '#2196F3',
          iconBgColor: '#E3F2FD',
        },
        {
          id: 'dataPrivacy',
          title: 'Data & Privacy',
          subtitle: 'Manage your data and privacy',
          icon: 'shield-checkmark',
          type: 'navigation',
          iconColor: '#4CAF50',
          iconBgColor: '#E8F5E8',
          onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
        },
      ],
    },
    {
      id: 'personalization',
      title: 'Personalization',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Route updates and building alerts',
          icon: 'notifications',
          type: 'toggle',
          value: settings.notifications,
          iconColor: '#FF9800',
          iconBgColor: '#FFF3E0',
        },
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          icon: 'moon',
          type: 'toggle',
          value: settings.darkMode,
          iconColor: '#9C27B0',
          iconBgColor: '#F3E5F5',
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English (Canada)',
          icon: 'language',
          type: 'navigation',
          iconColor: '#2196F3',
          iconBgColor: '#E3F2FD',
          onPress: () => Alert.alert('Language', 'Language settings coming soon!'),
        },
      ],
    },
    {
      id: 'support',
      title: 'Support & About',
      items: [
        {
          id: 'help',
          title: 'Help & FAQ',
          subtitle: 'Get help with navigation',
          icon: 'help-circle',
          type: 'navigation',
          iconColor: '#4CAF50',
          iconBgColor: '#E8F5E8',
          onPress: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Report issues or suggestions',
          icon: 'chatbubble-ellipses',
          type: 'navigation',
          iconColor: '#2196F3',
          iconBgColor: '#E3F2FD',
          onPress: () => Alert.alert('Feedback', 'Thank you for your interest in providing feedback!'),
        },
        {
          id: 'about',
          title: 'About UFV Pathfinding',
          subtitle: 'Version 1.0.0',
          icon: 'information-circle',
          type: 'navigation',
          iconColor: '#9C27B0',
          iconBgColor: '#F3E5F5',
          onPress: () => Alert.alert('About', 'UFV Pathfinding v1.0.0\nDeveloped for UFV students and faculty.'),
        },
        {
          id: 'rate',
          title: 'Rate This App',
          subtitle: 'Leave a review in the app store',
          icon: 'star',
          type: 'navigation',
          iconColor: '#FF9800',
          iconBgColor: '#FFF3E0',
          onPress: () => Alert.alert('Rate App', 'Thank you for considering rating our app!'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={() => {
          if (item.type === 'navigation' && item.onPress) {
            item.onPress();
          }
        }}
      >
        <View style={[styles.settingIcon, { backgroundColor: item.iconBgColor }]}>
          <Ionicons name={item.icon} size={dimensions.iconM} color={item.iconColor} />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={(value) => updateSetting(item.id, value)}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={item.value ? '#ffffff' : '#ffffff'}
            ios_backgroundColor="#E5E7EB"
          />
        )}
        
        {item.type === 'navigation' && (
          <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + dimensions.paddingM }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={dimensions.iconM} color="#111827" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Settings</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: dimensions.tabBarHeight + dimensions.paddingXL }}
      >
        {/* UFV Building Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7']}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusIcon}>
                <Ionicons name="business" size={dimensions.iconL} color="#15803D" />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>Building T Status</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Open • 7:00 AM - 10:00 PM</Text>
                </View>
                <Text style={styles.statusSubtext}>All systems operational</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {index < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Reset Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              Alert.alert(
                'Reset Settings',
                'This will reset all settings to their default values. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      setSettings({
                        notifications: true,
                        voiceGuidance: true,
                        accessibility: false,
                        hapticFeedback: true,
                        autoReroute: true,
                        offlineMode: false,
                        locationTracking: true,
                        analytics: true,
                        darkMode: false,
                        saveBattery: false,
                      });
                      Alert.alert('Settings Reset', 'All settings have been reset to default values.');
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="refresh" size={dimensions.iconM} color="#EF4444" />
            <Text style={styles.resetButtonText}>Reset All Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingM,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    flex: 1,
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: moderateScale(40),
  },
  
  // Content
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Status Card
  statusCard: {
    margin: dimensions.paddingM,
    borderRadius: dimensions.radiusL,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusGradient: {
    padding: dimensions.paddingM,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(21, 128, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: moderateScale(4),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(2),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#10B981',
    marginRight: moderateScale(6),
  },
  statusText: {
    fontSize: dimensions.fontM,
    color: '#15803D',
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: dimensions.fontS,
    color: '#16A34A',
    opacity: 0.8,
  },
  
  // Sections
  section: {
    marginTop: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingM,
  },
  sectionTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#374151',
    marginBottom: dimensions.paddingS,
    marginLeft: moderateScale(4),
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  
  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.paddingM,
  },
  settingIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
    marginBottom: moderateScale(2),
  },
  settingSubtitle: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: moderateScale(56),
  },
  
  // Reset Button
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  resetButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: moderateScale(8),
  },
});

export default SettingsScreen;