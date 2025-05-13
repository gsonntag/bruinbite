import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import Image from "next/image";

export default function Hero() {
    const [query, setQuery] = useState("");
    const [dishes, setDishes] = useState([]);

    useEffect(() => {
        const searchDishes = async () => {
            if (query.length <= 1) {
                setDishes([]);
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost:8080/search?keyword=${encodeURIComponent(query)}`
                );
                if (!response.ok) {
                    throw new Error("search failed");
                }
                const data = await response.json();
                console.log(data);                
                setDishes(data.dishes);
            } catch (error) {
                console.error("error: ", error);
                setDishes([]);
            }
        };

        const timeoutId = setTimeout(searchDishes, 350);
        return () => clearTimeout(timeoutId);
    }, [query]);

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
                    <div className="w-full max-w-md space-y-2">
                        <div className="relative">
                            <FaSearch className="absolute left-2.5 top-5 text-gray-500" />
                        </div>
                        <input
                            type="search"
                            placeholder="Search for a menu item....."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-8 shadow-sm focus:outline-none"
                        />


                        {dishes.length > 0 && (
                            <div className="w-full max-w-md rounded-lg shadow border border-gray-200 bg-white px-4 py-2 text-left">
                                {dishes.map((dishName, index) => (
                                    <div key={index} className="hover:text-gray-500 cursor-pointer">
                                        {dishName}
                                    </div>
                                ))}
                            </div>
                        )}

                        {query.length >= 2 && dishes.length === 0 && (
                            <div className="w-full max-w-md rounded-lg shadow border border-gray-200 bg-white px-4 py-2 text-left">
                                <div className="text-gray-500">No dishes found</div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </section>
    );
}

