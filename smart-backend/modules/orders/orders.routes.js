import { Router } from 'express';
import * as service from './orders.service.js';
import { requireAdmin, requireCustomer, optionalAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', service.getOrders);
router.get('/customer', service.getCustomerOrders);
router.post('/', service.placeOrder);
router.post('/place', service.placeOrder);
router.post('/update-status', service.updateOrderStatus);
router.post('/flush', service.flushOrders);
router.get('/flush', service.flushOrders);

export default router;
