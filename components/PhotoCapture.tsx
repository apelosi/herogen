import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Check } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotoAccepted: (dataUrl: string) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoAccepted }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'initial' | 'camera' | 'review'>('initial');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up stream when component unmounts or stream changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream to video element whenever mode becomes 'camera' and stream exists
  useEffect(() => {
    if (mode === 'camera' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [mode, stream]);

  // Helper to resize image to a reasonable size for AI processing (max 1024px)
  const resizeImage = (source: HTMLVideoElement | HTMLImageElement): string => {
    const MAX_WIDTH = 1024;
    const canvas = document.createElement('canvas');
    let width, height;

    if (source instanceof HTMLVideoElement) {
        width = source.videoWidth;
        height = source.videoHeight;
    } else {
        width = source.width;
        height = source.height;
    }

    // Calculate new dimensions
    if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        if (source instanceof HTMLVideoElement) {
            // Mirror logic for camera
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(source, 0, 0, width, height);
    }
    
    // Use slightly compressed JPEG to save bandwidth
    return canvas.toDataURL('image/jpeg', 0.85); 
  };

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setStream(mediaStream);
      setMode('camera');
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please use upload instead.");
    }
  };

  const stopCameraTracks = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
        // Wait for video dimensions to be ready
        if (videoRef.current.videoWidth) {
             const resizedDataUrl = resizeImage(videoRef.current);
             setCapturedImage(resizedDataUrl);
             setMode('review');
             stopCameraTracks();
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create an image element to load the file data so we can resize it
        const img = new Image();
        img.onload = () => {
            const resizedDataUrl = resizeImage(img);
            setCapturedImage(resizedDataUrl);
            setMode('review');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setMode('initial');
  };

  const confirm = () => {
    if (capturedImage) {
      onPhotoAccepted(capturedImage);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Identify Yourself</h2>
        <p className="text-gray-600">We need a face to base the hero on.</p>
      </div>

      <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center">
        {mode === 'initial' && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={startCamera}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <Camera size={24} />
              <span>Use Camera</span>
            </button>
            <div className="text-gray-400 text-sm font-medium text-center">- OR -</div>
            <label className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload size={24} />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {mode === 'camera' && (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100" 
            />
            <button 
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-indigo-600 shadow-lg flex items-center justify-center hover:bg-gray-100 z-10"
              aria-label="Capture Photo"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-full"></div>
            </button>
          </>
        )}

        {mode === 'review' && capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {mode === 'review' && (
        <div className="flex gap-4 w-full">
          <button 
            onClick={retake}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            <RefreshCw size={20} />
            Retake
          </button>
          <button 
            onClick={confirm}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <Check size={20} />
            Accept
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;