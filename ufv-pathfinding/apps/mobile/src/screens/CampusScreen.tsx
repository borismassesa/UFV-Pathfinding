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
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  dimensions, 
  scale, 
  moderateScale, 
  verticalScale,
  scaleFontSize,
  isTablet,
  responsiveValue 
} from '../utils/responsive';

// Types
interface ClassSchedule {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  type?: 'lecture' | 'lab' | 'tutorial'; // Optional override for different types on different days
}

interface Class {
  id: string;
  courseCode: string;
  courseName: string;
  professor: string;
  type: 'lecture' | 'lab' | 'tutorial'; // Default type
  color: string;
  schedule: ClassSchedule[]; // Array of schedules for different days
}

interface Service {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: 'available' | 'busy' | 'closed';
  location: string;
  hours?: string;
  description: string;
}

interface Event {
  id: string;
  title: string;
  type: 'academic' | 'social' | 'workshop' | 'club';
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  organizer: string;
}

interface AccessibilityFeature {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  locations: string[];
  status: 'operational' | 'maintenance' | 'unavailable';
  description: string;
}

type TabType = 'schedule' | 'services' | 'events' | 'accessibility';

const CampusScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [scheduleView, setScheduleView] = useState<'today' | 'week'>('today');
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [newClass, setNewClass] = useState({
    courseCode: '',
    courseName: '',
    professor: '',
    type: 'lecture' as 'lecture' | 'lab' | 'tutorial',
    schedule: [] as ClassSchedule[],
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [daySchedule, setDaySchedule] = useState({
    startTime: '',
    endTime: '',
    room: '',
    type: 'lecture' as 'lecture' | 'lab' | 'tutorial',
  });
  const [myClasses, setMyClasses] = useState<Class[]>([]);

  const [services] = useState<Service[]>([
    {
      id: '1',
      name: 'Computer Labs',
      icon: 'desktop',
      status: 'available',
      location: 'T032',
      hours: '7:00 AM - 10:00 PM',
      description: 'Medium Classroom with computers',
    },
    {
      id: '2',
      name: 'Study Areas',
      icon: 'book',
      status: 'available',
      location: 'T033',
      hours: '7:00 AM - 10:00 PM',
      description: 'Quiet study space',
    },
    {
      id: '3',
      name: 'Lecture Halls',
      icon: 'school',
      status: 'available',
      location: 'T001',
      hours: '7:00 AM - 10:00 PM',
      description: 'Large lecture hall (372m²)',
    },
    {
      id: '4',
      name: 'Faculty Offices',
      icon: 'person',
      status: 'available',
      location: 'T002-T013',
      hours: '8:00 AM - 5:00 PM',
      description: 'Small & medium offices',
    },
    {
      id: '5',
      name: 'Washrooms',
      icon: 'water',
      status: 'available',
      location: 'Multiple floors',
      hours: '24/7',
      description: 'Accessible facilities',
    },
    {
      id: '6',
      name: 'Utility Services',
      icon: 'construct',
      status: 'available',
      location: 'T014, T015',
      hours: 'Staff only',
      description: 'Building maintenance',
    },
  ]);

  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Computer Science Info Session',
      type: 'academic',
      location: 'T001',
      startTime: '12:00',
      endTime: '13:00',
      description: 'Learn about CS programs and career paths',
      organizer: 'CS Department',
    },
    {
      id: '2',
      title: 'Study Group - Programming',
      type: 'workshop',
      location: 'T032',
      startTime: '14:00',
      endTime: '16:00',
      description: 'Collaborative programming practice',
      organizer: 'Student Learning Centre',
    },
    {
      id: '3',
      title: 'Faculty Office Hours',
      type: 'academic',
      location: 'T007',
      startTime: '16:00',
      endTime: '17:00',
      description: 'Drop-in help with coursework',
      organizer: 'Dr. Smith',
    },
    {
      id: '4',
      title: 'Building T Maintenance',
      type: 'social',
      location: 'T014',
      startTime: '18:00',
      endTime: '20:00',
      description: 'Scheduled maintenance - limited access',
      organizer: 'Facilities Management',
    },
  ]);

  const [accessibilityFeatures] = useState<AccessibilityFeature[]>([
    {
      id: '1',
      name: 'Elevators',
      icon: 'layers',
      locations: ['Main Entrance', 'East Wing'],
      status: 'operational',
      description: 'All elevators functioning',
    },
    {
      id: '2',
      name: 'Accessible Washrooms',
      icon: 'accessibility',
      locations: ['T105', 'T205', 'T305'],
      status: 'operational',
      description: 'Wide stalls with support bars',
    },
    {
      id: '3',
      name: 'Ramps',
      icon: 'trending-up',
      locations: ['All entrances'],
      status: 'operational',
      description: 'Gradual incline ramps',
    },
    {
      id: '4',
      name: 'Quiet Study Spaces',
      icon: 'volume-off',
      locations: ['T215', 'T216'],
      status: 'available',
      description: 'Sound-isolated rooms',
    },
  ]);

  // Storage key for AsyncStorage
  const CLASSES_STORAGE_KEY = '@ufv_pathfinding_classes';
  const FIRST_LAUNCH_KEY = '@ufv_pathfinding_first_launch';

  // Demo classes for first launch
  const getDemoClasses = (): Class[] => [
    {
      id: '1',
      courseCode: 'COMP 150',
      courseName: 'Introduction to Programming',
      professor: 'Dr. Smith',
      type: 'lecture',
      color: '#2196F3',
      schedule: [
        { day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'T125', type: 'lecture' },
        { day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'T125', type: 'lecture' },
        { day: 'Friday', startTime: '14:00', endTime: '16:00', room: 'T032', type: 'lab' },
      ],
    },
    {
      id: '2',
      courseCode: 'MATH 110',
      courseName: 'Calculus I',
      professor: 'Prof. Johnson',
      type: 'lecture',
      color: '#4CAF50',
      schedule: [
        { day: 'Monday', startTime: '11:00', endTime: '12:30', room: 'T201' },
        { day: 'Wednesday', startTime: '11:00', endTime: '12:30', room: 'T201' },
        { day: 'Thursday', startTime: '15:00', endTime: '16:00', room: 'T033', type: 'tutorial' },
      ],
    },
    {
      id: '3',
      courseCode: 'COMP 155',
      courseName: 'Object-Oriented Programming',
      professor: 'Dr. Chen',
      type: 'lecture',
      color: '#FF9800',
      schedule: [
        { day: 'Tuesday', startTime: '10:00', endTime: '11:30', room: 'T125', type: 'lecture' },
        { day: 'Thursday', startTime: '14:00', endTime: '16:00', room: 'T032', type: 'lab' },
      ],
    },
    {
      id: '4',
      courseCode: 'ENGL 105',
      courseName: 'Academic Writing',
      professor: 'Prof. Williams',
      type: 'tutorial',
      color: '#9C27B0',
      schedule: [
        { day: 'Monday', startTime: '16:00', endTime: '17:30', room: 'T001' },
        { day: 'Wednesday', startTime: '14:00', endTime: '15:30', room: 'T033' },
      ],
    },
    {
      id: '5',
      courseCode: 'PHYS 101',
      courseName: 'Physics I',
      professor: 'Dr. Anderson',
      type: 'lecture',
      color: '#E91E63',
      schedule: [
        { day: 'Tuesday', startTime: '13:00', endTime: '14:30', room: 'T201', type: 'lecture' },
        { day: 'Friday', startTime: '10:00', endTime: '12:00', room: 'T015', type: 'lab' },
      ],
    },
  ];

  // Load classes from AsyncStorage
  const loadClasses = async () => {
    try {
      // Check if this is first launch
      const isFirstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      
      if (!isFirstLaunch) {
        // First launch - set demo data
        const demoClasses = getDemoClasses();
        setMyClasses(demoClasses);
        await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
        await AsyncStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(demoClasses));
        console.log('✅ First launch - loaded demo classes');
      } else {
        // Not first launch - load stored classes
        const storedClasses = await AsyncStorage.getItem(CLASSES_STORAGE_KEY);
        if (storedClasses) {
          const parsedClasses = JSON.parse(storedClasses);
          setMyClasses(parsedClasses);
          console.log('✅ Loaded', parsedClasses.length, 'classes from storage');
        }
      }
    } catch (error) {
      console.error('❌ Error loading classes:', error);
    }
  };

  // Save classes to AsyncStorage
  const saveClasses = async (classes: Class[]) => {
    try {
      await AsyncStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
      console.log('✅ Saved', classes.length, 'classes to storage');
    } catch (error) {
      console.error('❌ Error saving classes:', error);
      Alert.alert('Storage Error', 'Failed to save your classes. Please try again.');
    }
  };

  // Track if initial load is complete
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Load classes on component mount
  useEffect(() => {
    loadClasses().then(() => {
      setIsInitialLoadComplete(true);
    });
  }, []);

  // Save classes whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialLoadComplete) {
      saveClasses(myClasses);
    }
  }, [myClasses, isInitialLoadComplete]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get current day of week
  const getCurrentDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[currentTime.getDay()];
  };

  // Create expanded class instances for each schedule
  const getExpandedClasses = () => {
    const expanded: (Class & { daySchedule: ClassSchedule })[] = [];
    
    myClasses.forEach(cls => {
      cls.schedule.forEach(schedule => {
        expanded.push({
          ...cls,
          daySchedule: schedule,
        });
      });
    });
    
    return expanded;
  };

  // Get today's classes
  const getTodaysClasses = () => {
    const today = getCurrentDayOfWeek();
    const expandedClasses = getExpandedClasses();
    
    return expandedClasses
      .filter(cls => cls.daySchedule.day === today)
      .sort((a, b) => {
        const timeA = a.daySchedule.startTime.split(':').map(Number);
        const timeB = b.daySchedule.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
  };

  // Get next class
  const getNextClass = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const today = getCurrentDayOfWeek();
    const expandedClasses = getExpandedClasses();

    return expandedClasses.find(cls => {
      if (cls.daySchedule.day !== today) return false;
      const [startHour, startMinute] = cls.daySchedule.startTime.split(':').map(Number);
      const classStartInMinutes = startHour * 60 + startMinute;
      return classStartInMinutes > currentTimeInMinutes;
    });
  };

  // Get week's classes organized by day
  const getWeekClasses = () => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekSchedule: { [key: string]: (Class & { daySchedule: ClassSchedule })[] } = {};
    const expandedClasses = getExpandedClasses();
    
    weekDays.forEach(day => {
      weekSchedule[day] = expandedClasses
        .filter(cls => cls.daySchedule.day === day)
        .sort((a, b) => {
          const timeA = a.daySchedule.startTime.split(':').map(Number);
          const timeB = b.daySchedule.startTime.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
    });
    
    return weekSchedule;
  };

  // Calculate time until next class
  const getTimeUntilClass = (classItem: Class & { daySchedule: ClassSchedule }) => {
    const now = currentTime;
    const [startHour, startMinute] = classItem.daySchedule.startTime.split(':').map(Number);
    const classStart = new Date(now);
    classStart.setHours(startHour, startMinute, 0, 0);
    
    const diffMs = classStart.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const nextClass = getNextClass();

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Schedule and services updated!');
    }, 1000);
  };

  const navigateToRoom = (room: string) => {
    // Navigate to the Navigate tab with pre-selected destination
    navigation.navigate('Navigate' as never, { 
      screen: 'NavigationMain',
      params: { destination: room }
    } as never);
  };

  const navigateToClass = (classItem: Class) => {
    // Navigate to class detail screen
    navigation.navigate('ClassDetail', { 
      classData: classItem,
      canNavigate: true
    } as never);
  };

  const addNewClass = () => {
    setShowAddClassModal(true);
  };

  // Delete a class
  const deleteClass = (classId: string) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMyClasses(prev => prev.filter(c => c.id !== classId));
            Alert.alert('Success', 'Class deleted successfully');
          },
        },
      ]
    );
  };

  // Clear all classes
  const clearAllClasses = () => {
    Alert.alert(
      'Clear All Classes',
      'Are you sure you want to delete all classes? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setMyClasses([]);
            await AsyncStorage.removeItem(CLASSES_STORAGE_KEY);
            Alert.alert('Success', 'All classes have been removed');
          },
        },
      ]
    );
  };

  // Time picker functions
  const openTimePicker = (type: 'start' | 'end') => {
    console.log('Opening time picker for:', type);
    setShowTimePicker(type);
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    if (showTimePicker === 'start') {
      setDaySchedule(prev => ({ ...prev, startTime: timeString }));
    } else if (showTimePicker === 'end') {
      setDaySchedule(prev => ({ ...prev, endTime: timeString }));
    }
    
    setShowTimePicker(null);
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return 'Select time';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  const resetNewClass = () => {
    setNewClass({
      courseCode: '',
      courseName: '',
      professor: '',
      type: 'lecture',
      schedule: [],
    });
    setSelectedDay(null);
    setDaySchedule({
      startTime: '',
      endTime: '',
      room: '',
      type: 'lecture',
    });
  };

  // Day management functions
  const selectDay = (day: string) => {
    // If clicking the same day that's already selected, just return
    if (selectedDay === day) {
      return;
    }

    // Load schedule for the selected day
    const existingSchedule = newClass.schedule.find(s => s.day === day);
    if (existingSchedule) {
      setDaySchedule({
        startTime: existingSchedule.startTime,
        endTime: existingSchedule.endTime,
        room: existingSchedule.room,
        type: existingSchedule.type,
      });
    } else {
      setDaySchedule({
        startTime: '',
        endTime: '',
        room: '',
        type: 'lecture',
      });
    }
    
    setSelectedDay(day);
  };

  const removeDaySchedule = (day: string) => {
    const updatedSchedule = newClass.schedule.filter(s => s.day !== day);
    setNewClass(prev => ({ ...prev, schedule: updatedSchedule }));
    
    if (selectedDay === day) {
      setSelectedDay(null);
      setDaySchedule({
        startTime: '',
        endTime: '',
        room: '',
        type: 'lecture',
      });
    }
  };

  const handleSaveClass = () => {
    // Validate required fields
    if (!newClass.courseCode.trim() || !newClass.courseName.trim()) {
      Alert.alert('Missing Information', 'Please fill in Course Code and Course Name.');
      return;
    }

    // Use the current schedule as is (user must click "Save Schedule" for each day)
    const finalSchedule = newClass.schedule;

    if (finalSchedule.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one class schedule.');
      return;
    }

    // Validate each schedule entry
    for (const schedule of finalSchedule) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
        Alert.alert('Invalid Time', `Invalid time format for ${schedule.day}. Please use 24-hour format.`);
        return;
      }

      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      const startInMinutes = startHour * 60 + startMinute;
      const endInMinutes = endHour * 60 + endMinute;
      
      if (startInMinutes >= endInMinutes) {
        Alert.alert('Invalid Time', `End time must be after start time for ${schedule.day}.`);
        return;
      }

      if (!schedule.room.trim()) {
        Alert.alert('Missing Information', `Please specify a room for ${schedule.day}.`);
        return;
      }
    }

    // Generate new class object (use first schedule's type as the default)
    const defaultType = finalSchedule[0]?.type || 'lecture';
    const newClassItem: Class = {
      id: Date.now().toString(),
      courseCode: newClass.courseCode.trim().toUpperCase(),
      courseName: newClass.courseName.trim(),
      professor: newClass.professor.trim() || 'TBA',
      type: defaultType,
      color: defaultType === 'lecture' ? '#2196F3' : 
             defaultType === 'lab' ? '#FF9800' : '#9C27B0',
      schedule: finalSchedule.map(s => ({
        ...s,
        room: s.room.trim().toUpperCase(),
      })),
    };

    // Add to classes list
    setMyClasses(prev => [...prev, newClassItem]);
    
    // Reset form and close modal
    resetNewClass();
    setShowAddClassModal(false);
    
    const scheduleDays = finalSchedule.map(s => s.day).join(', ');
    Alert.alert(
      'Class Added! 🎉',
      `${newClassItem.courseCode} has been added to your schedule for ${scheduleDays}.`,
      [{ text: 'OK' }]
    );
  };

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={dimensions.iconXS} 
        color={activeTab === tab ? '#ffffff' : '#6B7280'} 
      />
      <Text 
        style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderScheduleView = () => {
    const nextClass = getNextClass();
    const todaysClasses = getTodaysClasses();
    const weekClasses = getWeekClasses();
    const today = getCurrentDayOfWeek();

    return (
      <View>
        {/* Next Class Card */}
        {nextClass && (
          <LinearGradient
            colors={['#2E7D32', '#4CAF50']}
            style={styles.nextClassCard}
          >
            <View style={styles.nextClassHeader}>
              <Text style={styles.nextClassLabel}>Next Class</Text>
              <View style={styles.timeUntilBadge}>
                <Ionicons name="time" size={dimensions.iconXS} color="#2E7D32" />
                <Text style={styles.timeUntilText}>{getTimeUntilClass(nextClass)}</Text>
              </View>
            </View>
            <Text style={styles.nextClassCourse}>{nextClass.courseCode}</Text>
            <Text style={styles.nextClassName}>{nextClass.courseName}</Text>
            <View style={styles.nextClassDetails}>
              <View style={styles.nextClassDetail}>
                <Ionicons name="location" size={dimensions.iconS} color="#ffffff" />
                <Text style={styles.nextClassDetailText}>Room {nextClass.daySchedule.room}</Text>
              </View>
              <View style={styles.nextClassDetail}>
                <Ionicons name="person" size={dimensions.iconS} color="#ffffff" />
                <Text style={styles.nextClassDetailText}>{nextClass.professor}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => navigateToClass(nextClass)}
            >
              <Text style={styles.navigateButtonText}>Navigate Now</Text>
              <Ionicons name="navigate" size={dimensions.iconM} color="#2E7D32" />
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Schedule View Toggle */}
        <View style={styles.scheduleToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, scheduleView === 'today' && styles.toggleButtonActive]}
            onPress={() => setScheduleView('today')}
          >
            <Ionicons 
              name="today" 
              size={dimensions.iconS} 
              color={scheduleView === 'today' ? '#ffffff' : '#6B7280'} 
            />
            <Text style={[styles.toggleButtonText, scheduleView === 'today' && styles.toggleButtonTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, scheduleView === 'week' && styles.toggleButtonActive]}
            onPress={() => setScheduleView('week')}
          >
            <Ionicons 
              name="calendar" 
              size={dimensions.iconS} 
              color={scheduleView === 'week' ? '#ffffff' : '#6B7280'} 
            />
            <Text style={[styles.toggleButtonText, scheduleView === 'week' && styles.toggleButtonTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
        </View>

        {scheduleView === 'today' ? (
          /* Today's Schedule */
          <View>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {todaysClasses.length > 0 ? (
              todaysClasses.map((classItem) => {
                const isPast = () => {
                  const [endHour, endMinute] = classItem.daySchedule.endTime.split(':').map(Number);
                  const now = currentTime;
                  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
                  const classEndInMinutes = endHour * 60 + endMinute;
                  return currentTimeInMinutes > classEndInMinutes;
                };

                const classType = classItem.daySchedule.type || classItem.type;

                return (
                  <TouchableOpacity
                    key={`${classItem.id}-${classItem.daySchedule.day}`}
                    style={styles.classCard}
                    onPress={() => navigateToClass(classItem)}
                    onLongPress={() => deleteClass(classItem.id)}
                  >
                    <View style={[styles.classColorBar, { backgroundColor: classItem.color }]} />
                    <View style={styles.classContent}>
                      <View style={styles.classHeader}>
                        <View>
                          <Text style={styles.classCourseCode}>{classItem.courseCode}</Text>
                          <Text style={styles.classCourseName}>{classItem.courseName}</Text>
                        </View>
                        <View style={[styles.classTypeBadge, { backgroundColor: classItem.color + '20' }]}>
                          <Text style={[styles.classTypeText, { color: classItem.color }]}>
                            {classType.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.classDetails}>
                        <View style={styles.classDetail}>
                          <Ionicons name="time" size={dimensions.iconXS} color="#6B7280" />
                          <Text style={styles.classDetailText}>
                            {classItem.daySchedule.startTime} - {classItem.daySchedule.endTime}
                          </Text>
                        </View>
                        <View style={styles.classDetail}>
                          <Ionicons name="location" size={dimensions.iconXS} color="#6B7280" />
                          <Text style={styles.classDetailText}>Room {classItem.daySchedule.room}</Text>
                        </View>
                        <View style={styles.classDetail}>
                          <Ionicons name="person" size={dimensions.iconXS} color="#6B7280" />
                          <Text style={styles.classDetailText}>{classItem.professor}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="calendar-outline" size={dimensions.iconXL} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No classes today</Text>
                <Text style={styles.emptyStateSubtext}>Enjoy your free day!</Text>
              </View>
            )}
          </View>
        ) : (
          /* Week Schedule */
          <View>
            <Text style={styles.sectionTitle}>This Week's Schedule</Text>
            {Object.entries(weekClasses).map(([day, classes]) => (
              <View key={day} style={styles.weekDaySection}>
                <View style={styles.weekDayHeader}>
                  <Text style={[styles.weekDayTitle, today === day && styles.weekDayTitleToday]}>
                    {day}
                    {today === day && (
                      <Text style={styles.todayIndicator}> (Today)</Text>
                    )}
                  </Text>
                  <Text style={styles.weekDayCount}>
                    {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                  </Text>
                </View>
                {classes.length > 0 ? (
                  classes.map((classItem) => {
                    const classType = classItem.daySchedule.type || classItem.type;
                    
                    return (
                      <TouchableOpacity
                        key={`${classItem.id}-${classItem.daySchedule.day}`}
                        style={styles.weekClassCard}
                        onPress={() => navigateToClass(classItem)}
                      >
                        <View style={[styles.weekClassColorBar, { backgroundColor: classItem.color }]} />
                        <View style={styles.weekClassContent}>
                          <View style={styles.weekClassHeader}>
                            <Text style={styles.weekClassCourse}>{classItem.courseCode}</Text>
                            <Text style={styles.weekClassTime}>
                              {classItem.daySchedule.startTime} - {classItem.daySchedule.endTime}
                            </Text>
                          </View>
                          <Text style={styles.weekClassRoom}>Room {classItem.daySchedule.room}</Text>
                        </View>
                        <View style={[styles.weekClassTypeBadge, { backgroundColor: classItem.color + '20' }]}>
                          <Text style={[styles.weekClassTypeText, { color: classItem.color }]}>
                            {classType.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyDayCard}>
                    <Text style={styles.emptyDayText}>No classes</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Add Class Button */}
        <TouchableOpacity style={styles.addButton} onPress={addNewClass}>
          <Ionicons name="add-circle" size={dimensions.iconM} color="#2E7D32" />
          <Text style={styles.addButtonText}>Add Class</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderServicesView = () => (
    <View>
      <Text style={styles.sectionTitle}>Campus Services</Text>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => (
          <View 
            key={service.id} 
            style={[
              styles.serviceCardWrapper,
              index % 2 === 0 ? styles.serviceCardLeft : styles.serviceCardRight
            ]}
          >
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => navigateToRoom(service.location)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.serviceIcon,
                { backgroundColor: service.status === 'available' ? '#E8F5E8' : 
                  service.status === 'busy' ? '#FFF3E0' : '#FFEBEE' }
              ]}>
                <Ionicons 
                  name={service.icon} 
                  size={dimensions.iconL} 
                  color={service.status === 'available' ? '#2E7D32' : 
                    service.status === 'busy' ? '#FF9800' : '#F44336'} 
                />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceLocation}>{service.location}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              {service.hours && (
                <Text style={styles.serviceHours}>{service.hours}</Text>
              )}
              <View style={[
                styles.serviceStatus,
                { backgroundColor: service.status === 'available' ? '#2E7D32' : 
                  service.status === 'busy' ? '#FF9800' : '#F44336' }
              ]}>
                <Text style={styles.serviceStatusText}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderEventsView = () => (
    <View>
      <Text style={styles.sectionTitle}>Today's Events</Text>
      {events.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.eventCard}
          onPress={() => navigateToRoom(event.location)}
        >
          <View style={[
            styles.eventTypeBar,
            { backgroundColor: 
              event.type === 'academic' ? '#2196F3' :
              event.type === 'workshop' ? '#4CAF50' :
              event.type === 'club' ? '#9C27B0' : '#FF9800'
            }
          ]} />
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventOrganizer}>{event.organizer}</Text>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetail}>
                <Ionicons name="time" size={dimensions.iconXS} color="#6B7280" />
                <Text style={styles.eventDetailText}>
                  {event.startTime} - {event.endTime}
                </Text>
              </View>
              <View style={styles.eventDetail}>
                <Ionicons name="location" size={dimensions.iconXS} color="#6B7280" />
                <Text style={styles.eventDetailText}>{event.location}</Text>
              </View>
            </View>
            <Text style={styles.eventDescription}>{event.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={dimensions.iconS} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          Alert.alert(
            'Campus Events',
            'View all upcoming events and activities in Building T.',
            [
              { text: 'OK' },
              { 
                text: 'Open Calendar', 
                onPress: () => Alert.alert('Calendar', 'External calendar integration coming soon!')
              }
            ]
          );
        }}
      >
        <Ionicons name="calendar" size={dimensions.iconM} color="#2E7D32" />
        <Text style={styles.addButtonText}>View All Events</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccessibilityView = () => (
    <View>
      <Text style={styles.sectionTitle}>Accessibility Features</Text>
      {accessibilityFeatures.map((feature) => (
        <View key={feature.id} style={styles.accessibilityCard}>
          <View style={styles.accessibilityHeader}>
            <View style={styles.accessibilityIcon}>
              <Ionicons name={feature.icon} size={dimensions.iconL} color="#2E7D32" />
            </View>
            <View style={styles.accessibilityInfo}>
              <Text style={styles.accessibilityName}>{feature.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: feature.status === 'operational' ? '#E8F5E8' : '#FFEBEE' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: feature.status === 'operational' ? '#2E7D32' : '#F44336' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: feature.status === 'operational' ? '#2E7D32' : '#F44336' }
                ]}>
                  {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.accessibilityDescription}>{feature.description}</Text>
          <View style={styles.locationsList}>
            <Text style={styles.locationsLabel}>Locations:</Text>
            {feature.locations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.locationChip}
                onPress={() => navigateToRoom(location)}
              >
                <Text style={styles.locationChipText}>{location}</Text>
                <Ionicons name="navigate" size={dimensions.iconXS} color="#2E7D32" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      
      <TouchableOpacity 
        style={styles.accessibleRouteButton}
        onPress={() => {
          navigation.navigate('Navigate' as never, { 
            screen: 'NavigationMain',
            params: { 
              accessibleRoute: true,
              message: 'Accessibility mode enabled - routes will prioritize elevators and ramps'
            }
          } as never);
        }}
      >
        <Ionicons name="map" size={dimensions.iconM} color="#ffffff" />
        <Text style={styles.accessibleRouteButtonText}>Plan Accessible Route</Text>
      </TouchableOpacity>
    </View>
  );

  // Render Time Picker Modal
  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 4 }, (_, i) => i * 15); // 0, 15, 30, 45
    
    console.log('Rendering time picker, showTimePicker:', showTimePicker);
    
    if (showTimePicker === null) return null;
    
    return (
      <View style={[styles.timePickerOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }]}>
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={() => setShowTimePicker(null)}
        />
        <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(null)}
              >
                <Text style={styles.timePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <Text style={styles.timePickerTitle}>
                Select {showTimePicker === 'start' ? 'Start' : 'End'} Time
              </Text>
              
              <View style={styles.timePickerButton} />
            </View>
            
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hour</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={styles.timePickerItem}
                      onPress={() => {
                        const currentMinute = daySchedule[showTimePicker === 'start' ? 'startTime' : 'endTime']?.split(':')[1] || '00';
                        handleTimeSelect(hour, parseInt(currentMinute));
                      }}
                    >
                      <Text style={styles.timePickerItemText}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <Text style={styles.timePickerSeparator}>:</Text>
              
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={styles.timePickerItem}
                      onPress={() => {
                        const currentHour = daySchedule[showTimePicker === 'start' ? 'startTime' : 'endTime']?.split(':')[0] || '09';
                        handleTimeSelect(parseInt(currentHour), minute);
                      }}
                    >
                      <Text style={styles.timePickerItemText}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={styles.timePickerQuickButton}
                onPress={() => handleTimeSelect(9, 0)}
              >
                <Text style={styles.timePickerQuickText}>9:00 AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timePickerQuickButton}
                onPress={() => handleTimeSelect(14, 0)}
              >
                <Text style={styles.timePickerQuickText}>2:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timePickerQuickButton}
                onPress={() => handleTimeSelect(17, 30)}
              >
                <Text style={styles.timePickerQuickText}>5:30 PM</Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>
    );
  };

  // Render Add Class Modal
  const renderAddClassModal = () => (
    <Modal
      visible={showAddClassModal}
      animationType="slide"
    >
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
        <View style={[styles.modalHeader, { paddingTop: insets.top + dimensions.paddingM }]}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              resetNewClass();
              setShowAddClassModal(false);
            }}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Add New Class</Text>
          
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSaveClass}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Course Info Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Course Information</Text>
            
            {/* Course Code */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Course Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., COMP 150"
                value={newClass.courseCode}
                onChangeText={(text) => setNewClass(prev => ({ ...prev, courseCode: text }))}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Course Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Course Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Introduction to Programming"
                value={newClass.courseName}
                onChangeText={(text) => setNewClass(prev => ({ ...prev, courseName: text }))}
                autoCapitalize="words"
              />
            </View>

            {/* Professor */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Professor</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Dr. Smith"
                value={newClass.professor}
                onChangeText={(text) => setNewClass(prev => ({ ...prev, professor: text }))}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Schedule Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Class Schedule</Text>
            <Text style={styles.sectionSubtitle}>Add all days this class meets (e.g., Monday lecture, Wednesday lab, Friday tutorial)</Text>
            
            {/* Day Buttons */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.daySelector}
              contentContainerStyle={styles.daySelectorContent}
            >
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((day) => {
                const hasSchedule = newClass.schedule.some(s => s.day === day);
                const isSelected = selectedDay === day;
                const isWeekend = day === 'Saturday' || day === 'Sunday';
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayScheduleButton,
                      isWeekend && styles.dayScheduleButtonWeekend,
                      hasSchedule && styles.dayScheduleButtonHasSchedule,
                      isSelected && styles.dayScheduleButtonSelected
                    ]}
                    onPress={() => selectDay(day)}
                  >
                    <Text style={[
                      styles.dayScheduleButtonText,
                      isWeekend && styles.dayScheduleButtonTextWeekend,
                      hasSchedule && styles.dayScheduleButtonTextHasSchedule,
                      isSelected && styles.dayScheduleButtonTextSelected
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                    {hasSchedule && (
                      <TouchableOpacity
                        style={styles.removeDayButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeDaySchedule(day);
                        }}
                      >
                        <Ionicons name="close-circle" size={dimensions.iconXS} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Schedule Summary */}
            {newClass.schedule.length > 0 && (
              <View style={styles.scheduleList}>
                <View style={styles.scheduleListHeader}>
                  <Text style={styles.scheduleListTitle}>Class Schedule ({newClass.schedule.length} {newClass.schedule.length === 1 ? 'day' : 'days'})</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Clear Schedule',
                        'Remove all scheduled days?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Clear All', 
                            style: 'destructive',
                            onPress: () => setNewClass(prev => ({ ...prev, schedule: [] }))
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.clearScheduleText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                {newClass.schedule.map((schedule, index) => {
                  const scheduleType = schedule.type;
                  return (
                    <View key={index} style={styles.scheduleItem}>
                      <View style={styles.scheduleItemLeft}>
                        <View style={[styles.scheduleItemBadge, { backgroundColor: 
                          scheduleType === 'lecture' ? '#2196F3' : 
                          scheduleType === 'lab' ? '#FF9800' : '#9C27B0' 
                        }]}>
                          <Text style={styles.scheduleItemBadgeText}>
                            {scheduleType.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.scheduleItemContent}>
                          <Text style={styles.scheduleItemDay}>{schedule.day}</Text>
                          <Text style={styles.scheduleItemTime}>
                            {formatTimeDisplay(schedule.startTime)} - {formatTimeDisplay(schedule.endTime)}
                          </Text>
                          <Text style={styles.scheduleItemRoom}>Room {schedule.room}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeDaySchedule(schedule.day)}
                        style={styles.scheduleItemRemove}
                      >
                        <Ionicons name="trash-outline" size={dimensions.iconS} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Day Schedule Editor */}
            {selectedDay && (
              <View style={styles.dayScheduleEditor}>
                <View style={styles.dayScheduleHeader}>
                  <Text style={styles.dayScheduleTitle}>Schedule for {selectedDay}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedDay(null)}
                    style={styles.closeDayButton}
                  >
                    <Ionicons name="close" size={dimensions.iconM} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.dayScheduleHelper}>Each day can have different times, rooms, and types (lecture/lab/tutorial).</Text>
                
                {/* Room */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Room *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., T125"
                    value={daySchedule.room}
                    onChangeText={(text) => setDaySchedule(prev => ({ ...prev, room: text }))}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                {/* Time Row */}
                <View style={styles.timeRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: dimensions.paddingS }]}>
                    <Text style={styles.formLabel}>Start Time *</Text>
                    <TouchableOpacity
                      style={styles.timePickerInput}
                      onPress={() => openTimePicker('start')}
                    >
                      <Text style={[
                        styles.timePickerInputText,
                        !daySchedule.startTime && styles.timePickerPlaceholder
                      ]}>
                        {daySchedule.startTime ? formatTimeDisplay(daySchedule.startTime) : 'Select start time'}
                      </Text>
                      <Ionicons name="time-outline" size={dimensions.iconS} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: dimensions.paddingS }]}>
                    <Text style={styles.formLabel}>End Time *</Text>
                    <TouchableOpacity
                      style={styles.timePickerInput}
                      onPress={() => openTimePicker('end')}
                    >
                      <Text style={[
                        styles.timePickerInputText,
                        !daySchedule.endTime && styles.timePickerPlaceholder
                      ]}>
                        {daySchedule.endTime ? formatTimeDisplay(daySchedule.endTime) : 'Select end time'}
                      </Text>
                      <Ionicons name="time-outline" size={dimensions.iconS} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Class Type */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Class Type</Text>
                  <View style={styles.typeSelector}>
                    {(['lecture', 'lab', 'tutorial'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          daySchedule.type === type && styles.typeButtonActive
                        ]}
                        onPress={() => setDaySchedule(prev => ({ ...prev, type }))}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          daySchedule.type === type && styles.typeButtonTextActive
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Save Day Schedule Button */}
                <TouchableOpacity
                  style={[styles.saveDayButton, (!daySchedule.startTime || !daySchedule.endTime || !daySchedule.room) && styles.saveDayButtonDisabled]}
                  onPress={() => {
                    if (daySchedule.startTime && daySchedule.endTime && daySchedule.room) {
                      // Save the current day's schedule
                      const updatedSchedule = newClass.schedule.filter(s => s.day !== selectedDay);
                      updatedSchedule.push({
                        day: selectedDay,
                        startTime: daySchedule.startTime,
                        endTime: daySchedule.endTime,
                        room: daySchedule.room,
                        type: daySchedule.type,
                      });
                      setNewClass(prev => ({ ...prev, schedule: updatedSchedule }));
                      
                      // Clear the form for next day
                      setDaySchedule({
                        startTime: '',
                        endTime: '',
                        room: '',
                        type: 'lecture',
                      });
                      setSelectedDay(null);
                      
                      Alert.alert('Success', `Schedule added for ${selectedDay}!`);
                    }
                  }}
                  disabled={!daySchedule.startTime || !daySchedule.endTime || !daySchedule.room}
                >
                  <Ionicons name="checkmark-circle" size={dimensions.iconM} color="#ffffff" />
                  <Text style={styles.saveDayButtonText}>Save Schedule for {selectedDay}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Helper Text */}
          <View style={styles.helperSection}>
            <Text style={styles.helperText}>
              💡 How to add a multi-day schedule:{'\n'}
              1. Tap a day button (e.g., Monday){'\n'}
              2. Fill in time, room, and type for that day{'\n'}
              3. Click "Save Schedule for [Day]"{'\n'}
              4. Repeat for other days (e.g., Wednesday lab, Friday tutorial){'\n'}
              5. Each day can have different times, rooms, and types!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Time Picker Overlay - Rendered on top of modal content */}
      {renderTimePicker()}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Add Class Modal */}
      {renderAddClassModal()}
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + dimensions.paddingM }]}>
        <Text style={styles.headerTitle}>Campus Hub</Text>
        <Text style={styles.headerSubtitle}>Everything you need in one place</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabScrollContainer}>
        <View style={styles.tabContainer}>
          {renderTabButton('schedule', 'Schedule', 'calendar')}
          {renderTabButton('services', 'Services', 'apps')}
          {renderTabButton('events', 'Events', 'megaphone')}
          {renderTabButton('accessibility', 'Access', 'accessibility')}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: dimensions.tabBarHeight + dimensions.paddingXL }}
      >
        {activeTab === 'schedule' && renderScheduleView()}
        {activeTab === 'services' && renderServicesView()}
        {activeTab === 'events' && renderEventsView()}
        {activeTab === 'accessibility' && renderAccessibilityView()}
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
    backgroundColor: '#ffffff',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginTop: moderateScale(4),
  },
  
  // Tab Navigation
  tabScrollContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingS,
    justifyContent: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(16),
    marginHorizontal: moderateScale(3),
    backgroundColor: '#F3F4F6',
    gap: moderateScale(4),
  },
  activeTabButton: {
    backgroundColor: '#2E7D32',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: dimensions.fontS,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  
  // Content
  content: {
    flex: 1,
    padding: dimensions.paddingM,
  },
  sectionTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
    marginTop: dimensions.paddingL,
    marginBottom: dimensions.paddingM,
  },
  
  // Next Class Card
  nextClassCard: {
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingL,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  nextClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  nextClassLabel: {
    fontSize: dimensions.fontM,
    color: '#ffffff',
    opacity: 0.9,
  },
  timeUntilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: dimensions.paddingS,
    paddingVertical: moderateScale(4),
    borderRadius: dimensions.radiusM,
    gap: moderateScale(4),
  },
  timeUntilText: {
    fontSize: dimensions.fontS,
    fontWeight: '600',
    color: '#2E7D32',
  },
  nextClassCourse: {
    fontSize: dimensions.fontXXL,
    fontWeight: '800',
    color: '#ffffff',
  },
  nextClassName: {
    fontSize: dimensions.fontL,
    color: '#ffffff',
    opacity: 0.95,
    marginTop: moderateScale(4),
  },
  nextClassDetails: {
    flexDirection: 'row',
    gap: dimensions.paddingM,
    marginTop: dimensions.paddingM,
  },
  nextClassDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  nextClassDetailText: {
    fontSize: dimensions.fontM,
    color: '#ffffff',
    opacity: 0.9,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
    marginTop: dimensions.paddingL,
    gap: dimensions.paddingS,
  },
  navigateButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#2E7D32',
  },
  
  // Class Cards
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    marginBottom: dimensions.paddingM,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  classColorBar: {
    width: moderateScale(6),
    height: '100%',
  },
  classContent: {
    flex: 1,
    padding: dimensions.paddingM,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: dimensions.paddingS,
  },
  classCourseCode: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
  },
  classCourseName: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  classTypeBadge: {
    paddingHorizontal: dimensions.paddingS,
    paddingVertical: moderateScale(4),
    borderRadius: dimensions.radiusS,
  },
  classTypeText: {
    fontSize: dimensions.fontXS,
    fontWeight: '600',
  },
  classDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.paddingM,
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  classDetailText: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
  },
  
  // Schedule Toggle
  scheduleToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: dimensions.radiusL,
    padding: moderateScale(4),
    marginBottom: dimensions.paddingL,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingS,
    borderRadius: dimensions.radiusM,
    gap: moderateScale(6),
  },
  toggleButtonActive: {
    backgroundColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },

  // Week Schedule
  weekDaySection: {
    marginBottom: dimensions.paddingL,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingS,
  },
  weekDayTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
  },
  weekDayTitleToday: {
    color: '#2E7D32',
  },
  todayIndicator: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#2E7D32',
  },
  weekDayCount: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    fontWeight: '500',
  },
  weekClassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusM,
    marginBottom: dimensions.paddingS,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  weekClassColorBar: {
    width: moderateScale(3),
    height: '100%',
  },
  weekClassContent: {
    flex: 1,
    padding: dimensions.paddingM,
  },
  weekClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  weekClassCourse: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#111827',
  },
  weekClassTime: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    fontWeight: '500',
  },
  weekClassRoom: {
    fontSize: dimensions.fontS,
    color: '#9CA3AF',
  },
  weekClassTypeBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  weekClassTypeText: {
    fontSize: dimensions.fontS,
    fontWeight: '700',
  },

  // Day Selector
  daySelector: {
    flexDirection: 'row',
    gap: dimensions.paddingS,
  },
  dayButton: {
    paddingVertical: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingL,
    borderRadius: dimensions.radiusL,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: moderateScale(60),
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  dayButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayButtonTextActive: {
    color: '#ffffff',
  },
  selectedDaysText: {
    fontSize: dimensions.fontS,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: dimensions.paddingS,
    textAlign: 'center',
  },

  // Empty States
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingXL,
    alignItems: 'center',
    marginTop: dimensions.paddingM,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyStateText: {
    fontSize: dimensions.fontL,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: dimensions.paddingM,
  },
  emptyStateSubtext: {
    fontSize: dimensions.fontM,
    color: '#9CA3AF',
    marginTop: moderateScale(4),
  },
  emptyDayCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusM,
    padding: dimensions.paddingM,
    alignItems: 'center',
    marginBottom: dimensions.paddingS,
  },
  emptyDayText: {
    fontSize: dimensions.fontM,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -dimensions.paddingS / 2,
  },
  serviceCardWrapper: {
    width: '50%',
    paddingHorizontal: dimensions.paddingS / 2,
    marginBottom: dimensions.paddingM,
  },
  serviceCardLeft: {
    paddingRight: dimensions.paddingS / 2,
    paddingLeft: 0,
  },
  serviceCardRight: {
    paddingLeft: dimensions.paddingS / 2,
    paddingRight: 0,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    paddingBottom: moderateScale(50),
    alignItems: 'center',
    minHeight: moderateScale(220),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  serviceIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  serviceName: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: dimensions.paddingS,
  },
  serviceLocation: {
    fontSize: dimensions.fontS,
    fontWeight: '600',
    color: '#374151',
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: dimensions.fontXS,
    color: '#6B7280',
    marginTop: moderateScale(6),
    textAlign: 'center',
    lineHeight: dimensions.fontXS * 1.4,
  },
  serviceHours: {
    fontSize: dimensions.fontXS,
    color: '#9CA3AF',
    marginTop: moderateScale(6),
    textAlign: 'center',
  },
  serviceStatus: {
    position: 'absolute',
    bottom: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: moderateScale(6),
    borderRadius: dimensions.radiusL,
  },
  serviceStatusText: {
    fontSize: dimensions.fontXS,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Events
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    marginBottom: dimensions.paddingM,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  eventTypeBar: {
    width: moderateScale(4),
    height: '100%',
  },
  eventContent: {
    flex: 1,
    padding: dimensions.paddingM,
  },
  eventTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
  },
  eventOrganizer: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  eventDetails: {
    flexDirection: 'row',
    gap: dimensions.paddingM,
    marginTop: dimensions.paddingS,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  eventDetailText: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
  },
  eventDescription: {
    fontSize: dimensions.fontS,
    color: '#9CA3AF',
    marginTop: dimensions.paddingS,
  },
  
  // Accessibility
  accessibilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingM,
    marginBottom: dimensions.paddingM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  accessibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  accessibilityIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  accessibilityInfo: {
    flex: 1,
  },
  accessibilityName: {
    fontSize: dimensions.fontL,
    fontWeight: '600',
    color: '#111827',
  },
  accessibilityDescription: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    marginBottom: dimensions.paddingM,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingS,
    paddingVertical: moderateScale(4),
    borderRadius: dimensions.radiusM,
    marginTop: moderateScale(4),
    alignSelf: 'flex-start',
    gap: moderateScale(6),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusText: {
    fontSize: dimensions.fontXS,
    fontWeight: '600',
  },
  locationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: dimensions.paddingS,
  },
  locationsLabel: {
    fontSize: dimensions.fontS,
    fontWeight: '600',
    color: '#374151',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: dimensions.paddingS,
    paddingVertical: moderateScale(4),
    borderRadius: dimensions.radiusM,
    gap: moderateScale(4),
  },
  locationChipText: {
    fontSize: dimensions.fontS,
    color: '#374151',
  },
  
  // Action Buttons
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: dimensions.radiusL,
    paddingVertical: dimensions.paddingM,
    marginTop: dimensions.paddingM,
    gap: dimensions.paddingS,
  },
  addButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
  },
  accessibleRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: dimensions.paddingM,
    borderRadius: dimensions.radiusL,
    marginTop: dimensions.paddingM,
    gap: dimensions.paddingS,
  },
  accessibleRouteButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  // Add Class Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingBottom: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  modalCancelButton: {
    padding: dimensions.paddingS,
  },
  modalCancelText: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
  },
  modalSaveButton: {
    padding: dimensions.paddingS,
  },
  modalSaveText: {
    fontSize: dimensions.fontM,
    color: '#2E7D32',
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: dimensions.paddingM,
  },
  
  // Form Styles
  formGroup: {
    marginBottom: dimensions.paddingL,
  },
  formLabel: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#374151',
    marginBottom: dimensions.paddingS,
  },
  formSubLabel: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginBottom: dimensions.paddingS,
    fontStyle: 'italic',
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: dimensions.radiusL,
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    fontSize: dimensions.fontM,
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
  },
  
  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: dimensions.paddingS,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingS,
    borderRadius: dimensions.radiusM,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2E7D32',
  },
  typeButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  
  // Helper Section
  helperSection: {
    marginTop: dimensions.paddingL,
    padding: dimensions.paddingM,
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusL,
  },
  helperText: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    lineHeight: dimensions.fontS * 1.5,
  },
  
  // Time Picker Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: dimensions.radiusXL,
    borderTopRightRadius: dimensions.radiusXL,
    paddingBottom: Platform.select({
      ios: moderateScale(34),
      android: moderateScale(20),
    }),
    maxHeight: '80%',
    minHeight: moderateScale(400),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timePickerButton: {
    padding: dimensions.paddingS,
    minWidth: moderateScale(60),
  },
  timePickerCancelText: {
    fontSize: dimensions.fontM,
    color: '#6B7280',
    fontWeight: '600',
  },
  timePickerTitle: {
    fontSize: dimensions.fontXL,
    fontWeight: '700',
    color: '#111827',
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: dimensions.paddingL,
    minHeight: moderateScale(200),
  },
  timePickerColumn: {
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  timePickerLabel: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#374151',
    marginBottom: dimensions.paddingM,
  },
  timePickerScroll: {
    maxHeight: moderateScale(150),
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusM,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerItem: {
    paddingVertical: dimensions.paddingM,
    paddingHorizontal: dimensions.paddingL,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timePickerItemText: {
    fontSize: dimensions.fontL,
    color: '#111827',
    fontWeight: '500',
  },
  timePickerSeparator: {
    fontSize: dimensions.fontXXL,
    fontWeight: '700',
    color: '#2E7D32',
    marginHorizontal: dimensions.paddingM,
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: dimensions.paddingM,
    paddingTop: dimensions.paddingM,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timePickerQuickButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: dimensions.paddingS,
    paddingHorizontal: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerQuickText: {
    fontSize: dimensions.fontS,
    color: '#374151',
    fontWeight: '600',
  },
  timePickerInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: dimensions.radiusL,
    paddingHorizontal: dimensions.paddingM,
    paddingVertical: dimensions.paddingM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerInputText: {
    fontSize: dimensions.fontM,
    color: '#111827',
    fontWeight: '500',
  },
  timePickerPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  
  // New Modal Styles
  formSection: {
    marginBottom: dimensions.paddingXL,
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusL,
    padding: dimensions.paddingL,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScale(4),
  },
  sectionSubtitle: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginBottom: dimensions.paddingM,
  },
  dayScheduleButton: {
    paddingVertical: dimensions.paddingS,
    paddingHorizontal: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: dimensions.paddingS,
    marginBottom: dimensions.paddingS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(70),
  },
  dayScheduleButtonWeekend: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  dayScheduleButtonHasSchedule: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  dayScheduleButtonSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  dayScheduleButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayScheduleButtonTextWeekend: {
    color: '#FF8F00',
  },
  dayScheduleButtonTextHasSchedule: {
    color: '#2E7D32',
  },
  dayScheduleButtonTextSelected: {
    color: '#ffffff',
  },
  removeDayButton: {
    marginLeft: moderateScale(4),
    padding: moderateScale(2),
  },
  scheduleList: {
    backgroundColor: '#F9FAFB',
    borderRadius: dimensions.radiusM,
    padding: dimensions.paddingM,
    marginBottom: dimensions.paddingM,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.paddingM,
  },
  scheduleListTitle: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#111827',
  },
  clearScheduleText: {
    fontSize: dimensions.fontS,
    color: '#EF4444',
    fontWeight: '600',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: dimensions.radiusM,
    padding: dimensions.paddingM,
    marginBottom: dimensions.paddingS,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleItemBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.paddingM,
  },
  scheduleItemBadgeText: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#ffffff',
  },
  scheduleItemContent: {
    flex: 1,
  },
  scheduleItemDay: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#111827',
  },
  scheduleItemTime: {
    fontSize: dimensions.fontS,
    color: '#374151',
    marginTop: moderateScale(2),
  },
  scheduleItemRoom: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  scheduleItemRemove: {
    padding: dimensions.paddingS,
  },
  dayScheduleEditor: {
    backgroundColor: '#F8F9FA',
    borderRadius: dimensions.radiusM,
    padding: dimensions.paddingM,
    marginTop: dimensions.paddingM,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  dayScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  dayScheduleTitle: {
    fontSize: dimensions.fontL,
    fontWeight: '700',
    color: '#2E7D32',
  },
  closeDayButton: {
    padding: dimensions.paddingS,
  },
  dayScheduleHelper: {
    fontSize: dimensions.fontS,
    color: '#6B7280',
    marginBottom: dimensions.paddingM,
    lineHeight: dimensions.fontS * 1.4,
  },
  saveDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: dimensions.radiusL,
    paddingVertical: dimensions.paddingM,
    marginTop: dimensions.paddingL,
    gap: dimensions.paddingS,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveDayButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
  },
  saveDayButtonText: {
    fontSize: dimensions.fontM,
    fontWeight: '700',
    color: '#ffffff',
  },
  daySelectorContent: {
    paddingRight: dimensions.paddingM,
  },
});

export default CampusScreen;