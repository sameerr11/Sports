const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initScheduler } = require('./utils/scheduler');
const { startScheduledTasks } = require('./scheduledTasks');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Initialize scheduler for recurring bookings
initScheduler();

// Start scheduled tasks
startScheduledTasks();

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

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../client/build');
    console.log('Production mode - Static files path:', buildPath);
    
    // Set static folder - it's important this comes BEFORE the catchall route
    app.use(express.static(buildPath));

    // Handle subdomain routing for booking
    app.get('*', (req, res) => {
        // Log the request for debugging
        console.log(`Request: ${req.method} ${req.url}, Hostname: ${req.hostname}`);
        
        // If it's the booking subdomain or the guest-booking path
        if (req.isBookingSubdomain || req.path === '/guest-booking') {
            console.log('Booking subdomain or path detected, serving index.html');
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