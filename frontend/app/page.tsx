'use client';

import { useState } from 'react';

// Type definitions
interface VideoInfo {
  title: string;
  duration: string;
  thumbnail: string;
  formats: VideoFormat[];
  view_count?: number;
  uploader?: string;
}

interface VideoFormat {
  format_id: string;
  ext: string;
  quality: string;
  filesize?: number;
  acodec?: string;
  vcodec?: string;
}

interface AnalysisResponse {
  success: boolean;
  data?: VideoInfo;
  error?: string;
}

export default function VideoAnalyzerPage() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [downloading, setDownloading] = useState(false);

  // ✅ FIX: URL validation
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      const validDomains = [
        'youtube.com', 'youtu.be',
        'facebook.com', 'fb.watch',
        'instagram.com',
        'tiktok.com',
        'twitter.com', 'x.com'
      ];
      return validDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  // ✅ FIX: Proper error handling in analyze function
  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Invalid URL. Supported: YouTube, Facebook, Instagram, TikTok, Twitter/X');
      return;
    }

    setLoading(true);
    setError('');
    setVideoInfo(null);
    setSelectedFormat('');

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResponse = await response.json();

      if (result.success && result.data) {
        setVideoInfo(result.data);
        
        // ✅ FIX: Safe array access with null check
        if (result.data.formats && result.data.formats.length > 0) {
          setSelectedFormat(result.data.formats[0].format_id);
        }
      } else {
        throw new Error(result.error || 'Failed to analyze video');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Download handler with proper error handling
  const handleDownload = async () => {
    if (!selectedFormat) {
      setError('Please select a format');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format_id: selectedFormat }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'video.mp4';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/i);
        if (match?.[1]) filename = match[1];
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setError('✓ Download completed!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // ✅ FIX: Format file size with null check
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🎬 Video Downloader</h1>
          <p className="text-gray-300 text-lg">YouTube • Facebook • Instagram • TikTok • Twitter</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl mb-8">
          <div className="space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Paste video URL here..."
              className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading || downloading}
            />
            
            {url && (
              <p className={`text-sm ${isValidUrl(url) ? 'text-green-400' : 'text-red-400'}`}>
                {isValidUrl(url) ? '✓ Valid URL' : '✗ Invalid URL'}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || downloading || !url || !isValidUrl(url)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
            >
              {loading ? '⏳ Analyzing...' : '🔍 Analyze Video'}
            </button>
          </div>

          {error && (
            <div className={`mt-4 p-4 rounded-lg ${error.includes('✓') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {error}
            </div>
          )}
        </div>

        {/* ✅ FIX: Proper null check before rendering */}
        {videoInfo && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                {videoInfo.thumbnail && (
                  <img src={videoInfo.thumbnail} alt={videoInfo.title || 'Video'} className="w-full rounded-lg shadow-lg" />
                )}
              </div>

              <div className="md:col-span-2 space-y-3">
                <h2 className="text-2xl font-bold text-white">{videoInfo.title || 'Untitled'}</h2>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  {videoInfo.uploader && <div><b>Uploader:</b> {videoInfo.uploader}</div>}
                  {videoInfo.duration && <div><b>Duration:</b> {videoInfo.duration}</div>}
                  {videoInfo.view_count && <div><b>Views:</b> {videoInfo.view_count.toLocaleString()}</div>}
                  {/* ✅ FIX: Safe array length check */}
                  <div><b>Formats:</b> {videoInfo.formats?.length ?? 0}</div>
                </div>
              </div>
            </div>

            {/* ✅ FIX: Proper array check before mapping */}
            {videoInfo.formats && videoInfo.formats.length > 0 && (
              <div className="space-y-4">
                <label className="block text-white font-semibold mb-2">Select Quality:</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  disabled={downloading}
                >
                  {videoInfo.formats.map((format) => (
                    <option key={format.format_id} value={format.format_id} className="bg-gray-800">
                      {format.quality} - {format.ext.toUpperCase()} 
                      {format.filesize ? ` (${formatFileSize(format.filesize)})` : ''}
                      {format.acodec && format.acodec !== 'none' ? ' 🔊' : ''}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleDownload}
                  disabled={downloading || !selectedFormat}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105"
                >
                  {downloading ? '⏳ Downloading...' : '⬇️ Download Video'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Respect copyright laws and platform terms of service</p>
        </div>
      </div>
    </div>
  );
}
