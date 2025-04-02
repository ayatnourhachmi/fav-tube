import React, { useState } from 'react';
import { Scissors, Search, Music, Video, Clock, Check, AlertCircle, Download } from 'lucide-react';

function CutterPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cutPoints, setCutPoints] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('video');
  const [videoTitle, setVideoTitle] = useState('');

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
    setFile(null);
    setSuccess(false);
    setError(null);
  };

  const handleLoadYoutubeVideo = async () => {
    if (!youtubeUrl || youtubeUrl.trim() === '') {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // First check video info to get title
      const infoResponse = await fetch('http://localhost:5000/api/video-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!infoResponse.ok) {
        const errorData = await infoResponse.json();
        throw new Error(errorData.error || 'Failed to get video information');
      }

      const infoData = await infoResponse.json();
      setVideoTitle(infoData.title || 'YouTube video');

      // Download as temporary file on server
      const response = await fetch('http://localhost:5000/api/prepare-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load YouTube video');
      }

      const data = await response.json();
      
      // Create a virtual file with the YouTube video ID
      setFile({
        name: data.videoId,
        type: 'youtube',
        size: data.size || 0,
        youtubeUrl: youtubeUrl
      });

    } catch (error) {
      console.error('Error loading YouTube video:', error);
      setError(error.message || 'Failed to load YouTube video');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddCutPoint = () => {
    setCutPoints([...cutPoints, { start: "00:00:00", end: "00:01:00" }]);
  };

  const handleCutPointChange = (index, field, value) => {
    const newCutPoints = [...cutPoints];
    newCutPoints[index][field] = value;
    setCutPoints(newCutPoints);
  };

  const handleRemoveCutPoint = (index) => {
    const newCutPoints = [...cutPoints];
    newCutPoints.splice(index, 1);
    setCutPoints(newCutPoints);
  };

  const handleFormatChange = (format) => {
    setDownloadFormat(format);
  };

  const handleSubmit = async () => {
    if (!file || cutPoints.length === 0) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      let response;
      
      if (file.type === 'youtube') {
        // For YouTube videos
        response = await fetch('http://localhost:5000/api/cut-youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: file.youtubeUrl,
            cutPoints: cutPoints,
            format: downloadFormat
          }),
        });
      } else {
        // Keep existing upload functionality
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cutPoints', JSON.stringify(cutPoints));
        formData.append('format', downloadFormat);

        response = await fetch('http://localhost:5000/api/cut-video', {
        method: 'POST',
        body: formData,
      });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      setJobId(data.job_id);
      setSuccess(true);
    } catch (error) {
      console.error('Error cutting video:', error);
      setError(error.message || 'Failed to process video');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (segmentNumber) => {
    if (!jobId) return;
    
    try {
      // Get the output files from the job status
      const statusResponse = await fetch(`http://localhost:5000/api/job-status/${jobId}`);
      if (!statusResponse.ok) throw new Error('Failed to get job status');
      
      const statusData = await statusResponse.json();
      if (statusData.status !== 'completed') {
        throw new Error('Job is still processing');
      }
      
      // Find the matching output file for this segment number
      const outputFile = statusData.output_files.find(f => f.includes(`_cut_${segmentNumber}_`));
      if (!outputFile) {
        throw new Error('Output file not found');
      }
      
      // Download the file
      const response = await fetch(`http://localhost:5000/api/download-cut/${jobId}/${outputFile}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFile;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download error:', error);
      setError(error.message || 'Failed to download video segment');
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-100/90 to-red-50/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-red-200">
      <div className="flex items-center justify-center mb-6">
        <Scissors className="w-8 h-8 text-red-500 mr-2" />
        <h1 className="text-2xl font-bold text-gray-800">YouTube Video Cutter</h1>
      </div>

      <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Enter YouTube URL</h2>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
                <input 
              type="text"
              value={youtubeUrl}
              onChange={handleYoutubeUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 border border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
            />
            <button
              className={`bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleLoadYoutubeVideo}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
            </>
          ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Load
                </>
              )}
            </button>
          </div>
          
          {file && file.type === 'youtube' && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="font-medium">{videoTitle}</p>
              <div className="flex items-center mt-2">
                <span className="mr-4 text-sm">Output format:</span>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 text-sm rounded-md flex items-center ${downloadFormat === 'video' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => handleFormatChange('video')}
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Video
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-md flex items-center ${downloadFormat === 'audio' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => handleFormatChange('audio')}
                  >
                    <Music className="w-4 h-4 mr-1" />
                    Audio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Set Cut Points</h2>
          
          {cutPoints.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Add cut points to trim your video</p>
          ) : (
            <div className="space-y-3 mb-4">
              {cutPoints.map((point, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                      <input 
                        type="text" 
                        placeholder="HH:MM:SS" 
                        value={point.start}
                        onChange={(e) => handleCutPointChange(index, 'start', e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">End Time</label>
                      <input 
                        type="text" 
                        placeholder="HH:MM:SS" 
                        value={point.end}
                        onChange={(e) => handleCutPointChange(index, 'end', e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    className="text-red-500 hover:text-red-700 mt-6"
                    onClick={() => handleRemoveCutPoint(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button 
            className="w-full bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
            onClick={handleAddCutPoint}
          >
            + Add Cut Point
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && jobId && (
        <div className="mb-6 p-3 bg-green-100 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            {downloadFormat === 'video' ? 'Video' : 'Audio'} segments are ready! Click below to download.
          </p>
          <div className="mt-2 space-y-2">
            {cutPoints.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDownload(index + 1)}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Segment {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {file && cutPoints.length > 0 && !success && (
        <button 
          className={`w-full ${isProcessing ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white py-3 rounded-xl flex items-center justify-center transition-colors`}
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Clock className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Scissors className="w-5 h-5 mr-2" />
              Cut {downloadFormat === 'video' ? 'Video' : 'Audio'}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default CutterPage;