const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load medicines database
const medicinesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'medicines-data.json'), 'utf8'));

// ═══════════════════════════════════════════════════════════
// MEDICINES API
// ═══════════════════════════════════════════════════════════

app.get('/api/medicines', (req, res) => {
  const { category, search, sortBy, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  let results = [];

  medicinesData.categories.forEach(cat => {
    if (!category || cat.id == category) {
      results.push(...cat.medicines);
    }
  });

  if (search) {
    results = results.filter(med => 
      med.name.toLowerCase().includes(search.toLowerCase()) ||
      med.generic.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (minPrice || maxPrice) {
    results = results.filter(med => {
      const price = med.prices.dow;
      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      return true;
    });
  }

  if (sortBy === 'price-low') results.sort((a, b) => a.prices.dow - b.prices.dow);
  if (sortBy === 'price-high') results.sort((a, b) => b.prices.dow - a.prices.dow);
  if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);

  const startIdx = (page - 1) * limit;
  const paginatedResults = results.slice(startIdx, startIdx + limit);

  res.json({ success: true, total: results.length, page, data: paginatedResults });
});

app.get('/api/medicines/:id', (req, res) => {
  for (let cat of medicinesData.categories) {
    const medicine = cat.medicines.find(m => m.id === req.params.id);
    if (medicine) {
      return res.json({ success: true, data: medicine });
    }
  }
  res.status(404).json({ success: false, message: 'Medicine not found' });
});

app.get('/api/price-comparison/:medicineId', (req, res) => {
  for (let cat of medicinesData.categories) {
    const medicine = cat.medicines.find(m => m.id === req.params.medicineId);
    if (medicine) {
      return res.json({
        success: true,
        medicine: medicine.name,
        prices: [
          { pharmacy: 'Dow Pharmacy', price: medicine.prices.dow, saving: 0, rating: 4.7 },
          { pharmacy: medicine.prices.pharmacy1, price: medicine.prices.pharmacy1_price, saving: medicine.prices.pharmacy1_price - medicine.prices.dow, rating: 4.5 },
          { pharmacy: medicine.prices.pharmacy2, price: medicine.prices.pharmacy2_price, saving: medicine.prices.pharmacy2_price - medicine.prices.dow, rating: 4.8 }
        ]
      });
    }
  }
  res.status(404).json({ success: false });
});

// ═══════════════════════════════════════════════════════════
// CART API
// ═══════════════════════════════════════════════════════════

let cartItems = {};

app.post('/api/cart/add', (req, res) => {
  const { medicineId, pharmacy, quantity } = req.body;
  for (let cat of medicinesData.categories) {
    const medicine = cat.medicines.find(m => m.id === medicineId);
    if (medicine) {
      const cartKey = `${medicineId}_${pharmacy}`;
      cartItems[cartKey] = {
        medicine,
        pharmacy,
        quantity: (cartItems[cartKey]?.quantity || 0) + quantity,
        timestamp: new Date()
      };
      return res.json({ success: true, message: 'Added to cart', cart: cartItems });
    }
  }
  res.status(404).json({ success: false });
});

app.get('/api/cart', (req, res) => {
  const items = Object.values(cartItems);
  const total = items.reduce((sum, item) => sum + (item.medicine.prices.dow * item.quantity), 0);
  res.json({ success: true, items, total, itemCount: items.length });
});

// ═══════════════════════════════════════════════════════════
// ORDERS API
// ═══════════════════════════════════════════════════════════

let orders = [];

app.post('/api/orders', (req, res) => {
  const { userId, items, pharmacy, address, phone } = req.body;
  const orderId = `PP-${Date.now()}`;
  const order = {
    id: orderId,
    userId,
    items,
    pharmacy,
    address,
    phone,
    total: items.reduce((sum, item) => sum + (item.medicine.prices.dow * item.quantity), 0),
    status: 'Confirmed',
    createdAt: new Date(),
    estimatedDelivery: new Date(Date.now() + 7200000)
  };
  orders.push(order);
  cartItems = {};
  res.json({ success: true, message: 'Order placed successfully', order });
});

app.get('/api/track/:orderId', (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (order) {
    const timeline = [
      { step: 'Order Confirmed', time: order.createdAt, completed: true },
      { step: 'Processing', time: new Date(order.createdAt.getTime() + 600000), completed: true },
      { step: 'Dispatched', time: new Date(order.createdAt.getTime() + 1200000), completed: true },
      { step: 'Out for Delivery', time: new Date(order.createdAt.getTime() + 1800000), completed: true },
      { step: 'Delivered', time: order.estimatedDelivery, completed: false }
    ];
    return res.json({ success: true, orderId: order.id, timeline });
  }
  res.status(404).json({ success: false });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ PharmaPlus API running on http://localhost:${PORT}`);
});