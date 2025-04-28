const CafeteriaItem = require('../models/CafeteriaItem');
const CafeteriaOrder = require('../models/CafeteriaOrder');
const CafeteriaSettings = require('../models/CafeteriaSettings');
const CafeSessionSummary = require('../models/CafeSessionSummary');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');

// @desc    Create a new cafeteria item
// @route   POST /api/cafeteria/items
// @access  Private (Supervisor)
exports.createItem = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    const newItem = new CafeteriaItem({
      name,
      description,
      price,
      category,
      stock,
      createdBy: req.user.id
    });

    // Handle image upload if present
    if (req.file) {
      newItem.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const item = await newItem.save();
    return ApiResponse.success(res, item, 'Item created successfully', 201);
  } catch (error) {
    console.error('Error creating cafeteria item:', error);
    return ApiResponse.error(res, 'Error creating cafeteria item', 500);
  }
};

// @desc    Get all cafeteria items
// @route   GET /api/cafeteria/items
// @access  Public
exports.getItems = async (req, res) => {
  try {
    const items = await CafeteriaItem.find({ isAvailable: true })
      .sort({ category: 1, name: 1 });
    
    // Convert buffer image data to base64 format for each item
    const itemsWithFormattedImages = items.map(item => {
      const itemObj = item.toObject();
      
      if (itemObj.image && itemObj.image.data && itemObj.image.contentType) {
        const base64Data = itemObj.image.data.toString('base64');
        itemObj.image = `data:${itemObj.image.contentType};base64,${base64Data}`;
      }
      
      return itemObj;
    });
    
    return ApiResponse.success(res, itemsWithFormattedImages);
  } catch (error) {
    console.error('Error fetching cafeteria items:', error);
    return ApiResponse.error(res, 'Error fetching cafeteria items', 500);
  }
};

// @desc    Update a cafeteria item
// @route   PUT /api/cafeteria/items/:id
// @access  Private (Supervisor)
exports.updateItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, stock } = req.body;

    const item = await CafeteriaItem.findById(req.params.id);
    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    // Create update object
    const updateData = {
      name,
      description,
      price,
      category,
      isAvailable,
      stock
    };

    // Handle image upload if present
    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const updatedItem = await CafeteriaItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    return ApiResponse.success(res, updatedItem, 'Item updated successfully');
  } catch (error) {
    console.error('Error updating cafeteria item:', error);
    return ApiResponse.error(res, 'Error updating cafeteria item', 500);
  }
};

// @desc    Create a new order
// @route   POST /api/cafeteria/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, total, paymentMethod, paymentStatus, customer } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return ApiResponse.error(res, 'No items in order', 400);
    }

    // Validate and check stock, also collect item details
    const enrichedItems = [];
    for (const orderItem of items) {
      const cafeteriaItem = await CafeteriaItem.findById(orderItem.item);
      if (!cafeteriaItem) {
        return ApiResponse.error(res, `Item ${orderItem.item} not found`, 404);
      }

      if (!cafeteriaItem.isAvailable) {
        return ApiResponse.error(res, `Item ${cafeteriaItem.name} is not available`, 400);
      }

      if (cafeteriaItem.stock < orderItem.quantity) {
        return ApiResponse.error(res, `Insufficient stock for ${cafeteriaItem.name}`, 400);
      }

      // Update stock
      cafeteriaItem.stock -= orderItem.quantity;
      await cafeteriaItem.save();

      // Add item details to the order
      enrichedItems.push({
        item: cafeteriaItem._id,
        name: cafeteriaItem.name,
        category: cafeteriaItem.category,
        description: cafeteriaItem.description,
        quantity: orderItem.quantity,
        price: orderItem.price,
        subtotal: orderItem.subtotal
      });
    }

    // Create new order with enriched items
    const newOrder = new CafeteriaOrder({
      items: enrichedItems,
      total,
      paymentMethod,
      paymentStatus,
      customer,
      processedBy: req.user.id
    });

    const order = await newOrder.save();
    
    // Generate receipt data
    const cashier = await User.findById(req.user.id).select('firstName lastName');
    const receiptData = {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      total: order.total,
      paymentMethod: order.paymentMethod,
      cashier: cashier ? `${cashier.firstName} ${cashier.lastName}` : 'Unknown',
      customer: order.customer.name || 'Walk-in Customer'
    };
    
    // Save the receipt to database
    const CafeReceipt = require('../models/CafeReceipt');
    const receipt = new CafeReceipt({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      total: order.total,
      paymentMethod: order.paymentMethod,
      cashier: cashier ? `${cashier.firstName} ${cashier.lastName}` : 'Unknown',
      customer: order.customer.name || 'Walk-in Customer',
      cashierId: req.user.id
    });
    
    await receipt.save();
    
    // Include receipt data in the response
    return ApiResponse.success(
      res, 
      { ...order.toObject(), receipt: receiptData }, 
      'Order created successfully', 
      201
    );
  } catch (error) {
    console.error('Error creating cafeteria order:', error);
    return ApiResponse.error(res, 'Error creating cafeteria order', 500);
  }
};

