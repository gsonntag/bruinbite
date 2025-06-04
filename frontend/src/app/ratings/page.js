'use client';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useRouter } from 'next/navigation';


function getUserRatings() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch(process.env.NEXT_PUBLIC_API_URL + '/userratings', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user ratings');
        }
        return response.json();
    });
}


export default function Ratings() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userRatings, setUserRatings] = useState(null);
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

    // Fetch user ratings
    useEffect(() => {
        getUserRatings().then(data => {
            if (data) {
                // Sort ratings by created_at date (most recent first)
                const sortedRatings = data.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                setUserRatings(sortedRatings);
            } else {
                setUserRatings(data);
            }
        });
    }, []);

    // Don't render anything until auth check completes
    if (!authChecked) {
        return null; // Or a loading indicator
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Ratings</h1>
                    <p className="text-gray-600">View and manage all your dish ratings</p>
                </div>
                
                {userRatings && userRatings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userRatings.map(rating => (
                            <div key={rating.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800 leading-tight">{rating.dish.name}</h2>
                                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md ml-3 flex-shrink-0">
                                            <span className="text-yellow-500 mr-1">★</span>
                                            <span className="text-sm font-medium text-blue-700">{rating.score}/5</span>
                                        </div>
                                    </div>
                                    
                                    {rating.comment && (
                                        <div className="mb-4">
                                            <p className="text-gray-700 text-sm italic">{rating.comment}</p>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 w-20">Location:</span>
                                            <span className="text-[#0d92db]">{rating.dish.location}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 w-20">Rated:</span>
                                            <span>{new Date(rating.created_at).toLocaleDateString()} at {new Date(rating.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 w-20">Last Seen:</span>
                                            <span>{new Date(rating.dish.last_seen_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No ratings found</h3>
                            <p className="text-gray-600 mb-4">You haven&apos;t rated any dishes yet.</p>
                            <button
                                onClick={() => router.push('/add-review')}
                                className="px-4 py-2 bg-[#0d92db] text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                Add Your First Rating
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}