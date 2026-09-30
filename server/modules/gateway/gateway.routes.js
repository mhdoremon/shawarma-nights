import { Router } from 'express';
import WebSocketHub from '../../core/WebSocketHub.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    connected: WebSocketHub.isGatewayConnected(req.storeId),
    stats: WebSocketHub.getStats(req.storeId)
  });
});

export default router;
