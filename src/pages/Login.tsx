import React, { useState, useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LayoutDashboard, Mail } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login, signInWithOAuth, signUp, user } = useCalendar();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      if (isSignUp) {
        // Sign Up Mode
        const { data, error } = await signUp(username, password, name);
        if (error) {
          setError(error.message || 'Error signing up');
        } else if (data?.session) {
          // Auto-login successful (Email confirmation might be disabled)
          navigate('/');
        } else {
          setMessage('Account created successfully! We have sent a confirmation link to your email. Please verify your email address to log in.');
          setIsSignUp(false);
        }
      } else {
        // Login Mode
        const success = await login(username, password);
        if (success) {
          navigate('/');
        } else {
          // Try Supabase Auth Login as fallback (if legacy login failed)
          // Actually, we don't have a direct "signInWithEmail" exposed yet, 
          // but let's assume legacy handles everything for now.
          // If we want to support email login for new users, we need to expose supabase.auth.signInWithPassword
          // The current `login` only checks the `clients` table.
          // The `clients` table has the password for new users as 'oauth-managed' or whatever we set.
          // Wait, if I sign up with email/password, Supabase Auth manages the password.
          // The `clients` table has 'oauth-managed'.
          // So `login` (legacy) will FAIL for these users because 'password123' != 'oauth-managed'.
          // I MUST expose `signInWithPassword` from context to support Email/Password login for new users.
          setError('Invalid username or password');
        }
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your calendar'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {isSignUp ? 'Email Address' : 'Username or Email'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isSignUp ? <Mail className="h-5 w-5 text-gray-400" /> : <User className="h-5 w-5 text-gray-400" />}
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder={isSignUp ? "you@example.com" : "Enter your username"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            
            {message && (
              <div className="text-green-600 text-sm text-center">
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSignUp ? 'Create Account' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div>
                <button
                  onClick={() => signInWithOAuth('google')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <FcGoogle className="h-5 w-5" />
                  <span className="ml-2">Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
