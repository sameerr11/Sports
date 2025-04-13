const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://sameersaif2002:KrgxJfAZ0t2PlcXz@sportsmanagement.mwplt.mongodb.net/sports?retryWrites=true&w=majority";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log(`Connection string: ${MONGODB_URI}`);

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