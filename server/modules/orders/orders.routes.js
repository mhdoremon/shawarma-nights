import { Router } from 'express';
import * as service from './orders.service.js';
import { requireAdmin, requireCustomer, optionalAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', service.getOrders);
router.post('/', service.placeOrder);
router.post('/place', service.placeOrder);
router.post('/update-status', service.updateOrderStatus);

export default router;
