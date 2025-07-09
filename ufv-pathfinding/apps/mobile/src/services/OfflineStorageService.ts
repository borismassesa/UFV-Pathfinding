import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// import * as FileSystem from 'expo-file-system';
// import * as SQLite from 'expo-sqlite';
import type { 
  Route, 
  Room, 
  Building, 
  BeaconData, 
  UserLocation,
  NavigationInstruction 
} from '../types';

interface CachedMapData {
  building: Building;
  rooms: Room[];
  beacons: BeaconData[];
  lastUpdated: Date;
  version: string;
}

interface CachedRoute {
  id: string;
  route: Route;
  timestamp: Date;
  expiresAt: Date;
}

interface OfflineMetadata {
  lastSync: Date;
  dataVersion: string;
  totalSize: number;
  buildings: string[];
}

class OfflineStorageService {
  private db: any | null = null;
  private readonly CACHE_KEYS = {
    METADATA: 'offline_metadata',
    MAP_DATA: 'map_data_',
    ROUTES: 'cached_routes',
    USER_PREFERENCES: 'user_preferences',
    SEARCH_HISTORY: 'search_history',
    FAVORITES: 'favorites',
  };

  private readonly CACHE_EXPIRY = {
    MAP_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
    ROUTES: 2 * 60 * 60 * 1000, // 2 hours
    SEARCH_RESULTS: 30 * 60 * 1000, // 30 minutes
  };

  async initialize(): Promise<void> {
    try {
      console.log('Initializing offline storage service (AsyncStorage only)...');
      
      // Skip SQLite initialization for now - use AsyncStorage only
      this.db = null;
      
      console.log('Offline storage service initialized successfully (AsyncStorage only)');
    } catch (error) {
      console.warn('Failed to initialize offline storage, running in demo mode:', error);
      // Continue without database for demo mode
      this.db = null;
    }
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        (tx) => {
          // Buildings table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS buildings (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              data TEXT NOT NULL,
              lastUpdated TEXT NOT NULL,
              version TEXT NOT NULL
            );
          `);

          // Rooms table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS rooms (
              id TEXT PRIMARY KEY,
              buildingId TEXT NOT NULL,
              name TEXT NOT NULL,
              floor INTEGER NOT NULL,
              coordinates TEXT NOT NULL,
              data TEXT NOT NULL,
              FOREIGN KEY (buildingId) REFERENCES buildings (id)
            );
          `);

