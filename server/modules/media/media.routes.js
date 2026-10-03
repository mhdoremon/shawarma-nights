import { Router } from 'express';
import * as service from './media.service.js';

const router = Router();

router.post('/upload', service.uploadMedia);
router.get('/upload/status', service.getMediaStatus);
router.get('/media/status', service.getMediaStatus);

export default router;
