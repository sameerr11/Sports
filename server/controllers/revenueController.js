const { validationResult } = require('express-validator');
const RevenueTransaction = require('../models/revenue/RevenueTransaction');
const ExpenseTransaction = require('../models/revenue/ExpenseTransaction');
const RevenueSourceType = require('../models/revenue/RevenueSourceType');
const ExpenseType = require('../models/revenue/ExpenseType');
const PlayerRegistration = require('../models/PlayerRegistration');
const CafeteriaOrder = require('../models/CafeteriaOrder');
const Booking = require('../models/Booking');
const SalaryInvoice = require('../models/SalaryInvoice');
const UtilityBill = require('../models/UtilityBill');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const SingleSessionFee = require('../models/SingleSessionFee'); // Added for daily report
const RegistrationRenewal = require('../models/RegistrationRenewal'); // Added for daily report

// Get or create a default admin user for transactions with missing creator
const getDefaultAdminUser = async () => {
  try {
    // Try to find an existing admin user
    let adminUser = await User.findOne({ role: 'admin' });
    
    // If no admin user found, use the first available user
    if (!adminUser) {
      adminUser = await User.findOne({});
    }
    
    if (!adminUser) {
      console.error('No users found in the system to use as default admin');
      return null;
    }
    
    return adminUser._id;
  } catch (error) {
    console.error('Error finding default admin user:', error);
    return null;
  }
};

