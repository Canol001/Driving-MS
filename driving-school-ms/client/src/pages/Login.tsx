import { FormEvent, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginUser } from '../api/index';
import bgVideo from '../assets/videos/animated-bg.mp4';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext)!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const video = document.querySelector('video');
    video?.addEventListener('error', (e) => console.error('Video loading error:', e));
    video?.addEventListener('loadeddata', () => console.log('Video loaded successfully'));
    return () => {
      video?.removeEventListener('error', () => {});
      video?.removeEventListener('loadeddata', () => {});
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser({ email, password });

      console.log('Login.tsx: API login response:', response);

      const { token, _id, name, email: userEmail, role } = response;

      if (!token || !_id || !name || !userEmail || !role) {
        throw new Error('Invalid user data');
      }

      const userData = {
        _id,
        name,
        email: userEmail,
        role
      };

      login(userData, token);

      // 🔁 Redirect based on role
      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'instructor') navigate('/dashboard/instructor');
      else if (role === 'student') navigate('/dashboard/student');
      else navigate('/');

    } catch (err: any) {
      console.error('Login.tsx: Error:', err.message || err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black bg-opacity-50 z-0" />

      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto p-8 bg-white rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-extrabold mb-4 text-center text-gray-900">Welcome Back!</h2>
        <p className="text-gray-500 mb-6 text-center">Login to your driving school account</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
              Register here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
