import { Router } from 'express';
import * as service from './deals.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

router.get('/deals', service.getDeals);
router.post('/deals/item', requireAdmin, service.upsertDeal);
router.delete('/deals/item/:id', requireAdmin, service.deleteDeal);
router.post('/coupon/validate', service.validateCoupon);
router.get('/coupon/best', service.getBestCoupon);

export default router;
