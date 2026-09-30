import { Router } from 'express';
import * as catalogService from './catalog.service.js';

const router = Router();

router.get('/menu', catalogService.getMenu);
router.get('/categories', catalogService.getCategories);
router.post('/menu/item', catalogService.addOrUpdateMenuItem);
router.delete('/menu/item/:id', catalogService.deleteMenuItem);
router.post('/menu/toggle-stock', catalogService.toggleStock);
router.post('/categories', catalogService.addCategory);
router.delete('/categories/:id', catalogService.deleteCategory);

export default router;
