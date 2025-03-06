const mongoose = require('mongoose');
const Test = require('./models/Test');

const MONGODB_URI = "mongodb+srv://sameersaif2002:KrgxJfAZ0t2PlcXz@sportsmanagement.mwplt.mongodb.net/sports?retryWrites=true&w=majority";

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        // Create a test document to ensure the database is created
        try {
            const testDoc = await Test.create({
                name: 'Test Document'
            });
            console.log('Test document created successfully:', testDoc);
        } catch (err) {
            console.log('Test document might already exist:', err.message);
        }
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
