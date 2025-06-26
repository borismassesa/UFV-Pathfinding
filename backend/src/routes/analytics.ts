import { Router } from 'express';

const router = Router();

// Analytics endpoints
router.get('/usage', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics endpoint - coming soon',
    data: {}
  });
});

export default router; 