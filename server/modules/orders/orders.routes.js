import { Router } from 'express';
import * as service from './orders.service.js';
import { requireAdmin, requireCustomer, optionalAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, service.getOrders);
router.get('/bookings', service.getBookings);
router.post('/', optionalAuth, service.placeOrder);
router.post('/place', optionalAuth, service.placeOrder);
router.post('/update-status', requireAdmin, service.updateOrderStatus);

export default router;
