"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Predefined positions for floating elements
const FLOATING_ELEMENTS = [
  { left: 15, top: 20, duration: 4.2, delay: 0.5 },
  { left: 75, top: 15, duration: 3.8, delay: 1.2 },
  { left: 25, top: 70, duration: 4.5, delay: 0.3 },
  { left: 85, top: 65, duration: 3.5, delay: 1.8 },
  { left: 45, top: 35, duration: 4.0, delay: 0.8 },
  { left: 60, top: 80, duration: 3.9, delay: 1.5 },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-scale">
            404
          </h1>
          
          {/* Floating elements */}
          <div className="absolute inset-0 -z-10">
            {FLOATING_ELEMENTS.map((element, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 animate-fade-in"
                style={{
                  left: `${element.left}%`,
                  top: `${element.top}%`,
                  animation: `float ${element.duration}s ease-in-out infinite`,
                  animationDelay: `${element.delay}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-8 animate-fade-in-up animation-delay-300">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Oops! The scholarship opportunity you&apos;re looking for seems to have
            disappeared. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-500">
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg group"
            >
              <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Back to Home
            </Button>
          </Link>

          <Link href="/matches">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg group border-2"
            >
              <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Find Scholarships
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 animate-fade-in animation-delay-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Need help? Here are some popular pages:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/applications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              My Applications
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/interview-prep"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Interview Prep
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              href="/knowledge"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Knowledge Base
            </Link>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(5px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 1s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
          opacity: 0;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
          opacity: 0;
        }

        .animation-delay-700 {
          animation-delay: 700ms;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
