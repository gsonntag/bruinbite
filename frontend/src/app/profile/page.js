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

// get friends list from api
function getFriendsList() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch('http://localhost:8080/friends', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch friends list');
        }
        return response.json();
    });
}


// get friend requests from api
function getFriendRequests() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch('http://localhost:8080/in-friend-requests', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch friend requests');
        }
        return response.json();
    });
}

// Accept friend request
function acceptFriendRequest(requestId) {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch('http://localhost:8080/accept-friend-request', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to accept friend request');
        }
        return response.json();
    });
}

// Decline friend request
function declineFriendRequest(requestId) {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch('http://localhost:8080/decline-friend-request', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to decline friend request');
        }
        return response.json();
    });
}

// send friend request
function sendFriendRequest(userId) {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch('http://localhost:8080/send-friend-request', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friend_id: userId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send friend request');
        }
        return response.json();
    });
}

// Search for other users to add as friends
function searchUsers(keyword) {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch(`http://localhost:8080/search-users?username=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to search for users');
        }
        return response.json();
    });
}

export default function Profile() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'friends', 'requests', 'search'
    const [loading, setLoading] = useState(true);
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
        if (isLoggedIn) {
            Promise.all([
                getUserInfo(),
                getFriendsList(),
                getFriendRequests()
            ]).then(([userResponse, friendsResponse, requestsResponse]) => {
                if (userResponse) setUserInfo(userResponse.user);
                if (friendsResponse) setFriendsList(friendsResponse.friends || []);
                if (requestsResponse) {
                    setFriendRequests(requestsResponse.requests || []);
                    console.log('Friend requests:', requestsResponse.requests);
                }
                setLoading(false);
            }).catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
        }
    }, [isLoggedIn]);

    // Search for users to add as friends
    useEffect(() => {
        if (searchQuery.length > 1) {
            const timeoutId = setTimeout(async () => {
                try {
                    const response = await searchUsers(searchQuery);
                    setSearchResults(response || []);
                } catch (error) {
                    console.error('Error searching for users:', error);
                }
            }, 350);
            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleAcceptRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId);
            // Refresh data
            const [friendsResponse, requestsResponse] = await Promise.all([
                getFriendsList(),
                getFriendRequests()
            ]);
            if (friendsResponse) setFriendsList(friendsResponse.friends || []);
            if (requestsResponse) setFriendRequests(requestsResponse.requests || []);
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const handleSendFriendRequest = async (userId) => {
        try {
            await sendFriendRequest(userId);
            // Optionally refresh search results or show a success message
            const response = await searchUsers(searchQuery);
            setSearchResults(response || []);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            await declineFriendRequest(requestId);
            // Refresh requests
            const requestsResponse = await getFriendRequests();
            if (requestsResponse) setFriendRequests(requestsResponse.requests || []);
        } catch (error) {
            console.error('Error declining friend request:', error);
        }
    };

    // Don't render anything until auth check completes
    if (!authChecked || loading) {
        return (
            <div>
                <Navbar />
                <div className="max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-lg p-6">
                    <p className="text-gray-500 text-center">Loading...</p>
                </div>
            </div>
        );
    }

    const renderProfileSection = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <div className="h-24 w-24 rounded-full bg-[#0d92db] flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
                    {userInfo?.username?.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{userInfo?.username}</h1>
                <p className="text-gray-600">{userInfo?.email}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-[#0d92db] mb-1">{friendsList.length}</div>
                    <div className="text-sm text-gray-600">Friends</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-[#0d92db] mb-1">{friendRequests.length}</div>
                    <div className="text-sm text-gray-600">Pending Requests</div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-gray-700">Account Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                    </span>
                </div>
                <button className="w-full bg-[#0d92db] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Edit Profile
                </button>
            </div>
        </div>
    );

    const renderFriendsSection = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Friends ({friendsList.length})</h2>
            {friendsList.length > 0 ? (
                <div className="space-y-4">
                    {friendsList.map(friend => (
                        <div key={friend.ID} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-full bg-[#0d92db] flex items-center justify-center text-white font-medium">
                                    {friend.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{friend.username}</p>
                                    <p className="text-sm text-gray-500">{friend.email}</p>
                                </div>
                            </div>
                            <button className="text-[#0d92db] hover:text-blue-600 text-sm font-medium"
                                onClick={() => router.push(`/profile/${friend.username}`)}
                            >
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No friends yet</p>
                    <p className="text-sm text-gray-400">Start connecting with other BruinBite users!</p>
                </div>
            )}
        </div>
    );

    const renderRequestsSection = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Friend Requests ({friendRequests.length})</h2>
            {friendRequests.length > 0 ? (
                <div className="space-y-4">
                    {friendRequests.map(request => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-full bg-[#0d92db] flex items-center justify-center text-white font-medium">
                                    {request.from_user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{request.from_user.username}</p>
                                    <p className="text-sm text-gray-500">{request.from_user.email}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleAcceptRequest(request.id)}
                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors"
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => handleDeclineRequest(request.id)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No pending requests</p>
                    <p className="text-sm text-gray-400">Friend requests will appear here</p>
                </div>
            )}
        </div>
    );

    const renderSearchSection = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Find Friends</h2>
            <div className="mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for users by username..."
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            {searchQuery.length > 1 && (
                <div>
                    {searchResults.length > 0 ? (
                        <div className="space-y-4">
                            {searchResults.map(user => (
                                <div key={user.ID} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 rounded-full bg-[#0d92db] flex items-center justify-center text-white font-medium">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        className="px-4 py-2 bg-[#0d92db] hover:bg-blue-600 text-white text-sm rounded-md transition-colors"
                                        onClick={() => handleSendFriendRequest(user.ID)}
                                    >
                                        Add Friend
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No users found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Page title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
                    <p className="text-gray-600 mt-2">Manage your account and connect with friends</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'profile'
                                        ? 'border-[#0d92db] text-[#0d92db]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'friends'
                                        ? 'border-[#0d92db] text-[#0d92db]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Friends ({friendsList.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'requests'
                                        ? 'border-[#0d92db] text-[#0d92db]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Requests 
                                {friendRequests.length > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {friendRequests.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('search')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'search'
                                        ? 'border-[#0d92db] text-[#0d92db]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Find Friends
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content based on active tab */}
                <div className="max-w-2xl mx-auto">
                    {activeTab === 'profile' && userInfo && renderProfileSection()}
                    {activeTab === 'friends' && renderFriendsSection()}
                    {activeTab === 'requests' && renderRequestsSection()}
                    {activeTab === 'search' && renderSearchSection()}
                </div>
            </div>
        </div>
    );
}