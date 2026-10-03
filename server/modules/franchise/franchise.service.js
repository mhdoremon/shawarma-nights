import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, now } from '../../utils/helpers.js';

// Default franchise configuration template (Generic & multi-store ready)
const DEFAULT_FRANCHISE_CONFIG = {
  enabled: true,
  brandName: 'Shawarma Nights',
  tagline: 'Artisanal Charcoal Spit Kitchen Franchise',
  headline: 'Own A Shawarma Nights In Your City',
  subheadline: "Join India's fastest growing artisanal charcoal shawarma network. Proven high-volume unit economics, turnkey kitchen setup, and 100% proprietary spice & sauce supply.",
  investmentRange: '₹3.5 Lakhs – ₹6.5 Lakhs',
  roiMonths: '3 to 6 Months',
  grossMargin: '50% – 60%',
  setupDays: '14 Days',
  directPhone: '7023963189',
  whatsappPhone: '917023963189',
  brochureUrl: '',
  highlights: [
    {
      title: 'Turnkey Kitchen Setup',
      desc: 'Complete layout, custom heavy-duty charcoal rotisserie spit, extraction hood, and commercial kitchen equipment delivered.'
    },
    {
      title: 'Proprietary Spice & Sauce Supply',
      desc: 'Centralized secret marination spices, garlic toum base, and signature pickles supplied directly to maintain 100% taste consistency.'
    },
    {
      title: 'Chef & Staff Training',
      desc: '7-day intensive culinary training for pitmasters and counter staff with standardized recipes and portion controls.'
    },
    {
      title: 'Smart POS & Delivery Integration',
      desc: 'Pre-configured smart billing POS, SMS gateway notifications, and automated multi-channel delivery aggregator onboarding.'
    },
    {
      title: 'Zero Royalty on Initial Growth',
      desc: 'Transparent low fixed fees or zero royalty in initial months so you recoup your investment capital at lightning speed.'
    },
    {
      title: 'Grand Opening & Local Marketing',
      desc: 'Hyperlocal social media campaigns, influencer seeding, and launch collateral provided for a packed day-1 opening.'
    }
  ],
  models: [
    {
      id: 'model_express',
      name: 'Express Kiosk / Cloud Outpost',
      space: '120 – 250 Sq Ft',
      investment: '₹3.5 Lakhs',
      idealFor: 'High-footfall markets, food courts, midnight takeaway & online delivery hubs.',
      dailyCapacity: '200+ Rolls / Day',
      features: [
        'Minimal staff required (2 people)',
        'Compact heavy-duty charcoal rotisserie',
        'Lowest commercial rent overhead',
        'Fastest breakeven (90 to 120 days)'
      ]
    },
    {
      id: 'model_cafe',
      name: 'High-Street Dine-In Cafe',
      space: '350 – 800 Sq Ft',
      investment: '₹6.5 Lakhs',
      idealFor: 'Prominent high streets, college & youth hubs, family dining with live charcoal theater.',
      dailyCapacity: '500+ Rolls & Platters / Day',
      features: [
        'Live charcoal spit visible kitchen',
        'Seating for 16 to 32 guests',
        'Expanded menu with loaded fries, platters & shakes',
        'Highest average order value (AOV)'
      ]
    }
  ]
};

function getFranchiseData(storeId) {
  const data = DataLayer.read(storeId, 'franchise');
  if (!data || typeof data !== 'object') {
    const initial = {
      config: DEFAULT_FRANCHISE_CONFIG,
      inquiries: []
    };
    DataLayer.writeSync(storeId, 'franchise', initial);
    return initial;
  }
  if (!data.config) {
    data.config = DEFAULT_FRANCHISE_CONFIG;
  }
  if (!Array.isArray(data.inquiries)) {
    data.inquiries = [];
  }
  return data;
}

/**
 * GET /api/franchise
 * Public: Get store's franchise details
 */
export function getFranchiseInfo(req, res) {
  try {
    const data = getFranchiseData(req.storeId);
    res.json({
      success: true,
      franchise: data.config,
      config: data.config
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/franchise/inquire
 * Public: Submit a franchise lead / inquiry
 */
export function submitInquiry(req, res) {
  try {
    const { name, phone, city, budget, experience, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required for franchise inquiry'
      });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    const data = getFranchiseData(req.storeId);
    const inquiry = {
      id: generateId('fran'),
      name: String(name).trim(),
      phone: cleanPhone,
      city: String(city || '').trim(),
      budget: String(budget || '₹3.5L - ₹5L').trim(),
      experience: Boolean(experience),
      notes: String(notes || '').trim(),
      status: 'new', // 'new' | 'contacted' | 'converted' | 'rejected'
      createdAt: now(),
      updatedAt: now()
    };

    data.inquiries.unshift(inquiry); // Newest first
    DataLayer.writeSync(req.storeId, 'franchise', data);

    // Real-time alerts
    // 1. Alert Dukandar Android Gateway app
    WebSocketHub.broadcastToGateway(req.storeId, {
      action: 'NEW_FRANCHISE_INQUIRY',
      payload: inquiry
    });

    // 2. Alert all connected admin websockets
    WebSocketHub.broadcastToAll(req.storeId, {
      action: 'FRANCHISE_INQUIRY_RECEIVED',
      payload: inquiry
    });

    res.json({
      success: true,
      message: 'Franchise inquiry submitted successfully! Our expansion team will contact you shortly.',
      inquiryId: inquiry.id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/admin/franchise/inquiries
 * Admin: List all franchise leads
 */
export function getAdminInquiries(req, res) {
  try {
    const data = getFranchiseData(req.storeId);
    res.json({
      success: true,
      inquiries: data.inquiries || [],
      count: (data.inquiries || []).length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/admin/franchise/config
 * Admin: Update franchise configuration
 */
export function updateFranchiseConfig(req, res) {
  try {
    const updates = req.body;
    const data = getFranchiseData(req.storeId);

    data.config = {
      ...(data.config || DEFAULT_FRANCHISE_CONFIG),
      ...updates,
      updatedAt: now()
    };

    DataLayer.writeSync(req.storeId, 'franchise', data);

    // Broadcast update to all store frontends
    WebSocketHub.broadcastToAll(req.storeId, {
      action: 'FRANCHISE_CONFIG_UPDATED',
      payload: data.config
    });

    res.json({
      success: true,
      message: 'Franchise details updated successfully',
      franchise: data.config
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/admin/franchise/inquiry-status
 * Admin: Update status of a lead
 */
export function updateInquiryStatus(req, res) {
  try {
    const { inquiryId, status, adminNote } = req.body;
    if (!inquiryId || !status) {
      return res.status(400).json({ success: false, message: 'inquiryId and status required' });
    }

    const data = getFranchiseData(req.storeId);
    const idx = (data.inquiries || []).findIndex(i => i.id === inquiryId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    data.inquiries[idx].status = status;
    data.inquiries[idx].updatedAt = now();
    if (adminNote) data.inquiries[idx].adminNote = adminNote;

    DataLayer.writeSync(req.storeId, 'franchise', data);

    WebSocketHub.broadcastToGateway(req.storeId, {
      action: 'FRANCHISE_INQUIRY_UPDATED',
      payload: data.inquiries[idx]
    });

    res.json({
      success: true,
      inquiry: data.inquiries[idx]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