// Sync transactions from various sources
const syncTransactionsFromSources = async () => {
  try {
    console.log('Synchronizing revenue and expense transactions from sources...');
    
    // Get default admin user for transactions with missing creator
    const defaultAdminId = await getDefaultAdminUser();
    if (!defaultAdminId) {
      console.error('Could not find a default admin user. Some transactions may be skipped.');
    }
    
    // ======= REVENUE SOURCES =======
    
    // 1. Player Registrations - Get all paid and completed registrations
    const registrations = await PlayerRegistration.find({
      'fee.paymentStatus': 'Paid',
      status: 'Completed',
      // Only get registrations that don't have a corresponding revenue entry
      $nor: [
        { 
          _id: { 
            $in: await RevenueTransaction.find({
              sourceModel: 'PlayerRegistration'
            }).distinct('sourceId')
          } 
        }
      ]
    }).populate('registeredBy', 'firstName lastName');
    
    console.log(`Found ${registrations.length} new player registrations to sync...`);
    
    // Create revenue transactions for each registration
    for (const registration of registrations) {
      // Use default admin if registeredBy is missing
      const creatorId = registration.registeredBy ? registration.registeredBy._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping registration ${registration._id} due to missing registeredBy and no default admin`);
        continue;
      }
      
      const revenueTransaction = new RevenueTransaction({
        amount: registration.fee.amount,
        sourceType: 'Registration',
        sourceId: registration._id,
        sourceModel: 'PlayerRegistration',
        description: `Registration fee for ${registration.player.firstName} ${registration.player.lastName} - ${registration.sports.join(', ')}`,
        date: registration.createdAt,
        createdBy: creatorId,
        notes: `Invoice #${registration.fee.invoiceNumber}, ${registration.registrationPeriod} period`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for registration: ${registration._id}`);
    }
    
    // 2. Cafeteria Orders - Get all completed orders
    const cafeteriaOrders = await CafeteriaOrder.find({
      paymentStatus: 'Completed',
      // Only get orders that don't have a corresponding revenue entry
      $nor: [
        { 
          _id: { 
            $in: await RevenueTransaction.find({
              sourceModel: 'CafeteriaOrder'
            }).distinct('sourceId')
          } 
        }
      ]
    }).populate('processedBy', 'firstName lastName');
    
    console.log(`Found ${cafeteriaOrders.length} new cafeteria orders to sync...`);
    
    // Create revenue transactions for each cafeteria order
    for (const order of cafeteriaOrders) {
      // Use default admin if processedBy is missing
      const creatorId = order.processedBy ? order.processedBy._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping cafeteria order ${order._id} due to missing processedBy and no default admin`);
        continue;
      }
      
      const revenueTransaction = new RevenueTransaction({
        amount: order.total,
        sourceType: 'Cafeteria',
        sourceId: order._id,
        sourceModel: 'CafeteriaOrder',
        description: `Cafeteria order #${order.orderNumber}`,
        date: order.createdAt,
        createdBy: creatorId,
        notes: `Order contains ${order.items.length} items`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for cafeteria order: ${order._id}`);
    }
    
    // 3. Regular Bookings - Get all paid bookings
    const bookings = await Booking.find({
      paymentStatus: 'Paid',
      // Only get bookings that don't have a corresponding revenue entry
      $nor: [
        { 
          _id: { 
            $in: await RevenueTransaction.find({
              sourceModel: 'Booking'
            }).distinct('sourceId')
          } 
        }
      ]
    }).populate('user', 'firstName lastName email').populate('court', 'name sportType');
    
    console.log(`Found ${bookings.length} new regular bookings to sync...`);
    
    // Create revenue transactions for each booking
    for (const booking of bookings) {
      // Skip free bookings (like training sessions)
      if (booking.purpose !== 'Rental' || booking.totalPrice <= 0) {
        continue;
      }
      
      // Use default admin if user is missing
      const creatorId = booking.user ? booking.user._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping booking ${booking._id} due to missing user and no default admin`);
        continue;
      }
      
      const revenueTransaction = new RevenueTransaction({
        amount: booking.totalPrice,
        sourceType: 'Rental',
        sourceId: booking._id,
        sourceModel: 'Booking',
        description: `Court rental: ${booking.court ? booking.court.name : 'Unknown court'} - ${booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Unknown user'}`,
        date: booking.createdAt,
        createdBy: creatorId,
        notes: `${new Date(booking.startTime).toLocaleString()} to ${new Date(booking.endTime).toLocaleString()}`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for booking: ${booking._id}`);
    }
    
    // 4. Guest Bookings - Get all paid guest bookings
    const GuestBooking = require('../models/GuestBooking');
    const guestBookings = await GuestBooking.find({
      paymentStatus: 'Paid',
      // Only get bookings that don't have a corresponding revenue entry
      $nor: [
        { 
          _id: { 
            $in: await RevenueTransaction.find({
              sourceModel: 'GuestBooking'
            }).distinct('sourceId')
          } 
        }
      ]
    }).populate('court', 'name sportType hourlyRate');
    
    console.log(`Found ${guestBookings.length} new guest bookings to sync...`);
    
    // Create revenue transactions for each guest booking
    for (const booking of guestBookings) {
      // Skip if totalPrice is not positive
      if (booking.totalPrice <= 0) {
        continue;
      }
      
      const revenueTransaction = new RevenueTransaction({
        amount: booking.totalPrice,
        sourceType: 'Rental',
        sourceId: booking._id,
        sourceModel: 'GuestBooking',
        description: `Guest court rental: ${booking.court ? booking.court.name : 'Unknown court'} - ${booking.guestName}`,
        date: booking.createdAt,
        createdBy: defaultAdminId, // Use default admin for guest bookings
        notes: `Reference: ${booking.bookingReference}, ${new Date(booking.startTime).toLocaleString()} to ${new Date(booking.endTime).toLocaleString()}`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for guest booking: ${booking._id}`);
    }
    
    // 5. Registration Renewals - Get all completed renewals
    const registrationRenewals = await RegistrationRenewal.find({
      status: 'Completed',
      'fee.paymentStatus': 'Paid',
      // Only get renewals that don't have a corresponding revenue entry
      $nor: [
        { 
          _id: { 
            $in: await RevenueTransaction.find({
              sourceModel: 'RegistrationRenewal'
            }).distinct('sourceId')
          } 
        }
      ]
    }).populate('renewedBy', 'firstName lastName');
    
    console.log(`Found ${registrationRenewals.length} new registration renewals to sync...`);
    
    // Create revenue transactions for each registration renewal
    for (const renewal of registrationRenewals) {
      // Use default admin if renewedBy is missing
      const creatorId = renewal.renewedBy ? renewal.renewedBy._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping registration renewal ${renewal._id} due to missing renewedBy and no default admin`);
        continue;
      }
      
      const revenueTransaction = new RevenueTransaction({
        amount: renewal.fee.amount,
        sourceType: 'Registration Renewal',
        sourceId: renewal._id,
        sourceModel: 'RegistrationRenewal',
        description: `Registration renewal for ${renewal.player.firstName} ${renewal.player.lastName} - ${renewal.sports.join(', ')}`,
        date: renewal.createdAt,
        createdBy: creatorId,
        notes: `Invoice #${renewal.fee.invoiceNumber}, ${renewal.registrationPeriod} period, Receipt #${renewal.fee.receiptNumber || 'N/A'}`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for registration renewal: ${renewal._id}`);
    }
    
    // ======= EXPENSE SOURCES =======
    
    // 1. Salary Invoices - Get all paid salary invoices
    const salaryInvoices = await SalaryInvoice.find({
      paymentStatus: 'Paid',
      // Only get invoices that don't have a corresponding expense entry
      $nor: [
        { 
          _id: { 
            $in: await ExpenseTransaction.find({
              expenseModel: 'SalaryInvoice'
            }).distinct('expenseId')
          } 
        }
      ]
    }).populate('issuedBy', 'firstName lastName').populate('userId', 'firstName lastName');
    
    console.log(`Found ${salaryInvoices.length} new salary invoices to sync...`);
    
    // Create expense transactions for each salary invoice
    for (const invoice of salaryInvoices) {
      // Use default admin if issuedBy is missing
      const creatorId = invoice.issuedBy ? invoice.issuedBy._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping salary invoice ${invoice._id} due to missing issuedBy and no default admin`);
        continue;
      }
      
      const userName = invoice.userId ? `${invoice.userId.firstName} ${invoice.userId.lastName}` : 'Unknown';
      
      const expenseTransaction = new ExpenseTransaction({
        amount: (invoice.amount || 0) + (invoice.bonus || 0), // Include bonus in total amount
        expenseType: 'Salary',
        expenseId: invoice._id,
        expenseModel: 'SalaryInvoice',
        description: `Salary payment to ${userName}${invoice.bonus ? ' (includes bonus)' : ''}`,
        date: invoice.paidDate || invoice.updatedAt,
        paymentStatus: 'Paid',
        paidDate: invoice.paidDate || invoice.updatedAt,
        createdBy: creatorId,
        paidBy: creatorId,
        notes: `Invoice #${invoice.invoiceNumber}`
      });
      
      await expenseTransaction.save();
      console.log(`Created expense transaction for salary invoice: ${invoice._id}`);
    }
    
    // 2. Utility Bills - Get all paid utility bills
    const utilityBills = await UtilityBill.find({
      paymentStatus: 'Paid',
      // Only get bills that don't have a corresponding expense entry
      $nor: [
        { 
          _id: { 
            $in: await ExpenseTransaction.find({
              expenseModel: 'UtilityBill'
            }).distinct('expenseId')
          } 
        }
      ]
    }).populate('createdBy', 'firstName lastName').populate('paidBy', 'firstName lastName');
    
    console.log(`Found ${utilityBills.length} new utility bills to sync...`);
    
    // Create expense transactions for each utility bill
    for (const bill of utilityBills) {
      // Use default admin if createdBy is missing
      const creatorId = bill.createdBy ? bill.createdBy._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping utility bill ${bill._id} due to missing createdBy and no default admin`);
        continue;
      }
      
      const expenseTransaction = new ExpenseTransaction({
        amount: bill.amount,
        expenseType: 'Utility',
        expenseId: bill._id,
        expenseModel: 'UtilityBill',
        description: `${bill.billType} bill - ${bill.sportType !== 'General' ? bill.sportType : bill.vendor}`,
        date: bill.paidDate || bill.updatedAt,
        paymentStatus: 'Paid',
        paidDate: bill.paidDate || bill.updatedAt,
        createdBy: creatorId,
        paidBy: bill.paidBy ? bill.paidBy._id : creatorId,
        notes: `Bill #${bill.billNumber}, Due date: ${new Date(bill.dueDate).toLocaleDateString()}, Sport: ${bill.sportType}`
      });
      
      await expenseTransaction.save();
      console.log(`Created expense transaction for utility bill: ${bill._id}`);
    }
    
    console.log('Synchronization of transactions completed successfully.');
  } catch (error) {
    console.error('Error synchronizing transactions:', error);
  }
};

