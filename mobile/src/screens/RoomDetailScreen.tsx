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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface RoomData {
  id: string;
  name: string;
  description: string;
  type: string;
  area?: number;
  capacity?: number;
  coordinates?: { x: number; y: number };
  facilities?: string[];
  accessibility?: string[];
  hours?: string;
  floor?: number;
}

const RoomDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Get room data from route params or default data
  useEffect(() => {
    const params = route.params as any;
    if (params?.room) {
      setRoomData(params.room);
    } else {
      // Default room data for demo
      setRoomData({
        id: 'T001',
        name: 'Large Lecture Hall',
        description: 'Main lecture hall with advanced AV equipment and tiered seating',
        type: 'academic',
        area: 372.48,
        capacity: 150,
        coordinates: { x: 552312.848251, y: 5430800.48876 },
        facilities: ['Projector', 'Audio System', 'Whiteboard', 'WiFi', 'AC'],
        accessibility: ['Wheelchair Access', 'Hearing Loop', 'Elevator Access'],
        hours: '7:00 AM - 10:00 PM',
        floor: 1,
      });
    }
  }, [route.params]);

  const handleNavigateToRoom = () => {
    if (!roomData) return;
    
    Alert.alert(
      '🧭 Start Navigation',
      `Navigate to ${roomData.name} (${roomData.id})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate!', 
          onPress: () => {
            // Navigate to Navigation tab
            navigation.navigate('Navigate' as never);
            Alert.alert('🚀 Navigation Started!', 'Route calculation in progress...');
          }
        }
      ]
    );
  };

  const handleAddToFavorites = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? '💔 Removed from Favorites' : '⭐ Added to Favorites!',
      `${roomData?.name} ${isFavorite ? 'removed from' : 'saved to'} your favorites.`
    );
  };

  const handleShare = async () => {
    if (!roomData) return;
    
    try {
      await Share.share({
        message: `Check out ${roomData.name} (${roomData.id}) at UFV Building T! 🏢\n\n${roomData.description}`,
        title: 'UFV Room Information',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'academic': return 'school';
      case 'office': return 'briefcase';
      case 'study': return 'library';
      case 'utility': return 'build';
      case 'lab': return 'flask';
      default: return 'location';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return '#4CAF50';
      case 'office': return '#2196F3';
      case 'study': return '#9C27B0';
      case 'utility': return '#FF9800';
      case 'lab': return '#F44336';
      default: return '#666';
    }
  };

  if (!roomData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading room details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Hero Section */}
      <LinearGradient
        colors={[getTypeColor(roomData.type), '#2E7D32']}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <View style={styles.roomHeader}>
            <View style={styles.roomIconContainer}>
              <Ionicons name={getTypeIcon(roomData.type)} size={32} color="#fff" />
            </View>
            <View style={styles.roomTitleContainer}>
              <Text style={styles.roomNumber}>{roomData.id}</Text>
              <Text style={styles.roomName}>{roomData.name}</Text>
              <Text style={styles.roomType}>{roomData.type.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.roomDescription}>{roomData.description}</Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNavigateToRoom}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Navigate Here</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, isFavorite && styles.favoriteActive]} 
              onPress={handleAddToFavorites}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorite ? "#E91E63" : "#fff"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Room Information</Text>
          
          <View style={styles.infoGrid}>
            {roomData.area && (
              <View style={styles.infoCard}>
                <Ionicons name="resize" size={24} color="#2E7D32" />
                <Text style={styles.infoLabel}>Area</Text>
                <Text style={styles.infoValue}>{roomData.area}m²</Text>
              </View>
            )}
            
            {roomData.capacity && (
              <View style={styles.infoCard}>
                <Ionicons name="people" size={24} color="#2196F3" />
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={styles.infoValue}>{roomData.capacity}</Text>
              </View>
            )}
            
            {roomData.floor && (
              <View style={styles.infoCard}>
                <Ionicons name="layers" size={24} color="#FF9800" />
                <Text style={styles.infoLabel}>Floor</Text>
                <Text style={styles.infoValue}>{roomData.floor}</Text>
              </View>
            )}
            
            {roomData.hours && (
              <View style={styles.infoCard}>
                <Ionicons name="time" size={24} color="#9C27B0" />
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>{roomData.hours}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Facilities */}
        {roomData.facilities && roomData.facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏗️ Facilities & Equipment</Text>
            <View style={styles.facilitiesList}>
              {roomData.facilities.map((facility, index) => (
                <View key={index} style={styles.facilityItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Accessibility */}
        {roomData.accessibility && roomData.accessibility.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>♿ Accessibility Features</Text>
            <View style={styles.facilitiesList}>
              {roomData.accessibility.map((feature, index) => (
                <View key={index} style={styles.facilityItem}>
                  <Ionicons name="accessibility" size={20} color="#2196F3" />
                  <Text style={styles.facilityText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Location Info */}
        {roomData.coordinates && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location Details</Text>
            <View style={styles.locationCard}>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>X Coordinate:</Text>
                <Text style={styles.coordinateValue}>{roomData.coordinates.x.toFixed(2)}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Y Coordinate:</Text>
                <Text style={styles.coordinateValue}>{roomData.coordinates.y.toFixed(2)}</Text>
              </View>
              <Text style={styles.coordinateNote}>
                UTM Zone 10N (NAD83) - Real shapefile coordinates
              </Text>
            </View>
          </View>
        )}

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
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roomIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomTitleContainer: {
    flex: 1,
  },
  roomNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  roomType: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    letterSpacing: 1,
  },
  roomDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
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
  favoriteActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: (width - 56) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 4,
  },
  facilitiesList: {
    gap: 12,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  facilityText: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  coordinateLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  coordinateNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default RoomDetailScreen; 