const User = require('../models/User');
const Booking = require('../models/Booking');

exports.getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const activeLessons = await Booking.countDocuments({ status: 'scheduled', date: { $gte: new Date() } });
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(0) + '%' : '0%';

    res.status(200).json({
      totalStudents,
      totalInstructors,
      activeLessons,
      completionRate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};