const express = require('express');
const cors = require('cors');
const connectDB = require('../server/db');
const routes = require('../server/routes');
const errorHandler = require('../server/middleware/errorHandler');
require('dotenv').config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Export the Express API
module.exports = app; 