import { Router } from 'express';
import * as service from './payments.service.js';

const router = Router();

// ─── Cashfree PG Endpoints ─────────────────────────────────────
// Order creation (both /api/create-order and /api/payment/cashfree/create-order)
router.post('/create-order', service.createCashfreeOrder);
router.post('/payment/cashfree/create-order', service.createCashfreeOrder);

// Cashfree webhook (both /api/cashfree-webhook and /api/payment/cashfree-webhook)
router.post('/cashfree-webhook', service.handleCashfreeWebhook);
router.post('/payment/cashfree-webhook', service.handleCashfreeWebhook);

// Cashfree live status verification
router.get('/payment/cashfree/verify/:orderId', service.verifyCashfreeOrder);
router.post('/payment/cashfree/verify', service.verifyCashfreeOrder);

// ─── Existing Manual UPI Endpoints ─────────────────────────────
router.get('/payment/config', service.getPaymentConfig);
router.post('/payment/initiate', service.initiatePayment);
router.post('/payment/verify-sms', service.verifySms);
router.post('/payment/submit-utr', service.submitUtr);
router.get('/payment/status/:orderId', service.getPaymentStatus);

export default router;
