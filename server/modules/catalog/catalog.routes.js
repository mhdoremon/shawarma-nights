import { Router } from 'express';
import * as catalogService from './catalog.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

router.get('/menu', catalogService.getMenu);
router.get('/categories', catalogService.getCategories);
router.post('/menu/item', requireAdmin, catalogService.addOrUpdateMenuItem);
router.delete('/menu/item/:id', requireAdmin, catalogService.deleteMenuItem);
router.post('/menu/toggle-stock', requireAdmin, catalogService.toggleStock);
router.post('/categories', requireAdmin, catalogService.addCategory);
router.delete('/categories/:id', requireAdmin, catalogService.deleteCategory);

export default router;
