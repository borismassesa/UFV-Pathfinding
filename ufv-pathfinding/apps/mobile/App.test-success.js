import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const testBackend = async () => {
    try {
      const response = await fetch('http://192.168.1.24:3000/api/v1/buildings');
      const data = await response.json();
      Alert.alert('Backend Test', `Connected! Found ${data.length} buildings`);
    } catch (error) {
      Alert.alert('Backend Test', 'Failed to connect: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UFV Pathfinding</Text>
      <Text style={styles.subtitle}>Expo Go Test Version</Text>
      
      <View style={styles.status}>
        <Text style={styles.statusText}>✅ App is running in Expo Go!</Text>
        <Text style={styles.info}>Backend: http://192.168.1.24:3000</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={testBackend}>
        <Text style={styles.buttonText}>Test Backend Connection</Text>
      </TouchableOpacity>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  status: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    color: '#2e7d32',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});