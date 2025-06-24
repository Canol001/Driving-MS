import axios from 'axios'; // Add axios for direct API call
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  User,
  X,
} from 'lucide-react';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCourses,
  getNotifications,
  getStudentProfile,
  reportIssue,
  sendMessage,
  updateAvailability,
  updateLessonStatus,
} from '../api';
import { AuthContext } from '../context/AuthContext';

interface Course {
  _id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  instructor: { _id: string; name: string } | string | null;
  createdAt: string;
}

interface Booking {
  _id: string;
  course: { _id: string; title: string } | null;
  student: { _id: string; name: string } | null;
  instructor: { _id: string; name: string } | string | null;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'scheduled' | 'completed' | 'missed';
  createdAt: string;
  notes?: string;
  progress?: { observations: string; skills: { skill: string; rating: number }[] };
  issues?: { remarks: string; type: 'student_absent' | 'vehicle_issue' | 'behavior' | 'other' };
}

interface Notification {
  _id: string;
  message: string;
  type: 'booking_new' | 'booking_updated' | 'admin_message' | 'instructor_message';
  read: boolean;
  createdAt: string;
}

interface StudentProfile {
  student: { _id: string; name: string; email: string; package: string } | null;
  progress: { course: string; status: string; progress?: { observations: string; skills: { skill: string; rating: number }[] } }[];
  sessionsRemaining: number;
}

