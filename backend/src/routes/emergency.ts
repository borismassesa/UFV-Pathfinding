import { Router } from 'express';

const router = Router();

// Emergency routes
router.get('/exits', (req, res) => {
  res.json({
    success: true,
    message: 'Emergency exits endpoint - coming soon',
    data: []
  });
});

export default router; 