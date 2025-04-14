const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://192.158.236.68:27017/sports";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: trueb
        });
        
        console.log(`MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        return conn;
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
