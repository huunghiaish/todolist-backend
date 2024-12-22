const express = require('express');
const mongoose = require('mongoose');
const Redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Cấu hình CORS chi tiết hơn
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Redis client
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});

// Redis connection
redisClient.connect()
  .then(() => console.log('Redis Connected'))
  .catch(err => console.error('Redis Connection Error:', err));

// Redis error handling
redisClient.on('error', (err) => console.error('Redis Error:', err));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/todos', require('./routes/todos'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 