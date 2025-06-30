// 📁 bookingController.js

const Booking = require('../models/Booking');

console.log('📦 Booking Controller loaded');

// ============================
// 📥 GET ALL BOOKINGS
// ============================
const getBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    console.log('📡 Fetching bookings for:', { userId, userRole });

    let query = {};

    if (userRole === 'student') {
      query.student = userId;
    } else if (userRole === 'instructor') {
      query.instructor = userId;
    }
    // Admin gets all bookings

    const bookings = await Booking.find(query)
      .populate('course', 'title')
      .populate('student', 'name email')
      .populate('instructor', 'name email');

    console.log(`✅ ${bookings.length} bookings fetched for role: ${userRole}`);
    res.status(200).json(bookings);

  } catch (error) {
    console.error('❌ getBookings Error:', error.stack);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

// ============================
// 🆕 CREATE A BOOKING
// ============================
const createBooking = async (req, res) => {
  try {
    const { course, instructor, student, date, status } = req.body;

    if (!course || !instructor || !student || !date) {
      return res.status(400).json({ message: 'Missing required fields: course, instructor, student, or date.' });
    }

    console.log('📝 Creating booking with:', { course, instructor, student, date, status });

    const booking = new Booking({
      course,
      instructor,
      student,
      date,
      status: status || 'pending'
    });

    await booking.save();

    console.log('✅ Booking created:', booking._id);
    res.status(201).json(booking);

  } catch (error) {
    console.error('❌ createBooking Error:', error.stack);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

// ============================
// ♻️ UPDATE A BOOKING
// ============================
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating booking:', id, updates);

    const booking = await Booking.findByIdAndUpdate(id, updates, { new: true });

    if (!booking) {
      console.warn('⚠️ Booking not found:', id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('✅ Booking updated:', id);
    res.status(200).json(booking);

  } catch (error) {
    console.error('❌ updateBooking Error:', error.stack);
    res.status(500).json({ message: 'Failed to update booking' });
  }
};

// ============================
// 🗑️ DELETE A BOOKING
// ============================
const deleteBooking = async (req, res) => {
  const { id } = req.params;

  console.log('🗑️ Deleting booking:', id);

  const booking = await Booking.findByIdAndDelete(id);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  res.status(200).json({ message: 'Booking deleted successfully' });
};


// ============================
// ✅ EXPORT FUNCTIONS
// ============================
module.exports = {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
};
