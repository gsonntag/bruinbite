'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function DishDetail() {
    const params = useParams();
    const router = useRouter();
    const dishId = params.id;
    
    const [dishRatings, setDishRatings] = useState([]);
    const [dishInfo, setDishInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDishData = async () => {
            try {
                //two endpoitns - one for ratings and other for fetching dish info
                const [ratingsResponse, dishResponse] = await Promise.all([
                    fetch(`http://localhost:8080/dishratings?dish_id=${dishId}`),
                    fetch(`http://localhost:8080/dish/${dishId}`)
                ]);
                
                if (!dishResponse.ok) {
                    throw new Error('error when fetching dish data');
                }
                
                const dishData = await dishResponse.json();
                setDishInfo(dishData.dish);
                
                if (ratingsResponse.ok) {
                    const ratingsData = await ratingsResponse.json();
                    setDishRatings(ratingsData);
                } else {
                    setDishRatings([]);
                }
                
            } catch (err) {
                console.log(err);
                setError(err);
            }
        };

        if (dishId) {
            fetchDishData();
        }
    }, [dishId]);

    //use error handning bc user could go to a slug that doesn't exist
    if (error) {
        return (
            <div>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-red-500 font-semibold">YIKES!! Dish not found</p>
                        <button 
                            onClick={() => router.push('/')}
                            className="mt-4 px-4 py-2 bg-[#0d92db] text-white rounded-md hover:bg-blue-700"
                        >
                            Go back to the homepage
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* dish info section */}
                <div className="mb-8">
                    <button 
                        onClick={() => router.back()}
                        className="mb-4 text-[#0d92db] hover:text-blue-600 flex items-center"
                    >
                        ← Back
                    </button>
                    

                    {dishInfo ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{dishInfo.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                {dishInfo.location && (
                                    <div className="flex items-center">
                                        <span className="font-medium">Location:</span>
                                        <span className="ml-1 text-[#0d92db]">{dishInfo.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <span className="font-medium">Average Rating:</span>
                                    <div className="ml-1 flex items-center">
                                        <span className="text-gray-700">
                                            {dishInfo.average_rating > 0 ? (
                                                <>
                                                <span className="text-yellow-500 mr-1">★</span>
                                                    {dishInfo.average_rating.toFixed(1)}/5
                                                    
                                                </>
                                            ) : (
                                                "No ratings yet"
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-medium">Total Reviews:</span>
                                    <span className="ml-1 text-gray-700">{dishRatings.length}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{dishInfo?.name || `Dish ${dishId}`}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <span className="font-medium">Average Rating:</span>
                                    <div className="ml-1 flex items-center">
                                        <span className="text-yellow-500 mr-1">★</span>
                                        <span className="text-gray-700">No ratings yet</span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-medium">Total Reviews:</span>
                                    <span className="ml-1 text-gray-700">0</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* reviews sections */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reviews</h2>
                    
                    {/* to do later: add filters for reviews */}

                    {dishRatings.length > 0 ? (
                        <div className="space-y-4">
                            {dishRatings.map((rating) => (
                                <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-800 mr-2">
                                                {rating.user.first_name} {rating.user.last_name}
                                            </span>
                                            <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                                                <span className="text-yellow-500 mr-1">★</span>
                                                <span className="text-sm font-medium text-blue-700">
                                                    {rating.score}/5
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(rating.created_at).toLocaleDateString()} at{' '}
                                            {new Date(rating.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    
                                    {rating.comment && (
                                        <p className="text-gray-700 mt-2 italic">"{rating.comment}"</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No reviews for this dish yet</p>
                            <button
                                onClick={() => router.push('/add-review')}
                                className="px-4 py-2 bg-[#0d92db] text-white rounded-md hover:bg-blue-600"
                            >
                                Add Review
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 