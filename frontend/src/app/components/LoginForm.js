'use client';
import { useState } from 'react';
import { login, signup } from "../services/auth";

export default function LoginForm({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    console.log('Handle submit')
    e.preventDefault();

    if (formData.username.length < 3 || formData.username.length > 16) {
      // invalid length
      return
    }

    // TODO: use regex matching to check validity ()

    // we only care if the user is signing up, otherwise `confirmPassword` will be blank
    if (!isLogin && formData.password !== formData.confirmPassword) {
      // TODO: put a visually appealing error 
      return
    }

    if (isLogin) {
      // pre-existing login, use `username` to represent either username or email (whatever the user enters)
      await login(formData.username, formData.password)
    } else {
      // submitting register form
      const res = await signup(formData.username, formData.email, formData.password)
      console.log(`response=${res}`)
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl w-full max-w-sm mx-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-light text-gray-900 dark:text-white">
            {isLogin ? 'Login' : 'Sign up'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form>
          <div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          <div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}