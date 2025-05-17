'use client';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';

export default function AddReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    diningHall: '',
    date: '',
    mealPeriod: '',
    dishName: '',
    rating: '',
    review: ''
  });

  const [time, setTime] = useState({
    hours: '12',
    minutes: '00',
    isPM: false
  });

  const determineMealPeriod = (hours, isPM) => {
    // Convert to 24-hour format
    let hour24 = parseInt(hours);
    if (isPM && hour24 !== 12) hour24 += 12;
    if (!isPM && hour24 === 12) hour24 = 0;

    if (hour24 >= 3 && hour24 < 11) {
      return 'Breakfast';
    } else if (hour24 >= 11 && hour24 < 16) {
      return 'Lunch';
    } else if (hour24 >= 16 && hour24 < 21) {
      return 'Dinner';
    } else {
      return 'Late Night';
    }
  };

  const updateMealPeriod = (hours, isPM) => {
    const mealPeriod = determineMealPeriod(hours, isPM);
    setFormData(prev => ({
      ...prev,
      mealPeriod
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement review submission logic
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeChange = (field, value) => {
    setTime(prev => {
      const newTime = {
        ...prev,
        [field]: value
      };
      // Update meal period whenever time changes
      updateMealPeriod(newTime.hours, newTime.isPM);
      return newTime;
    });
  };

  const toggleAMPM = () => {
    setTime(prev => {
      const newTime = {
        ...prev,
        isPM: !prev.isPM
      };
      // Update meal period when AM/PM changes
      updateMealPeriod(newTime.hours, newTime.isPM);
      return newTime;
    });
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    
    // Set date in YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      date: `${year}-${month}-${day}`
    }));

    // Set time with rounded minutes
    let hours = now.getHours();
    const isPM = hours >= 12;
    hours = hours % 12 || 12; // Convert to 12-hour format
    
    // Round minutes to nearest 15-minute interval
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.round(currentMinutes / 15) * 15;
    const minutes = String(roundedMinutes === 60 ? 0 : roundedMinutes).padStart(2, '0');
    
    // If we rounded to 60, increment the hour
    if (roundedMinutes === 60) {
      hours = (hours % 12) + 1;
    }
    
    const newTime = {
      hours: String(hours).padStart(2, '0'),
      minutes,
      isPM
    };
    
    setTime(newTime);
    // Update meal period based on the new time
    updateMealPeriod(newTime.hours, newTime.isPM);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Add a Review</h1>
          
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">Step 1: When did you visit?</h2>
              <p className="text-gray-600 mt-2">Select the date and time of your dining hall visit</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={time.hours}
                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                      <option key={hour} value={hour.toString().padStart(2, '0')}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500">:</span>
                  <select
                    value={time.minutes}
                    onChange={(e) => handleTimeChange('minutes', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[0, 15, 30, 45].map((minute) => (
                      <option key={minute} value={minute.toString().padStart(2, '0')}>
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={toggleAMPM}
                    className={`px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      time.isPM ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    {time.isPM ? 'PM' : 'AM'}
                  </button>
                </div>
                {formData.mealPeriod && (
                  <p className="mt-2 text-sm text-gray-600">
                    Meal Period: <span className="font-medium">{formData.mealPeriod}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Now Button */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={setCurrentDateTime}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Set to Current Time
              </button>
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 