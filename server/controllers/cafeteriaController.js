const CafeteriaItem = require('../models/CafeteriaItem');
const CafeteriaOrder = require('../models/CafeteriaOrder');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Create a new cafeteria item
// @route   POST /api/cafeteria/items
// @access  Private (Supervisor)
exports.createItem = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    const newItem = new CafeteriaItem({
      name,
      description,
      price,
      category,
      image,
      stock,
      createdBy: req.user.id
    });

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
    return ApiResponse.success(res, items);
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
    const { name, description, price, category, image, isAvailable, stock } = req.body;

    const item = await CafeteriaItem.findById(req.params.id);
    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    const updatedItem = await CafeteriaItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        category,
        image,
        isAvailable,
        stock
      },
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
    const { items, paymentMethod, customer } = req.body;

    // Validate and calculate totals
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const cafeteriaItem = await CafeteriaItem.findById(item.itemId);
      if (!cafeteriaItem) {
        return ApiResponse.error(res, `Item ${item.itemId} not found`, 404);
      }

      if (!cafeteriaItem.isAvailable) {
        return ApiResponse.error(res, `Item ${cafeteriaItem.name} is not available`, 400);
      }

      if (cafeteriaItem.stock < item.quantity) {
        return ApiResponse.error(res, `Insufficient stock for ${cafeteriaItem.name}`, 400);
      }

      const subtotal = cafeteriaItem.price * item.quantity;
      total += subtotal;

      orderItems.push({
        item: cafeteriaItem._id,
        quantity: item.quantity,
        price: cafeteriaItem.price,
        subtotal
      });

      // Update stock
      cafeteriaItem.stock -= item.quantity;
      await cafeteriaItem.save();
    }

    const newOrder = new CafeteriaOrder({
      items: orderItems,
      total,
      paymentMethod,
      customer,
      processedBy: req.user.id
    });

    const order = await newOrder.save();
    const populatedOrder = await CafeteriaOrder.findById(order._id)
      .populate('items.item', 'name price')
      .populate('processedBy', 'firstName lastName');

    return ApiResponse.success(res, populatedOrder, 'Order created successfully', 201);
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