require('dotenv').config();

const config = {
    mongodb: {
        uri: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'sports'
        }
    }
};

module.exports = config; 