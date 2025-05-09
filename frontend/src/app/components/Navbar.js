'use client';
import { useState } from 'react';
import LoginForm from './LoginForm';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {

    const [showLoginForm, setShowLoginForm] = useState(false);

    return (
        <div>
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="BruinBite Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                        <span className="text-xl font-bold text-[#0d92db]">
                            BruinBite
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className={`px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300`}>Add a Review</button>
                        <button onClick={() => setShowLoginForm(true)} className="bg-[#0d92db] hover:bg-sky-600 text-white px-3 py-1 text-sm rounded-md border border-gray-200 hover:border-gray-300">Log In / Sign Up</button>
                    </div>
                </div>
            </header>
            {showLoginForm && <LoginForm onClose={() => setShowLoginForm(false)} />}
        </div>
    )
}