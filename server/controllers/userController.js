const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @desc    Register a new user
// @route   POST /api/users
// @access  Admin
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  console.log('Register user request body:', req.body);
  const { firstName, lastName, email, password, role, phoneNumber, address, parentId, supervisorType, supervisorSportTypes, birthDate } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Validate role
    const validRoles = ['admin', 'supervisor', 'coach', 'player', 'parent', 'cashier', 'support', 'accounting', 'revenue_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: 'Invalid role selected' });
    }

    // Create new user object
    const userFields = {
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      address,
      birthDate
    };
    
    // Add supervisor specific fields if role is supervisor
    if (role === 'supervisor') {
      userFields.supervisorType = supervisorType || 'general';
      
      if (supervisorType === 'sports' && Array.isArray(supervisorSportTypes)) {
        userFields.supervisorSportTypes = supervisorSportTypes;
      }
    }
    
    // Only set parentId if it exists and is not empty string
    if (parentId && parentId.trim() !== '') {
      userFields.parentId = parentId;
      console.log(`Setting parentId to: ${parentId}`);
    }

    user = new User(userFields);
    await user.save();
    console.log('New user created:', { id: user._id, email: user.email, role: user.role, parentId: user.parentId });

    // Create notifications - separated to prevent notification failures from breaking user creation
    try {
      // Create notification for supervisors if new player registration
      if (role === 'player') {
        // Define the player's sports if provided in the request
        const playerSports = req.body.sports || [];
        
        // Get all general supervisors and admin users (they always receive notifications)
        const generalSupervisors = await User.find({
          $or: [
            { role: 'supervisor', supervisorType: 'general' },
            { role: 'admin' }
          ]
        });
        
        // Create notifications for general supervisors and admins
        for (const supervisor of generalSupervisors) {
          const notification = new Notification({
            recipient: supervisor._id,
            type: 'new_registration',
            title: 'New Player Registration',
            message: `${firstName} ${lastName} has registered as a new player.`,
            relatedTo: {
              model: 'User',
              id: user._id
            }
          });
          
          await notification.save();
        }
        
        // Get sports supervisors
        const sportsSupervisors = await User.find({ 
          role: 'supervisor',
          supervisorType: 'sports'
        });
        
        // Only notify sports supervisors if their assigned sports match the player's sports
        // If player sports are not specified, notify all sports supervisors
        for (const supervisor of sportsSupervisors) {
          // If no player sports defined or if supervisor has no assigned sports, send notification
          if (!playerSports.length || !supervisor.supervisorSportTypes || !supervisor.supervisorSportTypes.length) {
            const notification = new Notification({
              recipient: supervisor._id,
              type: 'new_registration',
              title: 'New Player Registration',
              message: `${firstName} ${lastName} has registered as a new player.`,
              relatedTo: {
                model: 'User',
                id: user._id
              }
            });
            
            await notification.save();
          } 
          // Otherwise, check if there's an overlap between player sports and supervisor sports
          else if (playerSports.some(sport => supervisor.supervisorSportTypes.includes(sport))) {
            const notification = new Notification({
              recipient: supervisor._id,
              type: 'new_registration',
              title: 'New Player Registration',
              message: `${firstName} ${lastName} has registered as a new player for ${playerSports.join(', ')}.`,
              relatedTo: {
                model: 'User',
                id: user._id
              }
            });
            
            await notification.save();
          }
        }
        
        // Also notify support users
        const supportUsers = await User.find({ role: 'support' });
        
        for (const supportUser of supportUsers) {
          const notification = new Notification({
            recipient: supportUser._id,
            type: 'new_registration',
            title: 'New Player Registration',
            message: `${firstName} ${lastName} has registered as a new player.`,
            relatedTo: {
              model: 'User',
              id: user._id
            }
          });
          
          await notification.save();
        }
        
        // If parentId is provided, create notification for the parent
        if (userFields.parentId) {
          const parent = await User.findById(userFields.parentId);
          if (parent) {
            const notification = new Notification({
              recipient: parent._id,
              type: 'child_account_linked',
              title: 'Child Account Linked',
              message: `Your account has been linked to ${firstName} ${lastName}.`,
              relatedTo: {
                model: 'User',
                id: user._id
              }
            });
            
            await notification.save();
          }
        }
      }
    } catch (notificationError) {
      // Log notification error but don't fail the whole request
      console.error('Error creating notifications:', notificationError);
      // We'll still return the created user without failing
    }

    // Return user without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin, Support (with restrictions)
