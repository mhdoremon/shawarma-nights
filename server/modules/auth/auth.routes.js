import { Router } from 'express';
import * as service from './auth.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Customer Auth (Legacy & Mobile OTP)
router.post('/send-otp', service.sendOtp);
router.get('/sim-gateway/status', service.getGatewayStatus);
router.post('/verify-otp', service.verifyOtp);
router.post('/register', service.register);
router.post('/update-profile', service.updateProfile);
router.post('/delete-account', service.deleteAccount);
router.get('/me', service.getMe);
router.get('/check-account', service.checkAccount);
router.post('/google', service.googleLogin);
router.post('/direct', service.directLogin);

// Unified Social Commerce Customer Auth (Unique Profile, Username, DOB, Strict Phone-Email Binding, Password & Forgot Password)
router.all('/customer/purge-all-data', service.purgeAllLoginDataHandler);
router.post('/customer/check-account', service.customerCheckAccount);
router.post('/customer/register', service.customerRegister);
router.post('/customer/login', service.customerLogin);
router.post('/customer/forgot-password/send-otp', service.customerForgotPasswordSendOtp);
router.post('/customer/forgot-password/verify-otp', service.customerForgotPasswordVerifyOtp);
router.post('/customer/reset-password', service.customerResetPassword);
router.post('/customer/upload-avatar', service.customerUploadAvatar);

// Dukandar Self-Onboarding & Portal Auth (Unique Dukan ID, Digital Contract E-Sign, Multi-category Setup, Forgot Password)
router.post('/dukandar/generate-id', service.dukandarGenerateId);
router.post('/dukandar/send-otp', service.dukandarSendOtp);
router.post('/dukandar/verify-otp', service.dukandarVerifyOtp);
router.post('/dukandar/register-apply', service.dukandarRegisterApply);
router.post('/dukandar/login', service.dukandarLogin);
router.post('/dukandar/forgot-password/send-otp', service.dukandarForgotPasswordSendOtp);
router.post('/dukandar/forgot-password/verify-otp', service.dukandarForgotPasswordVerifyOtp);
router.post('/dukandar/reset-password', service.dukandarResetPassword);

// Admin Auth
router.get('/admin/status', service.getAdminStatus);
router.post('/admin/setup', service.setupAdmin);
router.post('/admin/login', service.loginAdmin);
router.post('/admin/verify', service.verifyAdmin);
router.get('/admin/customers', requireAdmin, service.getAdminCustomers);

// Super Admin: Mohalla Store Management
router.get('/admin/mohalla/pending', requireAdmin, service.listMohallaPendingApplications);
router.post('/admin/mohalla/review', requireAdmin, service.reviewMohallaApplication);

export default router;
