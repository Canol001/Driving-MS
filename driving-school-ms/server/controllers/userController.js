const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User
const register = async (req, res) => {
  const { name, email, password, role, status, availability } = req.body;
  try {
    console.log('Registering user:', { email, role });

    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, email, password, role, status, availability });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, _id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Error in register:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Login attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, _id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Error in login:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update User
const updateUser = async (req, res) => {
  const { name, email, role, status, availability } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, status, availability },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error in updateUser:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error in deleteUser:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Logged-in User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error in getProfile:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



module.exports = {
  register,
  login,
  getUsers,
  updateUser,
  deleteUser,
  getProfile,
};
