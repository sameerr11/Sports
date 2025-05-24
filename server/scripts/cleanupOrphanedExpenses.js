const mongoose = require('mongoose');
const config = require('../config');
const ExpenseTransaction = require('../models/revenue/ExpenseTransaction');
const UtilityBill = require('../models/UtilityBill');

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Clean up orphaned expense transactions
const cleanOrphanedExpenseTransactions = async () => {
  try {
    console.log('Checking for orphaned expense transactions...');
    
    // Get all expense transactions
    const transactions = await ExpenseTransaction.find({ expenseModel: 'UtilityBill' });
    console.log(`Found ${transactions.length} utility bill expense transactions`);
    
    let removedCount = 0;
    
    for (const transaction of transactions) {
      // Skip transactions with no expenseId
      if (!transaction.expenseId) {
        continue;
      }
      
      // Check if the utility bill exists
      const utilityBillExists = await UtilityBill.exists({ _id: transaction.expenseId });
      
      // If utility bill doesn't exist, remove the transaction
      if (!utilityBillExists) {
        console.log(`Removing orphaned expense transaction ${transaction._id} for utility bill ${transaction.expenseId}`);
        await ExpenseTransaction.deleteOne({ _id: transaction._id });
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} orphaned expense transactions`);
    } else {
      console.log('No orphaned expense transactions found');
    }
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Cleanup completed, database connection closed.');
  } catch (error) {
    console.error('Error cleaning orphaned expense transactions:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the cleanup
cleanOrphanedExpenseTransactions(); 