import { Router } from 'express';
import * as service from './payments.service.js';

const router = Router();

router.get('/payment/config', service.getPaymentConfig);
router.post('/payment/initiate', service.initiatePayment);
router.post('/payment/verify-sms', service.verifySms);
router.post('/payment/submit-utr', service.submitUtr);
router.get('/payment/status/:orderId', service.getPaymentStatus);

export default router;
