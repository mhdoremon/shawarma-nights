import { Router } from 'express';
import * as service from './tenant.service.js';

export const platformRouter = Router();
platformRouter.get('/marketplace', service.getMarketplaceFeed);
platformRouter.get('/stores/marketplace-status', service.getStoreMarketplaceStatuses);
platformRouter.post('/stores/:storeId/toggle-marketplace', service.toggleStoreMarketplaceVisibility);
platformRouter.get('/products', service.getCityProducts);
platformRouter.post('/products/:storeId/:itemId/toggle-marketplace', service.toggleProductMarketplaceVisibility);
platformRouter.post('/stores/:storeId/toggle-review-permission', service.toggleStoreReviewPermission);
platformRouter.get('/reviews', service.getCityReviews);
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
