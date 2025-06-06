'use client';
import { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import Link from 'next/link';
import { logout } from '../services/auth';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navbar() {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const pathname = usePathname();

    // Check if user is logged in on component mount
    useEffect(() => {
        const token = localStorage.getItem('jwt');
        setIsLoggedIn(!!token);
        
        // Fetch user info if logged in
        if (token) {
            fetchUserInfo();
        }
    }, []);

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem('jwt');
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/userinfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Handle both response formats: { user: {...} } or direct user object
                const userData = data.user || data;
                setUserInfo(userData);
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }
    };

    // Close the dropdown and mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Get the mobile menu button element
            const mobileMenuButton = event.target.closest('button[aria-label="Menu"]');
            
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !mobileMenuButton) {
                setShowMobileMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef, mobileMenuRef]);

    const handleLogout = async () => {
        try {
            await logout();
            setIsLoggedIn(false);
            setUserInfo(null);
            setShowDropdown(false);
            setShowMobileMenu(false);
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
        fetchUserInfo(); // Fetch user info after login
        toast.success('Successfully logged in');
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    }

    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
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
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {isLoggedIn && (
                            <><Link href="/add-review">
                                <button className="px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300">
                                    Add a Review
                                </button>
                            </Link><Link href="/feed">
                                    <button className="px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300">
                                        Feed
                                    </button>
                                </Link></>
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
                                        {userInfo?.profile_picture ? (
                                            <img
                                                src={process.env.NEXT_PUBLIC_API_URL + `${userInfo.profile_picture}`}
                                                alt="Profile Picture"
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-[#0d92db] flex items-center justify-center text-white text-sm font-medium">
                                                {userInfo?.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span>Profile</span>
                                    </button>
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</Link>
                                            <Link href="/ratings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Ratings</Link>
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 rounded-md hover:bg-gray-100"
                        aria-label="Menu"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {showMobileMenu ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Mobile Menu */}
                    {showMobileMenu && (
                        <div
                            ref={mobileMenuRef}
                            className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 md:hidden"
                        >
                            <div className="px-4 py-3 space-y-3">
                                <Link href="/menus" onClick={() => setShowMobileMenu(false)}>
                                    <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                                        Menus
                                    </button>
                                </Link>
                                {isLoggedIn ? (
                                    <>
                                        <Link href="/add-review" onClick={() => setShowMobileMenu(false)}>
                                            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                                                Add a Review
                                            </button>
                                        </Link>
                                        <Link href="/feed" onClick={() => setShowMobileMenu(false)}>
                                            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                                                Feed
                                            </button>
                                        </Link>
                                        <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
                                            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                                                My Profile
                                            </button>
                                        </Link>
                                        <Link href="/ratings" onClick={() => setShowMobileMenu(false)}>
                                            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                                                My Ratings
                                            </button>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-red-600"
                                        >
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowMobileMenu(false);
                                            setShowLoginForm(true);
                                        }}
                                        className="w-full text-center px-3 py-2 text-sm rounded-md bg-[#0d92db] text-white hover:bg-sky-600"
                                    >
                                        Log In / Sign Up
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>
            {showLoginForm && <LoginForm onClose={() => setShowLoginForm(false)} onLoginSuccess={handleLoginSuccess} />}
        </div>
    );
}