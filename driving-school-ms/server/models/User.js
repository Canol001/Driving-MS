const mongoose = require('mongoose');

   const userSchema = new mongoose.Schema({
     name: { type: String, required: true },
     email: { type: String, required: true, unique: true },
     password: { type: String, required: true },
     role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
     status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
     lastActivity: { type: Date, default: Date.now },
     availability: [{ day: String, startTime: String, endTime: String }],
     notifications: [{
       message: String,
       type: { type: String, enum: ['booking_new', 'booking_updated', 'admin_message'] },
       read: { type: Boolean, default: false },
       createdAt: { type: Date, default: Date.now }
     }],
     package: { type: String } // For students (e.g., "10-lesson beginner package")
   }, { timestamps: true });

   module.exports = mongoose.model('User', userSchema);