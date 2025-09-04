# Registration Renewal Feature

## Overview
This feature allows accountants to renew expired player registrations without requiring full registration and admin approval. This streamlines the renewal process for existing players whose registrations have expired.

## Key Features

### 1. **Expired Registration Management**
- View all expired registrations in a dedicated interface
- Filter by sport type
- Pagination support for large datasets
- Quick access to player information

### 2. **Streamlined Renewal & Extension Process**
- Select specific sports to renew (can be subset of original)
- **Add new sports** that weren't in the original registration
- Choose renewal period (1 Month, 3 Months, 6 Months, 1 Year)
- **Manual fee editing** - accountants can override calculated fees for discounts or special pricing
- Automatic fee calculation based on current registration fees (with manual override option)
- Visual indicators showing which sports were original vs. new
- Fee breakdown showing calculated vs. manual amounts
- No admin approval required - immediate processing

### 3. **Payment Integration**
- Support for multiple payment methods (Cash, Card, Bank Transfer, Other)
- Payment status tracking (Paid, Pending, Failed)
- Invoice and receipt number management
- Transaction ID tracking

### 4. **Renewal History & Tracking**
- Complete audit trail of all renewals
- View renewal details and history
- Cancel renewals if needed (with proper rollback)
- Print renewal details

## Technical Implementation

### Backend Components

#### 1. **RegistrationRenewal Model** (`server/models/RegistrationRenewal.js`)
- Stores renewal information separately from original registration
- Links to original registration and user account
- Tracks payment and processing information
- Maintains audit trail

#### 2. **Registration Renewal Controller** (`server/controllers/registrationRenewalController.js`)
- `GET /api/registration-renewals/expired` - Get expired registrations
- `GET /api/registration-renewals/fees` - Get registration fees
- `POST /api/registration-renewals` - Create new renewal
- `GET /api/registration-renewals` - List all renewals
- `GET /api/registration-renewals/:id` - Get renewal details
- `PUT /api/registration-renewals/:id/cancel` - Cancel renewal

#### 3. **API Routes** (`server/routes/index.js`)
- Protected routes with accounting role requirement
- Input validation and error handling
- Proper authentication middleware

### Frontend Components

#### 1. **RegistrationRenewalManagement** (`client/src/components/registration/RegistrationRenewalManagement.js`)
- Main management interface with tabbed view
- Expired registrations list with renewal actions
- Renewals history and tracking
- Pagination and filtering support

#### 2. **RegistrationRenewalForm** (`client/src/components/registration/RegistrationRenewalForm.js`)
- Modal form for creating renewals
- Sport selection with fee calculation
- Payment information input
- Date picker for renewal period

#### 3. **RenewalDetailsDialog** (`client/src/components/registration/RenewalDetailsDialog.js`)
- Detailed view of renewal information
- Print functionality
- Cancel renewal option
- Complete audit information

#### 4. **Service Layer** (`client/src/services/registrationRenewalService.js`)
- API communication functions
- Error handling and response processing
- Type-safe service methods

## User Workflow

### For Accountants:

1. **Access Renewal Management**
   - Navigate to "Registration Renewals" from the sidebar
   - View expired registrations in the first tab

2. **Process Renewal & Extension**
   - Click "Renew/Extend" button for an expired registration
   - Select sports to renew (can be subset of original)
   - **Add new sports** that weren't in the original registration
   - Choose renewal period
   - Review calculated fees (shows fees for all selected sports)
   - **Edit total fee manually** if needed (click "Edit" button for discounts/special pricing)
   - Enter payment information
   - Add any notes
   - Submit renewal

3. **Track Renewals**
   - Switch to "Renewals" tab to view all processed renewals
   - Click on any renewal to view detailed information
   - Print renewal details if needed
   - Cancel renewal if necessary

### For Players:
- Receive automatic notifications when their registration is renewed
- Can view their renewed registration status in their dashboard

### For Admins:
- Receive notifications about all renewals processed
- Can view renewal history and details
- Can cancel renewals if needed

## Security & Permissions

- **Accounting Role Required**: Only users with 'accounting' role can access renewal features
- **Input Validation**: All inputs are validated on both frontend and backend
- **Audit Trail**: Complete tracking of who processed what renewal when
- **Data Integrity**: Original registration data is preserved and extended

## Database Schema

### RegistrationRenewal Collection
```javascript
{
  originalRegistration: ObjectId, // Reference to original registration
  userId: ObjectId,              // Reference to user account
  player: {                      // Player info snapshot
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String
  },
  sports: [String],              // Sports being renewed
  registrationPeriod: String,    // Renewal period
  startDate: Date,              // Renewal start date
  endDate: Date,                // Calculated end date
  fee: {                        // Payment information
    amount: Number,
    currency: String,
    paymentMethod: String,
    paymentStatus: String,
    receiptNumber: String,
    transactionId: String,
    invoiceNumber: String
  },
  renewedBy: ObjectId,          // Who processed the renewal
  status: String,               // 'Completed' or 'Cancelled'
  notes: String,                // Additional notes
  createdAt: Date,
  updatedAt: Date
}
```

## Integration Points

### 1. **Registration System**
- Extends existing PlayerRegistration model
- Updates original registration end date
- Maintains relationship between original and renewal

### 2. **Notification System**
- Sends notifications to players, admins, and supervisors
- Uses existing notification infrastructure
- Tracks notification delivery

### 3. **Fee Management**
- Integrates with existing RegistrationFee model
- Uses current fee structure for calculations
- Supports multiple sports and periods

### 4. **User Management**
- Works with existing User model
- Requires user account to exist for renewal
- Maintains user relationship

## Benefits

1. **Streamlined Process**: No admin approval needed for renewals
2. **Faster Processing**: Immediate renewal processing
3. **Better User Experience**: Quick renewal for existing players
4. **Audit Trail**: Complete tracking of all renewal activities
5. **Maximum Flexibility**: Can renew subset of sports, all sports, or add new sports
6. **Visual Clarity**: Clear indicators showing original vs. new sports
7. **Fee Flexibility**: Manual fee editing for discounts, special pricing, or adjustments
8. **Integration**: Seamlessly works with existing systems

## Future Enhancements

1. **Bulk Renewal**: Process multiple renewals at once
2. **Auto-Renewal**: Automatic renewal for players with recurring payments
3. **Email Notifications**: Send renewal confirmations via email
4. **Renewal Reminders**: Proactive reminders before expiration
5. **Analytics**: Renewal statistics and reporting
6. **Mobile Support**: Mobile-optimized renewal interface

## Testing

The feature includes comprehensive error handling and validation:
- Input validation on both frontend and backend
- Proper error messages for all failure scenarios
- Loading states and user feedback
- Confirmation dialogs for destructive actions

## Deployment Notes

1. **Database Migration**: No migration needed - new collection will be created automatically
2. **Environment Variables**: No new environment variables required
3. **Dependencies**: Uses existing dependencies, no new packages needed
4. **Backward Compatibility**: Fully backward compatible with existing system
