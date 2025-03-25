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
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});

// Initialize scheduler for recurring bookings
initScheduler();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../client/build');
    console.log('Serving static files from:', buildPath);
    
    // Set static folder
    app.use(express.static(buildPath));

    // Any route that is not /api will be redirected to the React app
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(buildPath, 'index.html'));
    });
}

// Error handling
app.use(errorHandler);

// Start server with port fallback
const startServer = async (retries = 3) => {
    const basePort = process.env.PORT || 5000;
    
    for (let i = 0; i < retries; i++) {
        const port = basePort + i;
        try {
            await new Promise((resolve, reject) => {
                const server = app.listen(port)
                    .once('listening', () => {
                        console.log(`Server is running on port ${port}`);
                        resolve();
                    })
                    .once('error', (err) => {
                        console.error(`Error starting server on port ${port}:`, err);
                        if (err.code === 'EADDRINUSE') {
                            console.log(`Port ${port} is busy, trying next port...`);
                            server.close();
                            reject(err);
                        } else {
                            console.error('Server error:', err);
                            reject(err);
                        }
                    });
            });
            // If we reach here, the server started successfully
            return;
        } catch (err) {
            console.error(`Attempt ${i + 1} failed:`, err);
            if (i === retries - 1) {
                console.error(`Failed to start server after ${retries} attempts`);
                process.exit(1);
            }
            // Continue to next port
        }
    }
};

startServer();
