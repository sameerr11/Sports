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

// Subdomain detection middleware
app.use((req, res, next) => {
  const host = req.hostname;
  
  // Check if the request is coming from the booking subdomain
  if (host.startsWith('booking.')) {
    // Store the subdomain information in the request for use in routes
    req.isBookingSubdomain = true;
  }
  
  next();
});

// Routes
app.use('/api', routes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../client/build');
    console.log('Production mode - Static files path:', buildPath);
    
    // Set static folder
    app.use(express.static(buildPath));

    // Handle subdomain routing for booking
    app.get('*', (req, res) => {
        // If it's the booking subdomain, always serve the index.html
        // but add a query parameter or header that your React app can use
        if (req.isBookingSubdomain) {
            // You can also attach a special header or query parameter here if needed
            console.log('Booking subdomain detected, serving guest booking page');
            return res.sendFile(path.resolve(buildPath, 'index.html'));
        }

        // Normal routing for the main domain
        res.sendFile(path.resolve(buildPath, 'index.html'));
    });
}

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
console.log('Starting server on port:', PORT);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});