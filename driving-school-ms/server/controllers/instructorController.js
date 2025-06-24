const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getSchedule = async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    const query = { instructor: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (studentId) {
      query.student = studentId;
    }
    
    const bookings = await Booking.find(query)
      .populate('course', 'title')
      .populate('student', 'name')
      .populate('instructor', 'name');
    
    res.json(bookings);
  } catch (error) {
    console.error('Error in getSchedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLessonStatus = async (req, res) => {
  try {
    const { bookingId, status, notes, progress } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, instructor: req.user._id },
      { status, notes, progress },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error in updateLessonStatus:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reportIssue = async (req, res) => {
  try {
    const { bookingId, remarks, type } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, instructor: req.user._id },
      { issues: { remarks, type } },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error in reportIssue:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    console.error('Error in updateAvailability:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select('name email package');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    const bookings = await Booking.find({ student: studentId })
      .populate('course', 'title')
      .select('status date progress');
    res.json({
      student,
      progress: bookings.map(b => ({
        course: b.course.title,
        status: b.status,
        progress: b.progress
      })),
      sessionsRemaining: bookings.filter(b => b.status === 'scheduled').length
    });
  } catch (error) {
    console.error('Error in getStudentProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const notification = new Notification({
      recipient: recipientId,
      message,
      type: 'instructor_message',
      sender: req.user._id
    });
    await notification.save();
    res.json({ message: 'Message sent' });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};