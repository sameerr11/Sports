const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/sports";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        return conn;
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;