interface AssignedStudent {
  id: string;
  name: string;
  lessonType: string;
  date: string;
  time: string;
  location: string;
  progress: number;
}

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getBookings = async (filters: { startDate?: string; endDate?: string; studentId?: string }) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/bookings?${params}`);

  // 👀 Safety net to detect if HTML was returned (like a frontend dev server response)
  if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
    throw new Error('Unexpected HTML response — check API baseURL or proxy config.');
  }

  return response.data;
};

const InstructorDashboard = () => {
  const { user, logout } = useContext(AuthContext)!;
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', studentId: '' });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    observations: '',
    skills: [{ skill: '', rating: 0 }],
    issueRemarks: '',
    issueType: '',
    message: '',
    recipientId: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const stableFilters = useMemo(
    () => ({ startDate: filters.startDate, endDate: filters.endDate, studentId: filters.studentId }),
    [filters.startDate, filters.endDate, filters.studentId]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, bookingsResRaw, notificationsRes] = await Promise.all([
          getCourses(),
          getBookings(stableFilters),
          getNotifications(),
        ]);

        console.log('User ID:', user?._id);
        console.log('Role:', user?.role);
        console.log('Raw Courses:', JSON.stringify(coursesRes, null, 2));
        console.log('Raw Bookings Response:', JSON.stringify(bookingsResRaw, null, 2));
        console.log('Notifications:', JSON.stringify(notificationsRes, null, 2));

        const bookingsRes: Booking[] = Array.isArray(bookingsResRaw) ? bookingsResRaw : [];

        const instructorBookings = bookingsRes.filter((b: Booking) => {
          if (!b.instructor) {
            console.warn('Booking missing instructor:', b);
            return false;
          }
          const instructorId = typeof b.instructor === 'string' ? b.instructor : b.instructor._id;
          console.log(`Comparing booking instructorId: ${instructorId} with user._id: ${user?._id}`);
          return instructorId === user?._id;
        });

        console.log('Filtered Bookings:', JSON.stringify(instructorBookings, null, 2));

        setCourses(coursesRes || []);
        setBookings(instructorBookings || []);
        setNotifications(notificationsRes || []);

        if (instructorBookings.length === 0) {
          console.warn('No bookings found for instructor. Check database or backend query.');
          setError('No bookings found. Check if bookings exist in the database or contact the admin.');
        }
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?._id && user?.role === 'instructor') {
      fetchData();
    } else {
      console.error('User ID missing or not an instructor, barato casino to login');
      setError('User not authenticated or not an instructor. Please log in.');
      navigate('/login');
    }
  }, [user?._id, user?.role, stableFilters, navigate]);

  // Derive unique assigned students from bookings
  const assignedStudents: AssignedStudent[] = useMemo(() => {
    const uniqueStudents = new Map<string, AssignedStudent>();
    bookings.forEach((b) => {
      if (b.student?._id && !uniqueStudents.has(b.student._id)) {
        uniqueStudents.set(b.student._id, {
          id: b.student._id,
          name: b.student.name || 'Unknown',
          lessonType: b.course?.title || 'N/A',
          date: b.date ? new Date(b.date).toLocaleDateString() : 'N/A',
          time: b.date ? new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          location: b.course?.title.includes('Highway') ? 'Highway Route 1' : 'Main Training Ground',
          progress:
            b.progress?.skills.reduce((sum, s) => sum + s.rating, 0) / (b.progress?.skills.length || 1) * 10 || 0,
        });
      }
    });
    const students = Array.from(uniqueStudents.values());
    console.log('Assigned Students:', JSON.stringify(students, null, 2));
    return students;
  }, [bookings]);

  const lessonSchedule = useMemo(
    () =>
      bookings.map((b) => ({
        id: b._id,
        student: b.student?.name || 'Unknown',
        type: b.course?.title || 'N/A',
        date: b.date ? new Date(b.date).toLocaleDateString() : 'N/A',
        time: b.date ? new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        location: b.course?.title.includes('Highway') ? 'Highway Route 1' : 'Main Training Ground',
        status: b.status || 'N/A',
      })),
    [bookings]
  );

  const instructorData = {
    name: user?.name || 'N/A',
    email: user?.email || 'N/A',
    phone: '+1 (555) 789-0123',
    instructorId: `ID-${new Date().getFullYear()}-${user?._id?.slice(-4) || '0000'}`,
    hireDate: new Date(user?.createdAt || Date.now()).toISOString().split('T')[0],
    assignedStudents: assignedStudents.length,
    completedLessons: bookings.filter((b) => b.status === 'completed').length,
    upcomingLessons: bookings.filter((b) => new Date(b.date) > new Date() && b.status === 'scheduled').length,
    nextLesson: lessonSchedule[0]?.date ? `${lessonSchedule[0].date} at ${lessonSchedule[0].time}` : 'None',
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'students', label: 'Students', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'lesson', label: 'Update Lesson', icon: Edit },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: MessageSquare },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'studentProfile', label: 'Student Profile', icon: User },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const downloadReport = () => {
    const content = `
      INSTRUCTOR REPORT
      
      Instructor Name: ${instructorData.name}
      Instructor ID: ${instructorData.instructorId}
      Hire Date: ${instructorData.hireDate}
      
      Performance Summary:
      - Assigned Students: ${instructorData.assignedStudents}
      - Completed Lessons: ${instructorData.completedLessons}
      - Upcoming Lessons: ${instructorData.upcomingLessons}
      
      Generated on: ${new Date().toLocaleDateString()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${instructorData.name}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) {
      setError('No lesson selected');
      return;
    }
    try {
      const updatedBooking = await updateLessonStatus({
        bookingId: selectedBooking._id,
        status: formData.status,
        notes: formData.notes,
        progress: {
          observations: formData.observations,
          skills: formData.skills.filter((s) => s.skill && s.rating),
        },
      });
      setBookings(bookings.map((b) => (b._id === selectedBooking._id ? updatedBooking : b)));
      setSelectedBooking(null);
      setFormData({ ...formData, status: '', notes: '', observations: '', skills: [{ skill: '', rating: 0 }] });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lesson');
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) {
      setError('No lesson selected');
      return;
    }
    try {
      const updatedBooking = await reportIssue({
        bookingId: selectedBooking._id,
        remarks: formData.issueRemarks,
        type: formData.issueType,
      });
      setBookings(bookings.map((b) => (b._id === selectedBooking._id ? updatedBooking : b)));
      setFormData({ ...formData, issueRemarks: '', issueType: '' });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report issue');
    }
  };

  const handleUpdateAvailability = async () => {
    try {
      await updateAvailability({ availability });
      alert('Availability updated successfully');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleViewStudentProfile = async (studentId: string) => {
    try {
      const profile = await getStudentProfile(studentId);
      setStudentProfile(profile);
      setActiveSection('studentProfile');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student profile');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMessage({ recipientId: formData.recipientId, message: formData.message });
      setFormData({ ...formData, message: '', recipientId: '' });
      alert('Message sent successfully');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const addSkillField = () => {
    setFormData({ ...formData, skills: [...formData.skills, { skill: '', rating: 0 }] });
  };

  const updateSkillField = (index: number, field: 'skill' | 'rating', value: string | number) => {
    const newSkills = [...formData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setFormData({ ...formData, skills: newSkills });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Assigned Students</p>
                  <p className="text-xl font-semibold text-gray-900">{instructorData.assignedStudents}</p>
                </div>
                <User className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Completed Lessons</p>
                  <p className="text-xl font-semibold text-emerald-600">{instructorData.completedLessons}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Upcoming Lessons</p>
                  <p className="text-xl font-semibold text-amber-600">{instructorData.upcomingLessons}</p>
                </div>
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Next Lesson</p>
                  <p className="text-xl font-semibold text-gray-900">{instructorData.nextLesson}</p>
                </div>
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Next Lesson</h3>
              {lessonSchedule[0] ? (
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-50 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {lessonSchedule[0].student} - {lessonSchedule[0].type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lessonSchedule[0].date} at {lessonSchedule[0].time}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming lessons</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={downloadReport}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={() => setActiveSection('schedule')}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>View Schedule</span>
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Available Courses</h3>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">
                No courses available. Contact the admin to assign courses.
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.description}</p>
                    <p className="text-xs text-gray-500">
                      Duration: {course.duration} min | Price: ${course.price}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading students...</div>
        </div>
      ) : assignedStudents.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Assigned Students</h3>
          <p className="text-sm text-gray-500 mb-4">
            No students assigned. Check if bookings exist in the database or try resetting filters.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', studentId: '' })}
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <span>Reset Filters</span>
            </button>
            <button
              onClick={() => navigate('/contact-admin')}
              className="inline-flex items-center space-x-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              <span>Contact Admin</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Assigned Students</h3>
          <div className="space-y-4">
            {assignedStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-50 p-2 rounded-full">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <button
                      onClick={() => student.id && handleViewStudentProfile(student.id)}
                      className="text-sm font-medium text-gray-900 hover:underline focus:outline-none"
                      disabled={!student.id}
                    >
                      {student.name} - {student.lessonType}
                    </button>
                    <p className="text-xs text-gray-500">
                      {student.date} at {student.time}
                    </p>
                    <p className="text-xs text-gray-500">
                      Progress: {isNaN(student.progress) ? '0' : student.progress.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 sm:text-right">
                  <p className="text-xs text-gray-500 flex items-center sm:justify-end">
                    <MapPin className="h-3 w-3 mr-1" />
                    {student.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading schedule...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Lesson Schedule</h3>
          <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                placeholder="Enter Student ID"
                value={filters.studentId}
                onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', studentId: '' })}
              className="self-end bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
          {lessonSchedule.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">
                No lessons scheduled.{' '}
                {filters.startDate || filters.endDate || filters.studentId
                  ? 'Try adjusting or resetting the filters.'
                  : 'Contact the admin to schedule lessons.'}
              </p>
              {(filters.startDate || filters.endDate || filters.studentId) && (
                <button
                  onClick={() => setFilters({ startDate: '', endDate: '', studentId: '' })}
                  className="inline-flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {lessonSchedule.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-50 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {lesson.student} - {lesson.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lesson.date} at {lesson.time}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:text-right flex items-center space-x-3">
                    <p className="text-xs text-gray-500 flex items-center sm:justify-end">
                      <MapPin className="h-3 w-3 mr-1" />
                      {lesson.location}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{lesson.status}</p>
                    <button
                      onClick={() => {
                        const booking = bookings.find((b) => b._id === lesson.id);
                        if (booking) {
                          setSelectedBooking(booking);
                          setActiveSection('lesson');
                          setFormData({
                            ...formData,
                            status: booking.status || '',
                            notes: booking.notes || '',
                            observations: booking.progress?.observations || '',
                            skills: booking.progress?.skills || [{ skill: '', rating: 0 }],
                          });
                        } else {
                          console.warn(`Booking not found for lesson ID: ${lesson.id}`);
                          setError('Lesson not found');
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                      disabled={!lesson.id}
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLessonForm = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading lesson form...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Update Lesson</h3>
          {selectedBooking ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={handleUpdateLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lesson Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Status</option>
                    {['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'missed'].map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Session Notes</label>
                  <textarea
                    placeholder="Enter session notes (e.g., student performance)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Observations</label>
                  <textarea
                    placeholder="e.g., Mastered clutch control"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Skill Ratings</label>
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Skill (e.g., Parking)"
                        value={skill.skill}
                        onChange={(e) => updateSkillField(index, 'skill', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg flex-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={skill.rating}
                        onChange={(e) => updateSkillField(index, 'rating', Number(e.target.value))}
                        className="p-2 border border-gray-300 rounded-lg w-20 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSkillField}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                  >
                    <Plus size={14} className="mr-1" /> Add Skill
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  Save Lesson
                </button>
              </form>
              <form onSubmit={handleReportIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issue Type</label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Issue Type</option>
                    {['student_absent', 'vehicle_issue', 'behavior', 'other'].map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issue Remarks</label>
                  <textarea
                    placeholder="Describe the issue"
                    value={formData.issueRemarks}
                    onChange={(e) => setFormData({ ...formData, issueRemarks: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Report Issue
                </button>
              </form>
            </div>
          ) : (
            <p className="text-center text-gray-500">Select a lesson from the Schedule section to update.</p>
          )}
        </div>
      )}
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading availability...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Set Availability</h3>
          <div className="space-y-4">
            {availability.length === 0 && (
              <p className="text-sm text-gray-500 text-center">No availability set. Add a slot to get started.</p>
            )}
            {availability.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <select
                  value={slot.day}
                  onChange={(e) => {
                    const newAvailability = [...availability];
                    newAvailability[index].day = e.target.value;
                    setAvailability(newAvailability);
                  }}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const newAvailability = [...availability];
                    newAvailability[index].startTime = e.target.value;
                    setAvailability(newAvailability);
                  }}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => {
                    const newAvailability = [...availability];
                    newAvailability[index].endTime = e.target.value;
                    setAvailability(newAvailability);
                  }}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={() => setAvailability(availability.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => setAvailability([...availability, { day: 'Monday', startTime: '09:00', endTime: '17:00' }])}
              className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
            >
              <Plus size={14} className="mr-1" /> Add Slot
            </button>
            <button
              onClick={handleUpdateAvailability}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm mt-4"
            >
              Save Availability
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading notifications...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500">No notifications available. Check back later.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 border-b ${notification.read ? 'bg-gray-50' : 'bg-indigo-50'}`}
              >
                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()} •{' '}
                  {notification.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading messages...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Send Message</h3>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Recipient ID</label>
              <input
                type="text"
                placeholder="Enter Admin or Student ID"
                value={formData.recipientId}
                onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
              <textarea
                placeholder="Type your message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              disabled={!formData.recipientId || !formData.message}
            >
              Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  );

  const renderStudentProfile = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading student profile...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Student Profile</h3>
          {studentProfile && studentProfile.student ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={studentProfile.student.name || 'N/A'}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={studentProfile.student.email || 'N/A'}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Package</label>
                  <input
                    type="text"
                    value={studentProfile.student.package || 'None'}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sessions Remaining</label>
                  <input
                    type="text"
                    value={studentProfile.sessionsRemaining || 0}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    readOnly
                  />
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Progress</h4>
              {studentProfile.progress.length === 0 ? (
                <p className="text-sm text-gray-500">No progress recorded.</p>
              ) : (
                <div className="space-y-3">
                  {studentProfile.progress.map((p, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{p.course || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Status: {p.status || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        Observations: {p.progress?.observations || 'None'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Skills:{' '}
                        {p.progress?.skills?.map((s) => `${s.skill}: ${s.rating}/10`).join(', ') || 'None'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">Select a student from the Students section to view their profile.</p>
          )}
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading reports...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Reports</h3>
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Generate and download your instructor reports here.</p>
            <button
              onClick={downloadReport}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse">Loading profile...</div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={instructorData.name}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={instructorData.email}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={instructorData.phone}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Instructor ID</label>
                <input
                  type="text"
                  value={instructorData.instructorId}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="text"
                  value={instructorData.hireDate}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'students':
        return renderStudents();
      case 'schedule':
        return renderSchedule();
      case 'lesson':
        return renderLessonForm();
      case 'availability':
        return renderAvailability();
      case 'notifications':
        return renderNotifications();
      case 'messages':
        return renderMessages();
      case 'studentProfile':
        return renderStudentProfile();
      case 'reports':
        return renderReports();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">DriveSafe</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors ${
                  activeSection === item.id
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-600'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3">
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                {activeSection === 'overview' ? 'Dashboard' : activeSection.replace(/([A-Z])/g, ' $1').trim()}
              </h2>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="relative p-1.5 text-gray-600 hover:text-gray-900">
                <MessageSquare className="h-5 w-5" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-red-500"></span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-gray-900">{instructorData.name}</p>
                  <p className="text-xs text-gray-500">{instructorData.instructorId}</p>
                </div>
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {instructorData.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default InstructorDashboard;