const Course = require('../models/Course');

console.log('✅ courseController.js loaded');

const getCourses = async (req, res) => {
  try {
    console.log('📥 Fetching courses for user:', req.user?._id);
    const courses = await Course.find().populate('instructor', 'name');
    res.status(200).json(courses);
  } catch (error) {
    console.error('❌ Error in getCourses:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, duration, price, instructor } = req.body;
    console.log('🛠️ Creating course with:', { title, instructor });

    if (!title || !duration || !price || !instructor) {
      return res.status(400).json({ message: 'Title, duration, price, and instructor are required' });
    }

    const course = new Course({ title, description, duration, price, instructor });
    await course.save();

    // 🔄 Re-fetch with instructor populated
    const populatedCourse = await Course.findById(course._id).populate('instructor', 'name');

    console.log('✅ Course created with ID:', course._id);
    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('❌ Error in createCourse:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('✏️ Updating course:', id);

    await Course.findByIdAndUpdate(id, updates, { new: false }); // Run update first
    const updatedCourse = await Course.findById(id).populate('instructor', 'name'); // Re-fetch with populated instructor

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('✅ Course updated:', updatedCourse._id);
    res.json(updatedCourse);
  } catch (error) {
    console.error('❌ Error in updateCourse:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting course:', id);
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('✅ Course deleted:', course._id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('❌ Error in deleteCourse:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};
