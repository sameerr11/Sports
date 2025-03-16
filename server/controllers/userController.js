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
  const { firstName, lastName, email, password, role, phoneNumber, address, parentId, supervisorType, supervisorSportTypes } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Validate role
    const validRoles = ['admin', 'supervisor', 'coach', 'player', 'parent', 'cashier', 'support'];
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
      address
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
        const supervisors = await User.find({ role: 'supervisor' });
        
        for (const supervisor of supervisors) {
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
// @access  Admin
exports.updateUser = async (req, res) => {
  console.log('Update user request body:', req.body);
  const { firstName, lastName, email, role, phoneNumber, address, isActive, parentId, supervisorType, supervisorSportTypes } = req.body;

  // Validate role if provided
  if (role) {
    const validRoles = ['admin', 'supervisor', 'coach', 'player', 'parent', 'cashier', 'support'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: 'Invalid role selected' });
    }
  }

  // Build user object
  const userFields = {};
  if (firstName) userFields.firstName = firstName;
  if (lastName) userFields.lastName = lastName;
  if (email) userFields.email = email;
  if (role) userFields.role = role;
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
  
  userFields.updatedAt = Date.now();

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if role is being changed
    const roleChanged = role && user.role !== role;
    
    // Check if parent is being changed (compare as strings in case of ObjectId objects)
    const parentChanged = parentId !== undefined && 
      ((!user.parentId && parentId && parentId.trim() !== '') || 
       (user.parentId && String(user.parentId) !== String(parentId)));
    
    console.log('Before update:', { 
      userId: user._id,
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
    
    console.log('After update:', { userId: user._id, parentId: user.parentId });

    // Create notifications - this is now separated from the main user update
    // to prevent notification creation failures from breaking the update
    try {
      // Create notification for role change
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
      
      // Create notification for parent change if user is a player
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
// @access  Admin
exports.changePassword = async (req, res) => {
  const { password } = req.body;

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
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
    
    res.json(user);
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
    const validRoles = ['admin', 'supervisor', 'coach', 'player', 'parent', 'cashier', 'support'];
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