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

export const placeOrder = async (req, res) => {
    try {
        const storeId = req.storeId;
        const orders = DataLayer.read(storeId, 'orders') || [];
        const payload = req.body;

        const orderNumCount = orders.length + 1;
        const orderNumber = `SN-${String(orderNumCount).padStart(4, '0')}`;
        
        const status = payload.paymentMethod === 'cod' ? 'confirmed' : 'payment_pending';
        const deliveryOtp = payload.deliveryType === 'delivery' ? generateOtp() : null;

        const order = {
            id: payload.orderId || payload.id || generateId('ord'),
            orderNumber,
            status,
            customer: payload.customer || { name: payload.customerName || "", phone: payload.customerPhone || "", email: "" },
            items: payload.items || [],
            deliveryType: payload.deliveryType || 'delivery',
            address: payload.address || '',
            lat: payload.lat || null,
            lng: payload.lng || null,
            paymentMethod: payload.paymentMethod || 'cod',
            paymentStatus: payload.paymentMethod === 'cod' ? 'pending' : 'pending',
            couponCode: payload.couponCode || null,
            subtotal: safeNum(payload.subtotal),
            discount: safeNum(payload.discount),
            deliveryFee: safeNum(payload.deliveryFee),
            tax: safeNum(payload.tax),
            packagingCharge: safeNum(payload.packagingCharge),
            tip: safeNum(payload.tip),
            total: safeNum(payload.total) || safeNum(payload.grandTotal),
            notes: payload.notes || payload.note || '',
            deliveryBoyId: null,
            deliveryOtp,
            createdAt: now(),
            updatedAt: now()
        };

        if (order.couponCode) {
            const usage = DataLayer.read(storeId, 'coupon_usage') || {};
            if (!usage[order.couponCode]) {
                usage[order.couponCode] = 0;
            }
            usage[order.couponCode] += 1;
            DataLayer.writeSync(storeId, 'coupon_usage', usage);
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
