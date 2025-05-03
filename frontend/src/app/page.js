import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="text-center px-4">
        <h1 className="text-6xl font-bold mb-6">
          BruinBite 🐻 💛 💙
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Your favorite UCLA food companion
        </p>

      </main>
    </div>
  );
}
