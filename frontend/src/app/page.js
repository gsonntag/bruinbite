'use client';
import { useState } from 'react';
import LoginForm from './components/LoginForm';

export default function Home() {
  const [showLoginForm, setShowLoginForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="text-center px-4">
        <h1 className="text-6xl font-bold mb-6">
          BruinBite 🐻 💛 💙
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Your favorite UCLA food companion
        </p>
        <button
          onClick={() => setShowLoginForm(true)}
          className="bg-blue-200 text-black px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 hover:text-white transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Login / Sign Up
        </button>
      </main>
      {showLoginForm && <LoginForm onClose={() => setShowLoginForm(false)} />}
    </div>
  );
}
