"use client";
export const dynamic = 'force-dynamic'; // skip pre-rendering in build
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../components/Navbar";
import { RecommendedModal } from "../components/RecommendedModal";
import { useRouter } from "next/navigation";
import { api } from '../utils/api'
import toast from 'react-hot-toast';
import LoginForm from '../components/LoginForm';

// TODO: possibly dynamically get the hall names from the API
const hallApiNameToFormName = {
  "bruin-plate": "Bruin Plate",
  "de-neve-dining": "De Neve Dining",
  "epicuria-at-covel": "Epicuria at Covel",
  "bruin-cafe": "Bruin Cafe",
  "cafe-1919": "Cafe 1919",
  "epicuria-at-ackerman": "Epicuria at Ackerman",
  "rendezvous": "Rendezvous",
  "the-drey": "The Drey",
  "the-study-at-hedrick": "The Study at Hedrick",
  "spice-kitchen": "Spice Kitchen",
};

const mealPeriodNames = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  ALL_DAY: "All Day",
  LUNCH_DINNER: "Lunch & Dinner",
};

// get valid meal periods for a certain day given a hall
async function getMealPeriods(hall_name, month, day, year) {
  const response = await api.get('/hall-meal-periods', null, {
    hall_name,
    month,
    day,
    year
  })
  if (!response.ok) throw new Error("Failed to fetch meal periods");
  return response.json(); // expected to return string[] like ["BREAKFAST","LUNCH"]
}

// get menu from api
async function getMenu(hall_name, month, day, year, meal_period) {
  const response = await api.get('/menu', null, {
    hall_name,
    month,
    day,
    year,
    meal_period
  })
  if (!response.ok) {
    throw new Error("Failed to fetch menu");
  }
  return response.json();
}

async function loadPeriods(
  hallName,
  formValues,
  setFormValues,
  setMealPeriods
) {
  try {
    const { date } = formValues;
    const periods = await getMealPeriods(
      hallName,
      date.month,
      date.day,
      date.year
    );
    setMealPeriods(periods["periods"]);

    // change period if currently selected no longer exists
    let selectedPeriod = formValues.mealPeriod;
    if (
      formValues.mealPeriod == null ||
      !periods["periods"].includes(formValues.mealPeriod)
    ) {
      selectedPeriod = periods["periods"][0] || "";
      setFormValues((v) => ({ ...v, mealPeriod: selectedPeriod }));
    }

    return selectedPeriod;
  } catch (e) {
    console.error(e);
    return formValues.mealPeriod;
  }
}

function getCurrentMealPeriod() {
  const currentHour = new Date().getHours();
  if (currentHour < 11) {
    return "BREAKFAST";
  } else if (currentHour < 16) {
    return "LUNCH";
  } else if (currentHour < 21) {
    return "DINNER";
  } else {
    return "LATE_NIGHT";
  }
}

