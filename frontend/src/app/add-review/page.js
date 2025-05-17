'use client';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';

export default function AddReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    diningHall: '',
    dishName: '',
    rating: '',
    review: ''
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
    </div>
  );
} 