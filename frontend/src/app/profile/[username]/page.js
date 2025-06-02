'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Rating from '../../components/Rating';
import { useParams, useRouter } from 'next/navigation';



// get user info from api
function getUserInfo(username) {
    return fetch(`http://localhost:8080/user/${username}`, {
        method: 'GET',
        headers: {
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

// get user ratings from api
function getUserRatings(username) {
    return fetch(`http://localhost:8080/user/${username}/ratings`, {
        method: 'GET',
        headers: {
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

export default function Profile() {
    const [userInfo, setUserInfo] = useState(null);
    const [userRatings, setUserRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const username = params.username;

    // Fetch user info
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const userData = await getUserInfo(username);
                setUserInfo(userData.user);
                const ratingsData = await getUserRatings(username);
                setUserRatings(ratingsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user info:', error);
                setLoading(false);
            }
        };
        fetchUserInfo();
    }, [username]);

    

    const renderProfileSection = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <div className="h-24 w-24 rounded-full bg-[#0d92db] flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
                    {userInfo?.username?.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{userInfo?.username}</h1>
                <p className="text-gray-600">{userInfo?.email}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-gray-700">Account Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Page title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
                </div>

                {/* Content based on active tab */}
                <div className="max-w-2xl mx-auto">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <p className="text-gray-600">Loading profile...</p>
                        </div>
                    ) : userInfo ? (
                        renderProfileSection()
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6 text-center">
                            <p className="text-red-600">User not found</p>
                        </div>
                    )}
                </div>

                {/* User Ratings Section */}
                <div className="max-w-2xl mx-auto mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Ratings</h2>
                    {userRatings.length === 0 ? (
                        <p className="text-gray-600">No ratings yet</p>
                    ) : (
                        <div className="space-y-6">
                            {userRatings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rating) => (
                                <Rating key={rating.id} rating={rating} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}