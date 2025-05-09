import { FaSearch } from "react-icons/fa"
import Image from "next/image";

export default function Hero() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 ">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h1
                            className="text-5xl font-bold sm:text-6xl  lg:text-7xl text-[#0d92db]"
                        >
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
                        <p className="text-2xl text-gray-500">Rate and Review dishes across UCLA dining halls</p>
                    </div>
                    <div className="w-full max-w-md space-y-2">
                        <div className="relative">
                            <FaSearch className="absolute left-2.5 top-5 text-gray-500" />
                        </div>
                        <input
                            type="search"
                            placeholder="Search for a menu item....."
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pl-8 shadow-sm focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}