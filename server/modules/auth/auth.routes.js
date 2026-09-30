import { Router } from 'express';
import * as service from './auth.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Customer Auth
router.post('/send-otp', service.sendOtp);
router.get('/sim-gateway/status', service.getGatewayStatus);
router.post('/verify-otp', service.verifyOtp);
router.post('/register', service.register);
router.post('/update-profile', service.updateProfile);
router.post('/delete-account', service.deleteAccount);
router.get('/me', service.getMe);

// Admin Auth
router.get('/admin/status', service.getAdminStatus);
router.post('/admin/setup', service.setupAdmin);
router.post('/admin/login', service.loginAdmin);
router.post('/admin/verify', service.verifyAdmin);
router.get('/admin/customers', requireAdmin, service.getAdminCustomers);

export default router;
