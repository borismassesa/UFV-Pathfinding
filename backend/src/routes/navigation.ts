import { Router } from 'express';

const router = Router();

// Real-time navigation updates
router.get('/live/:sessionId', (req, res) => {
  res.json({
    success: true,
    message: 'Live navigation endpoint - coming soon',
    data: null
  });
});

export default router; 