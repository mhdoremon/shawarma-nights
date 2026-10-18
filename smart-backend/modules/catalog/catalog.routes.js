import { Router } from 'express';
import * as catalogService from './catalog.service.js';

const router = Router();

router.get('/menu', catalogService.getMenu);
router.get('/categories', catalogService.getCategories);
router.post(['/menu/item', '/catalog/items'], catalogService.addOrUpdateMenuItem);
router.put('/catalog/items/:id', (req, res, next) => {
  req.body = { ...req.body, id: req.params.id };
  return catalogService.addOrUpdateMenuItem(req, res, next);
});
router.delete(['/menu/item/:id', '/catalog/items/:id'], catalogService.deleteMenuItem);
router.post('/menu/toggle-stock', catalogService.toggleStock);
router.post('/categories', catalogService.addCategory);
router.delete('/categories/:id', catalogService.deleteCategory);

export default router;
