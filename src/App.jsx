import React, { useState, useEffect } from 'react';
import {
  Heart,
  Download,
  Sparkles,
  Video,
  Music,
  Image,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import cute from "./assets/cute.png";
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('video');
  const [selectedQuality, setSelectedQuality] = useState('1080');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadData, setDownloadData] = useState(null);

  const formatOptions = [
    { id: 'video', icon: Video, label: 'Video', color: 'from-red-600 to-red-700' },
    { id: 'audio', icon: Music, label: 'Audio', color: 'from-red-500 to-red-600' },
    { id: 'thumbnail', icon: Image, label: 'Thumbnail', color: 'from-red-700 to-red-800' },
  ];

  const qualityOptions = {
    video: ['2160', '1440', '1080', '720', '480', '360'],
    audio: ['320', '256', '192', '128'],
    thumbnail: [],
  };

  useEffect(() => {
    // Automatically set quality when format changes
    if (selectedFormat === 'video') {
      setSelectedQuality('1080');
    } else if (selectedFormat === 'audio') {
      setSelectedQuality('192');
    } else {
      setSelectedQuality('');
    }
  }, [selectedFormat]);

  // Reset download state when URL changes
  useEffect(() => {
    if (downloadReady) {
      setDownloadReady(false);
      setDownloadData(null);
    }
  }, [url, selectedFormat, selectedQuality]);

  const handleProcessVideo = async () => {
    setError(null);
    setDownloadReady(false);
    setDownloadData(null);

    if (!url) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsLoading(true);

    try {
      // First step: Process the video on the backend
      const response = await fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          format: selectedFormat,
          quality: selectedQuality
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed. Please try again.');
      }

      // Store the response blob for later download
      const blob = await response.blob();
      
      // Get file extension
      const ext = selectedFormat === 'video' ? 'mp4' : 
                 selectedFormat === 'audio' ? 'mp3' : 'jpg';
      
      // Extract video ID from URL for filename
      const videoId = getVideoIdFromUrl(url);
      const filename = `${videoId}.${ext}`;
      
      // Store download data
      setDownloadData({
        blob,
        filename
      });
      
      // Video is processed and ready to download
      setDownloadReady(true);
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Server error. Make sure the backend is running.');
      console.error('Download error:', err);
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadData) return;
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(downloadData.blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadData.filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  };

  // Helper function to extract video ID from YouTube URL
  const getVideoIdFromUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'video';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-50 to-emerald-50 py-12 px-4 relative overflow-hidden">
      {/* Header Section */}
      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-2 animate-fade-in">
            <img src={cute} alt="Cute Logo" className="w-20 h-20 object-contain" />
            <div className='flex'>
              <h1 className="text-5xl font-extrabold text-red-600">Fav</h1>
              <p className='text-5xl font-extrabold text-emerald-500'>TUBE</p>
            </div>
          </div>
          <p className="text-gray-700 text-lg font-medium">
            Your adorable companion for downloading YouTube videos <Heart className="w-5 h-5 inline-block text-red-600 animate-bounce" />
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-red-100/90 to-red-50/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-red-200">

          {/* Format Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`relative p-4 rounded-xl transition-all ${
                    selectedFormat === format.id ? `bg-gradient-to-r ${format.color} text-white shadow-lg scale-[1.02]` : 'bg-red-50 text-gray-700 hover:bg-red-100'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{format.label}</span>
                  </div>
                  {selectedFormat === format.id && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4" />}
                </button>
              );
            })}
          </div>

          {/* Quality Selector */}
          {selectedFormat !== 'thumbnail' && (
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-1">
                {selectedFormat === 'video' ? 'Select Video Quality' : 'Select Audio Quality'}
              </label>
              <div className="w-full relative inline-block text-left">
  <button 
    id="qualityDropdownButton" 
    data-dropdown-toggle="qualityDropdown" 
    className="text-gray-700 bg-white/50 hover:bg-gray-50 border border-red-200 focus:border-red-500 focus:outline-none focus:ring-red-100 font-medium rounded-xl text-sm px-5 py-2.5 text-center inline-flex items-center justify-between w-full shadow-sm"
    type="button"
    onClick={() => document.getElementById('qualityDropdown').classList.toggle('hidden')}
  >
    {selectedFormat === 'video' ? `${selectedQuality}p` : `${selectedQuality}kbps`}
    <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
    </svg>
  </button>
  
  {/* Dropdown menu */}
  <div id="qualityDropdown" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-xl shadow-sm w-full mt-1 border border-red-100">
    <ul className="py-2 text-sm text-gray-700" aria-labelledby="qualityDropdownButton">
      {qualityOptions[selectedFormat].map((quality) => (
        <li key={quality}>
          <a 
            href="#" 
            className="block px-4 py-2 hover:bg-red-50"
            onClick={(e) => {
              e.preventDefault();
              setSelectedQuality(quality);
              document.getElementById('qualityDropdown').classList.add('hidden');
            }}
          >
            {selectedFormat === 'video' ? `${quality}p` : `${quality}kbps`}
          </a>
        </li>
      ))}
    </ul>
  </div>
</div>
            </div>
          )}

          {/* URL Input */}
          <div className="relative group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your YouTube video link here..."
              className="w-full px-6 py-4 rounded-xl border-2 border-red-200 focus:border-red-500 outline-none text-gray-700 transition-all pr-12 bg-white/50 backdrop-blur-sm placeholder:text-gray-500"
            />
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-green-500 transition-colors " />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Ready Message */}
          {downloadReady && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Download ready! Click the green button to save the file.</p>
            </div>
          )}

          {/* Process Button (Red) or Download Button (Green) */}
          {!downloadReady ? (
            <button
              onClick={handleProcessVideo}
              disabled={isLoading}
              className="mt-6 w-full bg-gradient-to-r from-red-700 to-red-800 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 hover:from-red-800 hover:to-red-900 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span>{isLoading ? "Processing..." : "Process Video"}</span>
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
          )}
        </div>
        {/* Footer Note */}
    <div className="text-center mt-8 space-y-2">
      <p className="text-sm text-gray-600">
        Made with <Heart className="w-4 h-4 inline-block text-red-600 animate-pulse" /> for YouTube lovers
      </p>
      <p className="text-xs text-gray-500">Select format • Paste link • Download • Enjoy!</p>
    </div>
      </div>
    </div>
  );
}

export default App;