import { Router } from 'express';
import * as service from './reviews.service.js';

const router = Router();

router.get('/', service.getReviews);
router.post('/', service.addReview);
router.delete('/:id', service.deleteReview);

export default router;
