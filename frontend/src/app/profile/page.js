'use client';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';


// get user info from api
function getUserInfo() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch('http://localhost:8080/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        return response.json();
    });
}

export default function Profile() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const router = useRouter();

    // Check if user is logged in on component mount
    useEffect(() => {
        const token = localStorage.getItem('jwt');
        setIsLoggedIn(!!token);
        setAuthChecked(true); // Mark that auth check is complete
    }, []);

    // Only redirect after auth check is complete
    useEffect(() => {
        if (authChecked && !isLoggedIn) {
            console.log('Not logged in, redirecting...');
            router.push('/');
        }
    }, [authChecked, isLoggedIn, router]);

    // Fetch user info
    useEffect(() => {
        getUserInfo().then(data => {
            setUserInfo(data.user);
        });
    }, []);

    // Don't render anything until auth check completes
    if (!authChecked) {
        return null; // Or a loading indicator
    }

    return (
        <div>
            <Navbar />
            {userInfo && (
                <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-6 text-white">
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                                {userInfo.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center">{userInfo.username}</h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{userInfo.email}</p>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-500">Account Status</p>
                            <p className="font-medium">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                </span>
                            </p>
                        </div>
                        
                        <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                            Edit Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}