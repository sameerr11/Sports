const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
const { auth, supervisor } = require('../middleware/auth');
const cafeteriaController = require('../controllers/cafeteriaController');

// Item routes
router.post(
  '/items',
  [
    auth,
    supervisor,
    upload.single('image'),
    check('name', 'Name is required').not().isEmpty(),
    check('price', 'Price is required and must be a number').isNumeric(),
    check('category', 'Category is required').isIn(['Food', 'Beverage', 'Snack', 'Other']),
    check('stock', 'Stock must be a number').optional().isNumeric()
  ],
  cafeteriaController.createItem
);

router.get('/items', cafeteriaController.getItems);

router.put(
  '/items/:id',
  [
    auth,
    supervisor,
    upload.single('image'),
    check('name', 'Name is required').optional().not().isEmpty(),
    check('price', 'Price must be a number').optional().isNumeric(),
    check('category', 'Invalid category').optional().isIn(['Food', 'Beverage', 'Snack', 'Other']),
    check('stock', 'Stock must be a number').optional().isNumeric()
  ],
  cafeteriaController.updateItem
);

// Order routes
router.post(
  '/orders',
  [
    auth,
    check('items', 'Items are required').isArray({ min: 1 }),
    check('items.*.itemId', 'Item ID is required').not().isEmpty(),
    check('items.*.quantity', 'Quantity must be a positive number').isInt({ min: 1 }),
    check('paymentMethod', 'Payment method is required').isIn(['Cash', 'Card', 'Mobile'])
  ],
  cafeteriaController.createOrder
);

router.get('/orders/:id', auth, cafeteriaController.getOrderById);

router.put(
  '/orders/:id/status',
  [
    auth,
    supervisor,
    check('paymentStatus', 'Invalid payment status').isIn(['Pending', 'Completed', 'Failed', 'Refunded'])
  ],
  cafeteriaController.updateOrderStatus
);

// Receipt routes
router.get('/receipts', auth, cafeteriaController.getReceipts);
router.put('/receipts/session/:sessionId', auth, cafeteriaController.updateReceiptsSession);

// Report routes
router.get(
  '/reports/sales',
  [
    auth,
    supervisor,
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty(),
    check('type', 'Invalid report type').optional().isIn(['daily', 'weekly', 'monthly'])
  ],
  cafeteriaController.getSalesReport
);

// Settings routes
router.get(
  '/settings/:settingName',
  auth,
  cafeteriaController.getSettingByName
);

router.put(
  '/settings/:settingName',
  [
    auth,
    supervisor,
    check('value', 'Setting value is required').exists(),
    check('type', 'Invalid setting type').optional().isIn(['string', 'number', 'boolean'])
  ],
  cafeteriaController.updateSetting
);

// Session routes
router.post(
  '/sessions',
  [
    auth,
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty(),
    check('startingBalance', 'Starting balance is required').isNumeric(),
    check('totalSales', 'Total sales is required').isNumeric(),
    check('finalBalance', 'Final balance is required').isNumeric()
  ],
  cafeteriaController.createSessionSummary
);

router.get(
  '/sessions',
  [
    auth,
    supervisor
  ],
  cafeteriaController.getSessionSummaries
);

module.exports = router; 