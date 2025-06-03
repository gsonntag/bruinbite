import { FaStar } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { hallApiNameToDisplayName, displayNameToApiName } from '../utils/hallMaps';

// Image mapping for dining halls (since images aren't stored in database)
const diningHallImages = {
    "Bruin Café": "/dining-halls/bcafe.avif",
    "Bruin Plate": "/dining-halls/bplate.avif",
    "Café 1919": "/dining-halls/cafe1919.avif",
    "De Neve": "/dining-halls/deneve.avif",
    "The Drey": "/dining-halls/drey.avif",
    "Epicuria": "/dining-halls/epic.avif",
    "Epic at Ackerman": "/dining-halls/epic.avif",
    "Rendezvous": "/dining-halls/rende.avif",
    "The Study": "/dining-halls/study.avif",
    "Spice Kitchen at Bruin Bowl": "/dining-halls/feast.avif" // Using feast image for Spice Kitchen
};

// Convert database names to IDs for consistency with existing code
const createSlugFromName = (name) => {
    return name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
};

export default function DiningHalls() {
    const [diningHalls, setDiningHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleDiningHallClick = (hall) => {
        const apiName = displayNameToApiName[hall.name];
        if (apiName) {
            const params = new URLSearchParams({
                hall: apiName
            });
            router.push(`/menus?${params.toString()}`);
        } else {
            router.push('/menus');
        }
    };

    // Fetch dining halls data from API
    useEffect(() => {
        const fetchDiningHalls = async () => {
            try {
                const response = await fetch('http://localhost:8080/dining-halls');
                if (!response.ok) {
                    throw new Error('Failed to fetch dining halls');
                }
                const data = await response.json();
                
                // Transform the data to match the expected format
                const transformedHalls = data.dining_halls.map(hall => ({
                    id: createSlugFromName(hallApiNameToDisplayName[hall.name] || hall.name),
                    name: hallApiNameToDisplayName[hall.name] || hall.name,
                    image: diningHallImages[hallApiNameToDisplayName[hall.name] || hall.name] || "/dining-halls/bcafe.avif", // fallback image
                    rating: hall.rating,
                    reviewCount: hall.reviewCount
                }));
                
                setDiningHalls(transformedHalls);
            } catch (err) {
                console.error('Error fetching dining halls:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDiningHalls();
    }, []);

    if (loading) {
        return (
            <section className="w-full py-12 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className=" font-bold text-left text-3xl text-[#0d92db]">
                                Featured Dining Halls
                            </h2>
                            <p className="text-gray-500 text-left text-lg">
                                Loading dining halls...
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="w-full py-12 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className=" font-bold text-left text-3xl text-[#0d92db]">
                                Featured Dining Halls
                            </h2>
                            <p className="text-red-500 text-left text-lg">
                                Error loading dining halls: {error}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="flex flex-col space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className=" font-bold text-left text-3xl text-[#0d92db]">
                            Featured Dining Halls
                        </h2>
                        <p className="text-gray-500 text-left text-lg">
                            Click on any dining hall to view its current menu and reviews
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {diningHalls.map((hall) => (
                            <div
                                key={hall.id}
                                className="flex flex-col md:flex-row bg-white rounded-lg shadow-md overflow-hidden h-full cursor-pointer hover:shadow-lg"
                                onClick={() => handleDiningHallClick(hall)}
                            >
                                <div className="md:w-48 h-48 md:h-auto">
                                    <img
                                        src={hall.image}
                                        alt={hall.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col justify-start p-4">
                                    <h3 className="text-xl text-left font-semibold">{hall.name}</h3>
                                    <div className="flex items-center text-sm text-gray-600 mt-2">
                                        <FaStar className="text-yellow-400 mr-1 " />
                                        <span>{hall.rating}</span>
                                        <span className="ml-2 text-gray-500">({hall.reviewCount} reviews)</span>
                                    </div>
                                    <p className="text-xs text-left text-blue-600 mt-2 font-medium">Click to view menu</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}