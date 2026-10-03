import DataLayer from '../../core/DataLayer.js';

export const listCustomers = (req, res) => {
    try {
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCustomer = (req, res) => {
    try {
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const customer = customers.find(c => String(c.id) === String(req.params.id));
        
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        res.json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomer = (req, res) => {
    try {
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const index = customers.findIndex(c => String(c.id) === String(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        const updatedCustomer = { ...customers[index], ...req.body };
        // Don't allow changing id or token via this endpoint ideally, but keeping it simple
        customers[index] = updatedCustomer;
        
        DataLayer.writeSync(req.storeId, 'customers', customers);
        
        res.json({ success: true, data: updatedCustomer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCustomer = (req, res) => {
    try {
        const customers = DataLayer.read(req.storeId, 'customers') || [];
        const newCustomers = customers.filter(c => String(c.id) !== String(req.params.id));
        
        if (customers.length === newCustomers.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        DataLayer.writeSync(req.storeId, 'customers', newCustomers);
        
        res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
