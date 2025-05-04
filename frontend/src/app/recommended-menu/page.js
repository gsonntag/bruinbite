'use client';
import { useState, useEffect } from 'react';
import DishCard from '../components/DishCard';

export default function RecommendedMenu() {
  const [recommendedDishes, setRecommendedDishes] = useState([]);
  const [mealPeriod, setMealPeriod] = useState('Lunch'); // default to current meal period based on time

  // just sample data for rn, will need to hook up to backend
  const mockRecommendedDishes = [
    {
      id: 1,
      name: 'Panini',
      diningHall: 'Cafe 1919',
      averageRating: 9.7,
      numberOfRatings: 69,
      description: 'Cafe 1919 Paninis are gas',
      dietary: {
        vegetarian: false,
        vegan: false,
        glutenFree: false
      }
    },
    {
      id: 2,
      name: 'California Sushi Roll',
      diningHall: 'Drey',
      averageRating: 8.7,
      numberOfRatings: 69,
      description: '8 california sushi rolls on a tray',
      dietary: {
        vegetarian: false,
        vegan: false,
        glutenFree: true
      }
    },
    {
      id: 3,
      name: 'Burrito Bowl',
      diningHall: 'Rendezvous',
      averageRating: 8.5,
      numberOfRatings: 69,
      description: 'Customizable Burrito Bowl at Rende',
      dietary: {
        vegetarian: true,
        vegan: true,
        glutenFree: true
      }
    }
  ];

  const mealPeriods = ['Breakfast', 'Lunch', 'Dinner', 'Late Night'];

  // setting recommended dishes and meal period
  useEffect(() => {
    // later, we would need to add backend to this with proper error handling
    setRecommendedDishes(mockRecommendedDishes);

    // setting default meal period based on current time (Im pretty sure these are the proper meal times but could be wrong)
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 10) {
      setMealPeriod('Breakfast');
    } else if (currentHour >= 11 && currentHour < 15) {
      setMealPeriod('Lunch');
    } else if (currentHour >= 17 && currentHour < 21) {
      setMealPeriod('Dinner');
    } else if (currentHour >= 21 && currentHour < 24) {
      setMealPeriod('Late Night');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Recommended Menu</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Top-rated dishes for {mealPeriod} today
          </p>
        </div>

        {/* selector for user to choose the meal period they want to look at */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {mealPeriods.map((meal) => {
              // changing button style based on selection status be it will need to show selected
              let buttonStyle = "px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-600";

              // selection-specific styling
              if (mealPeriod === meal) {
                buttonStyle += " bg-blue-600 text-white";
              } else {
                buttonStyle += " bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
              }

              // position-specific border radius
              if (meal === 'Breakfast') {
                buttonStyle += " rounded-l-lg";
              }
              if (meal === 'Late Night') {
                buttonStyle += " rounded-r-lg";
              }

              return (
                <button
                  key={meal}
                  onClick={() => setMealPeriod(meal)}
                  className={buttonStyle}
                >
                  {meal}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {recommendedDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </main>
    </div>
  );
}
