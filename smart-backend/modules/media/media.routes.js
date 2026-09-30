import { Router } from 'express';
import * as service from './media.service.js';

const router = Router();

router.post('/upload', service.uploadMedia);

export default router;
