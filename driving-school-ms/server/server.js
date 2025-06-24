//server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Load models
try {
  require('./models/User');
  console.log('User model registered');
  require('./models/Course');
  console.log('Course model registered');
  require('./models/Booking');
  console.log('Booking model registered');
  require('./models/Payment');
  console.log('Payment model registered');
} catch (error) {
  console.error('Error loading models:', error);
}

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const indexRoutes = require('./routes/index');
app.use('/api', indexRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));