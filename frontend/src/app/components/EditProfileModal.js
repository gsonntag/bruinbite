'use client';

import { useState } from 'react';
import { Image } from 'next/image';
import toast from 'react-hot-toast';

export default function EditProfileModal({ isOpen, onClose, userInfo, onUpdate }) {
    const [formData, setFormData] = useState({
        username: userInfo?.username || '',
        email: userInfo?.email || '',
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(userInfo?.profile_picture || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            setProfileImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                const base64Data = dataUrl.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('jwt');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            console.log('Starting profile update...', { username: formData.username, email: formData.email });

            // Prepare request data
            const requestData = {
                username: formData.username,
                email: formData.email,
            };

            // Add profile picture if selected
            if (profileImage) {
                console.log('Converting profile image to base64...');
                const base64Image = await convertImageToBase64(profileImage);
                requestData.profile_picture = base64Image;
                console.log('Base64 image added to request');
            }

            console.log('Sending PUT request to /profile...');
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                } else if (response.status === 400) {
                    throw new Error(`Validation error: ${errorMessage}`);
                } else if (response.status >= 500) {
                    throw new Error(`Server error: ${errorMessage}`);
                } else {
                    throw new Error(errorMessage);
                }
            }

            const result = await response.json();
            console.log('Profile update successful:', result);
            
            // Call the onUpdate callback with the updated user data
            if (onUpdate) {
                onUpdate(result.user);
                console.log('onUpdate callback executed');
            }
            
            // Reset form state
            setProfileImage(null);
            setError(null);
            
            // Show success message briefly
            toast.success('Profile updated successfully!');
            
            // Close the modal
            onClose();
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.message);
            
            // If it's an auth error, suggest refresh
            if (err.message.includes('Authentication') || err.message.includes('401')) {
                setError(err.message + ' Try refreshing the page and logging in again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Profile Picture */}
                    <div className="text-center">
                        <div className="mb-4">
                            {imagePreview ? (
                                <img
                                    src={imagePreview.startsWith('http') ? imagePreview : process.env.NEXT_PUBLIC_API_URL + `${imagePreview}`}
                                    alt="Profile preview"
                                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-200"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full mx-auto bg-[#0d92db] flex items-center justify-center text-2xl font-bold text-white">
                                    {formData.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="profileImage"
                            className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors"
                        >
                            Change Photo
                        </label>
                    </div>

                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d92db] focus:border-transparent"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d92db] focus:border-transparent"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#0d92db] hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 