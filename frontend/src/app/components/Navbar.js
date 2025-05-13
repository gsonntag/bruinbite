'use client';
import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import Link from 'next/link';
import Image from 'next/image';
import { logout } from '../services/auth';
import toast from 'react-hot-toast';

export default function Navbar() {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check if user is logged in on component mount
    useEffect(() => {
        const token = localStorage.getItem('jwt');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setIsLoggedIn(false);
            toast.success('Successfully logged out');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Failed to log out');
        }
    };

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        setShowLoginForm(false);
        toast.success('Successfully logged in');
    };

    return (
        <div>
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="BruinBite Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <span className="text-xl font-bold text-[#0d92db]">
                            BruinBite
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className={`px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300`}>Add a Review</button>
                        {isLoggedIn ? (
                            <button 
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                Log Out
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowLoginForm(true)} 
                                className="bg-[#0d92db] hover:bg-sky-600 text-white px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300"
                            >
                                Log In / Sign Up
                            </button>
                        )}
                    </div>
                </div>
            </header>
            {showLoginForm && <LoginForm onClose={() => setShowLoginForm(false)} onLoginSuccess={handleLoginSuccess} />}
        </div>
    )
}