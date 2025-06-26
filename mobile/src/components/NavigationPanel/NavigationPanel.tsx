import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface RouteStep {
  nodeId: string;
  coordinates: { x: number; y: number };
  instruction: string;
  distance: number;
  direction: string;
  landmark?: string;
}

interface NavigationPanelProps {
  instructions: RouteStep[];
  currentStep: number;
  totalDistance: number;
  estimatedTime: number;
  onStepPress?: (stepIndex: number) => void;
  onNavigationStart?: () => void;
  onNavigationStop?: () => void;
  isNavigating?: boolean;
}

const { width } = Dimensions.get('window');

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  instructions = [],
  currentStep = 0,
  totalDistance = 0,
  estimatedTime = 0,
  onStepPress,
  onNavigationStart,
  onNavigationStop,
  isNavigating = false,
}) => {
  const getDirectionIcon = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'north': return '⬆️';
      case 'south': return '⬇️';
      case 'east': return '➡️';
      case 'west': return '⬅️';
      case 'northeast': return '↗️';
      case 'northwest': return '↖️';
      case 'southeast': return '↘️';
      case 'southwest': return '↙️';
      default: return '🧭';
    }
  };

  const getStepStatusColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return '#4CAF50'; // Completed - Green
    if (stepIndex === currentStep) return '#FF9800'; // Current - Orange
    return '#E0E0E0'; // Future - Gray
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 100)} cm`;
    return `${distance} m`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getCurrentInstruction = () => {
    if (currentStep >= instructions.length) {
      return {
        instruction: "You have arrived at your destination!",
        distance: 0,
        direction: "none"
      };
    }
    return instructions[currentStep];
  };

  return (
    <View style={styles.container}>
      {/* Header with summary */}
      <View style={styles.header}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>📏</Text>
            <Text style={styles.summaryText}>{formatDistance(totalDistance)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>⏱️</Text>
            <Text style={styles.summaryText}>{formatTime(estimatedTime)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={styles.summaryText}>{instructions.length} steps</Text>
          </View>
        </View>
        
        {/* Navigation control button */}
        <TouchableOpacity
          style={[styles.navButton, isNavigating ? styles.stopButton : styles.startButton]}
          onPress={isNavigating ? onNavigationStop : onNavigationStart}
        >
          <Text style={styles.navButtonIcon}>
            {isNavigating ? "⏹️" : "▶️"}
          </Text>
          <Text style={styles.navButtonText}>
            {isNavigating ? "Stop Navigation" : "Start Navigation"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current instruction highlight */}
      {isNavigating && instructions.length > 0 && (
        <View style={styles.currentInstruction}>
          <View style={styles.currentStepHeader}>
            <Text style={styles.currentStepIcon}>
              {getDirectionIcon(getCurrentInstruction().direction)}
            </Text>
            <View style={styles.currentStepInfo}>
              <Text style={styles.currentStepNumber}>
                Step {currentStep + 1} of {instructions.length}
              </Text>
              <Text style={styles.currentStepDistance}>
                {formatDistance(getCurrentInstruction().distance)}
              </Text>
            </View>
          </View>
          <Text style={styles.currentStepText}>
            {getCurrentInstruction().instruction}
          </Text>
        </View>
      )}

      {/* Instructions list */}
      <ScrollView style={styles.instructionsContainer} showsVerticalScrollIndicator={false}>
        {instructions.map((step, index) => (
          <TouchableOpacity
            key={step.nodeId}
            style={[
              styles.instructionItem,
              index === currentStep && styles.currentStepItem,
              index < currentStep && styles.completedStepItem,
            ]}
            onPress={() => onStepPress?.(index)}
          >
            <View style={styles.stepIndicator}>
              <View style={[styles.stepNumber, { backgroundColor: getStepStatusColor(index) }]}>
                {index < currentStep ? (
                  <Text style={styles.stepCheckmark}>✅</Text>
                ) : (
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                )}
              </View>
              {index < instructions.length - 1 && (
                <View style={[styles.stepConnector, { backgroundColor: getStepStatusColor(index + 1) }]} />
              )}
            </View>
            
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepDirectionIcon}>
                  {getDirectionIcon(step.direction)}
                </Text>
                <Text style={[
                  styles.stepDistance,
                  index === currentStep && styles.currentStepHighlight
                ]}>
                  {formatDistance(step.distance)}
                </Text>
              </View>
              
              <Text style={[
                styles.stepInstruction,
                index === currentStep && styles.currentStepHighlight
              ]}>
                {step.instruction}
              </Text>
              
              {step.landmark && (
                <Text style={styles.stepLandmark}>
                  📍 {step.landmark}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  navButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentInstruction: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  currentStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentStepIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  currentStepInfo: {
    flex: 1,
  },
  currentStepNumber: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  currentStepDistance: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  currentStepText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
    lineHeight: 22,
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentStepItem: {
    backgroundColor: '#F3E5F5',
  },
  completedStepItem: {
    backgroundColor: '#E8F5E8',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepCheckmark: {
    fontSize: 12,
  },
  stepConnector: {
    width: 2,
    height: 20,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDirectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  stepDistance: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  stepInstruction: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  stepLandmark: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  currentStepHighlight: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default NavigationPanel; 