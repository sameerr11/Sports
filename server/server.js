const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initScheduler } = require('./utils/scheduler');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Initialize scheduler for recurring bookings
initScheduler();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Any route that is not /api will be redirected to the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
