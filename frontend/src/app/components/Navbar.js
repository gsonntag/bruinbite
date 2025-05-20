'use client';
import { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import Link from 'next/link';
import Image from 'next/image';
import { logout } from '../services/auth';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const pathname = usePathname();

    // Check if user is logged in on component mount
    useEffect(() => {
        const token = localStorage.getItem('jwt');
        setIsLoggedIn(!!token);
    }, []);

    // Close the dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = async () => {
        try {
            await logout();
            setIsLoggedIn(false);
            toast.success('Successfully logged out');
            window.location.href = '/'; // Redirect to home page after logout
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

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    }

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
                        {isLoggedIn && pathname !== '/add-review' && (
                            <Link href="/add-review">
                                <button className="px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300">
                                    Add a Review
                                </button>
                            </Link>
                        )}
                        <Link href="/menus">
                            <button className="px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300">
                                Menus
                            </button>
                        </Link>
                        {isLoggedIn ? (
                            // profile picture with dropdown
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={toggleDropdown}
                                        className="flex items-center gap-2 px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300"
                                    >
                                        <Image
                                            src="/profile-pic.png"
                                            alt="Profile Picture"
                                            width={32}
                                            height={32}
                                            className="h-8 w-8 rounded-full"
                                        />
                                        <span>Profile</span>
                                    </button>
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</Link>
                                            <Link href="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Favorites</Link>
                                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log Out</button>
                                        </div>
                                    )}
                                </div>
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
    );
}