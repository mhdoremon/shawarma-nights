import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, generateOtp, generateUUID, now, safeNum, money, isNonEmpty, normalizePhone } from '../../utils/helpers.js';

export const getOrders = async (req, res) => {
    try {
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookings = async (req, res) => {
    try {
        const { dateISO } = req.query;
        const orders = DataLayer.read(req.storeId, 'orders') || [];
        let bookings = orders.filter(o => o.status !== 'cancelled' && (o.dateISO || o.startMin !== undefined));
        if (dateISO) {
            bookings = bookings.filter(o => o.dateISO === dateISO);
        }
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const placeOrder = async (req, res) => {
    try {
        const storeId = req.storeId;
        const storeConfig = DataLayer.getStoreConfig(storeId) || {};
        const orders = DataLayer.read(storeId, 'orders') || [];
        const payload = req.body;

        // Check salon appointment slot validation & collision
        if (payload.dateISO && payload.startMin !== undefined) {
            const startMin = Number(payload.startMin);
            const totalMinutes = Number(payload.totalMinutes || 30);
            const reqEnd = startMin + totalMinutes;

            // IST (Indian Standard Time UTC+5:30) validation
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istNow = new Date(now.getTime() + istOffset);
            const todayISO = istNow.toISOString().split('T')[0];
            const currentMinutesToday = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();

            if (payload.dateISO < todayISO) {
                return res.status(400).json({ success: false, message: 'CANNOT_BOOK_PAST_DATE', error: 'Beete hue din ka appointment book nahi kiya ja sakta.' });
            }
            if (payload.dateISO === todayISO && startMin <= currentMinutesToday) {
                return res.status(400).json({ success: false, message: 'CANNOT_BOOK_PAST_TIME_SLOT', error: 'Beete hue samay ka slot book nahi kiya ja sakta. Kripya aane wala slot chunein.' });
            }

            const existingBookings = orders.filter(o => o.dateISO === payload.dateISO && o.status !== 'cancelled' && o.startMin !== undefined);
            for (const b of existingBookings) {
                const bStart = Number(b.startMin);
                const bEnd = bStart + Number(b.totalMinutes || 30);
                if (Math.max(bStart, startMin) < Math.min(bEnd, reqEnd)) {
                    return res.status(409).json({ success: false, message: 'SLOT_ALREADY_TAKEN' });
                }
            }
        }

        // Strict Validation: Nash Studio appointments MUST have Advance Token Payment
        if (storeId === 'nash-studio' || (storeConfig?.settings && storeConfig?.settings?.requireTokenPayment)) {
            const requiredFee = Number(storeConfig?.settings?.bookingFee ?? 50);
            const bookingFee = safeNum(payload.bookingFee);
            const txnId = (payload.txnId || payload.utr || '').trim();
            if (bookingFee < requiredFee || !txnId || txnId.length < 4) {
                return res.status(400).json({
                    success: false,
                    message: `Nash Studio me bina ₹${requiredFee} Token Payment ke slot booking sambhav nahi hai. Kripya ₹${requiredFee} UPI pay karke valid UTR number enter karein.`
                });
            }
        }

        // ─── UNIVERSAL SMART AUTHENTICATION POLICY ENFORCEMENT ───
        const authPolicy = storeConfig?.settings?.authPolicy || {};
        const requireAuth = authPolicy.requireAuth !== false; // Default: true (Bina auth ke order allow nahi)
        const requirePhone = authPolicy.requirePhone || storeConfig?.settings?.requirePhoneOtp || (storeId === 'shawarma' || storeId === 'skyline');

        // Extract customer identifiers from headers / payload
        const rawPhone = payload.customer?.phone || payload.customerPhone || payload.phone || '';
        const cleanPhone = normalizePhone(rawPhone);
        const customerEmail = (payload.customer?.email || payload.userEmail || payload.email || '').toLowerCase().trim();
        const customerToken = req.headers['x-auth-token'] || 
                              (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null) ||
                              payload.customerToken || payload.authToken || payload.token;

        // Lookup registered customer across store or platform
        const storeCustomers = DataLayer.read(storeId, 'customers') || [];
        let authenticatedUser = storeCustomers.find(c => 
            (customerToken && c.token === customerToken) ||
            (cleanPhone && c.phone && normalizePhone(c.phone) === cleanPhone) ||
            (customerEmail && c.email && c.email.toLowerCase() === customerEmail)
        );

        // Fallback: If not found in current store, check across all platform stores
        if (!authenticatedUser) {
            const allStoreIds = DataLayer.listStoreIds();
            for (const sId of allStoreIds) {
                if (sId === storeId) continue;
                const otherCusts = DataLayer.read(sId, 'customers') || [];
                const found = otherCusts.find(c => 
                    (customerToken && c.token === customerToken) ||
                    (cleanPhone && c.phone && normalizePhone(c.phone) === cleanPhone) ||
                    (customerEmail && c.email && c.email.toLowerCase() === customerEmail)
                );
                if (found) {
                    authenticatedUser = found;
                    // Auto-sync customer to this store's customer database
                    storeCustomers.push({ ...found, id: generateId('cust'), createdAt: now() });
                    DataLayer.writeSync(storeId, 'customers', storeCustomers);
                    break;
                }
            }
        }

        // 1. Mandatory Auth Enforcement: Ghost/Anonymous orders strictly blocked
        const isPosExempt = payload.source === 'pos_terminal' || payload.source === 'admin_gateway';
        if (requireAuth && !isPosExempt) {
            const hasVerifiedToken = customerToken && String(customerToken).length > 5;
            const hasVerifiedSession = payload.authenticated === true || payload.isVerified === true;
            
            if (!authenticatedUser && !hasVerifiedToken && !hasVerifiedSession) {
                return res.status(401).json({
                    success: false,
                    requireAuth: true,
                    message: 'Order place karne ke liye ChuruOne account me Login / Sign Up hona anivarya (mandatory) hai. Kripya pehle authenticate karein.'
                });
            }
        }

        // 2. Mandatory Phone Verification Enforcement (For Home Delivery items)
        const isBooking = payload.deliveryType === 'booking' || payload.deliveryType === 'salon_slot' || storeId.includes('nash');
        const isDelivery = payload.deliveryType === 'delivery' || requirePhone;
        if (isDelivery && !isPosExempt && !isBooking) {
            const isPhoneVerified = authenticatedUser?.phoneVerified === true || (authenticatedUser && payload.phoneVerified === true);

            if (!isPhoneVerified) {
                return res.status(403).json({
                    success: false,
                    requirePhoneOtp: true,
                    message: `${storeConfig?.settings?.storeName || storeId} par home delivery ke liye Mobile Number OTP verify hona anivarya hai. Kripya apna mobile number verify karein.`
                });
            }
        }

        const prefix = (storeConfig.slug || storeId).split('-').map(s => s[0]).join('').toUpperCase().slice(0, 3) || 'ORD';
        const orderNumCount = orders.length + 1;
        const defaultOrderNum = `${prefix}-${String(orderNumCount).padStart(4, '0')}`;
        const orderNumber = payload.token || payload.orderNumber || defaultOrderNum;
        
        const isOnlinePayment = String(payload.paymentMethod || '').trim().toLowerCase() === 'upi' || 
                                String(payload.paymentMethod || '').trim().toLowerCase() === 'online';
        const status = payload.status || (isOnlinePayment ? 'payment_pending' : 'confirmed');
        const deliveryOtp = payload.deliveryType === 'delivery' ? generateOtp() : null;

        // Extract customer
        const customerName = payload.customer?.name || payload.customerName || payload.name || "";
        const customerPhone = payload.customer?.phone || payload.customerPhone || payload.phone || "";

        // Extract items (support single service/hairstyle or item array)
        let items = payload.items || [];
        if ((!items || items.length === 0) && payload.styleName) {
            items = [{
                name: payload.styleName,
                price: safeNum(payload.totalPrice) || safeNum(payload.price) || 0,
                unitPrice: safeNum(payload.totalPrice) || safeNum(payload.price) || 0,
                qty: 1,
                time: safeNum(payload.workMinutes) || 30,
                tier: payload.tier || 'standard'
            }];
        }

        const order = {
            id: payload.orderId || payload.id || generateId('ord'),
            orderNumber,
            token: payload.token || orderNumber,
            status,
            customer: { name: customerName, phone: customerPhone, email: customerEmail },
            items,
            deliveryType: payload.deliveryType || (payload.dateISO ? 'booking' : 'delivery'),
            address: payload.address || '',
            lat: payload.orderGps?.lat || payload.lat || null,
            lng: payload.orderGps?.lng || payload.lng || null,
            orderGps: payload.orderGps || null,
            paymentMethod: storeId === 'nash-studio' ? 'UPI Token Advance' : (payload.paymentMethod || 'cod'),
            paymentStatus: storeId === 'nash-studio' ? 'Token Paid (₹50 Advance)' : (payload.paymentStatus || (payload.paymentMethod === 'cod' ? 'pending' : 'pending')),
            utr: payload.utr || payload.txnId || null,
            couponCode: payload.couponCode || null,
            subtotal: safeNum(payload.subtotal) || safeNum(payload.totalPrice) || 0,
            discount: safeNum(payload.discount) || 0,
            deliveryFee: safeNum(payload.deliveryFee) || 0,
            tax: safeNum(payload.tax) || 0,
            packagingCharge: safeNum(payload.packagingCharge) || 0,
            tip: safeNum(payload.tip) || 0,
            total: safeNum(payload.total) || safeNum(payload.grandTotal) || safeNum(payload.totalPrice) || 0,
            totalPrice: safeNum(payload.totalPrice) || safeNum(payload.total) || safeNum(payload.grandTotal) || 0,
            notes: payload.notes || payload.note || '',
            // Salon specific appointment fields:
            dateISO: payload.dateISO || null,
            dateLabel: payload.dateLabel || null,
            timeLabel: payload.timeLabel || null,
            startMin: payload.startMin !== undefined ? Number(payload.startMin) : null,
            workMinutes: payload.workMinutes ? Number(payload.workMinutes) : null,
            totalMinutes: payload.totalMinutes ? Number(payload.totalMinutes) : null,
            styleName: payload.styleName || (items[0]?.name || null),
            tier: payload.tier || null,
            bookingFee: storeId === 'nash-studio' ? 50 : (safeNum(payload.bookingFee) || 0),
            remainingDue: storeId === 'nash-studio' ? Math.max(0, (safeNum(payload.totalPrice) || safeNum(payload.total) || 0) - 50) : (safeNum(payload.remainingDue) || 0),
            deliveryBoyId: null,
            deliveryOtp,
            createdAt: now(),
            updatedAt: now()
        };

        if (order.couponCode) {
            const usage = DataLayer.read(storeId, 'coupon_usage') || {};
            const phone = order.customer?.phone || payload.customerPhone;
            if (phone) {
                if (!usage[phone]) usage[phone] = {};
                if (!usage[phone][order.couponCode]) usage[phone][order.couponCode] = 0;
                usage[phone][order.couponCode] += 1;
            }
            if (!usage[order.couponCode]) {
                usage[order.couponCode] = 0;
            }
            usage[order.couponCode] += 1;
            DataLayer.writeSync(storeId, 'coupon_usage', usage);

            const deals = DataLayer.read(storeId, 'deals') || [];
            const dealIndex = deals.findIndex(d => (d.code || '').toLowerCase() === order.couponCode.toLowerCase());
            if (dealIndex !== -1) {
                deals[dealIndex].usageCount = (deals[dealIndex].usageCount || 0) + 1;
                DataLayer.writeSync(storeId, 'deals', deals);
            }
        }

        orders.push(order);
        DataLayer.writeSync(storeId, 'orders', orders);

        // Sync customer to customers.json so they appear in dukandar database
        const custPhone = order.customer?.phone || payload.customerPhone;
        const custEmail = order.customer?.email || payload.userEmail || payload.email;
        if (custPhone || custEmail) {
            try {
                const customers = DataLayer.read(storeId, 'customers') || [];
                const cleanPhone = custPhone ? normalizePhone(custPhone) : '';
                const cleanEmail = custEmail ? custEmail.toLowerCase().trim() : '';

                const existingIdx = customers.findIndex(c => 
                    (cleanPhone && normalizePhone(c.phone) === cleanPhone) ||
                    (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail)
                );

                if (existingIdx !== -1) {
                    if (order.customer?.name && (!customers[existingIdx].name || customers[existingIdx].name === 'Customer')) {
                        customers[existingIdx].name = order.customer.name;
                    }
                    if (cleanEmail && !customers[existingIdx].email) {
                        customers[existingIdx].email = cleanEmail;
                    }
                    if (cleanPhone && !customers[existingIdx].phone) {
                        customers[existingIdx].phone = cleanPhone;
                    }
                    if (order.address && !customers[existingIdx].address) {
                        customers[existingIdx].address = order.address;
                    }
                    customers[existingIdx].lastOrderAt = now();
                    DataLayer.writeSync(storeId, 'customers', customers);
                } else {
                    customers.push({
                        id: generateId('cust'),
                        name: order.customer?.name || payload.customerName || (cleanEmail ? cleanEmail.split('@')[0] : 'Customer'),
                        phone: cleanPhone,
                        email: cleanEmail,
                        address: order.address || '',
                        registeredAt: now(),
                        lastOrderAt: now()
                    });
                    DataLayer.writeSync(storeId, 'customers', customers);
                }
            } catch (ignored) {}
        }

        WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_CREATED', payload: order });
        WebSocketHub.broadcastToGateway(storeId, { action: 'ORDER_CREATED', payload: order });

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const storeId = req.storeId;
        const { orderId, status, deliveryBoyId } = req.body;
        const orders = DataLayer.read(storeId, 'orders') || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[orderIndex];
        order.status = status;
        order.updatedAt = now();

        if (status === 'out_for_delivery' && deliveryBoyId) {
            order.deliveryBoyId = deliveryBoyId;
        }

        if (status === 'delivered') {
            order.paymentStatus = 'paid';
        }

        orders[orderIndex] = order;
        DataLayer.writeSync(storeId, 'orders', orders);

        WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_UPDATED', payload: order });

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export function handleOrdersWsMessage(data, ws, storeId, source) {
    if (!data.action) return false;

    if (data.action === 'UPDATE_ORDER_STATUS') {
        const orders = DataLayer.read(storeId, 'orders') || [];
        const orderId = data.payload?.orderId;
        const status = data.payload?.status;
        
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index].status = status;
            orders[index].updatedAt = now();
            if (status === 'delivered') {
                orders[index].paymentStatus = 'paid';
            }
            DataLayer.writeSync(storeId, 'orders', orders);
            WebSocketHub.broadcastToAll(storeId, { action: 'ORDER_UPDATED', payload: orders[index] });
        }
        return true;
    }

    if (data.action === 'GET_INITIAL_STATE') {
        const orders = DataLayer.read(storeId, 'orders') || [];
        const menu = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
        
        ws.send(JSON.stringify({
            action: 'INITIAL_STATE',
            payload: {
                orders,
                menu
            }
        }));
        return true;
    }

    return false;
}

/**
 * Universal Multi-Store Customer Order History
 * Aggregates all orders for a customer across all stores in ChuruOne
 */
export const getCustomerOrders = async (req, res) => {
    try {
        const rawPhone = req.query.phone || req.headers['x-customer-phone'] || '';
        const rawEmail = (req.query.email || req.headers['x-customer-email'] || '').toLowerCase().trim();
        const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);

        if (!cleanPhone && !rawEmail) {
            return res.json({ success: true, allOrders: [], stores: {} });
        }

        const storeIds = DataLayer.listStoreIds();
        const STORE_INFO = {
            'shawarma': { name: 'Shawarma Nights', category: 'Food & Dining', icon: '🍔' },
            'skyline': { name: 'Skyline Premium Outfits', category: 'Fashion & Wardrobe', icon: '👕' },
            'nash-studio': { name: 'Nash Studio', category: 'Salon & Grooming', icon: '✂️' }
        };

        const storeMap = {};
        const allOrders = [];

        for (const sId of storeIds) {
            const storeOrders = DataLayer.read(sId, 'orders') || [];
            const config = DataLayer.getStoreConfig(sId) || {};
            const storeName = config.name || STORE_INFO[sId]?.name || sId;
            const category = config.category || STORE_INFO[sId]?.category || 'Shopping';
            const icon = STORE_INFO[sId]?.icon || '🛍️';

            const userOrders = storeOrders.filter(o => {
                const oPhone = String(o.customer?.phone || o.phone || o.customerPhone || '').replace(/\D/g, '').slice(-10);
                const oEmail = String(o.customer?.email || o.email || o.userEmail || '').toLowerCase().trim();
                return (cleanPhone && oPhone === cleanPhone) || (rawEmail && oEmail === rawEmail);
            }).map(o => ({
                ...o,
                storeId: sId,
                storeName,
                storeCategory: category,
                storeIcon: icon
            }));

            if (userOrders.length > 0) {
                storeMap[sId] = {
                    storeId: sId,
                    storeName,
                    category,
                    icon,
                    orders: userOrders
                };
                allOrders.push(...userOrders);
            }
        }

        // Sort orders descending (most recent first)
        allOrders.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

        res.json({
            success: true,
            totalOrders: allOrders.length,
            stores: storeMap,
            allOrders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

