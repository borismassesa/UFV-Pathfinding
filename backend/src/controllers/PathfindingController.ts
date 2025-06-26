import { Request, Response } from 'express';
import { PathfindingService } from '../services/PathfindingService';
import { NavigationRequest, PathfindingOptions } from '../types/NavigationTypes';

export class PathfindingController {
    private pathfindingService: PathfindingService;

    constructor() {
        this.pathfindingService = new PathfindingService();
    }

    /**
     * Calculate route between two points
     * POST /api/v1/pathfinding/route
     */
    public calculateRoute = async (req: Request, res: Response): Promise<void> => {
        try {
            const navigationRequest: NavigationRequest = req.body;
            
            // Validate request
            if (!navigationRequest.start || !navigationRequest.end) {
                res.status(400).json({
                    success: false,
                    error: 'Start and end points are required'
                });
                return;
            }

            // Set default options
            const options: PathfindingOptions = {
                avoidStairs: navigationRequest.options?.avoidStairs || false,
                preferElevators: navigationRequest.options?.preferElevators || false,
                maxWalkingDistance: navigationRequest.options?.maxWalkingDistance || 500,
                algorithm: navigationRequest.options?.algorithm || 'astar'
            };

            const result = await this.pathfindingService.findPath(
                navigationRequest.start,
                navigationRequest.end,
                options
            );

            if (!result.success) {
                res.status(404).json({
                    success: false,
                    error: result.error || 'No route found'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    route: result.route,
                    instructions: result.instructions,
                    totalDistance: result.totalDistance,
                    estimatedTime: result.estimatedTime,
                    accessibility: result.accessibility
                }
            });

        } catch (error) {
            console.error('Pathfinding error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get turn-by-turn directions
     * GET /api/v1/navigation/directions/:routeId
     */
    public getDirections = async (req: Request, res: Response): Promise<void> => {
        try {
            const { routeId } = req.params;
            
            // For now, return mock directions
            const directions = [
                {
                    step: 1,
                    instruction: "Head north towards the main entrance",
                    distance: 15,
                    direction: "north",
                    landmark: "Main entrance"
                },
                {
                    step: 2,
                    instruction: "Turn right at the main hallway",
                    distance: 25,
                    direction: "east", 
                    landmark: "Information desk"
                },
                {
                    step: 3,
                    instruction: "Continue straight for 30 meters",
                    distance: 30,
                    direction: "east",
                    landmark: "Classroom corridor"
                },
                {
                    step: 4,
                    instruction: "Your destination is on the right",
                    distance: 5,
                    direction: "south",
                    landmark: "Room T-123"
                }
            ];

            res.json({
                success: true,
                data: {
                    routeId,
                    directions,
                    totalSteps: directions.length,
                    totalDistance: directions.reduce((sum, dir) => sum + dir.distance, 0)
                }
            });

        } catch (error) {
            console.error('Directions error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Search for rooms and locations
     * GET /api/v1/rooms/search?q=query
     */
    public searchRooms = async (req: Request, res: Response): Promise<void> => {
        try {
            const { q: query } = req.query;
            
            if (!query || typeof query !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Query parameter is required'
                });
                return;
            }

            // Mock room data for testing
            const mockRooms = [
                {
                    id: 1,
                    roomNumber: 'T-101',
                    buildingCode: 'T',
                    buildingName: 'Building T',
                    floor: 1,
                    roomType: 'classroom',
                    coordinates: { x: 123.456, y: 789.012 },
                    accessibility: ['wheelchair_accessible', 'audio_loop']
                },
                {
                    id: 2,
                    roomNumber: 'T-123',
                    buildingCode: 'T', 
                    buildingName: 'Building T',
                    floor: 1,
                    roomType: 'office',
                    coordinates: { x: 124.456, y: 790.012 },
                    accessibility: ['wheelchair_accessible']
                },
                {
                    id: 3,
                    roomNumber: 'T-201',
                    buildingCode: 'T',
                    buildingName: 'Building T', 
                    floor: 2,
                    roomType: 'laboratory',
                    coordinates: { x: 123.456, y: 791.012 },
                    accessibility: ['wheelchair_accessible', 'emergency_lighting']
                }
            ];

            // Simple search filter
            const filteredRooms = mockRooms.filter(room => 
                room.roomNumber.toLowerCase().includes(query.toLowerCase()) ||
                room.roomType.toLowerCase().includes(query.toLowerCase()) ||
                room.buildingName.toLowerCase().includes(query.toLowerCase())
            );

            res.json({
                success: true,
                data: {
                    query,
                    results: filteredRooms,
                    totalResults: filteredRooms.length
                }
            });

        } catch (error) {
            console.error('Room search error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get all buildings
     * GET /api/v1/buildings
     */
    public getBuildings = async (req: Request, res: Response): Promise<void> => {
        try {
            const mockBuildings = [
                {
                    id: 1,
                    code: 'T',
                    name: 'Building T',
                    address: 'UFV Abbotsford Campus',
                    floors: 2,
                    coordinates: { x: 123.456, y: 789.012 },
                    amenities: ['elevators', 'restrooms', 'accessibility_ramp']
                },
                {
                    id: 2,
                    code: 'A', 
                    name: 'Administration Building',
                    address: 'UFV Abbotsford Campus',
                    floors: 3,
                    coordinates: { x: 125.456, y: 791.012 },
                    amenities: ['elevators', 'restrooms', 'cafeteria', 'accessibility_ramp']
                }
            ];

            res.json({
                success: true,
                data: {
                    buildings: mockBuildings,
                    totalBuildings: mockBuildings.length
                }
            });

        } catch (error) {
            console.error('Buildings error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get campus alerts
     * GET /api/v1/alerts
     */
    public getCampusAlerts = async (req: Request, res: Response): Promise<void> => {
        try {
            const mockAlerts = [
                {
                    id: 1,
                    type: 'maintenance',
                    title: 'Elevator Maintenance - Building T',
                    message: 'Elevator in Building T will be out of service from 2-4 PM today',
                    severity: 'medium',
                    affectedAreas: ['Building T'],
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                    isActive: true
                },
                {
                    id: 2,
                    type: 'construction',
                    title: 'Pathway Construction',
                    message: 'Construction work near Building A entrance. Use alternate entrance.',
                    severity: 'low',
                    affectedAreas: ['Building A', 'Parking Lot A'],
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                    isActive: true
                }
            ];

            res.json({
                success: true,
                data: {
                    alerts: mockAlerts.filter(alert => alert.isActive),
                    totalAlerts: mockAlerts.filter(alert => alert.isActive).length
                }
            });

        } catch (error) {
            console.error('Alerts error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
} 