const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string (copied from db.js)
const MONGODB_URI = "mongodb+srv://sameersaif2002:KrgxJfAZ0t2PlcXz@sportsmanagement.mwplt.mongodb.net/sports?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected');
  setupParentChildRelationship();
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

async function setupParentChildRelationship() {
  try {
    // Find parent user by email
    // Replace with your test parent's email
    const parentEmail = 'parent1@example.com';
    const parent = await User.findOne({ email: parentEmail });
    
    if (!parent) {
      console.log(`Parent with email ${parentEmail} not found. Creating parent user...`);
      
      // Create a parent user if not found
      const newParent = new User({
        firstName: 'Parent',
        lastName: 'One',
        email: parentEmail,
        password: 'password123',
        role: 'parent'
      });
      
      await newParent.save();
      console.log(`Created new parent user: ${newParent.firstName} ${newParent.lastName}`);
      
      // Use the newly created parent
      const createdParent = await User.findOne({ email: parentEmail });
      
      // Find player users to associate with this parent
      // Adjust the query to find specific players or pick random ones
      const players = await User.find({ role: 'player' }).limit(3);
      
      if (players.length === 0) {
        console.log('No players found to associate with parent');
        
        // Create test player
        const newPlayer = new User({
          firstName: 'Child',
          lastName: 'One',
          email: 'child1@example.com',
          password: 'password123',
          role: 'player',
          parentId: createdParent._id
        });
        
        await newPlayer.save();
        console.log(`Created new player: ${newPlayer.firstName} ${newPlayer.lastName}`);
      } else {
        // Associate players with parent
        for (const player of players) {
          player.parentId = createdParent._id;
          await player.save();
          console.log(`Associated player ${player.firstName} ${player.lastName} with parent ${createdParent.firstName} ${createdParent.lastName}`);
        }
      }
    } else {
      console.log(`Found parent: ${parent.firstName} ${parent.lastName}`);
      
      // Find player users to associate with this parent
      const players = await User.find({ role: 'player' }).limit(3);
      
      if (players.length === 0) {
        console.log('No players found to associate with parent');
        
        // Create test player
        const newPlayer = new User({
          firstName: 'Child',
          lastName: 'One',
          email: 'child1@example.com',
          password: 'password123',
          role: 'player',
          parentId: parent._id
        });
        
        await newPlayer.save();
        console.log(`Created new player: ${newPlayer.firstName} ${newPlayer.lastName}`);
      } else {
        // Associate players with parent
        for (const player of players) {
          player.parentId = parent._id;
          await player.save();
          console.log(`Associated player ${player.firstName} ${player.lastName} with parent ${parent.firstName} ${parent.lastName}`);
        }
      }
    }
    
    console.log('Parent-child relationship setup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up parent-child relationship:', error);
    process.exit(1);
  }
} 