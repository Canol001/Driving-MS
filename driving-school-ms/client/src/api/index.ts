import axios, { AxiosInstance } from 'axios';

// 🌟 Interface Definitions
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

interface AuthResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
  };
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

interface Booking {
  _id: string;
  course: { _id: string; title: string };
  student: { _id: string; name: string };
  instructor: { _id: string; name: string };
  date: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'missed';
  createdAt: string;
  notes?: string;
  progress?: { observations: string; skills: { skill: string; rating: number }[] };
  issues?: { remarks: string; type: 'student_absent' | 'vehicle_issue' | 'behavior' | 'other' };
}

interface Payment {
  _id: string;
  booking: { _id: string; course: { title: string } };
  user: { _id: string; name: string };
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  date: string;
}

interface AnalyticsData {
  totalStudents: number;
  totalInstructors: number;
  activeLessons: number;
  completionRate: string;
}

interface Notification {
  _id: string;
  message: string;
  type: 'booking_new' | 'booking_updated' | 'admin_message';
  read: boolean;
  createdAt: string;
}

interface StudentProfile {
  student: { _id: string; name: string; email: string; package: string };
  progress: {
    course: string;
    status: string;
    progress?: {
      observations: string;
      skills: { skill: string; rating: number }[];
    };
  }[];
  sessionsRemaining: number;
}

// 🔧 Axios Instance Setup
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// 🔐 JWT Interceptor
api.interceptors.request.use((config) => {
  const publicRoutes = ['/users/login', '/users/register'];
  if (!publicRoutes.includes(config.url || '')) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage for:', config.url);
    }
  }
  return config;
});

// ❌ Global Error Handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error(`🔥 API error for ${error.config?.url}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    throw error;
  }
);

// 👤 Auth
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  status?: 'Active' | 'Inactive';
  availability?: { day: string; time: string }[];
}): Promise<User> => await api.post('/users/register', data);

export const login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await api.post('/users/login', data);
  console.log('✅ Login response:', response);
  return response;
};

// 👥 Users
export const getUsers = async (): Promise<User[]> => await api.get('/users');
export const updateUser = async (id: string, data: Partial<User>): Promise<User> =>
  await api.put(`/users/${id}`, data);
export const deleteUser = async (id: string): Promise<void> =>
  await api.delete(`/users/${id}`);

// 📚 Courses
export const getCourses = async (): Promise<Course[]> => await api.get('/courses');
export const createCourse = async (data: {
  title: string;
  description: string;
  duration: number;
  price: number;
  instructor: string;
  categories: string[];
}): Promise<Course> => await api.post('/courses', data);
export const updateCourse = async (id: string, data: Partial<Course>): Promise<Course> =>
  await api.put(`/courses/${id}`, data);
export const deleteCourse = async (id: string): Promise<void> =>
  await api.delete(`/courses/${id}`);

// 📆 Bookings
export const getBookings = async (): Promise<Booking[]> => await api.get('/bookings');
export const createBooking = async (data: {
  course: string;
  student: string;
  instructor: string;
  date: string;
  status?: string;
}): Promise<Booking> => await api.post('/bookings', data);
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<Booking> =>
  await api.put(`/bookings/${id}`, data);
export const cancelBooking = async (id: string): Promise<Booking> =>
  await api.put(`/bookings/cancel/${id}`);

// 💰 Payments
export const getPayments = async (): Promise<Payment[]> => await api.get('/payments');
export const processPayment = async (id: string): Promise<Payment> =>
  await api.put(`/payments/process/${id}`);
export const refundPayment = async (id: string): Promise<Payment> =>
  await api.put(`/payments/refund/${id}`);

// 📊 Analytics
export const getAnalytics = async (): Promise<AnalyticsData> => await api.get('/analytics');

// 🧑‍🏫 Instructor Endpoints
export const getSchedule = async (filters: {
  startDate?: string;
  endDate?: string;
  studentId?: string;
}): Promise<Booking[]> => await api.get('/instructor/schedule', { params: filters });

export const updateLessonStatus = async (data: {
  bookingId: string;
  status: string;
  notes?: string;
  progress?: { observations: string; skills: { skill: string; rating: number }[] };
}): Promise<Booking> => await api.put('/instructor/lesson', data);

export const reportIssue = async (data: {
  bookingId: string;
  remarks: string;
  type: string;
}): Promise<Booking> => await api.post('/instructor/report', data);

export const updateAvailability = async (data: {
  availability: { day: string; startTime: string; endTime: string }[];
}): Promise<User> => await api.put('/instructor/availability', data);

export const getNotifications = async (): Promise<Notification[]> => await api.get('/instructor/notifications');

export const getStudentProfile = async (studentId: string): Promise<StudentProfile> =>
  await api.get(`/instructor/student/${studentId}`);

export const sendMessage = async (data: {
  recipientId: string;
  message: string;
}): Promise<{ message: string }> => await api.post('/instructor/message', data);
