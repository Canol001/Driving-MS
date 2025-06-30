import {
  AlertCircle,
  BarChart2,
  Book,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  FileText,
  LogOut,
  Menu,
  Plus,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cancelBooking, createBooking, createCourse, deleteCourse, deleteUser, getAnalytics, getBookings, getCourses, getPayments, getUsers, processPayment, refundPayment, registerUser, updateBooking, updateCourse, updateUser } from '../api';
import { AuthContext } from '../context/AuthContext';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'Active' | 'Inactive';
  lastActivity: string;
  createdAt?: string;
  availability?: { day: string; time: string }[];
}

interface Booking {
  _id: string;
  course: { _id: string; title: string };
  student: { _id: string; name: string };
  instructor: { _id: string; name: string };
  date: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'cancelled';
}

interface Payment {
  _id: string;
  booking: { _id: string; course: { title: string } };
  user: { _id: string; name: string };
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  date: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  instructor: { _id: string; name: string };
  categories: string[];
  createdAt: string;
}

interface AnalyticsData {
  totalStudents: number;
  totalInstructors: number;
  activeLessons: number;
  completionRate: string;
}

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext)!;
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0,
    totalInstructors: 0,
    activeLessons: 0,
    completionRate: '0%',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'addUser' | 'editUser' | 'addBooking' | 'editBooking' | 'addCourse' | 'editCourse' | ''>('');
  const [selectedItem, setSelectedItem] = useState<User | Booking | Course | null>(null);
  const [formData, setFormData] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, analyticsRes, bookingsRes, paymentsRes, coursesRes] = await Promise.all([
          getUsers(),
          getAnalytics(),
          getBookings(),
          getPayments(),
          getCourses(),
        ]);
        setUsers(usersRes);
        setAnalytics(analyticsRes);
        setBookings(bookingsRes);
        setPayments(paymentsRes);
        setCourses(coursesRes);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const adminData = {
    name: user?.name || 'N/A',
    email: user?.email || 'N/A',
    phone: '+1 (555) 321-9876',
    adminId: `AD-${new Date().getFullYear()}-${user?._id.slice(-4) || '0000'}`,
    role: 'System Administrator',
    totalStudents: analytics.totalStudents,
    totalInstructors: analytics.totalInstructors,
    activeLessons: analytics.activeLessons,
    lastReport: new Date().toISOString().split('T')[0],
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'lessons', label: 'Lessons', icon: Calendar },
    { id: 'instructors', label: 'Instructors', icon: User },
    { id: 'courses', label: 'Courses', icon: Book },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const openModal = (type: 'addUser' | 'editUser' | 'addBooking' | 'editBooking' | 'addCourse' | 'editCourse', item?: User | Booking | Course) => {
    setModalType(type);
    setSelectedItem(item || null);
    setFormData(item ? { ...item, categories: item.categories?.join(', ') || '' } : {});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setSelectedItem(null);
    setFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserSubmit = async () => {
    try {
      if (modalType === 'addUser') {
        const newUser = await registerUser(formData);
        setUsers([...users, newUser]);
      } else if (modalType === 'editUser' && selectedItem) {
        const updatedUser = await updateUser(selectedItem._id, formData);
        setUsers(users.map(u => (u._id === selectedItem._id ? updatedUser : u)));
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u._id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const handleBookingSubmit = async () => {
    try {
      if (modalType === 'addBooking') {
        const newBooking = await createBooking(formData);
        setBookings([...bookings, newBooking]);
      } else if (modalType === 'editBooking' && selectedItem) {
        const updatedBooking = await updateBooking(selectedItem._id, formData);
        setBookings(bookings.map(b => (b._id === selectedItem._id ? updatedBooking : b)));
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save booking.');
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this lesson?')) {
      try {
        const cancelledBooking = await cancelBooking(id);
        setBookings(bookings.map(b => (b._id === id ? cancelledBooking : b)));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to cancel booking.');
      }
    }
  };

  const handleCourseSubmit = async () => {
    try {
      const courseData = {
        ...formData,
        categories: formData.categories ? formData.categories.split(',').map((c: string) => c.trim()) : [],
      };
      if (modalType === 'addCourse') {
        const newCourse = await createCourse(courseData);
        setCourses([...courses, newCourse]);
      } else if (modalType === 'editCourse' && selectedItem) {
        const updatedCourse = await updateCourse(selectedItem._id, courseData);
        setCourses(courses.map(c => (c._id === selectedItem._id ? updatedCourse : c)));
      }
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save course.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(id);
        setCourses(courses.filter(c => c._id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete course.');
      }
    }
  };

  const handlePaymentAction = async (id: string, action: 'process' | 'refund') => {
    try {
      const updatedPayment = action === 'process' ? await processPayment(id) : await refundPayment(id);
      setPayments(payments.map(p => (p._id === id ? updatedPayment : p)));
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} payment.`);
    }
  };

  const downloadSystemReport = (format: 'txt' | 'pdf') => {
    const content = format === 'txt' ? (
      `
      SYSTEM ADMIN REPORT
      
      Administrator Name: ${adminData.name}
      Admin ID: ${adminData.adminId}
      Role: ${adminData.role}
      
      System Summary:
      - Total Students: ${adminData.totalStudents}
      - Total Instructors: ${adminData.totalInstructors}
      - Active Lessons: ${adminData.activeLessons}
      - Total Courses: ${courses.length}
      - Completion Rate: ${analytics.completionRate}
      
      Generated on: ${new Date().toLocaleDateString()}
      `
    ) : (
      `
      \\documentclass{article}
      \\usepackage[utf8]{inputenc}
      \\usepackage{geometry}
      \\geometry{a4paper, margin=1in}
      \\usepackage{fancyhdr}
      \\pagestyle{fancy}
      \\fancyhf{}
      \\fancyfoot[C]{\\thepage}
      \\lhead{DriveSafe System Report}
      \\rhead{Generated: ${new Date().toLocaleDateString()}}
      
      \\begin{document}
      
      \\title{System Admin Report}
      \\author{${adminData.name}}
      \\date{${new Date().toLocaleDateString()}}
      \\maketitle
      
      \\section*{Administrator Details}
      \\begin{itemize}
        \\item Name: ${adminData.name}
        \\item Admin ID: ${adminData.adminId}
        \\item Role: ${adminData.role}
      \\end{itemize}
      
      \\section*{System Summary}
      \\begin{itemize}
        \\item Total Students: ${adminData.totalStudents}
        \\item Total Instructors: ${adminData.totalInstructors}
        \\item Active Lessons: ${adminData.activeLessons}
        \\item Total Courses: ${courses.length}
        \\item Completion Rate: ${analytics.completionRate}
      \\end{itemize}
      
      \\end{document}
      `
    );

    const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'text/latex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${adminData.name}_SystemReport.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Students</p>
                  <p className="text-xl font-semibold text-gray-900">{adminData.totalStudents}</p>
                </div>
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Instructors</p>
                  <p className="text-xl font-semibold text-gray-900">{adminData.totalInstructors}</p>
                </div>
                <User className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Active Lessons</p>
                  <p className="text-xl font-semibold text-emerald-600">{adminData.activeLessons}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Courses</p>
                  <p className="text-xl font-semibold text-gray-900">{courses.length}</p>
                </div>
                <Book className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">System Status</h3>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">All systems operational</p>
                  <p className="text-xs text-gray-500">Last checked: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => openModal('addUser')}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New User</span>
                </button>
                <button
                  onClick={() => openModal('addCourse')}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Book className="h-4 w-4" />
                  <span>Add New Course</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-900">User Management</h3>
            <button
              onClick={() => openModal('addUser')}
              className="flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{u.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={u.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}>{u.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.lastActivity).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal('editUser', u)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderLessons = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-900">Lesson Management</h3>
            <button
              onClick={() => openModal('addBooking')}
              className="flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Lesson</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.course?.title || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.student?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.instructor?.name || 'Unassigned'}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(b.date).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      <span className={b.status === 'confirmed' ? 'text-emerald-600' : b.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'}>{b.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal('editBooking', b)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleCancelBooking(b._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderInstructors = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Instructor Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lessons Assigned</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(u => u.role === 'instructor').map(u => (
                  <tr key={u._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.availability?.map(a => `${a.day}: ${a.time}`).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bookings.filter(b => b?.instructor?._id === u._id).length}

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal('editUser', u)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-900">Course Management</h3>
            <button
              onClick={() => openModal('addCourse')}
              className="flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Course</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map(c => (
                  <tr key={c._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {c.instructor ? c.instructor.name : <span className="italic text-red-400">Unknown</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Ksh. {c.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.duration} hours</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(c.categories) && c.categories.length > 0
                        ? c.categories.join(', ')
                        : <span className="italic text-gray-400">||===|===||</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal('editCourse', c)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteCourse(c._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map(p => (
                  <tr key={p._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.booking.course.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      <span className={p.status === 'completed' ? 'text-emerald-600' : p.status === 'refunded' ? 'text-red-600' : 'text-amber-600'}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => handlePaymentAction(p._id, 'process')}
                          className="text-green-600 hover:text-green-900 mr-4 text-sm"
                        >
                          Process
                        </button>
                      )}
                      {p.status === 'completed' && (
                        <button
                          onClick={() => handlePaymentAction(p._id, 'refund')}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">System Analytics</h3>
          <div className="space-y-3">
            {[
              { metric: 'Total Students', value: adminData.totalStudents, change: '+5%', status: 'positive' },
              { metric: 'Total Instructors', value: adminData.totalInstructors, change: '+2%', status: 'positive' },
              { metric: 'Active Lessons', value: adminData.activeLessons, change: '-3%', status: 'negative' },
              { metric: 'Total Courses', value: courses.length, change: '+1%', status: 'positive' },
            ].map((metric, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-50 p-2 rounded-full">
                    <BarChart2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                    <p className="text-xs text-gray-500">Value: {metric.value}</p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                  <p className={`text-xs ${metric.status === 'positive' ? 'text-emerald-600' : 'text-amber-600'}`}>{metric.change}</p>
                </div>
              </div>
            ))}
          </div>
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
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Reports</h3>
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Generate and download system reports.</p>
            <div className="space-x-4">
              <button
                onClick={() => downloadSystemReport('txt')}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download TXT Report</span>
              </button>
              <button
                onClick={() => downloadSystemReport('pdf')}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">System Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Default Lesson Duration (hours)</label>
              <input
                type="number"
                defaultValue="2"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Base Lesson Price ($)</label>
              <input
                type="number"
                defaultValue="100"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notification Preferences</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                <option>Email</option>
                <option>SMS</option>
                <option>Both</option>
                <option>None</option>
              </select>
            </div>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm">
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderModal = () => {
    if (!modalOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {modalType === 'addUser' ? 'Add User' : 
               modalType === 'editUser' ? 'Edit User' : 
               modalType === 'addBooking' ? 'Schedule Lesson' : 
               modalType === 'editBooking' ? 'Edit Lesson' :
               modalType === 'addCourse' ? 'Add Course' : 'Edit Course'}
            </h3>
            <button onClick={closeModal}>
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          {modalType === 'addUser' || modalType === 'editUser' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              {modalType === 'addUser' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password || ''}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role || 'student'}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || 'Active'}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {formData.role === 'instructor' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Availability (e.g., Mon 9AM-12PM)</label>
                  <input
                    type="text"
                    name="availability"
                    value={formData.availability?.join(', ') || ''}
                    onChange={e => setFormData({ ...formData, availability: e.target.value.split(', ') })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Mon 9AM-12PM, Tue 1PM-4PM"
                  />
                </div>
              )}
              <button
                onClick={handleUserSubmit}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm"
              >
                Save
              </button>
            </div>
          ) : modalType === 'addBooking' || modalType === 'editBooking' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
                <select
                  name="course"
                  value={formData.course?._id || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
                <select
                  name="student"
                  value={formData.student?._id || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Student</option>
                  {users.filter(u => u.role === 'student').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Instructor</label>
                <select
                  name="instructor"
                  value={formData.instructor?._id || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Instructor</option>
                  {users.filter(u => u.role === 'instructor').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date ? new Date(formData.date).toISOString().slice(0, 16) : ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button
                onClick={handleBookingSubmit}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (hours)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Instructor</label>
                <select
                  name="instructor"
                  value={formData.instructor?._id || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Instructor</option>
                  {users.filter(u => u.role === 'instructor').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categories (comma-separated, e.g., B1 small cars, manual)</label>
                <input
                  type="text"
                  name="categories"
                  value={formData.categories || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="B1 small cars, manual, automatic, period"
                />
              </div>
              <button
                onClick={handleCourseSubmit}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'users': return renderUsers();
      case 'lessons': return renderLessons();
      case 'instructors': return renderInstructors();
      case 'courses': return renderCourses();
      case 'payments': return renderPayments();
      case 'analytics': return renderAnalytics();
      case 'reports': return renderReports();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">DriveSafe</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <nav className="mt-6">
          {sidebarItems.map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors ${
                  activeSection === item.id ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' : 'text-gray-600'
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
        <div className="fixed inset-0 bg-black bg-opacity-60 lg:hidden z-40" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3">
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                {activeSection === 'overview' ? 'Dashboard' : activeSection}
              </h2>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="relative p-1.5 text-gray-600 hover:text-gray-900">
                <AlertCircle className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-red-500"></span>
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
                  <p className="text-xs font-medium text-gray-900">{adminData.name}</p>
                  <p className="text-xs text-gray-500">{adminData.adminId}</p>
                </div>
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {adminData.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {renderContent()}
          {renderModal()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;