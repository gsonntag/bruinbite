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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                    <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                        {userInfo?.username?.charAt(0).toUpperCase()}
                    </div>
                </div>
                <h2 className="text-xl font-bold text-center">{userInfo?.username}</h2>
            </div>
            
            <div className="p-6">
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{userInfo?.email}</p>
                </div>
                
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className="font-medium">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                        </span>
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{friendsList.length}</p>
                        <p className="text-sm text-gray-600">Friends</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{friendRequests.length}</p>
                        <p className="text-sm text-gray-600">Pending Requests</p>
                    </div>
                </div>
                
                <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Edit Profile
                </button>
            </div>
        </div>
    );

    const renderFriendsSection = () => (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Friends ({friendsList.length})</h3>
            </div>
            <div className="p-6">
                {friendsList.length > 0 ? (
                    <div className="space-y-3">
                        {friendsList.map(friend => (
                            <div key={friend.ID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                        {friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{friend.username}</p>
                                        <p className="text-sm text-gray-500">{friend.email}</p>
                                    </div>
                                </div>
                                <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                                    View Profile
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No friends yet</p>
                        <p className="text-sm text-gray-400">Start connecting with other BruinBite users!</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderRequestsSection = () => (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Friend Requests ({friendRequests.length})</h3>
            </div>
            <div className="p-6">
                {friendRequests.length > 0 ? (
                    <div className="space-y-3">
                        {friendRequests.map(request => (
                            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                                        {request.from_user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{request.from_user.username}</p>
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
                        <p className="text-gray-500">No pending requests</p>
                        <p className="text-sm text-gray-400">Friend requests will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSearchSection = () => (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Search</h3>
            </div>
            <div className="p-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a BruinBite user"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                />
                {searchQuery.length > 1 && (
                    <div className="mt-4">
                        {searchResults.length > 0 ? (
                            <div className="space-y-3">
                                {searchResults.map(user => (
                                    <div key={user.ID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.username}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors"
                                            onClick={() => handleSendFriendRequest(user.ID)}
                                        >
                                            Send Friend Request
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No users found</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto pt-8 px-4">
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'friends'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Friends ({friendsList.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'requests'
                                        ? 'border-blue-500 text-blue-600'
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
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Search Users
                            </button>
                            
                        </nav>
                    </div>
                </div>

                {/* Content based on active tab */}
                <div className="pb-8">
                    {activeTab === 'profile' && userInfo && renderProfileSection()}
                    {activeTab === 'friends' && renderFriendsSection()}
                    {activeTab === 'requests' && renderRequestsSection()}
                    {activeTab === 'search' && renderSearchSection()}
                </div>
            </div>
        </div>
    );
}