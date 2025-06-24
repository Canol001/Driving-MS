const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'scheduled', 'completed', 'missed'], 
    default: 'pending' 
  },
  notes: { type: String },
  progress: {
    observations: { type: String },
    skills: [{ skill: String, rating: Number }]
  },
  issues: {
    remarks: { type: String },
    type: { type: String, enum: ['student_absent', 'vehicle_issue', 'behavior', 'other'] }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);