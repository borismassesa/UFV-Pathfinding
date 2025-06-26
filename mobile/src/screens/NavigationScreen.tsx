import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView from '../components/MapView/MapView';
import NavigationPanel from '../components/NavigationPanel/NavigationPanel';
import SearchBar from '../components/SearchBar/SearchBar';
import { PathfindingService } from '../services/PathfindingService';

// Real UFV Building T room data (matching your shapefile format)
const REAL_UFV_ROOMS = [
  { id: "T001", x: 552312.848251, y: 5430800.48876, area: 372.48, desc: "Large Lecture Hall", type: "academic" },
  { id: "T002", x: 552297.100925, y: 5430796.951502, area: 9.05, desc: "Small Office", type: "office" },
  { id: "T003", x: 552300.046514, y: 5430797.019896, area: 9.05, desc: "Small Office", type: "office" },
  { id: "T004", x: 552302.992104, y: 5430797.08829, area: 9.05, desc: "Small Office", type: "office" },
  { id: "T005", x: 552305.937694, y: 5430797.156684, area: 9.05, desc: "Small Office", type: "office" },
  { id: "T032", x: 552309.652266, y: 5430794.708623, area: 35.53, desc: "Medium Classroom", type: "academic" },
  { id: "T033", x: 552318.361519, y: 5430806.730978, area: 28.3, desc: "Study Area", type: "study" },
];

interface NavigationNode {
  id: string;
  coordinates: { x: number; y: number };
  type: string;
  accessibility: string[];
}

interface RouteStep {
  nodeId: string;
  coordinates: { x: number; y: number };
  instruction: string;
  distance: number;
  direction: string;
  landmark?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'room' | 'building' | 'service';
  building: string;
  floor?: number;
  description?: string;
  coordinates: { x: number; y: number };
}

const { width, height } = Dimensions.get('window');

