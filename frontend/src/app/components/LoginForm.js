'use client';
import { useState } from 'react';
import { login, signup } from "../services/auth";

export default function LoginForm({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const isValidName = (name) => {
    const nameRegex = /^[a-zA-Z0-9._-]+$/;
    return nameRegex.test(name);
  };

  const handleSubmit = async (e) => {
    console.log('Handle submit')
    e.preventDefault();
    setError(''); // Clear any previous errors

    if (!isValidName(formData.username) && !isValidEmail(formData.username)) {
      setError('Special characters are not allowed!');
      return;
    }

    if (!isValidEmail(formData.username) &&
      (formData.username.length < 3 || formData.username.length > 16)) {
        setError('Username must be a valid email or 3–16 characters long');
        return;
    }

    // we only care if the user is signing up, otherwise `confirmPassword` will be blank
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    try {
      if (isLogin) {
        // pre-existing login, use `username` to represent either username or email (whatever the user enters)
        await login(formData.username, formData.password)
      } else {
        // submitting register form
        await signup(formData.username, formData.email, formData.password)
      }
      onClose(); // Close the form on successful login/signup
    } catch (error) {
      if (error.message.includes('already exists')) {
        setError('An account with this email already exists');
      } else if (error.message.includes('Login failed')) {
        setError('Invalid email or password');
      } else {
        setError(error.message || 'An error occurred. Please try again.');
      }
    }
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      // change later if needed, kinda placeholder

      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-2xl w-full max-w-sm mx-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-light text-gray-900 ">
            {isLogin ? 'Login' : 'Sign up'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div>
            <input
              type="username"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={isLogin ? "Username or email" : "Username"}
              className="w-full px-4 py-3 bg-gray-50  border-0 rounded-lg text-gray-900  placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="w-full px-4 py-3 bg-gray-50  border-0 rounded-lg text-gray-900  placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          )}

          <div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-50  border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full px-4 py-3 bg-gray-50  border-0 rounded-lg text-gray-900  placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0d92db] text-white py-3 rounded-lg font-medium hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-500 hover:text-gray-700   transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}