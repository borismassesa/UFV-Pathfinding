import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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

interface ClassSchedule {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  type?: 'lecture' | 'lab' | 'tutorial';
}

interface Class {
  id: string;
  courseCode: string;
  courseName: string;
  professor: string;
  type: 'lecture' | 'lab' | 'tutorial';
  color: string;
  schedule: ClassSchedule[];
  daySchedule?: ClassSchedule; // For expanded classes
}

interface RouteParams {
  classData: Class;
  canNavigate?: boolean;
}

const ClassDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { classData, canNavigate = true } = route.params as RouteParams;
  
  // Get the current schedule (either from daySchedule for expanded classes or use the first schedule)
  const currentSchedule = classData.daySchedule || classData.schedule[0];
  const allSchedules = classData.schedule || [currentSchedule];
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClassActive, setIsClassActive] = useState(false);
  const [timeStatus, setTimeStatus] = useState<'upcoming' | 'active' | 'past'>('upcoming');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkClassStatus = () => {
      if (!currentSchedule) return;
      
      const now = currentTime;
      const [startHour, startMinute] = currentSchedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = currentSchedule.endTime.split(':').map(Number);
      
      const classStart = new Date(now);
      classStart.setHours(startHour, startMinute, 0, 0);
      
      const classEnd = new Date(now);
      classEnd.setHours(endHour, endMinute, 0, 0);
      
      const nowTime = now.getTime();
      const startTime = classStart.getTime();
      const endTime = classEnd.getTime();
      
      if (nowTime < startTime) {
        setTimeStatus('upcoming');
        setIsClassActive(false);
      } else if (nowTime >= startTime && nowTime <= endTime) {
        setTimeStatus('active');
        setIsClassActive(true);
      } else {
        setTimeStatus('past');
        setIsClassActive(false);
      }
    };

    checkClassStatus();
  }, [currentTime, currentSchedule]);

  const getTimeUntilClass = () => {
    if (!currentSchedule) return 'No schedule';
    
    const now = currentTime;
    const [startHour, startMinute] = currentSchedule.startTime.split(':').map(Number);
    const classStart = new Date(now);
    classStart.setHours(startHour, startMinute, 0, 0);
    
    const diffMs = classStart.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 'Started';
    if (diffMins < 60) return `${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getClassDuration = () => {
    if (!currentSchedule) return 'N/A';
    
    const [startHour, startMinute] = currentSchedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = currentSchedule.endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = endInMinutes - startInMinutes;
    
    const hours = Math.floor(durationInMinutes / 60);
    const mins = durationInMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const navigateToRoom = () => {
    if (!currentSchedule) return;
    
    navigation.navigate('Navigate' as never, { 
      screen: 'NavigationMain',
      params: { 
        destination: currentSchedule.room,
        courseInfo: {
          courseCode: classData.courseCode,
          courseName: classData.courseName,
          professor: classData.professor,
          time: `${currentSchedule.startTime} - ${currentSchedule.endTime}`
        }
      }
    } as never);
  };

  const shareClass = async () => {
    try {
      const scheduleText = allSchedules.map(schedule => 
        `${schedule.day}: ${schedule.startTime} - ${schedule.endTime} in ${schedule.room}${schedule.type ? ` (${schedule.type})` : ''}`
      ).join('\n');
      
      const result = await Share.share({
        message: `${classData.courseCode} - ${classData.courseName}\n` +
                 `Professor: ${classData.professor}\n` +
                 `Schedule:\n${scheduleText}`,
        title: 'Class Information',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share class information');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return 'school';
      case 'lab': return 'flask';
      case 'tutorial': return 'people';
      default: return 'book';
    }
  };

  const getStatusColor = () => {
    switch (timeStatus) {
      case 'upcoming': return '#3B82F6';
      case 'active': return '#10B981';
      case 'past': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (timeStatus) {
      case 'upcoming': return `Starts in ${getTimeUntilClass()}`;
      case 'active': return 'Class is Active';
      case 'past': return 'Class Ended';
      default: return 'Unknown Status';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={classData.color} />
      
      {/* Header */}
      <LinearGradient
        colors={[classData.color, classData.color + 'DD']}
        style={[styles.header, { paddingTop: insets.top + dimensions.paddingM }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={dimensions.iconM} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareClass}
          >
            <Ionicons name="share-outline" size={dimensions.iconM} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.courseCode}>{classData.courseCode}</Text>
          <Text style={styles.courseName}>{classData.courseName}</Text>
          
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Info Cards */}
        <View style={styles.quickInfoGrid}>
          <View style={styles.quickInfoCard}>
            <View style={styles.quickInfoIcon}>
              <Ionicons name="time" size={dimensions.iconM} color="#3B82F6" />
            </View>
            <Text style={styles.quickInfoLabel}>Time</Text>
            <Text style={styles.quickInfoValue}>
              {currentSchedule ? `${currentSchedule.startTime} - ${currentSchedule.endTime}` : 'Multiple times'}
            </Text>
          </View>
          
          <View style={styles.quickInfoCard}>
            <View style={styles.quickInfoIcon}>
              <Ionicons name="location" size={dimensions.iconM} color="#10B981" />
            </View>
            <Text style={styles.quickInfoLabel}>Room</Text>
            <Text style={styles.quickInfoValue}>
              {currentSchedule ? currentSchedule.room : 'Multiple rooms'}
            </Text>
          </View>
          
          <View style={styles.quickInfoCard}>
            <View style={styles.quickInfoIcon}>
              <Ionicons name="calendar" size={dimensions.iconM} color="#8B5CF6" />
            </View>
            <Text style={styles.quickInfoLabel}>Day</Text>
            <Text style={styles.quickInfoValue}>
              {currentSchedule ? currentSchedule.day : allSchedules.map(s => s.day).join(', ')}
            </Text>
          </View>
          
          <View style={styles.quickInfoCard}>
            <View style={styles.quickInfoIcon}>
              <Ionicons name="hourglass" size={dimensions.iconM} color="#F59E0B" />
            </View>
            <Text style={styles.quickInfoLabel}>Duration</Text>
            <Text style={styles.quickInfoValue}>{getClassDuration()}</Text>
          </View>
        </View>

        {/* Class Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Class Details</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={dimensions.iconM} color="#4B5563" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Professor</Text>
              <Text style={styles.detailValue}>{classData.professor || 'TBA'}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name={getTypeIcon(classData.type)} size={dimensions.iconM} color="#4B5563" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Class Type</Text>
              <Text style={styles.detailValue}>
                {classData.type.charAt(0).toUpperCase() + classData.type.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="repeat" size={dimensions.iconM} color="#4B5563" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Recurring</Text>
              <Text style={styles.detailValue}>
                {allSchedules.length > 1 ? 'Multiple schedules' : `Weekly on ${allSchedules[0]?.day}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Building Information */}
        <View style={styles.buildingCard}>
          <Text style={styles.buildingTitle}>Building Information</Text>
          
          <View style={styles.buildingInfo}>
            <View style={styles.buildingIcon}>
              <Ionicons name="business" size={dimensions.iconL} color="#2E7D32" />
            </View>
            <View style={styles.buildingContent}>
              <Text style={styles.buildingName}>UFV Building T</Text>
              <Text style={styles.buildingAddress}>University of the Fraser Valley</Text>
              <Text style={styles.buildingFloor}>
                Room {classData.room} • Ground Floor
              </Text>
            </View>
          </View>
          
          <View style={styles.buildingFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="wifi" size={dimensions.iconS} color="#10B981" />
              <Text style={styles.featureText}>WiFi Available</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="accessibility" size={dimensions.iconS} color="#10B981" />
              <Text style={styles.featureText}>Accessible</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cafe" size={dimensions.iconS} color="#10B981" />
              <Text style={styles.featureText}>Cafeteria Nearby</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {canNavigate && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={navigateToRoom}
            >
              <Ionicons name="navigate" size={dimensions.iconM} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Navigate to Room</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                Alert.alert(
                  'Add to Calendar',
                  'This feature will be available soon.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="calendar-outline" size={dimensions.iconM} color="#2E7D32" />
              <Text style={styles.secondaryButtonText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header
  header: {
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingL,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingL,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  courseCode: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: moderateScale(4),
  },
  courseName: {
    fontSize: dimensions.fontL,
    color: '#ffffff',
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: dimensions.paddingM,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: moderateScale(8),
    borderRadius: dimensions.radiusL,
    gap: moderateScale(8),
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  statusText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Content
  content: {
    flex: 1,
    padding: dimensions.paddingM,
  },
  
  // Quick Info Grid
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.paddingM,
    marginBottom: dimensions.paddingL,
  },
  quickInfoCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickInfoIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.paddingS,
  },
  quickInfoLabel: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginBottom: moderateScale(4),
  },
  quickInfoValue: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  
  // Details Card
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingL,
    marginBottom: dimensions.paddingL,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
    marginBottom: dimensions.paddingL,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  detailIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginBottom: moderateScale(2),
  },
  detailValue: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Building Card
  buildingCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingL,
    marginBottom: dimensions.paddingL,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buildingTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
    marginBottom: dimensions.paddingL,
  },
  buildingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  buildingIcon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  buildingContent: {
    flex: 1,
  },
  buildingName: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
  },
  buildingAddress: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  buildingFloor: {
    fontSize: dimensions.fontS,
    color: '#9CA3AF',
    marginTop: moderateScale(2),
  },
  buildingFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.paddingM,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  featureText: {
    fontSize: dimensions.fontS,
    color: '#4B5563',
  },
  
  // Action Buttons
  actionButtons: {
    gap: dimensions.paddingM,
    marginBottom: dimensions.paddingXL,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.paddingL,
    borderRadius: dimensions.radiusL,
    gap: dimensions.paddingS,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2E7D32',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  primaryButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#2E7D32',
  },
});

export default ClassDetailScreen;