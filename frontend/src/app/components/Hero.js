import { useState, useEffect } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getDisplayName } from "../utils/hallMaps";
import { api } from '../utils/api'

export default function Hero() {
    const [query, setQuery] = useState("");
    const [selectedHall, setSelectedHall] = useState("");
    const [dishes, setDishes] = useState([]);
    const router = useRouter();

    // Dining hall options for the filter dropdown
    const diningHalls = [
        { value: "", label: "All Dining Halls" },
        { value: "bcafe", label: "Bruin Café" },
        { value: "bplate", label: "Bruin Plate" },
        { value: "cafe1919", label: "Café 1919" },
        { value: "deneve", label: "De Neve" },
        { value: "epicuria", label: "Epicuria at Covel" },
        { value: "epicuriaa", label: "Epic at Ackerman" },
        { value: "rendezvous", label: "Rendezvous" },
        { value: "thedrey", label: "The Drey" },
        { value: "thestudy", label: "The Study" },
        { value: "spicekitchen", label: "Spice Kitchen" }
    ];

    // Mapping from dropdown values to actual database hall names
    const hallValueToApiName = {
        "bcafe": "bruin-cafe",
        "bplate": "bruin-plate", 
        "cafe1919": "cafe-1919",
        "deneve": "de-neve-dining",
        "epicuria": "epicuria-at-covel",
        "epicuriaa": "epicuria-at-ackerman",
        "rendezvous": "rendezvous",
        "thedrey": "the-drey",
        "thestudy": "the-study-at-hedrick",
        "spicekitchen": "spice-kitchen"
    };

    useEffect(() => {
        const searchDishes = async () => {
            if (query.length <= 1) {
                setDishes([]);
                return;
            }

            try {
                // Build search URL with optional hall filter
                let keyword = encodeURIComponent(query);
                let hall = null;
                if (selectedHall) {
                    // Map the selected hall value to the actual database hall name
                    const actualHallName = hallValueToApiName[selectedHall];
                    if (actualHallName) {
                        hall = encodeURIComponent(actualHallName)
                    }
                }  
                const response = hall ? await api.get('/search', null, {keyword, hall}) : await api.get('/search', null, {keyword});
                if (!response.ok) {
                    throw new Error("search failed");
                }
                const data = await response.json();
                setDishes(data.dishes);
            } catch (error) {
                console.error("error: ", error);
                setDishes([]);
            }
        };

        const timeoutId = setTimeout(searchDishes, 350);
        return () => clearTimeout(timeoutId);
    }, [query, selectedHall]);

    const handleDishClick = (dish) => {
        router.push(`/dish/${dish.id}`);
    };

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 ">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold sm:text-6xl  lg:text-7xl text-[#0d92db]">
                            <span>
                                <Image
                                    src="/logo.png"
                                    alt="BruinBite Logo"
                                    width={100}
                                    height={100}
                                    className="inline h-18 w-18 mr-2 mb-3"
                                />
                            </span>
                            BruinBite
                        </h1>
                        <p className="text-2xl text-gray-500">
                            Discover & Rate Your Favorite UCLA Dining Hall Dishes
                        </p>
                    </div>
                    <div className="w-full max-w-lg space-y-2">
                        {/* Search input with icon */}
                        <div className="relative">
                            <FaSearch className="absolute left-2.5 top-3 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Search for a menu item....."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Dining hall filter dropdown */}
                        <div className="relative">
                            <FaFilter className="absolute left-2.5 top-3 text-gray-500" />
                            <select
                                value={selectedHall}
                                onChange={(e) => setSelectedHall(e.target.value)}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                {diningHalls.map((hall) => (
                                    <option key={hall.value} value={hall.value}>
                                        {hall.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Search results */}
                        {dishes.length > 0 && (
                            <div className="w-full max-w-lg rounded-lg shadow border border-gray-200 bg-white text-left max-h-64 overflow-y-auto">
                                {dishes.map((dish) => (
                                    <div 
                                        key={dish.id} 
                                        className="hover:bg-gray-50 cursor-pointer px-4 py-3 border-b border-gray-100 last:border-b-0"
                                        onClick={() => handleDishClick(dish)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {dish.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {getDisplayName(dish.hall_name)}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-yellow-500 mr-1">★</span>
                                                <span className="text-sm text-gray-600">
                                                    {dish.average_rating > 0 
                                                        ? dish.average_rating.toFixed(1) 
                                                        : "No ratings"
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {query.length >= 2 && dishes.length === 0 && (
                            <div className="w-full rounded-lg shadow border border-gray-200 bg-white px-4 py-2 text-left">
                                <div className="text-gray-500">
                                    No dishes found{selectedHall && ` in ${diningHalls.find(h => h.value === selectedHall)?.label}`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

