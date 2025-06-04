'use client';
import { useState, useEffect, Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { useRouter, useSearchParams } from 'next/navigation';

// Same mappings as in menus page
const hallApiNameToFormName = {
    'bruin-plate': 'Bruin Plate',
    'de-neve-dining': 'De Neve Dining',
    'epicuria-at-covel': 'Epicuria at Covel',
    'bruin-cafe': 'Bruin Cafe',
    'cafe-1919': 'Cafe 1919',
    'epicuria-at-ackerman': 'Epicuria at Ackerman',
    'rendezvous': 'Rendezvous',
    'the-drey': 'The Drey',
    'the-study-at-hedrick': 'The Study at Hedrick',
    'spice-kitchen': 'Spice Kitchen'
};

const mealPeriodNames = {
    'BREAKFAST': 'Breakfast',
    'LUNCH': 'Lunch',
    'DINNER': 'Dinner',
    'ALL_DAY': 'All Day',
    'LUNCH_DINNER': 'Lunch & Dinner'
};

// get user info from api (same logic as profile/page.js)
function getUserInfo() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        return null;
    }
    return fetch(process.env.NEXT_PUBLIC_API_URL + '/userinfo', {
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

// get valid meal periods for a certain day given a hall
async function getMealPeriods(hall_name, month, day, year) {
    const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `/hall-meal-periods?hall_name=${hall_name}&month=${month}&day=${day}&year=${year}`
    );
    if (!res.ok) throw new Error('Failed to fetch meal periods');
    return res.json();
}

// get menu from api to show dishes for selection
async function getMenu(hall_name, month, day, year, meal_period) {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + `/menu?hall_name=${hall_name}&month=${month}&day=${day}&year=${year}&meal_period=${meal_period}`);
    if (!response.ok) {
        throw new Error('Failed to fetch menu');
    }
    return response.json();
}

async function loadPeriods(hallName, formValues, setFormValues, setMealPeriods) {
    try {
        const { date } = formValues;
        const periods = await getMealPeriods(hallName, date.month, date.day, date.year);
        setMealPeriods(periods["periods"]);

        // change period if currently selected no longer exists
        if (formValues.mealPeriod == null || !periods["periods"].includes(formValues.mealPeriod))
            setFormValues(v => ({...v, mealPeriod: periods["periods"][0] || ''}));
    } catch (e) {
        console.error(e);
        setMealPeriods([]);
    }
}

function getCurrentMealPeriod() {
    const currentHour = new Date().getHours();
    if (currentHour < 11) {
        return 'BREAKFAST';
    } else if (currentHour < 16) {
        return 'LUNCH';
    } else if (currentHour < 21) {
        return 'DINNER';
    } else {
        return 'DINNER'; // Default to dinner for late night
    }
}

export default function AddReview() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
            <AddReviewContent />
        </Suspense>
    )
}

function AddReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const today = new Date();
    
    // Check if we're coming from menus page with specific dish
    const isFromMenus = searchParams.get('step') === '3'
    const [currentStep, setCurrentStep] = useState(isFromMenus ? 3 : 1);
    
    // Authentication state (same as profile/page.js)
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    
    // Initialize form values from URL params if coming from menus
    const getInitialFormValues = () => {
        if (isFromMenus) {
            return {
                hallName: searchParams.get('hallName') || 'de-neve-dining',
                mealPeriod: searchParams.get('mealPeriod') || getCurrentMealPeriod(),
                date: {
                    month: parseInt(searchParams.get('month')) || today.getMonth() + 1,
                    day: parseInt(searchParams.get('day')) || today.getDate(),
                    year: parseInt(searchParams.get('year')) || today.getFullYear()
                }
            };
        }
        return {
            hallName: 'de-neve-dining',
            mealPeriod: getCurrentMealPeriod(),
            date: {
                month: today.getMonth() + 1,
                day: today.getDate(),
                year: today.getFullYear()
            }
        };
    };
    
    // Form values for location/time selection
    const [formValues, setFormValues] = useState(getInitialFormValues());

    // Available meal periods for selected hall/date
    const [mealPeriods, setMealPeriods] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Menu data for dish selection
    const [menu, setMenu] = useState(null);
    
    // Initialize review data with pre-selected dish if coming from menus
    const getInitialReviewData = () => {
        if (isFromMenus) {
            const dishId = parseInt(searchParams.get('dishId'));
            if (dishId) {
                return {
                    selectedDishes: [dishId],
                    dishReviews: {}
                };
            }
        }
        return {
            selectedDishes: [], 
            dishReviews: {} 
        };
    };
    
    // Review form data
    const [reviewData, setReviewData] = useState(getInitialReviewData());

    // Check if user is logged in on component mount (same as profile/page.js)
    useEffect(() => {
        const token = localStorage.getItem('jwt');
        setIsLoggedIn(!!token);
        setAuthChecked(true); // Mark that auth check is complete
    }, []);

    // Only redirect after auth check is complete (same as profile/page.js)
    useEffect(() => {
        if (authChecked && !isLoggedIn) {
            console.log('Not logged in, redirecting...');
            router.push('/');
        }
    }, [authChecked, isLoggedIn, router]);

    // Fetch user info (same as profile/page.js)
    useEffect(() => {
        if (isLoggedIn) {
            getUserInfo().then(data => {
                setUserInfo(data.user);
            }).catch(error => {
                console.error('Failed to fetch user info:', error);
                // If user info fetch fails, redirect to login
                router.push('/');
            });
        }
    }, [isLoggedIn, router]);

    // Load meal periods when component mounts or when hall/date changes
    useEffect(() => {
        if (authChecked && isLoggedIn) {
            loadPeriods(formValues.hallName, formValues, setFormValues, setMealPeriods);
        }
    }, [formValues, authChecked, isLoggedIn]);

    // Load menu automatically when coming from menus page
    useEffect(() => {
        if (isFromMenus && authChecked && isLoggedIn && mealPeriods.length > 0) {
            const loadMenuForReview = async () => {
                try {
                    const data = await getMenu(
                        formValues.hallName, 
                        formValues.date.month, 
                        formValues.date.day, 
                        formValues.date.year, 
                        formValues.mealPeriod
                    );
                    setMenu(data.menu);
                } catch (error) {
                    console.error('Error fetching menu for review:', error);
                    // If menu loading fails, redirect back to step 1
                    setCurrentStep(1);
                }
            };
            
            loadMenuForReview();
        }
    }, [isFromMenus, authChecked, isLoggedIn, mealPeriods.length, formValues]);

    // Don't render anything until auth check completes (same as profile/page.js)
    if (!authChecked) {
        return null; // Or a loading indicator
    }

    // Form change handlers
    const handleHallChange = (e) => {
        setFormValues({...formValues, hallName: e.target.value});
    };
    
    const handleMealPeriodChange = (e) => {
        setFormValues({...formValues, mealPeriod: e.target.value});
    };
    
    const handleDateChange = (e) => {
        const [year, month, day] = e.target.value.split('-');
        setFormValues({
            ...formValues, 
            date: { 
                year: parseInt(year), 
                month: parseInt(month), 
                day: parseInt(day) 
            }
        });
    };

    const handleNextStep = async () => {
        if (currentStep === 1) {
            // Load menu for selected hall, date, and meal period
            setLoading(true);
            try {
                const data = await getMenu(
                    formValues.hallName, 
                    formValues.date.month, 
                    formValues.date.day, 
                    formValues.date.year, 
                    formValues.mealPeriod
                );
                setMenu(data.menu);
                setCurrentStep(2);
            } catch (error) {
                console.error('Error fetching menu:', error);
                alert('Error loading menu. Please try again.');
            } finally {
                setLoading(false);
            }
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleDishSelect = (dishId) => {
        setReviewData(prev => {
            const isSelected = prev.selectedDishes.includes(dishId);
            const newSelectedDishes = isSelected 
                ? prev.selectedDishes.filter(id => id !== dishId)
                : [...prev.selectedDishes, dishId];
            
            // If deselecting a dish, remove its review data
            const newDishReviews = {...prev.dishReviews};
            if (isSelected) {
                delete newDishReviews[dishId];
            }
            
            return {
                ...prev,
                selectedDishes: newSelectedDishes,
                dishReviews: newDishReviews
            };
        });
    };

    const handleIndividualReviewChange = (dishId, field, value) => {
        setReviewData(prev => ({
            ...prev,
            dishReviews: {
                ...prev.dishReviews,
                [dishId]: {
                    ...prev.dishReviews[dishId],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('jwt');
        if (!token) {
            alert('Please log in to submit a review.');
            router.push('/');
            return;
        }
        
        // create json to send to server
        // ex: { "dish_id": 1, "score": 10, "comment": "hi this is great" }
        // one review per dish
        const allReviews = Object.entries(reviewData.dishReviews).map(([dishId, review]) => ({
            dish_id: parseInt(dishId),
            score: review.rating ? parseInt(review.rating) : null,
            comment: review.review || ''
        }));

        console.log('REVIEWS TO SUBMIT:', allReviews);
         

        // send to server, one review per dish
        for (const review of allReviews) {
            if (review.score == null) {
                alert('Please provide a rating for all selected dishes.');
                return;
            }
            if (review.score < 1 || review.score > 5) {
                alert('Rating must be between 1 and 5 stars.');
                return;
            }
            if (review.comment.length > 500) {
                alert('Review comment cannot exceed 500 characters.');
                return;
            }
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // use proper JWT
                },
                body: JSON.stringify(review)
            });

            console.log('SUBMISSION DATA WITH AUTHENTICATED USER:', review);
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error submitting review:', errorData);
                alert(`Failed to submit review: ${errorData.message || 'Unknown error'}`);
                return;
            }
        }

        // successful submission
        setTimeout(() => {
            alert('Review submitted successfully! \n\nRedirecting to home page...');
            router.push('/');
        }, 1000);
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800">Step 1: Where and when did you eat?</h2>
                <p className="text-gray-600 mt-2">Select the dining hall, date, and meal period</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dining Hall
                    </label>
                    <select 
                        value={formValues.hallName} 
                        onChange={handleHallChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.entries(hallApiNameToFormName).map(([apiName, name]) => (
                            <option key={apiName} value={apiName}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        value={`${formValues.date.year}-${String(formValues.date.month).padStart(2, '0')}-${String(formValues.date.day).padStart(2, '0')}`}
                        onChange={handleDateChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Period
                    </label>
                    <select 
                        value={formValues.mealPeriod} 
                        onChange={handleMealPeriodChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={mealPeriods.length === 0}
                    >
                        {mealPeriods.map(p => (
                            <option key={p} value={p}>
                                {mealPeriodNames[p]}
                            </option>
                        ))}
                    </select>
                    {mealPeriods.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">Loading meal periods...</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading || mealPeriods.length === 0 || !formValues.mealPeriod}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                    {loading ? 'Loading...' : 'Next: Select Dish'}
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800">Step 2: What did you eat?</h2>
                <p className="text-gray-600 mt-2">
                    Select the dishes from {hallApiNameToFormName[formValues.hallName]} on {formValues.date.month}/{formValues.date.day}/{formValues.date.year} during {mealPeriodNames[formValues.mealPeriod]}
                </p>
                {reviewData.selectedDishes.length > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                        {reviewData.selectedDishes.length} dish{reviewData.selectedDishes.length !== 1 ? 'es' : ''} selected
                    </p>
                )}
            </div>

            {menu && menu.dishes && menu.dishes.length > 0 ? (
                <div>
                    {Object.entries(menu.dishes.reduce((locations, dish) => {
                        if (!locations[dish.location]) {
                            locations[dish.location] = [];
                        }
                        locations[dish.location].push(dish);
                        return locations;
                    }, {})).map(([location, dishes]) => (
                        <div key={location} className="mb-8">
                            <h3 className="text-lg font-medium text-[#0d92db] mb-4 border-b border-gray-200 pb-2">
                                {location}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {dishes.map((dish) => (
                                    <div 
                                        key={dish.id} 
                                        className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                                            reviewData.selectedDishes.includes(dish.id)
                                                ? 'border-blue-500 bg-blue-50' 
                                                : 'border-gray-200'
                                        }`}
                                        onClick={() => handleDishSelect(dish.id)}
                                    >
                                        <div className="p-4">
                                            {reviewData.selectedDishes.includes(dish.id) && (
                                                <div className="flex justify-end mb-2">
                                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            <h4 className="font-semibold text-lg mb-2">{dish.name}</h4>
                                            <div className="flex items-center">
                                                <span className="text-yellow-500 mr-1">★</span>
                                                <span className="text-sm text-gray-700">
                                                    {dish.average_rating > 0 ? dish.average_rating.toFixed(1) : "No ratings"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500">No dishes found for this selection.</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Make sure {hallApiNameToFormName[formValues.hallName]} was serving {mealPeriodNames[formValues.mealPeriod]} on this date.
                    </p>
                </div>
            )}

            <div className="flex justify-between space-x-4 mt-8">
                <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={reviewData.selectedDishes.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                    Next: Write Review{reviewData.selectedDishes.length !== 1 ? 's' : ''}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => {
        const selectedDishObjects = menu?.dishes?.filter(dish => reviewData.selectedDishes.includes(dish.id)) || [];
        
        const isFormValid = reviewData.selectedDishes.every(dishId => 
            reviewData.dishReviews[dishId]?.rating
        );
        
        return (
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {isFromMenus ? 'Write your review' : 'Step 3: Write your reviews'}
                    </h2>
                    <p className="text-gray-600 mt-2">
                        {isFromMenus 
                            ? `Rate and review ${selectedDishObjects[0]?.name || 'this dish'} from ${hallApiNameToFormName[formValues.hallName]}`
                            : `Rate and review each dish you selected (${selectedDishObjects.length} dish${selectedDishObjects.length !== 1 ? 'es' : ''})`
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {selectedDishObjects.map((dish, index) => (
                        <div key={dish.id} className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                {!isFromMenus && (
                                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                        {index + 1}
                                    </span>
                                )}
                                <h3 className="text-xl font-semibold text-gray-900">{dish.name}</h3>
                                {isFromMenus && (
                                    <span className="ml-auto text-sm text-gray-500">
                                        from {dish.location}
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating (1-5 stars) *
                                    </label>
                                    <select
                                        value={reviewData.dishReviews[dish.id]?.rating || ''}
                                        onChange={(e) => handleIndividualReviewChange(dish.id, 'rating', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a rating</option>
                                        <option value="1">1 star - Poor</option>
                                        <option value="2">2 stars - Fair</option>
                                        <option value="3">3 stars - Good</option>
                                        <option value="4">4 stars - Very Good</option>
                                        <option value="5">5 stars - Excellent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Review (Optional)
                                    </label>
                                    <textarea
                                        value={reviewData.dishReviews[dish.id]?.review || ''}
                                        onChange={(e) => handleIndividualReviewChange(dish.id, 'review', e.target.value)}
                                        placeholder={`Tell others about your experience with ${dish.name}...`}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-between space-x-4 mt-8">
                        <button
                            type="button"
                            onClick={() => isFromMenus ? router.push('/menus') : handlePreviousStep()}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            {isFromMenus ? 'Back to Menu' : 'Back'}
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
                        >
                            Submit {selectedDishObjects.length} Review{selectedDishObjects.length !== 1 ? 's' : ''}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        {isFromMenus ? 'Review Dish' : 'Add a Review'}
                    </h1>
                    
                    {/* Progress indicator - only show when not coming from menus */}
                    {!isFromMenus && (
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex items-center ">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                            step <= currentStep 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {step}
                                        </div>
                                        {step < 3 && (
                                            <div className={`w-16 h-1 mx-3 ${
                                                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                            }`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </div>
            </main>
        </div>
    );
} 