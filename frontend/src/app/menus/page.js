'use client'
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';

// TODO: possibly dynamically get the hall id to name mapping
const hallIdToName = {
    1: 'De Neve',
    7: 'Bruin Plate',
    8: 'Epicuria'
};

// get menu from api
async function getMenu(hall_id, month, day, year, meal_period) {
    const response = await fetch(`http://localhost:8080/menu?hall_id=${hall_id}&month=${month}&day=${day}&year=${year}&meal_period=${meal_period}`);
    if (!response.ok) {
        throw new Error('Failed to fetch menu');
    }
    return response.json();
}

function getCurrentMealPeriod() {
    const currentHour = new Date().getHours();
    if (currentHour < 11) {
        return 'BREAKFAST';
    } else if (currentHour < 16) {
        return 'LUNCH';
    } else {
        return 'DINNER';
    }
}

export default function Menus() {
    const router = useRouter();
    const today = new Date();
    
    // Current search parameters (used for display)
    const [currentSearch, setCurrentSearch] = useState({
        hallId: 1,
        mealPeriod: getCurrentMealPeriod(),
        date: {
            month: today.getMonth() + 1,
            day: today.getDate(),
            year: today.getFullYear()
        }
    });
    
    // Form values
    const [formValues, setFormValues] = useState({
        hallId: 1,
        mealPeriod: getCurrentMealPeriod(),
        date: {
            month: today.getMonth() + 1,
            day: today.getDate(),
            year: today.getFullYear()
        }
    });
    
    const [menu, setMenu] = useState([]);
    const [fetchedmenu, setFetchedmenu] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchmenu = async () => {
        try {
            setLoading(true);
            const data = await getMenu(
                formValues.hallId, 
                formValues.date.month, 
                formValues.date.day, 
                formValues.date.year, 
                formValues.mealPeriod
            );
            setMenu(data.menu);
            setFetchedmenu(true);
            
            // Update the current search parameters only after successful fetch
            setCurrentSearch({...formValues});
        } catch (error) {
            console.error('Error fetching menu:', error);
            // pop a toast
            alert('Error fetching menu. Please try again later.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchmenu();
    }, []);
 
    // Form change handlers
    const handleHallChange = (e) => {
        setFormValues({...formValues, hallId: e.target.value});
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold text-center text-[#0d92db] mb-8">Dining Hall Menu</h1>
                
                {/* filtering */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dining Hall
                            </label>
                            <select 
                                value={formValues.hallId} 
                                onChange={handleHallChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.entries(hallIdToName).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meal Period
                            </label>
                            <select 
                                value={formValues.mealPeriod} 
                                onChange={handleMealPeriodChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="BREAKFAST">Breakfast</option>
                                <option value="LUNCH">Lunch</option>
                                <option value="DINNER">Dinner</option>
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
                        
                        <div className="flex items-end">
                            <button 
                                onClick={fetchmenu} 
                                className="w-full bg-[#0d92db] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-blue-300"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Find Menu'}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* actual menu */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-500 mb-4">Loading menu...</p>
                    </div>
                ) : fetchedmenu ? (
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">
                            {menu.hall && menu.hall.name || hallIdToName[currentSearch.hallId]} - {currentSearch.mealPeriod.charAt(0) + currentSearch.mealPeriod.slice(1).toLowerCase()} Menu
                        </h2>

                        {/* group dishes by location */}
                        {Object.entries(menu.dishes.reduce((locations, dish) => {
                            if (!locations[dish.location]) {
                                locations[dish.location] = [];
                            }
                            locations[dish.location].push(dish);
                            return locations;
                        }, {})).map(([location, dishes]) => (
                            <div key={location} className="mb-8">
                                <h3 className="text-xl font-medium text-[#0d92db] mb-4 border-b border-gray-200 pb-2">
                                    {location}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {dishes.map((dish) => (
                                        <div key={dish.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-4">
                                                <h4 className="font-semibold text-lg mb-2">{dish.name}</h4>
                                                <div className="flex items-center mt-2">
                                                    <div className="flex items-center">
                                                        <span className="text-yellow-500 mr-1">★</span>
                                                        <span className="text-sm text-gray-700">
                                                            {dish.average_rating > 0 ? dish.average_rating.toFixed(1) : "No ratings"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-500 mb-4">No menu loaded yet. Select your preferences and click &quot;Find Menu&quot;.</p>
                    </div>
                )}
            </div>
        </div>
    );
}