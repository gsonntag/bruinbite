'use client';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useRouter } from 'next/navigation';
import Rating from '../components/Rating';


const getFriendRatings = () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch(process.env.NEXT_PUBLIC_API_URL + '/friendratings', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch friend ratings');
        }
        return response.json();
    });
};

export default function Feed() {
    const [friendRatings, setFriendRatings] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchFriendRatings = async () => {
            const data = await getFriendRatings();
            setFriendRatings(data);
        };

        fetchFriendRatings();
    }, []);
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#0d92db] mb-8 text-center">Friend Ratings</h1>
                    {friendRatings.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <p className="text-gray-500 mb-4">No ratings from friends yet</p>
                            <p className="text-sm text-gray-400">Connect with friends to see their dining hall reviews!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {friendRatings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((rating) => (
                                <Rating key={rating.id} rating={rating} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}