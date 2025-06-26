import { Router } from 'express';

const router = Router();

// Get all rooms
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Rooms endpoint - coming soon',
    data: []
  });
});

// Get room by ID
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Room details endpoint - coming soon',
    data: null
  });
});

export default router; 