import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, allowedRole }: { children: JSX.Element; allowedRole: 'student' | 'instructor' | 'admin' }) => {
  const { user, isLoading } = useContext(AuthContext)!;
  console.log('ProtectedRoute: User:', user);
  if (isLoading) return <div className="text-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (user.role !== allowedRole) return <Navigate to="/" />;
  return children;
};

const App = () => {
  const { user } = useContext(AuthContext)!;
  console.log('App: User:', user);
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard/student"
          element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard/instructor"
          element={<ProtectedRoute allowedRole="instructor"><InstructorDashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard/admin"
          element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate to={`/dashboard/${user.role}`} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;