exports.updateUser = async (req, res) => {
  console.log('Update user request body:', req.body);
  const { firstName, lastName, email, role, phoneNumber, address, isActive, parentId, supervisorType, supervisorSportTypes, birthDate } = req.body;

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if support staff is trying to update non-player account
    if (req.user.role === 'support' && user.role !== 'player') {
      return res.status(403).json({ msg: 'Support staff can only update player accounts' });
    }

    // Build user object based on requester role
    const userFields = {};
    
    // Support staff can only update contact details of players
    if (req.user.role === 'support') {
      if (phoneNumber) userFields.phoneNumber = phoneNumber;
      if (address) userFields.address = address;
      
      // Support cannot change roles, status, email, or parent associations
    } else {
      // Admin can update everything
      if (firstName) userFields.firstName = firstName;
      if (lastName) userFields.lastName = lastName;
      if (email) userFields.email = email;
      if (birthDate) userFields.birthDate = birthDate;
      
      // Validate role if provided
      if (role) {
        const validRoles = ['admin', 'supervisor', 'coach', 'player', 'parent', 'cashier', 'support', 'accounting'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ msg: 'Invalid role selected' });
        }
        userFields.role = role;
      }
      
      if (phoneNumber) userFields.phoneNumber = phoneNumber;
      if (address) userFields.address = address;
      if (isActive !== undefined) userFields.isActive = isActive;
      
      // Handle parentId - Set it if provided as non-empty string, otherwise set to null if explicitly provided
      if (parentId !== undefined) {
        if (parentId && parentId.trim()) {
          userFields.parentId = parentId;
          console.log(`Setting parentId to: ${parentId}`);
        } else {
          userFields.parentId = null;
          console.log('Setting parentId to null');
        }
      }
      
      // Handle supervisor specific fields
      if (role === 'supervisor' || (req.body.supervisorType && !role)) {
        if (supervisorType) {
          userFields.supervisorType = supervisorType;
        }
        
        if (supervisorType === 'sports' && Array.isArray(supervisorSportTypes)) {
          userFields.supervisorSportTypes = supervisorSportTypes;
        } else if (supervisorType !== 'sports') {
          // Clear sport types if supervisor type is not sports
          userFields.supervisorSportTypes = [];
        }
      }
    }
    
    userFields.updatedAt = Date.now();

    // Check if role is being changed
    const roleChanged = role && user.role !== role && req.user.role === 'admin';
    
    // Check if parent is being changed (compare as strings in case of ObjectId objects)
    const parentChanged = parentId !== undefined && req.user.role === 'admin' && 
      ((!user.parentId && parentId && parentId.trim() !== '') || 
       (user.parentId && String(user.parentId) !== String(parentId)));
    
    console.log('Before update:', { 
      userId: user._id,
      updatedBy: req.user.role,
      fieldsToUpdate: Object.keys(userFields),
      currentParentId: user.parentId, 
      newParentId: parentId,
      parentChanged 
    });
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    console.log('After update:', { 
      userId: user._id, 
      updatedBy: req.user.role,
      fieldsUpdated: Object.keys(userFields)
    });

    // Create notifications - this is now separated from the main user update
    // to prevent notification creation failures from breaking the update
    try {
      // Create notification for role change (admin only)
      if (roleChanged) {
        const notification = new Notification({
          recipient: user._id,
          type: 'role_change',
          title: 'Role Updated',
          message: `Your role has been updated to ${role}.`,
          relatedTo: {
            model: 'User',
            id: user._id
          }
        });
        
        await notification.save();
      }
      
      // Create notification for parent change if user is a player (admin only)
      if (parentChanged && user.role === 'player' && userFields.parentId) {
        const parent = await User.findById(userFields.parentId);
        if (parent) {
          const notification = new Notification({
            recipient: parent._id,
            type: 'child_account_linked',
            title: 'Child Account Linked',
            message: `Your account has been linked to ${user.firstName} ${user.lastName}.`,
            relatedTo: {
              model: 'User',
              id: user._id
            }
          });
          
          await notification.save();
        }
      }
      
      // Notification for profile update by support staff
      if (req.user.role === 'support') {
        // Notify the player that their profile was updated
        const notification = new Notification({
          recipient: user._id,
          type: 'profile_updated',
          title: 'Profile Updated',
          message: 'Your contact information has been updated by support staff.',
          relatedTo: {
            model: 'User',
            id: user._id
          }
        });
        
        await notification.save();
      }
    } catch (notificationError) {
      // Log notification error but don't fail the whole request
      console.error('Error creating notifications:', notificationError);
      // We'll still return the updated user without failing
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Ensure user can only change their own password unless they are an admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized to change this password' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    ).select('-password');
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin reset user password (no current password required)
// @route   PUT /api/users/:id/reset-password
// @access  Admin only
exports.adminResetPassword = async (req, res) => {
  const { newPassword } = req.body;

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Ensure only admin can reset passwords
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Only admins can reset passwords.' });
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: 'Please provide a valid password (minimum 6 characters)' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    ).select('-password');
    
    // Create notification for the user
    try {
      const notification = new Notification({
        recipient: user._id,
        type: 'password_reset',
        title: 'Password Reset',
        message: 'Your password has been reset by an administrator.',
        relatedTo: {
          model: 'User',
          id: user._id
        }
      });
      
      await notification.save();
    } catch (notificationErr) {
      console.error('Error creating notification:', notificationErr);
      // Continue execution even if notification fails
    }
    
    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Supervisor, Admin, Support
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    const validRoles = ['admin', 'supervisor', 'coach', 'player', 'parent', 'cashier', 'support', 'accounting'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }
    
    // Only admin, support, and supervisor roles should access this endpoint
    if (req.user.role !== 'admin' && req.user.role !== 'support' && req.user.role !== 'supervisor') {
      return res.status(403).json({ msg: 'Access denied. Admin, Support, or Supervisor privileges required.' });
    }
    
    const users = await User.find({ role, isActive: true }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get children of a parent user
// @route   GET /api/users/parent/children
// @access  Private (Parent)
exports.getParentChildren = async (req, res) => {
  try {
    // Get the parent user ID
    const parentId = req.user.id;
    
    // Check if user is a parent
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Not authorized. Only parent users can access this data' });
    }
    
    // Find child users linked to this parent
    // Assuming there's a parentId field in the User model for child users
    const children = await User.find({ 
      parentId: parentId,
      role: 'player'
    }).select('-password');
    
    if (!children || children.length === 0) {
      return res.status(404).json({ msg: 'No children found for this parent' });
    }
    
    res.json(children);
  } catch (err) {
    console.error('Error fetching parent children:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Upload document for user
// @route   POST /api/users/:id/documents
// @access  Private - Admin and Support
exports.uploadDocument = async (req, res) => {
  try {
    console.log('Upload document request body:', req.body);
    console.log('Upload document for user ID:', req.params.id);
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const { name, type } = req.body;
    
    if (!name) {
      return res.status(400).json({ msg: 'Document name is required' });
    }
    
    console.log('Creating document with name:', name, 'and type:', type);
    
    // In a real application, we would handle file upload to cloud storage
    // For this example, we'll create a mock document with simulated URL
    const documentType = type || 'other'; // Default to 'other' if no type provided
    
    // Create document with simulated URL
    const newDocument = {
      _id: new mongoose.Types.ObjectId(),
      name,
      type: documentType,
      url: `https://example.com/documents/${req.params.id}/${Date.now()}`,
      createdAt: new Date()
    };
    
    console.log('New document object:', newDocument);
    
    // Add document to user's documents array
    user.documents = user.documents || [];
    user.documents.push(newDocument);
    
    await user.save();
    console.log('Document saved to user:', user._id);
    
    // Create notification for the user
    try {
      const notification = new Notification({
        recipient: user._id,
        type: 'document_upload',
        title: 'New Document Added',
        message: `A new document "${name}" has been uploaded to your profile.`,
        relatedTo: {
          model: 'User',
          id: user._id
        }
      });
      
      await notification.save();
      console.log('Notification created for document upload');
    } catch (notificationErr) {
      console.error('Error creating notification:', notificationErr);
      // Continue execution even if notification fails
    }
    
    res.json(newDocument);
  } catch (err) {
    console.error('Error in uploadDocument:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Delete a document from a user
// @route   DELETE /api/users/:id/documents/:documentId
// @access  Private (Admin and Support)
exports.deleteDocument = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Find the document in the user's documents array
    const documentIndex = user.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );
    
    if (documentIndex === -1) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    // In a real implementation, you would delete the file from storage here
    
    // Remove the document from the array
    user.documents.splice(documentIndex, 1);
    await user.save();
    
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error('Error deleting document:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Upload profile picture for a user
// @route   POST /api/users/:id/picture
// @access  Admin only
exports.uploadUserProfilePicture = async (req, res) => {
  try {
    console.log('Upload profile picture request for user ID:', req.params.id);
    
    // Check if the user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if file is present in the request
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file provided' });
    }
    
    // Convert the image buffer to a base64 data URL that can be displayed directly
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype; // e.g., 'image/jpeg', 'image/png'
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('Setting profile picture URL:', imageUrl.substring(0, 50) + '...');
    
    // Update the user with the new profile picture URL
    user.profilePicture = imageUrl;
    await user.save();
    
    // Return the updated image URL
    res.json({ imageUrl });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Upload profile picture for current user
// @route   POST /api/users/profile/picture
// @access  Private (any authenticated user)
exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log('Upload profile picture for current user ID:', req.user.id);
    
    // Get the current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if file is present in the request
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file provided' });
    }
    
    // Convert the image buffer to a base64 data URL that can be displayed directly
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype; // e.g., 'image/jpeg', 'image/png'
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('Setting profile picture URL:', imageUrl.substring(0, 50) + '...');
    
    // Update the user with the new profile picture URL
    user.profilePicture = imageUrl;
    await user.save();
    
    // Return the updated image URL
    res.json({ imageUrl });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}; 