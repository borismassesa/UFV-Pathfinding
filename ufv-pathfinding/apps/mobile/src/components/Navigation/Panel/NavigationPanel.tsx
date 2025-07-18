import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationPanelProps {
  selectedRoom: {
    id: string;
    name: string;
    type: string;
    floor: number;
  } | null;
  onClose: () => void;
  onRecenter: () => void;
}

interface NavigationStep {
  id: string;
  instruction: string;
  distance: string;
  icon: string;
  completed: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  selectedRoom,
  onClose,
  onRecenter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [panelHeight] = useState(new Animated.Value(120));

  // Mock navigation steps
  const navigationSteps: NavigationStep[] = [
    {
      id: '1',
      instruction: 'Head north towards the main hallway',
      distance: '12m',
      icon: 'arrow-up',
      completed: false,
    },
    {
      id: '2',
      instruction: 'Turn right at the intersection',
      distance: '8m',
      icon: 'arrow-forward',
      completed: false,
    },
    {
      id: '3',
      instruction: `Arrive at ${selectedRoom?.name || 'destination'}`,
      distance: '5m',
      icon: 'flag',
      completed: false,
    },
  ];

  // Simulate navigation progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < navigationSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 10000); // Progress every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Toggle panel expansion
  const toggleExpansion = () => {
    const newHeight = isExpanded ? 120 : 280;
    Animated.spring(panelHeight, {
      toValue: newHeight,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  };

  // Get step color based on status
  const getStepColor = (index: number) => {
    if (index < currentStep) return '#10B981'; // Completed
    if (index === currentStep) return '#4CAF50'; // Current
    return '#9CA3AF'; // Upcoming
  };

  const getStepIcon = (step: NavigationStep, index: number) => {
    if (index < currentStep) return 'checkmark-circle';
    return step.icon;
  };

  const totalDistance = navigationSteps.reduce((sum, step) => {
    return sum + parseInt(step.distance);
  }, 0);

  const estimatedTime = Math.ceil(totalDistance / 60); // Assuming 1m/s walking speed

  return (
    <Animated.View style={[styles.container, { height: panelHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.expandButton} onPress={toggleExpansion}>
          <View style={styles.dragHandle} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName}>
              {selectedRoom?.name || 'Destination'}
            </Text>
            <Text style={styles.destinationDetails}>
              {selectedRoom?.id} • Floor {selectedRoom?.floor}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Step */}
      <View style={styles.currentStep}>
        <View style={styles.stepIconContainer}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.stepIconGradient}
          >
            <Ionicons 
              name={getStepIcon(navigationSteps[currentStep], currentStep) as any} 
              size={24} 
              color="#ffffff" 
            />
          </LinearGradient>
        </View>
        
        <View style={styles.stepInfo}>
          <Text style={styles.stepInstruction}>
            {navigationSteps[currentStep]?.instruction}
          </Text>
          <Text style={styles.stepDistance}>
            {navigationSteps[currentStep]?.distance} • {estimatedTime} min remaining
          </Text>
        </View>
        
        <TouchableOpacity style={styles.recenterButton} onPress={onRecenter}>
          <Ionicons name="locate" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Route Summary */}
          <View style={styles.routeSummary}>
            <View style={styles.summaryItem}>
              <Ionicons name="walk" size={16} color="#6B7280" />
              <Text style={styles.summaryText}>{totalDistance}m total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text style={styles.summaryText}>{estimatedTime} min</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="layers" size={16} color="#6B7280" />
              <Text style={styles.summaryText}>Floor {selectedRoom?.floor}</Text>
            </View>
          </View>

          {/* All Steps */}
          <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
            {navigationSteps.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View style={[styles.stepMarker, { backgroundColor: getStepColor(index) }]}>
                  <Ionicons 
                    name={getStepIcon(step, index) as any} 
                    size={16} 
                    color="#ffffff" 
                  />
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepText,
                    index === currentStep && styles.currentStepText
                  ]}>
                    {step.instruction}
                  </Text>
                  <Text style={styles.stepMetrics}>{step.distance}</Text>
                </View>
                
                {index < navigationSteps.length - 1 && (
                  <View style={[styles.stepConnector, { 
                    backgroundColor: index < currentStep ? '#10B981' : '#E5E7EB' 
                  }]} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="volume-high" size={20} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Voice</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share" size={20} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="list" size={20} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Steps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  destinationDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
  },
  
  // Current Step
  currentStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stepIconContainer: {
    marginRight: 16,
  },
  stepIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  recenterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  
  // Expanded Content
  expandedContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  routeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Steps
  stepsContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    position: 'relative',
  },
  stepMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
  },
  currentStepText: {
    fontWeight: '600',
    color: '#111827',
  },
  stepMetrics: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  stepConnector: {
    position: 'absolute',
    left: 15,
    top: 44,
    width: 2,
    height: 24,
    zIndex: 0,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default NavigationPanel;