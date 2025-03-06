const mongoose = require('mongoose');

const uri = "mongodb+srv://sameersaif2002:KrgxJfAZ0t2PlcXz@sportsmanagement.mwplt.mongodb.net/sports?retryWrites=true&w=majority";

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');
        const conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connection successful!');
        console.log('Host:', conn.connection.host);
        console.log('Database:', conn.connection.name);
        
        // List all collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('Disconnected successfully');
    } catch (error) {
        console.error('Connection error:', error);
    }
    process.exit();
}

testConnection(); 