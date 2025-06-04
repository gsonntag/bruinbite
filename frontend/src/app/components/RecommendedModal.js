'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDisplayName } from '../utils/hallMaps';

export function RecommendedModal({ isOpen, onClose }) {
    const [recHallsData, setRecHallsData] = useState([]);
    const [error, setError] = useState('');
    const router = useRouter();

    const fetchRecHallsData = async () => {
        setError('');
        
        try {
            const token = localStorage.getItem('jwt');
            if (!token) {
                setError('You are not logged in! Log in to view recommendations.');
                return;
            }

            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/recommended', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('You are not logged in! Log in to view recommendations.');
                } else {
                    setError('Failed to fetch recommendations... Please try again later.');
                }
                return;
            }

            const data = await response.json();
            if (data.message) {
                //If backend returns message, set to error (such as no dining halls avail rn)
                setError(data.message);
                setRecHallsData([]);
            } else {
                setRecHallsData(data.halls || []);
            }
        } catch (error) {
            console.log(error);
            setError('Failed to fetch recommendations... Please try again later.');
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRecHallsData();
        } else {
            setRecHallsData([]);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDishClick2 = (dish) => {
        router.push(`/dish/${dish.id.toString()}`);
      };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0d92db]">
                        Recommended Dining Halls
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error ? (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                ) : recHallsData.length === 0 ? (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        No recommendations available right now. Check again later!
                    </div>
                ) : (
                    <div className="space-y-6">
                        {recHallsData.map((hallData, index) => (
                            <div key={hallData.hall.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        #{index+1} {getDisplayName(hallData.hall.name)}
                                    </h3>
                                    <div className="text-right">
                                        <div className="flex items-center">
                                            <span className="text-yellow-500 mr-1">★</span>
                                            <span className="font-medium">
                                                {hallData.score.toFixed(1)}/5.0
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {hallData.top_dishes && hallData.top_dishes.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                                            Top Rated Dishes:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {hallData.top_dishes.map((dish) => (
                                                <span
                                                    key={dish.id}
                                                    className="cursor-pointer bg-[#47b7f4] font-semibold text-white text-xs px-2 py-1 rounded-full"
                                                    onClick={() => handleDishClick2(dish)}
                                                >
                                                    {dish.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="cursor-pointer bg-zinc-300 hover:bg-zinc-400 text-gray-700 font-medium py-2 px-6 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
} 