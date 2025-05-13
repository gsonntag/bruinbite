import { FaStar } from "react-icons/fa";

export default function DiningHalls() {
    return (
        <section className="w-full py-12 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="flex flex-col space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className=" font-bold text-left text-3xl text-[#0d92db]">
                            Featured Dining Halls
                        </h2>
                        <p className="text-gray-500 text-left text-lg">
                            Check out reviews for specific menu items in each Dining Hall
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">

                        {diningHalls.map((hall) => (
                            <div
                                key={hall.id}
                                className="flex flex-col md:flex-row bg-white rounded-lg shadow-md overflow-hidden h-full"
                            >
                                <div className="md:w-48 h-48 md:h-auto">
                                    <img
                                        src={hall.image}
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    )


}


//dummy hard coded review data, we need to find a way to fetch this from a database later
//also we can link to each dining hall's page later
const diningHalls = [
    {
        id: "b-cafe",
        name: "Bruin Café",
        image: "/dining-halls/bcafe.avif",
        rating: 3.8,
        reviewCount: 180,
    },
    {
        id: "bplate",
        name: "Bruin Plate",
        image: "/dining-halls/bplate.avif",
        rating: 4.5,
        reviewCount: 200,
    },
    {
        id: "cafe-1919",
        name: "Café 1919",
        image: "/dining-halls/cafe1919.avif",
        rating: 3.1,
        reviewCount: 120,
    },
    {
        id: "de-neve",
        name: "De Neve",
        image: "/dining-halls/deneve.avif",
        rating: 2.8,
        reviewCount: 300,
    },
    {
        id: "drey",
        name: "The Drey",
        image: "/dining-halls/drey.avif",
        rating: 3.9,
        reviewCount: 95,
    },
    {
        id: "epicuria",
        name: "Epicuria at Covel",
        image: "/dining-halls/epic.avif",
        rating: 4.9,
        reviewCount: 150,
    },
    {
        id: "feast",
        name: "Feast",
        image: "/dining-halls/feast.avif",
        rating: 3.3,
        reviewCount: 100,
    },
    {
        id: "rende",
        name: "Rendezvous",
        image: "/dining-halls/rende.avif",
        rating: 3.7,
        reviewCount: 130,
    },
    {
        id: "study",
        name: "The Study",
        image: "/dining-halls/study.avif",
        rating: 4.2,
        reviewCount: 160,
    }
];