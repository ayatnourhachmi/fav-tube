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
  Loader2,
  FileText,
  Scissors
} from 'lucide-react';
import cute from "./assets/cute.png";
import './App.css';
import Navbar from './Navbar';
import CutterPage from './CutterPage';

const API_URL = import.meta.env.VITE_API_URL || 'https://fav-tube-production.up.railway.app';

function App() {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('video');
  const [selectedQuality, setSelectedQuality] = useState('1080');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadData, setDownloadData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [inputMode, setInputMode] = useState('search');
  const [activeTab, setActiveTab] = useState('home');

  const formatOptions = [
    { id: 'video', icon: Video, label: 'Video', color: 'from-red-600 to-red-700' },
    { id: 'audio', icon: Music, label: 'Audio', color: 'from-red-500 to-red-600' },
    { id: 'thumbnail', icon: Image, label: 'Thumbnail', color: 'from-red-700 to-red-800' }
  ];

  const qualityOptions = {
    video: ['2160', '1440', '1080', '720', '480', '360'],
    audio: ['320', '256', '192', '128'],
    thumbnail: []
  };

  useEffect(() => {
    setSelectedQuality(
      selectedFormat === 'video' ? '1080' : selectedFormat === 'audio' ? '192' : ''
    );
  }, [selectedFormat]);

  useEffect(() => {
    if (downloadReady) {
      setDownloadReady(false);
      setDownloadData(null);
    }
  }, [url, selectedFormat, selectedQuality]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) searchVideos(searchQuery);
      else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchVideos = async (query) => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const processed = data.map(video => ({
        ...video,
        thumbnail: ensureValidThumbnailUrl(video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`)
      }));
      setSearchResults(processed);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search videos. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const ensureValidThumbnailUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/320x180?text=No+Thumbnail';
    if (url.startsWith('/')) return `${API_URL}${url}`;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return `https://${url}`;
    return url;
  };

  const handleVideoSelect = (id) => {
    setUrl(`https://www.youtube.com/watch?v=${id}`);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setInputMode('url');
  };

  const getVideoIdFromUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'video';
  };

  const handleProcessVideo = async () => {
    setError(null);
    setDownloadReady(false);
    setDownloadData(null);

    if (!url) return setError("Please enter a YouTube URL");
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return setError("Please enter a valid YouTube URL");

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format: selectedFormat, quality: selectedQuality })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Download failed.');
      }

      const blob = await res.blob();
      const ext = selectedFormat === 'video' ? 'mp4' : selectedFormat === 'audio' ? 'mp3' : 'jpg';
      const filename = `${getVideoIdFromUrl(url)}.${ext}`;

      setDownloadData({ blob, filename });
      setDownloadReady(true);
    } catch (err) {
      setError(err.message || 'Server error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadData) return;
    const url = URL.createObjectURL(downloadData.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadData.filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const TranscriptTab = () => (
    <div className="bg-gradient-to-br from-red-100/90 to-red-50/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-red-200 text-center">
      <FileText className="w-16 h-16 mx-auto text-red-600 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">FavTUBE Transcript</h2>
      <p className="text-gray-600">Extract and download transcripts from YouTube videos.</p>
      <p className="text-sm text-gray-500 mt-6">Coming soon - This feature is under development.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-50 to-emerald-50 relative overflow-hidden">
      <Navbar onTabChange={setActiveTab} />
      <div className="py-12 px-4">
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
          {activeTab === 'cutter' ? <CutterPage /> : activeTab === 'transcript' ? <TranscriptTab /> : renderHomeContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