          // Routes table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS routes (
              id TEXT PRIMARY KEY,
              startLocation TEXT NOT NULL,
              endLocation TEXT NOT NULL,
              data TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              expiresAt TEXT NOT NULL
            );
          `);

          // Beacons table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS beacons (
              id TEXT PRIMARY KEY,
              buildingId TEXT NOT NULL,
              coordinates TEXT NOT NULL,
              data TEXT NOT NULL,
              lastUpdated TEXT NOT NULL
            );
          `);

          // Create indexes
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms (buildingId);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_routes_locations ON routes (startLocation, endLocation);');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_beacons_building ON beacons (buildingId);');
        },
        (error) => {
          console.error('Database transaction error:', error);
          reject(error);
        },
        () => {
          console.log('Database tables created successfully');
          resolve();
        }
      );
    });
  }

  // Map Data Caching
  async cacheMapData(buildingId: string, mapData: CachedMapData): Promise<void> {
    try {
      // Store in AsyncStorage for quick access
      await AsyncStorage.setItem(
        `${this.CACHE_KEYS.MAP_DATA}${buildingId}`,
        JSON.stringify(mapData)
      );

      // Store in SQLite for complex queries
      await this.storeMapDataInDB(buildingId, mapData);

      console.log(`Map data cached for building: ${buildingId}`);
    } catch (error) {
      console.error('Failed to cache map data:', error);
      throw error;
    }
  }

  async getCachedMapData(buildingId: string): Promise<CachedMapData | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_KEYS.MAP_DATA}${buildingId}`);
      
      if (!cached) return null;

      const mapData: CachedMapData = JSON.parse(cached);
      
      // Check if cache is expired
      const isExpired = Date.now() - new Date(mapData.lastUpdated).getTime() > this.CACHE_EXPIRY.MAP_DATA;
      
      if (isExpired) {
        await this.removeCachedMapData(buildingId);
        return null;
      }

      return mapData;
    } catch (error) {
      console.error('Failed to get cached map data:', error);
      return null;
    }
  }

  private async storeMapDataInDB(buildingId: string, mapData: CachedMapData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        (tx) => {
          // Store building
          tx.executeSql(
            'INSERT OR REPLACE INTO buildings (id, name, data, lastUpdated, version) VALUES (?, ?, ?, ?, ?)',
            [
              buildingId,
              mapData.building.name,
              JSON.stringify(mapData.building),
              mapData.lastUpdated.toISOString(),
              mapData.version
            ]
          );

          // Store rooms
          mapData.rooms.forEach((room) => {
            tx.executeSql(
              'INSERT OR REPLACE INTO rooms (id, buildingId, name, floor, coordinates, data) VALUES (?, ?, ?, ?, ?, ?)',
              [
                room.id,
                buildingId,
                room.name,
                room.floor,
                JSON.stringify(room.coordinates),
                JSON.stringify(room)
              ]
            );
          });

          // Store beacons
          mapData.beacons.forEach((beacon) => {
            tx.executeSql(
              'INSERT OR REPLACE INTO beacons (id, buildingId, coordinates, data, lastUpdated) VALUES (?, ?, ?, ?, ?)',
              [
                beacon.id,
                buildingId,
                JSON.stringify(beacon.coordinates),
                JSON.stringify(beacon),
                mapData.lastUpdated.toISOString()
              ]
            );
          });
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }

  // Route Caching
  async cacheRoute(route: Route): Promise<void> {
    try {
      const cachedRoute: CachedRoute = {
        id: route.id,
        route,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_EXPIRY.ROUTES),
      };

      // Store in SQLite
      await this.storeRouteInDB(cachedRoute);

      console.log(`Route cached: ${route.id}`);
    } catch (error) {
      console.error('Failed to cache route:', error);
      throw error;
    }
  }

  async getCachedRoute(startLocation: string, endLocation: string): Promise<Route | null> {
    try {
      if (!this.db) {
        // Fallback to AsyncStorage
        const cachedRoutes = await AsyncStorage.getItem(this.CACHE_KEYS.ROUTES);
        if (!cachedRoutes) return null;
        
        const routes: CachedRoute[] = JSON.parse(cachedRoutes);
        const routeKey = `${startLocation}-${endLocation}`;
        const route = routes.find(r => r.id === routeKey && new Date(r.expiresAt) > new Date());
        
        return route ? route.route : null;
      }

      return new Promise((resolve, reject) => {
        this.db!.transaction(
          (tx) => {
            tx.executeSql(
              'SELECT * FROM routes WHERE startLocation = ? AND endLocation = ? AND expiresAt > ? ORDER BY timestamp DESC LIMIT 1',
              [startLocation, endLocation, new Date().toISOString()],
              (_, { rows }) => {
                if (rows.length > 0) {
                  const cachedRoute = JSON.parse(rows.item(0).data) as CachedRoute;
                  resolve(cachedRoute.route);
                } else {
                  resolve(null);
                }
              },
              (_, error) => {
                console.error('Failed to get cached route:', error);
                resolve(null);
                return false;
              }
            );
          }
        );
      });
    } catch (error) {
      console.error('Failed to get cached route:', error);
      return null;
    }
  }

  private async storeRouteInDB(cachedRoute: CachedRoute): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const startLocation = `${cachedRoute.route.start.lat},${cachedRoute.route.start.lng}`;
      const endLocation = `${cachedRoute.route.end.lat},${cachedRoute.route.end.lng}`;

      this.db.transaction(
        (tx) => {
          tx.executeSql(
            'INSERT OR REPLACE INTO routes (id, startLocation, endLocation, data, timestamp, expiresAt) VALUES (?, ?, ?, ?, ?, ?)',
            [
              cachedRoute.id,
              startLocation,
              endLocation,
              JSON.stringify(cachedRoute),
              cachedRoute.timestamp.toISOString(),
              cachedRoute.expiresAt.toISOString()
            ]
          );
        },
        (error) => reject(error),
        () => resolve()
      );
    });
  }

  // Search History and Favorites
  async cacheSearchHistory(searches: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.SEARCH_HISTORY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to cache search history:', error);
    }
  }

  async getCachedSearchHistory(): Promise<string[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.SEARCH_HISTORY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached search history:', error);
      return [];
    }
  }

  async cacheFavorites(favorites: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to cache favorites:', error);
    }
  }

  async getCachedFavorites(): Promise<string[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.FAVORITES);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached favorites:', error);
      return [];
    }
  }

  // Offline Room Search
  async searchRoomsOffline(query: string, buildingId?: string): Promise<Room[]> {
    try {
      if (!this.db) {
        // Fallback to AsyncStorage search
        const mapData = await this.getCachedMapData(buildingId || 'building-t');
        if (!mapData) return [];
        
        const filteredRooms = mapData.rooms.filter(room => 
          room.name.toLowerCase().includes(query.toLowerCase())
        );
        
        return filteredRooms.slice(0, 20);
      }

      return new Promise((resolve, reject) => {
        let sql = 'SELECT data FROM rooms WHERE name LIKE ?';
        let params = [`%${query}%`];

        if (buildingId) {
          sql += ' AND buildingId = ?';
          params.push(buildingId);
        }

        sql += ' ORDER BY name LIMIT 20';

        this.db!.transaction(
          (tx) => {
            tx.executeSql(
              sql,
              params,
              (_, { rows }) => {
                const rooms: Room[] = [];
                for (let i = 0; i < rows.length; i++) {
                  rooms.push(JSON.parse(rows.item(i).data));
                }
                resolve(rooms);
              },
              (_, error) => {
                console.error('Failed to search rooms offline:', error);
                resolve([]);
                return false;
              }
            );
          }
        );
      });
    } catch (error) {
      console.error('Failed to search rooms offline:', error);
      return [];
    }
  }

  // Cache Management
  async getOfflineMetadata(): Promise<OfflineMetadata | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.METADATA);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get offline metadata:', error);
      return null;
    }
  }

  async updateOfflineMetadata(metadata: OfflineMetadata): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to update offline metadata:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('map_data_') || key.startsWith('cached_routes'));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('map_data_') || 
        key.startsWith('cached_routes') ||
        key === this.CACHE_KEYS.METADATA
      );
      
      await AsyncStorage.multiRemove(cacheKeys);

      // Clear SQLite data
      if (this.db) {
        await new Promise<void>((resolve, reject) => {
          this.db!.transaction(
            (tx) => {
              tx.executeSql('DELETE FROM buildings');
              tx.executeSql('DELETE FROM rooms');
              tx.executeSql('DELETE FROM routes');
              tx.executeSql('DELETE FROM beacons');
            },
            (error) => reject(error),
            () => resolve()
          );
        });
      }

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  private async cleanupExpiredData(): Promise<void> {
    try {
      // Clean expired routes
      if (this.db) {
        await new Promise<void>((resolve, reject) => {
          this.db!.transaction(
            (tx) => {
              tx.executeSql(
                'DELETE FROM routes WHERE expiresAt < ?',
                [new Date().toISOString()]
              );
            },
            (error) => reject(error),
            () => resolve()
          );
        });
      }

      console.log('Expired data cleaned up');
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  private async removeCachedMapData(buildingId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.CACHE_KEYS.MAP_DATA}${buildingId}`);
      
      if (this.db) {
        await new Promise<void>((resolve, reject) => {
          this.db!.transaction(
            (tx) => {
              tx.executeSql('DELETE FROM buildings WHERE id = ?', [buildingId]);
              tx.executeSql('DELETE FROM rooms WHERE buildingId = ?', [buildingId]);
              tx.executeSql('DELETE FROM beacons WHERE buildingId = ?', [buildingId]);
            },
            (error) => reject(error),
            () => resolve()
          );
        });
      }
    } catch (error) {
      console.error('Failed to remove cached map data:', error);
    }
  }

  // Check if offline data is available
  async isOfflineDataAvailable(buildingId: string): Promise<boolean> {
    try {
      const mapData = await this.getCachedMapData(buildingId);
      return mapData !== null;
    } catch (error) {
      return false;
    }
  }

  // Get offline statistics
  async getOfflineStats(): Promise<{
    cachedBuildings: number;
    cachedRoutes: number;
    cacheSize: number;
    lastSync: Date | null;
  }> {
    try {
      const [cacheSize, metadata] = await Promise.all([
        this.getCacheSize(),
        this.getOfflineMetadata()
      ]);

      return new Promise((resolve, reject) => {
        if (!this.db) {
          resolve({
            cachedBuildings: 0,
            cachedRoutes: 0,
            cacheSize,
            lastSync: metadata?.lastSync || null
          });
          return;
        }

        this.db.transaction(
          (tx) => {
            tx.executeSql(
              'SELECT COUNT(*) as buildingCount FROM buildings',
              [],
              (_, buildingResult) => {
                tx.executeSql(
                  'SELECT COUNT(*) as routeCount FROM routes WHERE expiresAt > ?',
                  [new Date().toISOString()],
                  (_, routeResult) => {
                    resolve({
                      cachedBuildings: buildingResult.rows.item(0).buildingCount,
                      cachedRoutes: routeResult.rows.item(0).routeCount,
                      cacheSize,
                      lastSync: metadata?.lastSync || null
                    });
                  }
                );
              }
            );
          },
          (error) => {
            console.error('Failed to get offline stats:', error);
            resolve({
              cachedBuildings: 0,
              cachedRoutes: 0,
              cacheSize,
              lastSync: metadata?.lastSync || null
            });
          }
        );
      });
    } catch (error) {
      console.error('Failed to get offline stats:', error);
      return {
        cachedBuildings: 0,
        cachedRoutes: 0,
        cacheSize: 0,
        lastSync: null
      };
    }
  }
}

export default new OfflineStorageService();