const NavigationScreen: React.FC = () => {
  const [pathfindingService] = useState(() => new PathfindingService(REAL_UFV_ROOMS));
  const [currentRoute, setCurrentRoute] = useState<NavigationNode[]>([]);
  const [routeInstructions, setRouteInstructions] = useState<RouteStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    console.log('🧭 NavigationScreen initialized with real UFV Building T data');
  }, []);

  const handleLocationSelect = async (location: SearchResult) => {
    setSelectedDestination(location);
    
    try {
      console.log(`🎯 Calculating route to ${location.name}...`);
      
      // Use real A* pathfinding with your UFV room data
      const startRoomId = 'T001'; // Start from main lecture hall
      const endRoomId = location.id;
      
      const pathSegments = pathfindingService.findPath(startRoomId, endRoomId);
      
      // Convert path segments to route nodes
      const route: NavigationNode[] = [];
      const instructions: RouteStep[] = [];
      
      pathSegments.forEach((segment, index) => {
        const fromNode: NavigationNode = {
          id: segment.from.id,
          coordinates: { x: segment.from.x, y: segment.from.y },
          type: segment.from.type,
          accessibility: ['wheelchair']
        };
        
        const toNode: NavigationNode = {
          id: segment.to.id,
          coordinates: { x: segment.to.x, y: segment.to.y },
          type: segment.to.type,
          accessibility: ['wheelchair']
        };
        
        if (index === 0) route.push(fromNode);
        route.push(toNode);
        
        instructions.push({
          nodeId: segment.to.id,
          coordinates: { x: segment.to.x, y: segment.to.y },
          instruction: segment.instruction,
          distance: segment.distance,
          direction: segment.direction,
          landmark: segment.to.room?.desc || segment.to.id
        });
      });
      
      setCurrentRoute(route);
      setRouteInstructions(instructions);
      setCurrentStep(0);
      setShowMap(true);
      
      const totalDistance = pathfindingService.getPathDistance(pathSegments);
      const estimatedTime = Math.round(totalDistance / 1.4); // Walking speed 1.4 m/s
      
      Alert.alert(
        '🗺️ Route Found!',
        `✅ Real A* pathfinding successful!\n\nRoute: ${startRoomId} → ${endRoomId}\nDistance: ${totalDistance.toFixed(1)}m\nTime: ${estimatedTime}s\n\nUsing your real UFV Building T data!`,
        [{ text: 'Start Navigation!' }]
      );
      
    } catch (error) {
      console.error('A* algorithm error:', error);
      
      // Fallback to simple direct route
      const fallbackRoute: NavigationNode[] = [
        {
          id: 'T001',
          coordinates: { x: 552312.848251, y: 5430800.48876 },
          type: 'room',
          accessibility: ['wheelchair']
        },
        {
          id: location.id,
          coordinates: location.coordinates,
          type: 'room',
          accessibility: ['wheelchair']
        }
      ];
      
      const fallbackInstructions: RouteStep[] = [
        {
          nodeId: location.id,
          coordinates: location.coordinates,
          instruction: `Navigate directly to ${location.name}`,
          distance: 25,
          direction: 'north',
          landmark: location.description || location.name
        }
      ];
      
      setCurrentRoute(fallbackRoute);
      setRouteInstructions(fallbackInstructions);
      setCurrentStep(0);
      setShowMap(true);
      
      Alert.alert(
        '🧭 Fallback Route',
        `Using simplified route to ${location.name}.\n\nA* pathfinding encountered an issue, but you can still navigate!`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleNavigationStart = () => {
    if (currentRoute.length === 0) {
      Alert.alert('No Route', 'Please select a destination first.');
      return;
    }
    
    setIsNavigating(true);
    setCurrentStep(0);
    setShowMap(true);
    
    Alert.alert(
      '🧭 Real Navigation Started',
      'Following route calculated with A* algorithm using your UFV Building T room data!\n\nThis is a demo - in a real app, indoor positioning would track your location.',
      [{ text: 'Let\'s Go!' }]
    );
  };

  const handleNavigationStop = () => {
    setIsNavigating(false);
    Alert.alert(
      '⏹️ Navigation Stopped',
      'You can restart navigation at any time.',
      [{ text: 'OK' }]
    );
  };

  const handleStepPress = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setShowMap(true);
  };

  const handleNodePress = (node: NavigationNode) => {
    const nodeIndex = currentRoute.findIndex(n => n.id === node.id);
    if (nodeIndex !== -1) {
      setCurrentStep(nodeIndex);
    }
  };

  // Simulate navigation progress
  useEffect(() => {
    if (!isNavigating) return;

    const progressTimer = setInterval(() => {
      setCurrentStep(prevStep => {
        if (prevStep < routeInstructions.length - 1) {
          return prevStep + 1;
        } else {
          setIsNavigating(false);
          Alert.alert(
            '🎉 Destination Reached!',
            `You have arrived at ${selectedDestination?.name || 'your destination'}!\n\n✅ Navigation completed using real UFV Building T data.`,
            [{ text: 'Awesome!' }]
          );
          return prevStep;
        }
      });
    }, 3000); // Progress every 3 seconds

    return () => clearInterval(progressTimer);
  }, [isNavigating, routeInstructions.length, selectedDestination]);

  const totalDistance = routeInstructions.reduce((sum, step) => sum + step.distance, 0);
  const estimatedTime = Math.round(totalDistance / 1.4); // 1.4 m/s walking speed

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Real Data Status */}
      <View style={[styles.connectionStatus, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.connectionStatusText}>
          🗺️ Real UFV Data: {REAL_UFV_ROOMS.length} rooms loaded
        </Text>
        <Text style={styles.connectionStatusText}>
          🤖 A* Algorithm Ready
        </Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          onLocationSelect={handleLocationSelect}
          placeholder="Search UFV Building T rooms..."
        />
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {showMap ? (
          <View style={styles.mapSection}>
            <MapView
              route={currentRoute}
              instructions={routeInstructions}
              currentStep={currentStep}
              zoom={1.2}
              onNodePress={handleNodePress}
            />
          </View>
        ) : null}

        {/* Navigation Panel */}
        <View style={[styles.navigationPanel, showMap ? styles.panelBottom : styles.panelFull]}>
          <NavigationPanel
            instructions={routeInstructions}
            currentStep={currentStep}
            totalDistance={totalDistance}
            estimatedTime={estimatedTime}
            onStepPress={handleStepPress}
            onNavigationStart={handleNavigationStart}
            onNavigationStop={handleNavigationStop}
            isNavigating={isNavigating}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectionStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentContainer: {
    flex: 1,
  },
  mapSection: {
    flex: 0.6,
    minHeight: 300,
  },
  navigationPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  panelBottom: {
    flex: 0.4,
    minHeight: 250,
  },
  panelFull: {
    flex: 1,
  },
});

export default NavigationScreen; 