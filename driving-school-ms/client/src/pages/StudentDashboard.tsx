import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Car, 
  FileText, 
  CreditCard, 
  Award, 
  Bell, 
  Settings, 
  Download,
  Menu,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  MapPin,
  LogOut
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getCourses, getBookings } from '../api';

interface Course {
  _id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  instructor: { _id: string; name: string };
  createdAt: string;
}

interface Booking {
  _id: string;
  course: { _id: string; title: string };
  student: { _id: string; name: string };
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

interface ProgressItem {
  category: string;
  completed: number;
  total: 100;
  status: 'completed' | 'in-progress' | 'pending';
}

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext)!;
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const testData = {
    theoryTest: { status: 'Passed', score: '95/100', date: '2024-03-15' },
    practicalTest: { status: 'Scheduled', date: '2024-06-30', time: '10:00 AM' },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, bookingsRes] = await Promise.all([getCourses(), getBookings()]);
        setCourses(coursesRes);
        setBookings(bookingsRes);

        const progress: ProgressItem[] = [
          { category: 'Theory', completed: 100, total: 100, status: 'completed' },
          { category: 'Basic Driving', completed: 90, total: 100, status: 'in-progress' },
          { category: 'Highway Driving', completed: 75, total: 100, status: 'in-progress' },
          { category: 'Parking', completed: 60, total: 100, status: 'in-progress' },
          { category: 'Night Driving', completed: 0, total: 100, status: 'pending' },
        ];
        setProgressData(progress);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const studentData = {
    name: user?.name || 'N/A',
    email: user?.email || 'N/A',
    phone: '+1 (555) 123-4567',
    studentId: `DS-${new Date().getFullYear()}-${user?._id.slice(-4) || '0000'}`,
    enrollmentDate: new Date(user?.createdAt || Date.now()).toISOString().split('T')[0],
    instructor: courses[0]?.instructor?.name || 'N/A',
    totalLessons: courses.length,
    completedLessons: bookings.filter(b => b.status === 'confirmed').length,
    nextLesson: bookings[0]?.date ? new Date(bookings[0].date).toLocaleString() : 'None',
    theoryTestStatus: testData.theoryTest.status,
    practicalTestStatus: testData.practicalTest.status,
    licenseStatus: bookings.length >= courses.length ? 'Ready' : 'In Progress',
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'lessons', label: 'Lessons', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: BookOpen },
    { id: 'tests', label: 'Tests', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'certificate', label: 'Certificate', icon: Award },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const downloadLicense = () => {
    const content = `
      DRIVING SCHOOL CERTIFICATE
      
      Student Name: ${studentData.name}
      Student ID: ${studentData.studentId}
      Enrollment Date: ${studentData.enrollmentDate}
      
      Course Progress:
      - Theory Test: ${studentData.theoryTestStatus}
      - Practical Test: ${studentData.practicalTestStatus}
      - License Status: ${studentData.licenseStatus}
      
      Instructor: ${studentData.instructor}
      Completed Lessons: ${studentData.completedLessons}/${studentData.totalLessons}
      
      Generated on: ${new Date().toLocaleDateString()}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentData.name}_Certificate.txt`;
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Lessons</p>
                  <p className="text-xl font-semibold text-gray-900">{studentData.totalLessons}</p>
                </div>
                <Car className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Completed</p>
                  <p className="text-xl font-semibold text-emerald-600">{studentData.completedLessons}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Theory Test</p>
                  <p className="text-xl font-semibold text-emerald-600">{studentData.theoryTestStatus}</p>
                </div>
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">License Status</p>
                  <p className="text-xl font-semibold text-amber-600">{studentData.licenseStatus}</p>
                </div>
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Next Lesson</h3>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{studentData.nextLesson}</p>
                  <p className="text-xs text-gray-500">with {studentData.instructor}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={downloadLicense}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Certificate</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Lesson</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderLessons = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Upcoming Lessons</h3>
          <div className="space-y-3">
            {bookings.map((lesson) => (
              <div key={lesson._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-50 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lesson.course.title}</p>
                    <p className="text-xs text-gray-500">{new Date(lesson.date).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Instructor: {lesson.course.instructor?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                  <p className="text-xs text-gray-500 flex items-center sm:justify-end">
                    <MapPin className="h-3 w-3 mr-1" />
                    {lesson.course.title.includes('Highway') ? 'Highway Route 1' : 'Main Training Ground'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Learning Progress</h3>
          <div className="space-y-4">
            {progressData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-700">{item.category}</span>
                  <span className="text-xs text-gray-500">{item.completed}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      item.status === 'completed' ? 'bg-emerald-600' : 
                      item.status === 'in-progress' ? 'bg-indigo-600' : 'bg-gray-400'
                    }`}
                    style={{ width: `${item.completed}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTests = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Theory Test</h3>
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-600">{testData.theoryTest.status}</span>
            </div>
            <p className="text-xs text-gray-500">Score: {testData.theoryTest.score}</p>
            <p className="text-xs text-gray-500">Date: {testData.theoryTest.date}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Practical Test</h3>
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-600">{testData.practicalTest.status}</span>
            </div>
            <p className="text-xs text-gray-500">Date: {testData.practicalTest.date}</p>
            <p className="text-xs text-gray-500">Time: {testData.practicalTest.time}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={studentData.name}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={studentData.email}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="tel" 
                  value={studentData.phone}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student ID</label>
                <input 
                  type="text" 
                  value={studentData.studentId}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Enrollment Date</label>
                <input 
                  type="text" 
                  value={studentData.enrollmentDate}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Instructor</label>
                <input 
                  type="text" 
                  value={studentData.instructor}
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
      case 'overview': return renderOverview();
      case 'lessons': return renderLessons();
      case 'progress': return renderProgress();
      case 'tests': return renderTests();
      case 'payments': return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Payment History</h3>
          <p className="text-sm text-gray-500">Payment records and billing information will be displayed here.</p>
        </div>
      );
      case 'certificate': return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Certificate & License</h3>
          <div className="text-center py-6">
            <Award className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Your driving certificate will be available once you complete all requirements.</p>
            <button 
              onClick={downloadLicense}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download Certificate</span>
            </button>
          </div>
        </div>
      );
      case 'profile': return renderProfile();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">DriveSafe</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 lg:hidden z-40" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-3"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                {activeSection === 'overview' ? 'Dashboard' : activeSection}
              </h2>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="relative p-1.5 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
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
                  <p className="text-xs font-medium text-gray-900">{studentData.name}</p>
                  <p className="text-xs text-gray-500">{studentData.studentId}</p>
                </div>
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {studentData.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;