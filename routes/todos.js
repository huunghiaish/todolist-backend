const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const Redis = require('redis');

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});

// Connect Redis
redisClient.connect().catch(console.error);

// Get all todos
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Checking Redis cache...');
    // Check cache first
    const cachedTodos = await redisClient.get('todos');
    if (cachedTodos) {
      console.log('✅ Data found in Redis cache');
      return res.json(JSON.parse(cachedTodos));
    }

    console.log('🔍 Cache miss, fetching from MongoDB...');
    // If not in cache, get from DB
    const todos = await Todo.find().sort({ createdAt: -1 });
    
    console.log('💾 Saving to Redis cache...');
    // Set cache
    await redisClient.setEx('todos', 3600, JSON.stringify(todos));
    console.log('✅ Data cached in Redis');
    
    res.json(todos);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Create todo
router.post('/', async (req, res) => {
  try {
    // Validate request body
    if (!req.body.title || typeof req.body.title !== 'string') {
      console.log('❌ Validation failed: Invalid title');
      return res.status(400).json({ 
        message: 'Title is required and must be a string' 
      });
    }

    console.log('💾 Saving new todo to MongoDB...');
    const todo = new Todo({
      title: req.body.title.trim(),
    });
    const newTodo = await todo.save();
    console.log('✅ Todo saved to MongoDB');
    
    console.log('🗑️ Invalidating Redis cache...');
    // Invalidate cache
    await redisClient.del('todos');
    console.log('✅ Redis cache invalidated');
    
    res.status(201).json(newTodo);
  } catch (err) {
    console.error('❌ Error creating todo:', err);
    res.status(500).json({ 
      message: 'Error creating todo',
      error: err.message 
    });
  }
});

// Update todo
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔍 Finding todo ${req.params.id} in MongoDB...`);
    const todo = await Todo.findById(req.params.id);
    if (req.body.completed !== undefined) {
      todo.completed = req.body.completed;
    }
    if (req.body.title) {
      todo.title = req.body.title;
    }

    console.log('💾 Saving updated todo to MongoDB...');
    const updatedTodo = await todo.save();
    console.log('✅ Todo updated in MongoDB');
    
    console.log('🗑️ Invalidating Redis cache...');
    // Invalidate cache
    await redisClient.del('todos');
    console.log('✅ Redis cache invalidated');
    
    res.json(updatedTodo);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting todo ${req.params.id} from MongoDB...`);
    await Todo.findByIdAndDelete(req.params.id);
    console.log('✅ Todo deleted from MongoDB');
    
    console.log('🗑️ Invalidating Redis cache...');
    // Invalidate cache
    await redisClient.del('todos');
    console.log('✅ Redis cache invalidated');
    
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 