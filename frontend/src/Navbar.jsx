import React from 'react';
import { Home, Scissors, FileText } from 'lucide-react';

function Navbar({ onTabChange }) {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-red-100 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-center space-x-4 py-4">
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-red-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => onTabChange('cutter')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-red-50 transition-colors"
          >
            <Scissors className="w-5 h-5" />
            <span>Cutter</span>
          </button>
          <button
            onClick={() => onTabChange('transcript')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:bg-red-50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Transcript</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 