'use client';
import { useState } from 'react';

export default function DishCard({ dish }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // This is currently only the frented part, but we will later need to hook this up to the backend to actually be able to track the user's favourites
  };

  // Have rating only show up to one decimal place
  const formattedRating = dish.averageRating.toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{dish.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{dish.diningHall}</p>
          </div>
          <button
            onClick={toggleFavorite}
            className={`p-1.5 rounded-full ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
          >
            <span className="sr-only">{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
            <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFavorite ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{dish.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {dish.dietary.vegetarian && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Vegetarian
            </span>
          )}
          {dish.dietary.vegan && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Vegan
            </span>
          )}
          {dish.dietary.glutenFree && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              Gluten-Free
            </span>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="text-yellow-500 text-lg">★</span>
              <span className="ml-1 text-gray-900 dark:text-white font-medium">{formattedRating}</span>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-gray-500">10</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {dish.numberOfRatings} ratings
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Rate This Dish
          </button>
        </div>
      </div>
    </div>
  );
}
