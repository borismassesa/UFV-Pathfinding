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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface RouteStep {
  id: string;
  instruction: string;
  distance: number;
  direction: string;
  landmark?: string;
  type: 'turn' | 'straight' | 'arrive';
}

interface RouteData {
  id: string;
  from: string;
  to: string;
  totalDistance: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  accessibility: boolean;
  steps: RouteStep[];
  created: Date;
}

const RouteDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const params = route.params as any;
    if (params?.route) {
      setRouteData(params.route);
    } else {
      // Default route data for demo
      setRouteData({
        id: 'route_001',
        from: 'Main Entrance',
        to: 'T001 - Large Lecture Hall',
        totalDistance: 45.6,
        estimatedTime: 32,
        difficulty: 'easy',
        accessibility: true,
        created: new Date(),
        steps: [
          {
            id: 'step_1',
            instruction: 'Enter through main entrance',
            distance: 0,
            direction: 'start',
            landmark: 'Main Entrance',
            type: 'straight'
          },
          {
            id: 'step_2',
            instruction: 'Walk straight down the main corridor',
            distance: 25.3,
            direction: 'north',
            landmark: 'Main Corridor',
            type: 'straight'
          },
          {
            id: 'step_3',
            instruction: 'Turn right towards the lecture halls',
            distance: 12.8,
            direction: 'east',
            landmark: 'Academic Wing',
            type: 'turn'
          },
          {
            id: 'step_4',
            instruction: 'T001 Large Lecture Hall will be on your left',
            distance: 7.5,
            direction: 'north',
            landmark: 'T001',
            type: 'arrive'
          }
        ]
      });
    }
  }, [route.params]);

  const handleStartNavigation = () => {
    if (!routeData) return;
    
    setIsNavigating(true);
    Alert.alert(
      '🧭 Navigation Started!',
      `Starting turn-by-turn navigation from ${routeData.from} to ${routeData.to}.\n\nEstimated time: ${routeData.estimatedTime} seconds\nDistance: ${routeData.totalDistance.toFixed(1)}m`,
      [{ text: 'Let\'s Go!' }]
    );
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    Alert.alert(
      '⏹️ Navigation Stopped',
      'Navigation has been stopped. You can restart at any time.',
      [{ text: 'OK' }]
    );
  };

  const getStepIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'turn': return 'return-up-forward';
      case 'straight': return 'arrow-up';
      case 'arrive': return 'flag';
      default: return 'navigate';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  if (!routeData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading route details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Hero Section */}
      <LinearGradient
        colors={['#2E7D32', '#4CAF50']}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <View style={styles.routeHeader}>
            <View style={styles.routeIconContainer}>
              <Ionicons name="navigate" size={32} color="#fff" />
            </View>
            <View style={styles.routeTitleContainer}>
              <Text style={styles.routeTitle}>Route Planning</Text>
              <Text style={styles.routeSubtitle}>From: {routeData.from}</Text>
              <Text style={styles.routeSubtitle}>To: {routeData.to}</Text>
            </View>
          </View>
          
          {/* Route Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statValue}>{routeData.totalDistance.toFixed(1)}m</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statValue}>{formatTime(routeData.estimatedTime)}</Text>
              <Text style={styles.statLabel}>Est. Time</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={[styles.statValue, { color: getDifficultyColor(routeData.difficulty) }]}>
                {routeData.difficulty.toUpperCase()}
              </Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isNavigating ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleStartNavigation}>
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Start Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={handleStopNavigation}>
                <Ionicons name="stop" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Stop Navigation</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Turn-by-Turn Directions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛣️ Turn-by-Turn Directions</Text>
          
          <View style={styles.stepsList}>
            {routeData.steps.map((step, index) => (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepIcon}>
                    <Ionicons 
                      name={getStepIcon(step.type)} 
                      size={24} 
                      color={step.type === 'arrive' ? '#4CAF50' : '#2196F3'} 
                    />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    {step.landmark && (
                      <Text style={styles.stepLandmark}>📍 {step.landmark}</Text>
                    )}
                  </View>
                </View>
                
                {step.distance > 0 && (
                  <View style={styles.stepFooter}>
                    <View style={styles.stepDistance}>
                      <Ionicons name="resize-outline" size={16} color="#666" />
                      <Text style={styles.stepDistanceText}>{step.distance}m</Text>
                    </View>
                    <View style={styles.stepDirection}>
                      <Ionicons name="compass-outline" size={16} color="#666" />
                      <Text style={styles.stepDirectionText}>{step.direction}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  heroContent: {
    gap: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  routeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeTitleContainer: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  routeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    lineHeight: 20,
  },
  stepLandmark: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  stepFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stepDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDistanceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  stepDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDirectionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bottomPadding: {
    height: 40,
  },
});

export default RouteDetailScreen; 