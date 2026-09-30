import { Router } from 'express';
import * as service from './delivery.service.js';

const router = Router();

router.post('/register', service.register);
router.post('/login', service.login);
router.get('/status', service.getStatus);
router.post('/update-location', service.updateLocation);
router.get('/orders', service.getOrders);
router.post('/verify-otp', service.verifyOtp);

export default router;