// Quick sync function that only processes new renewals and registrations
const quickSyncNewTransactions = async () => {
  try {
    console.log('Running quick sync for new transactions...');
    
    // Get default admin user for transactions with missing creator
    const defaultAdminId = await getDefaultAdminUser();
    if (!defaultAdminId) {
      console.error('Could not find a default admin user. Skipping sync.');
      return;
    }
    
    // Only sync new registration renewals (most likely to be new)
    const registrationRenewals = await RegistrationRenewal.find({
      status: 'Completed',
      'fee.paymentStatus': 'Paid',
      // Only get renewals that don't have a corresponding revenue entry
      $nor: [
        { 
          _id: { 
            $in: await RevenueTransaction.find({
              sourceModel: 'RegistrationRenewal'
            }).distinct('sourceId')
          } 
        }
      ]
    }).populate('renewedBy', 'firstName lastName');
    
    console.log(`Found ${registrationRenewals.length} new registration renewals to sync...`);
    
    // Create revenue transactions for each registration renewal
    for (const renewal of registrationRenewals) {
      // Use default admin if renewedBy is missing
      const creatorId = renewal.renewedBy ? renewal.renewedBy._id : defaultAdminId;
      
      // Skip if we can't find a valid creator ID
      if (!creatorId) {
        console.log(`Skipping registration renewal ${renewal._id} due to missing renewedBy and no default admin`);
        continue;
      }
      
      const revenueTransaction = new RevenueTransaction({
        amount: renewal.fee.amount,
        sourceType: 'Registration Renewal',
        sourceId: renewal._id,
        sourceModel: 'RegistrationRenewal',
        description: `Registration renewal for ${renewal.player.firstName} ${renewal.player.lastName} - ${renewal.sports.join(', ')}`,
        date: renewal.createdAt,
        createdBy: creatorId,
        notes: `Invoice #${renewal.fee.invoiceNumber}, ${renewal.registrationPeriod} period, Receipt #${renewal.fee.receiptNumber || 'N/A'}`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for registration renewal: ${renewal._id}`);
    }
    
    console.log('Quick sync completed successfully.');
  } catch (error) {
    console.error('Error in quick sync:', error);
  }
};

// @desc    Get revenue dashboard data
// @route   GET /api/revenue/dashboard
// @access  Revenue Manager, Admin, Accounting
exports.getDashboardData = async (req, res) => {
  try {
    // Only sync if explicitly requested or if it's been a while since last sync
    const { forceSync } = req.query;
    if (forceSync === 'true') {
      console.log('Force sync requested - running full synchronization...');
      await syncTransactionsFromSources();
      await cleanOrphanedTransactions();
      await cleanOrphanedExpenseTransactions();
    } else {
      // Quick sync - only check for new renewals and registrations
      await quickSyncNewTransactions();
    }
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Set time to start and end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get total revenue
    const totalRevenue = await RevenueTransaction.aggregate([
      { 
        $match: { 
          date: { $gte: start, $lte: end } 
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get total expenses
    const totalExpenses = await ExpenseTransaction.aggregate([
      { 
        $match: { 
          date: { $gte: start, $lte: end },
          paymentStatus: 'Paid'
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get revenue by source type
    let revenueBySource = await RevenueTransaction.aggregate([
      { 
        $match: { 
          date: { $gte: start, $lte: end } 
        } 
      },
      {
        $group: {
          _id: '$sourceType',
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          sourceType: '$_id',
          total: 1,
          _id: 0
        }
      },
      {
        // Sort by sourceType for consistent display
        $sort: { sourceType: 1 }
      }
    ]);
    
    // Check if both "Court Rental" and "Rental" exist in the results
    // If so, merge them into a single "Rental" category
    const courtRentalIndex = revenueBySource.findIndex(item => item.sourceType === 'Court Rental');
    if (courtRentalIndex !== -1) {
      const rentalIndex = revenueBySource.findIndex(item => item.sourceType === 'Rental');
      
      if (rentalIndex !== -1) {
        // Add Court Rental amount to Rental
        revenueBySource[rentalIndex].total += revenueBySource[courtRentalIndex].total;
        // Remove Court Rental entry
        revenueBySource.splice(courtRentalIndex, 1);
      } else {
        // Just rename Court Rental to Rental
        revenueBySource[courtRentalIndex].sourceType = 'Rental';
      }
    }
    
    // Check if both "Registration" and "Registration Renewal" exist in the results
    // If so, merge them into a single "Registration" category
    const registrationRenewalIndex = revenueBySource.findIndex(item => item.sourceType === 'Registration Renewal');
    if (registrationRenewalIndex !== -1) {
      const registrationIndex = revenueBySource.findIndex(item => item.sourceType === 'Registration');
      
      if (registrationIndex !== -1) {
        // Add Registration Renewal amount to Registration
        revenueBySource[registrationIndex].total += revenueBySource[registrationRenewalIndex].total;
        // Remove Registration Renewal entry
        revenueBySource.splice(registrationRenewalIndex, 1);
      } else {
        // Just rename Registration Renewal to Registration
        revenueBySource[registrationRenewalIndex].sourceType = 'Registration';
      }
    }

    // Get expenses by type
    const expensesByType = await ExpenseTransaction.aggregate([
      { 
        $match: { 
          date: { $gte: start, $lte: end },
          paymentStatus: 'Paid'
        } 
      },
      {
        $group: {
          _id: '$expenseType',
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          expenseType: '$_id',
          total: 1,
          _id: 0
        }
      }
    ]);

    // Get monthly revenue data (for charts)
    const monthlyRevenue = await RevenueTransaction.aggregate([
      { 
        $match: { 
          date: { $gte: start, $lte: end } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          date: {
            $dateToString: { 
              format: '%Y-%m', 
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          },
          total: 1,
          _id: 0
        }
      }
    ]);

    // Get monthly expense data (for charts)
    const monthlyExpenses = await ExpenseTransaction.aggregate([
      { 
        $match: { 
          date: { $gte: start, $lte: end },
          paymentStatus: 'Paid'
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          date: {
            $dateToString: { 
              format: '%Y-%m', 
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          },
          total: 1,
          _id: 0
        }
      }
    ]);

    // Prepare the response data
    const dashboardData = {
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      totalExpenses: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      netRevenue: (totalRevenue.length > 0 ? totalRevenue[0].total : 0) - 
                  (totalExpenses.length > 0 ? totalExpenses[0].total : 0),
      revenueBySource,
      expensesByType,
      monthlyRevenue,
      monthlyExpenses
    };

    return ApiResponse.success(res, dashboardData);
  } catch (error) {
    console.error('Error getting revenue dashboard data:', error);
    return ApiResponse.error(res, 'Error getting revenue dashboard data', 500);
  }
};

// @desc    Get revenue transactions with pagination and filters
// @route   GET /api/revenue/transactions
// @access  Revenue Manager, Admin, Accounting
exports.getRevenueTransactions = async (req, res) => {
  try {
    // Use quick sync for better performance
    await quickSyncNewTransactions();
    
    const { startDate, endDate, sourceType, limit = 20, page = 1 } = req.query;
    
    // Build query object
    const query = {};
    
    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    // Source type filter
    if (sourceType) {
      query.sourceType = sourceType;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await RevenueTransaction.countDocuments(query);
    
    // Get transactions with pagination
    const transactions = await RevenueTransaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName');
    
    // Calculate total amount from filtered transactions
    const totalAmount = await RevenueTransaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    return ApiResponse.success(res, {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
    });
  } catch (error) {
    console.error('Error getting revenue transactions:', error);
    return ApiResponse.error(res, 'Error getting revenue transactions', 500);
  }
};

// @desc    Get expense transactions
// @route   GET /api/revenue/expenses
// @access  Revenue Manager, Admin
exports.getExpenseTransactions = async (req, res) => {
  try {
    // Sync transactions from other sources
    await syncTransactionsFromSources();
    
    const { startDate, endDate, expenseType, paymentStatus, sportType, limit = 20, page = 1 } = req.query;
    
    // Build query object
    const query = {};
    
    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    // Expense type filter
    if (expenseType) {
      query.expenseType = expenseType;
    }
    
    // Sport type filter (for utility bills only)
    if (expenseType === 'Utility' && sportType) {
      if (sportType === 'General') {
        // For General sport type, we need to match transactions where:
        // 1. Notes field does NOT contain "Sport:" (older records created before this feature)
        // 2. OR notes field explicitly contains "Sport: General"
        query.$or = [
          { notes: { $not: /Sport:/ } },
          { notes: new RegExp(`Sport: General\\b`, 'i') }
        ];
      } else {
        // For other sport types, match the specific sport in notes field
        query.notes = new RegExp(`Sport: ${sportType}\\b`, 'i');
      }
    }
    
    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await ExpenseTransaction.countDocuments(query);
    
    // Get transactions with pagination
    const transactions = await ExpenseTransaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName')
      .populate('paidBy', 'firstName lastName');
    
    // Calculate total amount from filtered transactions
    const totalAmount = await ExpenseTransaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    return ApiResponse.success(res, {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
    });
  } catch (error) {
    console.error('Error getting expense transactions:', error);
    return ApiResponse.error(res, 'Error getting expense transactions', 500);
  }
};

// @desc    Update expense payment status
// @route   PUT /api/revenue/expenses/:id/status
// @access  Revenue Manager, Admin
exports.updateExpenseStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 400);
    }

    const { paymentStatus } = req.body;
    
    // Find the expense transaction
    const expense = await ExpenseTransaction.findById(req.params.id);
    if (!expense) {
      return ApiResponse.error(res, 'Expense transaction not found', 404);
    }
    
    // Update status
    expense.paymentStatus = paymentStatus;
    
    // If marked as paid, set paid date and user
    if (paymentStatus === 'Paid' && expense.paymentStatus !== 'Paid') {
      expense.paidDate = new Date();
      expense.paidBy = req.user.id;
    }
    
    await expense.save();
    
    return ApiResponse.success(res, expense, 'Expense payment status updated successfully');
  } catch (error) {
    console.error('Error updating expense status:', error);
    return ApiResponse.error(res, 'Error updating expense status', 500);
  }
};

// @desc    Add custom revenue transaction
// @route   POST /api/revenue/transactions
// @access  Revenue Manager, Admin, Accounting
exports.addRevenueTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 400);
    }

    const { amount, sourceType, description, date, notes } = req.body;
    
    // For custom revenue entries, create or use an existing source type
    let sourceId;
    if (sourceType === 'Other') {
      // Check if we have a source type with this description
      let revenueSourceType = await RevenueSourceType.findOne({ 
        name: description || 'Other Revenue' 
      });
      
      // If not, create one
      if (!revenueSourceType) {
        revenueSourceType = new RevenueSourceType({
          name: description || 'Other Revenue',
          description: notes || 'Custom revenue entry',
          createdBy: req.user.id
        });
        await revenueSourceType.save();
      }
      
      sourceId = revenueSourceType._id;
    }
    
    // Create the revenue transaction
    const revenueTransaction = new RevenueTransaction({
      amount,
      sourceType,
      sourceId: sourceId || null,
      sourceModel: 'RevenueSourceType',
      description,
      date: date || new Date(),
      createdBy: req.user.id,
      notes
    });
    
    await revenueTransaction.save();
    
    return ApiResponse.success(
      res, 
      revenueTransaction, 
      'Revenue transaction added successfully',
      201
    );
  } catch (error) {
    console.error('Error adding revenue transaction:', error);
    return ApiResponse.error(res, 'Error adding revenue transaction', 500);
  }
};

// @desc    Add custom expense transaction
// @route   POST /api/revenue/expenses
// @access  Revenue Manager, Admin
exports.addExpenseTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 400);
    }

    const { amount, expenseType, description, date, paymentStatus, notes } = req.body;
    
    // For custom expense entries, create or use an existing expense type
    let expenseId;
    if (expenseType === 'Other') {
      // Check if we have an expense type with this description
      let expenseTypeEntry = await ExpenseType.findOne({ 
        name: description || 'Other Expense' 
      });
      
      // If not, create one
      if (!expenseTypeEntry) {
        expenseTypeEntry = new ExpenseType({
          name: description || 'Other Expense',
          description: notes || 'Custom expense entry',
          createdBy: req.user.id
        });
        await expenseTypeEntry.save();
      }
      
      expenseId = expenseTypeEntry._id;
    }
    
    // Create the expense transaction
    const expenseTransaction = new ExpenseTransaction({
      amount,
      expenseType,
      expenseId: expenseId || null,
      expenseModel: 'ExpenseType',
      description,
      date: date || new Date(),
      paymentStatus: paymentStatus || 'Pending',
      createdBy: req.user.id,
      notes,
      // Set paid date and user if status is Paid
      paidDate: paymentStatus === 'Paid' ? new Date() : null,
      paidBy: paymentStatus === 'Paid' ? req.user.id : null
    });
    
    await expenseTransaction.save();
    
    return ApiResponse.success(
      res, 
      expenseTransaction, 
      'Expense transaction added successfully',
      201
    );
  } catch (error) {
    console.error('Error adding expense transaction:', error);
    return ApiResponse.error(res, 'Error adding expense transaction', 500);
  }
};

// Fix inconsistent revenue source types in the database
const fixRevenueSourceTypes = async () => {
  try {
    console.log('Checking for inconsistent revenue source types...');
    
    // Update all "Court Rental" transactions to "Rental"
    const updateResult = await RevenueTransaction.updateMany(
      { sourceType: 'Court Rental' },
      { $set: { sourceType: 'Rental' } }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log(`Fixed ${updateResult.modifiedCount} revenue transactions with incorrect sourceType`);
    } else {
      console.log('No inconsistent revenue source types found');
    }
  } catch (error) {
    console.error('Error fixing revenue source types:', error);
  }
};

// Run the fix during application startup to ensure data consistency
fixRevenueSourceTypes();

// Remove revenue transactions that don't have a corresponding source record
const cleanOrphanedTransactions = async () => {
  try {
    console.log('Checking for orphaned revenue transactions...');
    
    // Use the models already imported at the top of the file
    const GuestBooking = require('../models/GuestBooking');
    
    // Get all revenue transactions
    const transactions = await RevenueTransaction.find();
    let removedCount = 0;
    
    for (const transaction of transactions) {
      let sourceExists = false;
      
      // Skip transactions with no sourceModel or sourceId
      if (!transaction.sourceModel || !transaction.sourceId) {
        continue;
      }
      
      // Check if the source record exists based on sourceModel
      switch (transaction.sourceModel) {
        case 'Booking':
          sourceExists = await Booking.exists({ _id: transaction.sourceId });
          break;
        case 'GuestBooking':
          sourceExists = await GuestBooking.exists({ _id: transaction.sourceId });
          break;
        case 'PlayerRegistration':
          sourceExists = await PlayerRegistration.exists({ _id: transaction.sourceId });
          break;
        case 'CafeteriaOrder':
          sourceExists = await CafeteriaOrder.exists({ _id: transaction.sourceId });
          break;
        case 'RegistrationRenewal':
          sourceExists = await RegistrationRenewal.exists({ _id: transaction.sourceId });
          break;
        default:
          // For unknown sourceModel, keep the transaction
          sourceExists = true;
      }
      
      // If source doesn't exist, remove the transaction
      if (!sourceExists) {
        console.log(`Removing orphaned transaction ${transaction._id} with sourceModel ${transaction.sourceModel} and sourceId ${transaction.sourceId}`);
        await RevenueTransaction.deleteOne({ _id: transaction._id });
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} orphaned revenue transactions`);
    } else {
      console.log('No orphaned revenue transactions found');
    }
  } catch (error) {
    console.error('Error cleaning orphaned transactions:', error);
  }
};

// Remove expense transactions that don't have a corresponding source record
const cleanOrphanedExpenseTransactions = async () => {
  try {
    console.log('Checking for orphaned expense transactions...');
    
    // Use the models already imported at the top of the file
    const UtilityBill = require('../models/UtilityBill');
    
    // Get all expense transactions
    const transactions = await ExpenseTransaction.find();
    let removedCount = 0;
    
    for (const transaction of transactions) {
      let sourceExists = false;
      
      // Skip transactions with no expenseModel or expenseId
      if (!transaction.expenseModel || !transaction.expenseId) {
        continue;
      }
      
      // Check if the source record exists based on expenseModel
      switch (transaction.expenseModel) {
        case 'UtilityBill':
          sourceExists = await UtilityBill.exists({ _id: transaction.expenseId });
          break;
        case 'SalaryInvoice':
          sourceExists = await SalaryInvoice.exists({ _id: transaction.expenseId });
          break;
        default:
          // For unknown expenseModel, keep the transaction
          sourceExists = true;
      }
      
      // If source doesn't exist, remove the transaction
      if (!sourceExists) {
        console.log(`Removing orphaned expense transaction ${transaction._id} with expenseModel ${transaction.expenseModel} and expenseId ${transaction.expenseId}`);
        await ExpenseTransaction.deleteOne({ _id: transaction._id });
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} orphaned expense transactions`);
    } else {
      console.log('No orphaned expense transactions found');
    }
  } catch (error) {
    console.error('Error cleaning orphaned expense transactions:', error);
  }
}; 

// @desc    Get daily accounting report
// @route   GET /api/revenue/daily-report
// @access  Revenue Manager, Admin, Accounting
exports.getDailyAccountingReport = async (req, res) => {
  try {
    const { date } = req.query;
    const currentUserId = req.user.id;
    
    // If no date provided, use today's date
    const reportDate = date ? new Date(date) : new Date();
    
    // Set time to start and end of day
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get utility bills paid on this date by the current accounting user
    const utilityBills = await UtilityBill.find({
      paidDate: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'Paid',
      paidBy: currentUserId
    }).populate('paidBy', 'firstName lastName email');

    // Get salary invoices paid on this date by the current accounting user
    const salaryInvoices = await SalaryInvoice.find({
      paidDate: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'Paid',
      issuedBy: currentUserId
    }).populate('userId', 'firstName lastName email role')
      .populate('issuedBy', 'firstName lastName');

    // Get player registrations processed on this date by the current accounting user
    const playerRegistrations = await PlayerRegistration.find({
      'fee.paymentStatus': 'Paid',
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      registeredBy: currentUserId
    }).populate('registeredBy', 'firstName lastName email');

    // Get single session fees processed on this date by the current accounting user
    const singleSessionRevenueTransactions = await RevenueTransaction.find({
      sourceType: 'Registration',
      date: { $gte: startOfDay, $lte: endOfDay },
      description: { $regex: /Single session payment/i },
      createdBy: currentUserId
    });

    // Get registration renewals processed on this date by the current accounting user
    const registrationRenewals = await RegistrationRenewal.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      renewedBy: currentUserId,
      status: 'Completed'
    }).populate('renewedBy', 'firstName lastName email')
      .populate('originalRegistration', 'player');

    // Calculate totals
    // Expenses (should be subtracted)
    const utilityBillsTotal = utilityBills.reduce((sum, bill) => sum + bill.amount, 0);
    const salaryInvoicesTotal = salaryInvoices.reduce((sum, invoice) => sum + invoice.amount + (invoice.bonus || 0), 0);
    
    // Revenue (should be added)
    const playerRegistrationsTotal = playerRegistrations.reduce((sum, reg) => sum + reg.fee.amount, 0);
    const singleSessionFeesTotal = singleSessionRevenueTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const registrationRenewalsTotal = registrationRenewals.reduce((sum, renewal) => sum + renewal.fee.amount, 0);

    // Calculate grand total: Revenue (positive) - Expenses (negative)
    const revenueTotal = playerRegistrationsTotal + singleSessionFeesTotal + registrationRenewalsTotal;
    const expenseTotal = utilityBillsTotal + salaryInvoicesTotal;
    const grandTotal = revenueTotal - expenseTotal;

    // Prepare the response data
    const dailyReport = {
      date: reportDate.toISOString().split('T')[0],
      accountant: {
        id: currentUserId,
        name: req.user.firstName + ' ' + req.user.lastName,
        role: req.user.role
      },
      summary: {
        utilityBills: {
          count: utilityBills.length,
          total: utilityBillsTotal
        },
        salaryInvoices: {
          count: salaryInvoices.length,
          total: salaryInvoicesTotal
        },
        playerRegistrations: {
          count: playerRegistrations.length,
          total: playerRegistrationsTotal
        },
        singleSessionFees: {
          count: singleSessionRevenueTransactions.length,
          total: singleSessionFeesTotal
        },
        registrationRenewals: {
          count: registrationRenewals.length,
          total: registrationRenewalsTotal
        },
        revenueTotal,
        expenseTotal,
        grandTotal
      },
      details: {
        utilityBills,
        salaryInvoices,
        playerRegistrations,
        singleSessionFees: singleSessionRevenueTransactions,
        registrationRenewals
      }
    };

    return ApiResponse.success(res, dailyReport);
  } catch (error) {
    console.error('Error getting daily accounting report:', error);
    return ApiResponse.error(res, 'Error getting daily accounting report', 500);
  }
};

// @desc    Force full synchronization of all transactions
// @route   POST /api/revenue/sync
// @access  Revenue Manager, Admin, Accounting
exports.forceSyncTransactions = async (req, res) => {
  try {
    console.log('Force sync requested by user...');
    await syncTransactionsFromSources();
    await cleanOrphanedTransactions();
    await cleanOrphanedExpenseTransactions();
    
    return ApiResponse.success(res, { message: 'Full synchronization completed successfully' });
  } catch (error) {
    console.error('Error in force sync:', error);
    return ApiResponse.error(res, 'Error during synchronization', 500);
  }
};

module.exports = {
  getDashboardData: exports.getDashboardData,
  getRevenueTransactions: exports.getRevenueTransactions,
  addRevenueTransaction: exports.addRevenueTransaction,
  updateExpenseStatus: exports.updateExpenseStatus,
  getExpenseTransactions: exports.getExpenseTransactions,
  addExpenseTransaction: exports.addExpenseTransaction,
  getDailyAccountingReport: exports.getDailyAccountingReport,
  forceSyncTransactions: exports.forceSyncTransactions
}; 