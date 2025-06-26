import { Router } from 'express';
import { PathfindingController } from '../controllers/PathfindingController';

const router = Router();
const pathfindingController = new PathfindingController();

// Core pathfinding routes
router.post('/route', pathfindingController.calculateRoute);
router.get('/directions/:routeId', pathfindingController.getDirections);

// Room and location search
router.get('/rooms/search', pathfindingController.searchRooms);
router.get('/buildings', pathfindingController.getBuildings);

// Campus information
router.get('/alerts', pathfindingController.getCampusAlerts);

export default router; 