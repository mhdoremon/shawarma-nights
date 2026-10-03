import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, now } from '../../utils/helpers.js';

export const getReviews = (req, res) => {
    try {
        const reviews = DataLayer.read(req.storeId, 'reviews') || [];
        return res.json({ success: true, reviews });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const addReview = (req, res) => {
    try {
        const { name, phone, rating, comment, dish, dishId, type, tags } = req.body;
        const reviews = DataLayer.read(req.storeId, 'reviews') || [];
        
        const review = {
            id: generateId('rev'),
            name,
            phone,
            rating: Number(rating),
            comment,
            dish,
            dishId,
            type: type || 'dish',
            tags: tags || [],
            date: 'Just now',
            createdAt: now()
        };
        
        reviews.push(review);
        DataLayer.write(req.storeId, 'reviews', reviews);

        if (dishId) {
            const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
            const dishIndex = menuData.menu.findIndex(d => d.id === dishId);
            if (dishIndex !== -1) {
                const dishReviews = reviews.filter(r => r.dishId === dishId);
                const avgRating = dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length;
                menuData.menu[dishIndex].rating = avgRating.toFixed(1);
                menuData.menu[dishIndex].reviews = dishReviews.length;
                DataLayer.write(req.storeId, 'menu', menuData);
            }
        }

        WebSocketHub.broadcastToAll(req.storeId, { action: 'REVIEW_ADDED', payload: review });
        
        return res.json({ success: true, review });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteReview = (req, res) => {
    try {
        const { id } = req.params;
        let reviews = DataLayer.read(req.storeId, 'reviews') || [];
        const review = reviews.find(r => r.id === id);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        reviews = reviews.filter(r => r.id !== id);
        DataLayer.write(req.storeId, 'reviews', reviews);

        if (review.dishId) {
            const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
            const dishIndex = menuData.menu.findIndex(d => d.id === review.dishId);
            if (dishIndex !== -1) {
                const dishReviews = reviews.filter(r => r.dishId === review.dishId);
                if (dishReviews.length > 0) {
                    const avgRating = dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length;
                    menuData.menu[dishIndex].rating = avgRating.toFixed(1);
                } else {
                    menuData.menu[dishIndex].rating = null;
                }
                menuData.menu[dishIndex].reviews = dishReviews.length;
                DataLayer.write(req.storeId, 'menu', menuData);
            }
        }

        WebSocketHub.broadcastToAll(req.storeId, { action: 'REVIEW_DELETED', payload: { id } });

        return res.json({ success: true, message: 'Review deleted' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};
