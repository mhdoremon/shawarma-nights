import DataLayer from '../../core/DataLayer.js';
import WebSocketHub from '../../core/WebSocketHub.js';
import { generateId, now } from '../../utils/helpers.js';

export function getMenu(req, res) {
  try {
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    res.json({ success: true, data: menuData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function getCategories(req, res) {
  try {
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    res.json({ success: true, data: menuData.categories || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function addOrUpdateMenuItem(req, res) {
  try {
    const itemData = req.body || {};
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    let menu = menuData.menu || [];
    
    let existingIndex = -1;
    if (itemData.id) {
      existingIndex = menu.findIndex(i => i.id === itemData.id);
    }

    const universalItem = {
      id: itemData.id || generateId('dish'),
      name: itemData.name || null,
      category: itemData.category || null,
      price: itemData.price || 0,
      originalPrice: itemData.originalPrice || null,
      prepTime: itemData.prepTime || itemData.time || null,
      time: itemData.time || itemData.prepTime || 30,
      type: itemData.type || 'standard',
      isVeg: itemData.isVeg !== undefined ? itemData.isVeg : false,
      badge: itemData.badge || null,
      spiceLevel: itemData.spiceLevel || null,
      description: itemData.description || itemData.desc || null,
      desc: itemData.desc || itemData.description || null,
      image: itemData.image || itemData.img || null,
      img: itemData.img || itemData.image || null,
      available: itemData.available !== undefined ? itemData.available : true,
      rating: itemData.rating || 0,
      reviews: itemData.reviews || 0,
      variants: itemData.variants || [],
      modifiers: itemData.modifiers || [],
      attributes: itemData.attributes || {},
      media: itemData.media || [],
      tags: itemData.tags || [],
      stock: itemData.stock || null,
      trackInventory: itemData.trackInventory || false,
      weight: itemData.weight || null,
      taxCode: itemData.taxCode || null,
      createdAt: itemData.createdAt || now(),
      updatedAt: now()
    };
    
    if (existingIndex >= 0) {
      // Keep existing fields not overwritten
      menu[existingIndex] = { ...menu[existingIndex], ...itemData, updatedAt: now() };
    } else {
      menu.push(universalItem);
    }
    
    menuData.menu = menu;
    DataLayer.writeSync(req.storeId, 'menu', menuData);
    WebSocketHub.broadcastToAll(req.storeId, { action: 'MENU_UPDATED', payload: menuData });
    
    res.json({ success: true, data: existingIndex >= 0 ? menu[existingIndex] : universalItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function deleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    const menuLength = menuData.menu ? menuData.menu.length : 0;
    
    menuData.menu = (menuData.menu || []).filter(item => String(item.id) !== String(id));
    
    if (menuData.menu.length !== menuLength) {
      DataLayer.writeSync(req.storeId, 'menu', menuData);
      WebSocketHub.broadcastToAll(req.storeId, { action: 'MENU_UPDATED', payload: menuData });
      res.json({ success: true, message: 'Item deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function toggleStock(req, res) {
  try {
    const targetId = req.body.itemId || req.body.id;
    const targetAvailable = req.body.available !== undefined ? req.body.available : req.body.isAvailable;
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    let menu = menuData.menu || [];
    
    const itemIndex = menu.findIndex(i => String(i.id) === String(targetId));
    if (itemIndex >= 0) {
      menu[itemIndex].available = targetAvailable;
      menu[itemIndex].updatedAt = now();
      DataLayer.writeSync(req.storeId, 'menu', menuData);
      WebSocketHub.broadcastToAll(req.storeId, { action: 'MENU_UPDATED', payload: menuData });
      res.json({ success: true, data: menu[itemIndex] });
    } else {
      res.status(404).json({ success: false, message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function addCategory(req, res) {
  try {
    const { id, name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name required' });
    
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    const categories = menuData.categories || [];
    
    const newCategory = {
      id: id || generateId('cat'),
      name
    };
    
    categories.push(newCategory);
    menuData.categories = categories;
    
    DataLayer.writeSync(req.storeId, 'menu', menuData);
    WebSocketHub.broadcastToAll(req.storeId, { action: 'MENU_UPDATED', payload: menuData });
    
    res.json({ success: true, data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const menuData = DataLayer.read(req.storeId, 'menu') || { menu: [], categories: [] };
    const categoriesLength = menuData.categories ? menuData.categories.length : 0;
    
    menuData.categories = (menuData.categories || []).filter(c => String(c.id) !== String(id));
    
    if (menuData.categories.length !== categoriesLength) {
      DataLayer.writeSync(req.storeId, 'menu', menuData);
      WebSocketHub.broadcastToAll(req.storeId, { action: 'MENU_UPDATED', payload: menuData });
      res.json({ success: true, message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function handleCatalogWsMessage(data, ws, storeId, source) {
  const { action, payload } = data;
  
  if (['ADD_MENU_ITEM', 'UPDATE_MENU_ITEM', 'DELETE_MENU_ITEM', 'TOGGLE_STOCK', 'TOGGLE_AVAILABILITY'].includes(action)) {
    const menuData = DataLayer.read(storeId, 'menu') || { menu: [], categories: [] };
    let menu = menuData.menu || [];
    let updated = false;

    if (action === 'ADD_MENU_ITEM' || action === 'UPDATE_MENU_ITEM') {
      const itemData = payload;
      let existingIndex = -1;
      if (itemData.id) {
        existingIndex = menu.findIndex(i => i.id === itemData.id);
      }
      
      const universalItem = {
        id: itemData.id || generateId('dish'),
        name: itemData.name || null,
        category: itemData.category || null,
        price: itemData.price || 0,
        originalPrice: itemData.originalPrice || null,
        prepTime: itemData.prepTime || null,
        isVeg: itemData.isVeg !== undefined ? itemData.isVeg : false,
        badge: itemData.badge || null,
        spiceLevel: itemData.spiceLevel || null,
        description: itemData.description || null,
        image: itemData.image || null,
        available: itemData.available !== undefined ? itemData.available : true,
        rating: itemData.rating || 0,
        reviews: itemData.reviews || 0,
        variants: itemData.variants || [],
        modifiers: itemData.modifiers || [],
        attributes: itemData.attributes || {},
        media: itemData.media || [],
        tags: itemData.tags || [],
        stock: itemData.stock || null,
        trackInventory: itemData.trackInventory || false,
        weight: itemData.weight || null,
        taxCode: itemData.taxCode || null,
        createdAt: itemData.createdAt || now(),
        updatedAt: now()
      };

      if (existingIndex >= 0) {
        menu[existingIndex] = { ...menu[existingIndex], ...itemData, updatedAt: now() };
      } else {
        menu.push(universalItem);
      }
      updated = true;
    } else if (action === 'DELETE_MENU_ITEM') {
      const { id } = payload;
      const initialLength = menu.length;
      menu = menu.filter(item => item.id !== id);
      if (menu.length !== initialLength) updated = true;
    } else if (action === 'TOGGLE_STOCK' || action === 'TOGGLE_AVAILABILITY') {
      const itemId = payload.itemId || payload.id;
      const itemIndex = menu.findIndex(i => i.id === itemId);
      if (itemIndex >= 0) {
        const available = payload.available !== undefined ? payload.available : !menu[itemIndex].available;
        menu[itemIndex].available = available;
        menu[itemIndex].updatedAt = now();
        updated = true;
      }
    }

    if (updated) {
      menuData.menu = menu;
      DataLayer.writeSync(storeId, 'menu', menuData);
      WebSocketHub.broadcastToAll(storeId, { action: 'MENU_UPDATED', payload: menuData });
    }
    return true; // Handled
  }
  
  return false; // Not handled
}
