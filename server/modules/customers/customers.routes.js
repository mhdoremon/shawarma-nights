import { Router } from 'express';
import * as service from './customers.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, service.listCustomers);
router.get('/:id', requireAdmin, service.getCustomer);
router.put('/:id', requireAdmin, service.updateCustomer);
router.delete('/:id', requireAdmin, service.deleteCustomer);

export default router;
