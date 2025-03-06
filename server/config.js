require('dotenv').config();

const config = {
    mongodb: {
        uri: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'sports'
        }
    },
    jwtSecret: process.env.JWT_SECRET || 'sportsmanagement_secret_key'
};

module.exports = config; 