// @desc    Get sales report
// @route   GET /api/cafeteria/reports/sales
// @access  Private (Supervisor)
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, type = 'daily' } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ApiResponse.error(res, 'Invalid date range', 400);
    }

    // Set time to start and end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const matchStage = {
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'Completed'
    };

    let groupStage = {};
    if (type === 'daily') {
      groupStage = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      };
    } else if (type === 'weekly') {
      groupStage = {
        $week: '$createdAt'
      };
    } else if (type === 'monthly') {
      groupStage = {
        $dateToString: { format: '%Y-%m', date: '$createdAt' }
      };
    }

    const report = await CafeteriaOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupStage,
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
          items: {
            $push: {
              items: '$items',
              total: '$total',
              paymentMethod: '$paymentMethod'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return ApiResponse.success(res, report);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return ApiResponse.error(res, 'Error generating sales report', 500);
  }
};

// @desc    Get order by ID
// @route   GET /api/cafeteria/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await CafeteriaOrder.findById(req.params.id)
      .populate('items.item', 'name price')
      .populate('processedBy', 'firstName lastName');

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    return ApiResponse.success(res, order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return ApiResponse.error(res, 'Error fetching order', 500);
  }
};

// @desc    Update order status
// @route   PUT /api/cafeteria/orders/:id/status
// @access  Private (Supervisor)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await CafeteriaOrder.findById(req.params.id);

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    return ApiResponse.success(res, order, 'Order status updated successfully');
  } catch (error) {
    console.error('Error updating order status:', error);
    return ApiResponse.error(res, 'Error updating order status', 500);
  }
};

// @desc    Get a cafeteria setting by name
// @route   GET /api/cafeteria/settings/:settingName
// @access  Private
exports.getSettingByName = async (req, res) => {
  try {
    const { settingName } = req.params;
    
    const setting = await CafeteriaSettings.findOne({ settingName });
    
    if (!setting) {
      return ApiResponse.success(res, { settingName, exists: false });
    }
    
    return ApiResponse.success(res, { 
      settingName, 
      exists: true,
      value: setting.stringValue || setting.numberValue || setting.booleanValue 
    });
  } catch (error) {
    console.error('Error fetching cafeteria setting:', error);
    return ApiResponse.error(res, 'Error fetching cafeteria setting', 500);
  }
};

