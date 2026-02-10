"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface Format {
  id: string;
  quality: string;
}

interface VideoData {
  title: string;
  thumbnail: string;
  duration: number | null;
  formats: Format[];
}

const BACKEND = "http://localhost:8000";
const WS_BACKEND = "ws://localhost:8000";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadProgress, setProgress] = useState<{progress: number, status: string} | null>(null);

  const handleAnalyze = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/analyze`, { params: { url: url.trim() } });
      setVideoData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Cannot reach backend. Is Uvicorn running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formatId: string) => {
    setError("");
    try {
      // 1. Start the task
      const { data } = await axios.get(`${BACKEND}/download/start`, {
        params: { url: url.trim(), format_id: formatId }
      });

      // 2. Connect to WebSocket for live progress
      const ws = new WebSocket(`${WS_BACKEND}/ws/progress/${data.task_id}`);
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setProgress({ progress: msg.progress, status: msg.status });
        
        if (msg.status === "Finished") {
          ws.close();
          alert("Download ready in temp_downloads folder!");
          setProgress(null);
        }
      };
    } catch (err) {
      setError("Failed to start download.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-10">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-6">Pro Downloader</h1>
        
        <div className="flex gap-2 mb-4">
          <input 
            className="flex-1 p-4 rounded-xl bg-gray-800 border border-gray-700"
            placeholder="Paste Link Here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={handleAnalyze} className="bg-blue-600 px-6 rounded-xl font-bold">Analyze</button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {downloadProgress && (
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div className="bg-blue-500 h-4 rounded-full transition-all" style={{width: `${downloadProgress.progress}%`}}></div>
            <p className="text-xs mt-1">{downloadProgress.status}: {downloadProgress.progress}%</p>
          </div>
        )}

        {videoData && (
          <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
            <img src={videoData.thumbnail} className="w-full rounded-xl mb-4" />
            <h2 className="font-bold mb-4">{videoData.title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {videoData.formats.map(f => (
                <button key={f.id} onClick={() => handleDownload(f.id)} className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600">
                  {f.quality} MP4
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}