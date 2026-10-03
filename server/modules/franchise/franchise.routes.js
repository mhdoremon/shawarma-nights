import { Router } from 'express';
import * as service from './franchise.service.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Public routes (Website visitors)
router.get(['/franchise', '/franchise/info'], service.getFranchiseInfo);
router.post(['/franchise/inquire', '/franchise/apply'], service.submitInquiry);

// Admin routes (Dukandar portal & app)
router.get(['/admin/franchise/inquiries', '/franchise/admin/inquiries'], requireAdmin, service.getAdminInquiries);
router.post(['/admin/franchise/config', '/franchise/admin/config'], requireAdmin, service.updateFranchiseConfig);
router.post(['/admin/franchise/inquiry-status', '/franchise/admin/inquiry-status'], requireAdmin, service.updateInquiryStatus);

export default router;