export default function Menus() {
  const router = useRouter();
  const today = new Date();

  const getInitialHall = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const hallParam = urlParams.get("hall");
      if (hallParam && Object.keys(hallApiNameToFormName).includes(hallParam)) {
        return hallParam;
      }
    }
    return "de-neve-dining"; // default
  };

  // Current search parameters (used for display)
  const [currentSearch, setCurrentSearch] = useState({
    hallName: getInitialHall(),
    mealPeriod: getCurrentMealPeriod(),
    date: {
      month: today.getMonth() + 1,
      day: today.getDate(),
      year: today.getFullYear(),
    },
  });

  const [mealPeriods, setMealPeriods] = useState([]);

  // Form values
  const [formValues, setFormValues] = useState({
    hallName: getInitialHall(),
    mealPeriod: getCurrentMealPeriod(),
    date: {
      month: today.getMonth() + 1,
      day: today.getDate(),
      year: today.getFullYear(),
    },
  });

  const [menu, setMenu] = useState([]);
  const [fetchedMenu, setFetchedMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRecs, setshowRecs] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const fetchMenuWithPeriod = useCallback(
    async (hallName, date, mealPeriod) => {
      try {
        setLoading(true);
        console.log(`period ${mealPeriod}`);
        const data = await getMenu(
          hallName,
          date.month,
          date.day,
          date.year,
          mealPeriod
        );
        setMenu(data.menu);
        setFetchedMenu(true);

        // Update the current search parameters only after successful fetch
        setCurrentSearch({ hallName, date, mealPeriod });
      } catch (error) {
        console.error("Error fetching menu:", error);
        // pop a toast
        toast.error("Error fetching menu. Please try again later.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchMenu = async () => {
    return fetchMenuWithPeriod(
      formValues.hallName,
      formValues.date,
      formValues.mealPeriod
    );
  };

  useEffect(() => {
    const initializeMenu = async () => {
      const today = new Date();
      const initialHallName = getInitialHall();
      const initialDate = {
        month: today.getMonth() + 1, // zero-indexed
        day: today.getDate(),
        year: today.getFullYear(),
      };
      const initialFormValues = {
        hallName: initialHallName,
        mealPeriod: getCurrentMealPeriod(),
        date: initialDate,
      };

      const selectedPeriod = await loadPeriods(
        initialHallName,
        initialFormValues,
        setFormValues,
        setMealPeriods
      );
      // Only fetch menu after meal periods have been loaded, using the correct period
      await fetchMenuWithPeriod(initialHallName, initialDate, selectedPeriod);
    };

    initializeMenu();
  }, [fetchMenuWithPeriod]);

  // Form change handlers
  const handleHallChange = async (e) => {
    const newHallName = e.target.value;
    setFormValues({ ...formValues, hallName: newHallName });
    await loadPeriods(newHallName, formValues, setFormValues, setMealPeriods);
  };

  const handleMealPeriodChange = (e) => {
    setFormValues({ ...formValues, mealPeriod: e.target.value });
  };

  const handleDateChange = (e) => {
    const [year, month, day] = e.target.value.split("-");

    const selected = new Date(year, month, day);
    // zero-out time on both dates
    selected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected > today) {
      toast.error("Date cannot be in the future.");
      return; // don’t update formValues
    }

    setFormValues({
      ...formValues,
      date: {
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
      },
    });
  };

  const handleDishClick = (dish) => {
    const token = localStorage.getItem('jwt');
    if (!token) {
        toast.error('Please log in to add a review');
        setShowLoginForm(true);
        return;
    }
    
    // Create URL parameters to pass to add-review page
    const params = new URLSearchParams({
        step: "3",
        hallName: currentSearch.hallName,
        mealPeriod: currentSearch.mealPeriod,
        month: currentSearch.date.month.toString(),
        day: currentSearch.date.day.toString(),
        year: currentSearch.date.year.toString(),
        dishId: dish.id.toString(),
        dishName: dish.name,
        location: dish.location || "",
    });

    router.push(`/add-review?${params.toString()}`);
  };

  const handleDishClick2 = (dish) => {
    router.push(`/dish/${dish.id.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center text-[#0d92db] mb-4">
          Dining Hall Menu
        </h1>
        <div className="text-center mt-3 mb-8">
        {/* https://tailwindflex.com/@leon-bachmann/glowing-backround-button */}
          <div className="relative inline-flex group">
            <div className="absolute transition-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-500 rounded-md blur-lg "></div>
            <button
              onClick={() => setshowRecs(true)}
              className="relative cursor-pointer font-semibold bg-gradient-to-br from-indigo-400 to-sky-500 text-white py-2 px-6 rounded-md transition-all duration-200"
            >
              View Recommended Menu
            </button>
          </div>
        </div>

        {/* filtering */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dining Hall
              </label>
              <select
                value={formValues.hallName}
                onChange={handleHallChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(hallApiNameToFormName).map(
                  ([apiName, name]) => (
                    <option key={apiName} value={apiName}>
                      {name}
                    </option>
                  )
                )}
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
                {mealPeriods.map((p) => (
                  <option key={p} value={p}>
                    {mealPeriodNames[p]}
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
                value={`${formValues.date.year}-${String(
                  formValues.date.month
                ).padStart(2, "0")}-${String(formValues.date.day).padStart(
                  2,
                  "0"
                )}`}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchMenu}
                className="w-full bg-[#0d92db] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? "Loading..." : "Find Menu"}
              </button>
            </div>
          </div>
        </div>

        {/* actual menu */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 mb-4">Loading menu...</p>
          </div>
        ) : fetchedMenu ? (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {(menu.hall && menu.hall.name) ||
                hallApiNameToFormName[currentSearch.hallName]}{" "}
              - {mealPeriodNames[currentSearch.mealPeriod]} Menu
            </h2>

            {/* group dishes by location */}
            {Object.entries(
              menu.dishes.reduce((locations, dish) => {
                if (!locations[dish.location]) {
                  locations[dish.location] = [];
                }
                locations[dish.location].push(dish);
                return locations;
              }, {})
            ).map(([location, dishes]) => (
              <div key={location} className="mb-8">
                <h3 className="text-xl font-medium text-[#0d92db] mb-4 border-b border-gray-200 pb-2">
                  {location}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow hover:border-blue-300"
                    >
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-2">
                          {dish.name}
                        </h4>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="text-sm text-gray-700">
                              {dish.average_rating > 0
                                ? dish.average_rating.toFixed(1)
                                : "No ratings"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDishClick(dish)}
                            className="bg-[#0d92db] cursor-pointer hover:bg-sky-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                          >
                            Add Review
                          </button>
                          <button
                            onClick={() => handleDishClick2(dish)}
                            className="bg-zinc-400 cursor-pointer hover:bg-zinc-500 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                          >
                            See Reviews
                          </button>
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
            <p className="text-gray-500 mb-4">
              No menu loaded yet. Select your preferences and click &quot;Find
              Menu&quot;.
            </p>
          </div>
        )}
      </div>
      <RecommendedModal isOpen={showRecs} onClose={() => setshowRecs(false)} />
      {showLoginForm && (
        <LoginForm 
          onClose={() => setShowLoginForm(false)} 
          onLoginSuccess={() => {
            setShowLoginForm(false);
            toast.success('Successfully logged in');
          }} 
        />
      )}
    </div>
  );
}
