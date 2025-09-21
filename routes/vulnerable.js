const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mock product data
const mockProducts = [
  { _id: '1', name: 'Wireless Headphones', price: 99.99, category: 'Electronics', description: 'High-quality wireless headphones' },
  { _id: '2', name: 'Smartphone Case', price: 19.99, category: 'Accessories', description: 'Protective smartphone case' },
  { _id: '3', name: 'Laptop Stand', price: 49.99, category: 'Office', description: 'Ergonomic laptop stand' },
  { _id: '4', name: 'Coffee Mug', price: 14.99, category: 'Kitchen', description: 'Ceramic coffee mug' },
  { _id: '5', name: 'Desk Lamp', price: 34.99, category: 'Office', description: 'LED desk lamp' }
];

// Mock user data
const mockUsers = [
  { _id: '1', username: 'admin', password: 'password123', email: 'admin@example.com', role: 'admin' },
  { _id: '2', username: 'user1', password: 'pass123', email: 'user1@example.com', role: 'user' },
  { _id: '3', username: 'john_doe', password: 'secret', email: 'john@example.com', role: 'user' }
];

// VULNERABLE: Product search - susceptible to NoSQL injection
router.get('/products/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    // VULNERABILITY: Direct query construction without sanitization
    let searchQuery = {};
    if (query) {
      try {
        // This allows injection of MongoDB operators
        searchQuery = JSON.parse(query);
      } catch {
        // Fallback to text search if not valid JSON
        searchQuery = { name: { $regex: query, $options: 'i' } };
      }
    }

    // Simulate database query - in real app this would hit MongoDB
    // Insert the malicious query into users collection to trigger detection
    if (typeof searchQuery === 'object' && Object.keys(searchQuery).some(key => key.startsWith('$'))) {
      // Insert attack payload to trigger monitoring system
      const db = mongoose.connection;
      await db.collection('users').insertOne({
        searchQuery,
        timestamp: new Date(),
        sourceIP: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        endpoint: '/api/vulnerable/products/search'
      });
    }

    // Return filtered products (mock implementation)
    const filteredProducts = mockProducts.filter(product => 
      !query || product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      products: filteredProducts,
      total: filteredProducts.length,
      query: searchQuery
    });
  } catch (error) {
    res.status(500).json({ error: error.message, query: req.query.query });
  }
});

// VULNERABLE: User authentication - susceptible to auth bypass
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // VULNERABILITY: Direct query construction allows auth bypass
    let loginQuery = { username, password };
    
    // If password contains MongoDB operators, it's an injection attempt
    if (typeof password === 'object') {
      // Insert attack payload to trigger monitoring
      const db = mongoose.connection;
      await db.collection('users').insertOne({
        loginAttempt: { username, password },
        timestamp: new Date(),
        sourceIP: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        endpoint: '/api/vulnerable/auth/login'
      });
      
      // Simulate successful bypass for demo purposes
      return res.json({
        success: true,
        message: 'Login bypassed!',
        user: { username: 'admin', role: 'admin' },
        token: 'fake-jwt-token-bypassed'
      });
    }

    // Normal login check
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
      res.json({
        success: true,
        message: 'Login successful',
        user: { username: user.username, role: user.role },
        token: 'fake-jwt-token'
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABLE: User profile lookup - susceptible to injection
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // VULNERABILITY: Accept complex queries in ID parameter
    let userQuery;
    try {
      userQuery = JSON.parse(id);
      
      // If it's an object (injection attempt), trigger monitoring
      if (typeof userQuery === 'object') {
        const db = mongoose.connection;
        await db.collection('users').insertOne({
          userLookup: userQuery,
          timestamp: new Date(),
          sourceIP: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent'),
          endpoint: '/api/vulnerable/users/' + id
        });
        
        // Return all users for demo (simulating successful injection)
        return res.json({
          message: 'User lookup bypassed - returning all users!',
          users: mockUsers.map(u => ({ ...u, password: '***' }))
        });
      }
    } catch {
      userQuery = id;
    }

    // Normal user lookup
    const user = mockUsers.find(u => u._id === userQuery);
    
    if (user) {
      const { password, ...safeUser } = user;
      res.json({ user: safeUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VULNERABLE: Product filtering - accepts raw MongoDB queries
router.get('/products/filter', async (req, res) => {
  try {
    const filters = req.query;
    
    // VULNERABILITY: Accept any query parameters as MongoDB operators
    const hasInjection = Object.keys(filters).some(key => 
      key.startsWith('$') || (typeof filters[key] === 'string' && filters[key].includes('$'))
    );
    
    if (hasInjection) {
      // Trigger monitoring system
      const db = mongoose.connection;
      await db.collection('users').insertOne({
        productFilter: filters,
        timestamp: new Date(),
        sourceIP: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        endpoint: '/api/vulnerable/products/filter'
      });
    }

    // Mock filtering (return all products for demo)
    res.json({
      products: mockProducts,
      appliedFilters: filters,
      message: hasInjection ? 'Filter injection detected!' : 'Normal filtering'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (safe endpoint)
router.get('/products', (req, res) => {
  res.json({
    products: mockProducts,
    total: mockProducts.length
  });
});

// Get all categories (safe endpoint)
router.get('/categories', (req, res) => {
  const categories = [...new Set(mockProducts.map(p => p.category))];
  res.json({ categories });
});

module.exports = router;
