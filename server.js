require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const exercisesRoutes = require('./routes/exercises');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai_updated');
const foodRoutes = require('./routes/food');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies, increase limit for base64 images

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/food', foodRoutes);

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