// @desc    Update a cafeteria setting
// @route   PUT /api/cafeteria/settings/:settingName
// @access  Private (Supervisor)
exports.updateSetting = async (req, res) => {
  try {
    const { settingName } = req.params;
    const { value, type = 'string' } = req.body;
    
    if (!value && value !== false && value !== 0) {
      return ApiResponse.error(res, 'Setting value is required', 400);
    }
    
    // Determine which field to update based on the type
    const updateData = {};
    if (type === 'string') {
      updateData.stringValue = value;
      updateData.numberValue = null;
      updateData.booleanValue = null;
    } else if (type === 'number') {
      updateData.stringValue = null;
      updateData.numberValue = value;
      updateData.booleanValue = null;
    } else if (type === 'boolean') {
      updateData.stringValue = null;
      updateData.numberValue = null;
      updateData.booleanValue = value;
    } else {
      return ApiResponse.error(res, 'Invalid setting type', 400);
    }
    
    // Add the user who updated it
    updateData.updatedBy = req.user.id;
    
    // Find and update or create if it doesn't exist
    const setting = await CafeteriaSettings.findOneAndUpdate(
      { settingName },
      updateData,
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    // If this is a new setting, set the creator
    if (setting.createdBy === undefined) {
      setting.createdBy = req.user.id;
      await setting.save();
    }
    
    return ApiResponse.success(res, { 
      settingName, 
      value: setting.stringValue || setting.numberValue || setting.booleanValue 
    }, 'Setting updated successfully');
  } catch (error) {
    console.error('Error updating cafeteria setting:', error);
    return ApiResponse.error(res, 'Error updating cafeteria setting', 500);
  }
};

// @desc    Create a session summary
// @route   POST /api/cafeteria/sessions
// @access  Private
exports.createSessionSummary = async (req, res) => {
  try {
    const { 
      startTime, 
      endTime, 
      startingBalance, 
      totalSales, 
      finalBalance,
      startingStock,
      endingStock
    } = req.body;

    if (!startTime || !endTime || startingBalance === undefined || totalSales === undefined || finalBalance === undefined) {
      return ApiResponse.error(res, 'Missing required session data', 400);
    }

    const sessionSummary = new CafeSessionSummary({
      startTime,
      endTime,
      startingBalance,
      totalSales,
      finalBalance,
      cashier: req.user.id,
      startingStock: startingStock || [],
      endingStock: endingStock || []
    });

    const savedSummary = await sessionSummary.save();
    
    return ApiResponse.success(res, savedSummary, 'Session summary saved successfully', 201);
  } catch (error) {
    console.error('Error saving session summary:', error);
    return ApiResponse.error(res, 'Error saving session summary', 500);
  }
};

// @desc    Get all session summaries
// @route   GET /api/cafeteria/sessions
// @access  Private (Supervisor)
exports.getSessionSummaries = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination and populate cashier info
    const sessions = await CafeSessionSummary.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('cashier', 'firstName lastName email');
    
    // Get total count for pagination
    const total = await CafeSessionSummary.countDocuments(query);
    
    return ApiResponse.success(res, {
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching session summaries:', error);
    return ApiResponse.error(res, 'Error fetching session summaries', 500);
  }
};

// @desc    Get receipts for a session
// @route   GET /api/cafeteria/receipts
// @access  Private
exports.getReceipts = async (req, res) => {
  try {
    const { sessionId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    console.log('Getting receipts with query params:', req.query);
    console.log('User requesting receipts:', req.user.id, req.user.role);
    
    let query = {};
    
    // Filter by session if provided
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    // Filter by cashier (current user) if not admin
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      query.cashierId = req.user.id;
    }
    
    const CafeReceipt = require('../models/CafeReceipt');
    
    console.log('Final query:', query);
    
    // Get total count for pagination
    const total = await CafeReceipt.countDocuments(query);
    console.log('Total receipts found:', total);
    
    // Get receipts with pagination
    const receipts = await CafeReceipt.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('Receipts found:', receipts.length);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    // Create response data
    const responseData = {
      receipts,
      pagination: {
        total,
        page: parseInt(page),
        pages: totalPages,
        limit: parseInt(limit)
      }
    };
    
    console.log('Sending response with receipt count:', receipts.length);
    
    return ApiResponse.success(res, responseData);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return ApiResponse.error(res, 'Error fetching receipts: ' + error.message, 500);
  }
};

// @desc    Update receipts with session ID when session ends
// @route   PUT /api/cafeteria/receipts/session/:sessionId
// @access  Private
exports.updateReceiptsSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return ApiResponse.error(res, 'Session ID is required', 400);
    }
    
    const CafeReceipt = require('../models/CafeReceipt');
    
    // Find all receipts by this cashier without a session ID
    const result = await CafeReceipt.updateMany(
      { 
        cashierId: req.user.id,
        sessionId: { $exists: false }
      },
      { 
        $set: { sessionId } 
      }
    );
    
    return ApiResponse.success(res, {
      updated: result.nModified || result.modifiedCount
    }, 'Receipts updated successfully');
  } catch (error) {
    console.error('Error updating receipts session:', error);
    return ApiResponse.error(res, 'Error updating receipts session', 500);
  }
}; 