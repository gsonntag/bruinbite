'use client';
import { useState } from 'react';
import { Navbar }
  from './components/Navbar';
import Hero from './components/Hero';
import DiningHalls from './components/DiningHalls';
export default function Home() {

  return (
    <div className="min-h-screen flex flex-col">
      < Navbar />
    <Hero />
    <DiningHalls />
    </div>
  );
}
