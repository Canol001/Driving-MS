const Booking = require('../models/Booking');

console.log('bookingController.js: File loaded');

const getBookings = async (req, res) => {
  try {
    console.log('getBookings: Fetching bookings for user:', req.user._id);
    const query = req.user.role === 'student' ? { student: req.user._id } : 
                 req.user.role === 'instructor' ? { instructor: req.user._id } : {};
    const bookings = await Booking.find(query)
      .populate('course', 'title')
      .populate('student', 'name')
      .populate('instructor', 'name');
    res.json(bookings);
  } catch (error) {
    console.error('getBookings: Error:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { course, instructor, date } = req.body;
    console.log('createBooking: Creating booking:', { course, instructor, date });
    const booking = new Booking({
      course,
      student: req.user._id,
      instructor,
      date,
      status: 'pending'
    });
    await booking.save();
    console.log('createBooking: Booking created:', booking._id);
    res.status(201).json(booking);
  } catch (error) {
    console.error('createBooking: Error:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('updateBooking: Updating booking:', id, updates);
    const booking = await Booking.findByIdAndUpdate(id, updates, { new: true });
    if (!booking) {
      console.log('updateBooking: Booking not found:', id);
      return res.status(404).json({ message: 'Booking not found' });
    }
    console.log('updateBooking: Booking updated:', id);
    res.json(booking);
  } catch (error) {
    console.error('updateBooking: Error:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('deleteBooking: Deleting booking:', id);
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      console.log('deleteBooking: Booking not found:', id);
      return res.status(404).json({ message: 'Booking not found' });
    }
    console.log('deleteBooking: Booking deleted:', id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('deleteBooking: Error:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportedFunctions = {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking
};

console.log('bookingController.js: Exporting functions:', Object.keys(exportedFunctions));
module.exports = exportedFunctions;