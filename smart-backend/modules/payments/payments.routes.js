import { Router } from 'express';
import * as service from './payments.service.js';

const router = Router();

// ─── Universal Smart Payment Endpoints (Any Brand) ─────────────
// Order session creation (supports /api/create-order, /api/payment/create-session, etc.)
router.post('/create-order', service.createCashfreeOrder);
router.post('/payment/create-order', service.createCashfreeOrder);
router.post('/payment/create-session', service.createCashfreeOrder);
router.post('/payment/cashfree/create-order', service.createCashfreeOrder);

// Cashfree instant server webhook
router.post('/cashfree-webhook', service.handleCashfreeWebhook);
router.post('/payment/cashfree-webhook', service.handleCashfreeWebhook);

// Universal live payment verification
router.get('/payment/verify/:orderId', service.verifyCashfreeOrder);
router.get('/payment/cashfree/verify/:orderId', service.verifyCashfreeOrder);
router.post('/payment/verify', service.verifyCashfreeOrder);
router.post('/payment/cashfree/verify', service.verifyCashfreeOrder);

// Store Payments History Ledger
router.get('/payment/history', service.getStorePayments);
router.get('/payment/cashfree/history', service.getStorePayments);

// ─── Payment Configuration & Backward Compatibility ────────────
router.get('/payment/config', service.getPaymentConfig);
router.post('/payment/initiate', service.initiatePayment);
router.post('/payment/verify-sms', service.verifySms);
router.post('/payment/submit-utr', service.submitUtr);
router.get('/payment/status/:orderId', service.getPaymentStatus);

export default router;
