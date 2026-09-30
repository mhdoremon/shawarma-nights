import { Router } from 'express';
import * as service from './tenant.service.js';

export const platformRouter = Router();
platformRouter.post('/stores', service.registerStore);
platformRouter.get('/stores', service.listStores);
platformRouter.get('/stores/:storeId', service.getStoreInfo);
platformRouter.put('/stores/:storeId', service.updateStoreConfig);
platformRouter.delete('/stores/:storeId', service.deleteStore);
platformRouter.get('/stats', service.getStats);

export const storeInfoRouter = Router();
storeInfoRouter.get('/store-info', service.getStoreSettings);
storeInfoRouter.post('/store-info', service.updateStoreSettings);
storeInfoRouter.get('/hero', service.getHero);
storeInfoRouter.post('/hero', service.updateHero);

// Default export for convenience
export default platformRouter;
