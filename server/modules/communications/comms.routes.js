import { Router } from 'express';
import * as service from './comms.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

router.get('/status', service.getStatus);
router.post('/test-sms', requireAdmin, service.testSms);

export default router;
