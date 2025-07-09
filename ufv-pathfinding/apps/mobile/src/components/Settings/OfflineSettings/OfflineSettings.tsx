import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import OfflineNavigationService from '../../../services/OfflineNavigationService';

interface OfflineSettingsProps {
  onClose?: () => void;
}

interface SyncProgress {
  building: string;
  progress: number;
  total: number;
  status: 'downloading' | 'processing' | 'complete' | 'error';
}

interface CacheStats {
  size: number;
  buildings: number;
  routes: number;
  lastSync: Date | null;
}

export const OfflineSettings: React.FC<OfflineSettingsProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    size: 0,
    buildings: 0,
    routes: 0,
    lastSync: null,
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [capabilities, setCapabilities] = useState({
    isOnline: true,
    hasOfflineData: false,
    canNavigate: true,
    canSearch: true,
    lastSync: null as Date | null,
  });

  useEffect(() => {
    loadData();
    setupEventListeners();
  }, []);

  const loadData = async () => {
    try {
      const [stats, caps] = await Promise.all([
        OfflineNavigationService.getCacheStats(),
        OfflineNavigationService.getOfflineCapabilities(),
      ]);

      setCacheStats(stats);
      setCapabilities(caps);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const setupEventListeners = () => {
    const unsubscribeCapability = OfflineNavigationService.onCapabilityChange(setCapabilities);
    const unsubscribeSync = OfflineNavigationService.onSyncProgress(setSyncProgress);

    return () => {
      unsubscribeCapability();
      unsubscribeSync();
    };
  };

  const handleDownloadData = async () => {
    try {
      setIsLoading(true);
      
      if (!capabilities.isOnline) {
        Alert.alert(
          'No Internet Connection',
          'You need an internet connection to download offline data.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Download Offline Data',
        'This will download map data for UFV Building T. The download may take a few minutes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                await OfflineNavigationService.syncBuildingData('building-t', true);
                await loadData();
                
                Alert.alert(
                  'Download Complete',
                  'Offline data has been downloaded successfully. You can now use navigation without an internet connection.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Download Failed',
                  'Failed to download offline data. Please check your internet connection and try again.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsLoading(true);
      
      if (!capabilities.isOnline) {
        Alert.alert(
          'No Internet Connection',
          'You need an internet connection to sync data.',
          [{ text: 'OK' }]
        );
        return;
      }

      await OfflineNavigationService.forceSyncAll();
      await loadData();
      
      Alert.alert(
        'Sync Complete',
        'All offline data has been updated with the latest information.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert(
        'Sync Failed',
        'Failed to sync offline data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will remove all downloaded offline data. You will need an internet connection to use navigation features after clearing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await OfflineNavigationService.clearOfflineData();
              await loadData();
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Alert.alert(
                'Clear Failed',
                'Failed to clear offline data. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getConnectionStatusColor = (): string => {
    return capabilities.isOnline ? '#34C759' : '#FF3B30';
  };

  const getConnectionStatusText = (): string => {
    return capabilities.isOnline ? 'Online' : 'Offline';
  };

  const renderSyncProgress = () => {
    if (!syncProgress) return null;

    const { building, progress, total, status } = syncProgress;

    return (
      <View style={styles.syncProgressContainer}>
        <View style={styles.syncProgressHeader}>
          <Text style={styles.syncProgressTitle}>
            {status === 'downloading' && 'Downloading...'}
            {status === 'processing' && 'Processing...'}
            {status === 'complete' && 'Complete!'}
            {status === 'error' && 'Error'}
          </Text>
          <Text style={styles.syncProgressPercent}>
            {Math.round((progress / total) * 100)}%
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(progress / total) * 100}%`,
                backgroundColor: status === 'error' ? '#FF3B30' : '#007AFF'
              }
            ]} 
          />
        </View>
        
        <Text style={styles.syncProgressDetails}>
          Building: {building}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F2F2F7', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Offline Settings</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Connection Status */}
          <View style={styles.section}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
                <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
              </View>
              
              <Text style={styles.statusDescription}>
                {capabilities.isOnline 
                  ? 'Connected to internet. All features available.'
                  : 'No internet connection. Using offline data when available.'
                }
              </Text>
            </View>
          </View>

          {/* Sync Progress */}
          {syncProgress && (
            <View style={styles.section}>
              {renderSyncProgress()}
            </View>
          )}

          {/* Cache Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offline Data</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatFileSize(cacheStats.size)}</Text>
                <Text style={styles.statLabel}>Storage Used</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cacheStats.buildings}</Text>
                <Text style={styles.statLabel}>Buildings</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cacheStats.routes}</Text>
                <Text style={styles.statLabel}>Cached Routes</Text>
              </View>
            </View>

            <View style={styles.lastSyncContainer}>
              <Text style={styles.lastSyncLabel}>Last Sync:</Text>
              <Text style={styles.lastSyncValue}>
                {formatLastSync(cacheStats.lastSync)}
              </Text>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Auto-sync when online</Text>
                <Text style={styles.settingDescription}>
                  Automatically update offline data when connected to WiFi
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor={autoSync ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            {!capabilities.hasOfflineData ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={handleDownloadData}
                disabled={isLoading || !capabilities.isOnline}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Download Offline Data</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.syncButton]}
                  onPress={handleSyncAll}
                  disabled={isLoading || !capabilities.isOnline}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Sync All Data</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.clearButton]}
                  onPress={handleClearCache}
                  disabled={isLoading}
                >
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Clear Offline Data</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Info */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <Text style={styles.infoText}>
                Offline data allows you to navigate even without an internet connection. 
                Make sure to sync regularly to get the latest building information and room changes.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  syncProgressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  syncProgressPercent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  syncProgressDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  lastSyncContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lastSyncLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  lastSyncValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  syncButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default OfflineSettings;