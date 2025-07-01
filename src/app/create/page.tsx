'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Upload, Radio, Settings, Users, Camera, FlipHorizontal, Image, Zap, Timer, Music } from 'lucide-react';

import { useRouter } from 'next/navigation';

import { CreateProvider, useCreate } from '@/contexts/create-context';
import MusicSelectionSheet from '@/components/music-selection-sheet';

const RecordTab = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [captureMode, setCaptureMode] = useState<"photo" | "video">('photo');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [timerDuration, setTimerDuration] = useState<number>(0); // 0 for off, 3 for 3s, 10 for 10s
  const [countdown, setCountdown] = useState<number>(0);
  const countdownIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [showFocusIndicator, setShowFocusIndicator] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const initialPinchDistance = useRef<number | null>(null);
  const [isMusicSheetOpen, setIsMusicSheetOpen] = useState<boolean>(false);
  const countdownSoundRef = useRef<HTMLAudioElement | null>(null);
  const captureSoundRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startCamera = async (mode: "user" | "environment") => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
        },
      });
      videoTrackRef.current = stream.getVideoTracks()[0];
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Apply flash mode if supported
      if (videoTrackRef.current && 'torch' in videoTrackRef.current.getCapabilities()) {
        if (flashMode === 'on' || flashMode === 'auto') {
          await videoTrackRef.current.applyConstraints({ advanced: [{ torch: true }] });
        } else {
          await videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
        }
      }

    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Failed to access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const toggleFlash = () => {
    setFlashMode((prevMode) => {
      if (prevMode === 'off') return 'on';
      if (prevMode === 'on') return 'auto';
      return 'off';
    });
  };

  const toggleTimer = () => {
    setTimerDuration((prevDuration) => {
      if (prevDuration === 0) return 3;
      if (prevDuration === 3) return 10;
      return 0;
    });
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [facingMode, flashMode]);

  useEffect(() => {
    countdownSoundRef.current = new Audio('/sounds/countdown.mp3'); // Placeholder for countdown sound
    captureSoundRef.current = new Audio('/sounds/capture.mp3'); // Placeholder for capture sound
  }, []);

  const resizeImage = (imageDataURL: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Use JPEG for smaller size
        } else {
          resolve(imageDataURL); // Fallback if context is null
        }
      };
      img.src = imageDataURL;
    });
  };

  const handleCapture = async () => {
    if (timerDuration > 0) {
      setCountdown(timerDuration);
      setIsTimerActive(true);
      countdownIntervalIdRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown > 0 && countdownSoundRef.current) {
            countdownSoundRef.current.play();
          }
          if (prevCountdown <= 1) {
            if (countdownIntervalIdRef.current) {
              clearInterval(countdownIntervalIdRef.current);
            }
            if (captureSoundRef.current) {
              captureSoundRef.current.play();
            }
            executeCapture();
            setIsTimerActive(false);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const cancelCountdown = () => {
    if (countdownIntervalIdRef.current) {
      clearInterval(countdownIntervalIdRef.current);
      countdownIntervalIdRef.current = null;
    }
    setCountdown(0);
    setIsTimerActive(false);
    // Optionally stop countdown sound if it's playing
    if (countdownSoundRef.current) {
      countdownSoundRef.current.pause();
      countdownSoundRef.current.currentTime = 0;
    }
  };

  const executeCapture = async () => {
    setIsCapturing(true);
    if (videoRef.current && videoTrackRef.current) {
      if (flashMode === 'on' && 'torch' in videoTrackRef.current.getCapabilities()) {
        await videoTrackRef.current.applyConstraints({ advanced: [{ torch: true }] });
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const fullSizeImage = canvas.toDataURL('image/png');
        setCapturedImage(fullSizeImage);

        // Generate thumbnail
        const thumbnail = await resizeImage(fullSizeImage, 150, 150);
        setCapturedThumbnail(thumbnail);
      }

      if (flashMode === 'on' && 'torch' in videoTrackRef.current.getCapabilities()) {
        await videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
      }
    }
    setTimeout(() => {
      setIsCapturing(false);
    }, 200); // Animation duration
  };

  const startRecording = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCapturedImage(url); // Assuming capturedImage can also store video URL for preview
        // You might want to create a thumbnail for the video here as well
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      // Start recording time interval
      const interval = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= 59) { // 60 seconds (0-59)
            stopRecording();
            return 0;
          }
          return prevTime + 1;
        });
      }, 1000);
      // Store interval ID to clear it later
      (mediaRecorderRef.current as any).intervalId = interval;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Clear recording time interval
      clearInterval((mediaRecorderRef.current as any).intervalId);
    }
  };

  const handleTapToFocus = async (event: React.MouseEvent<HTMLVideoElement>) => {
    if (!videoRef.current || !videoTrackRef.current) return;

    const videoElement = videoRef.current;
    const rect = videoElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Normalize coordinates to be between 0 and 1
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    setFocusPoint({ x: normalizedX, y: normalizedY });
    setShowFocusIndicator(true);
    setTimeout(() => {
      setShowFocusIndicator(false);
    }, 1000); // Hide after 1 second

    try {
      await videoTrackRef.current.applyConstraints({
        advanced: [{
          pointsOfInterest: [{ x: normalizedX, y: normalizedY }],
        }],
      });
    } catch (error) {
      console.error("Error applying focus:", error);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLVideoElement>) => {
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = async (event: React.TouchEvent<HTMLVideoElement>) => {
    if (event.touches.length === 2 && initialPinchDistance.current) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);

      const scale = currentPinchDistance / initialPinchDistance.current;
      let newZoom = zoom * scale;

      // Clamp zoom to a reasonable range (e.g., 1x to 5x)
      newZoom = Math.max(1, Math.min(newZoom, 5));

      setZoom(newZoom);

      if (videoTrackRef.current) {
        const capabilities = videoTrackRef.current.getCapabilities();
        // @ts-ignore
        if (capabilities.zoom) {
          // @ts-ignore
          const { max, min, step } = capabilities.zoom;
          const zoomValue = min + (newZoom - 1) / 4 * (max - min); // Map 1-5 to min-max
          try {
            await videoTrackRef.current.applyConstraints({ advanced: [{ zoom: zoomValue }] });
          } catch (error) {
            console.error("Error applying zoom:", error);
          }
        }
      }

      initialPinchDistance.current = currentPinchDistance;
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedThumbnail(null);
    // Optionally restart camera if it was stopped
    startCamera(facingMode);
  };

  const handleTouchEnd = () => {
    initialPinchDistance.current = null;
  };

  return (
    <div className="w-full h-full relative flex-shrink-0">
      {cameraError ? (
        <div className="w-full h-full flex items-center justify-center bg-black text-white text-center p-4">
          <p>{cameraError}</p>
        </div>
      ) : capturedImage ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out transform-gpu"
            autoPlay
            muted
            playsInline
            onClick={handleTapToFocus}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          {focusPoint && showFocusIndicator && (
            <div
              className="absolute border-2 border-yellow-400 rounded-full w-20 h-20 transition-all duration-200 ease-out"
              style={{
                left: `calc(${focusPoint.x * 100}% - 40px)`,
                top: `calc(${focusPoint.y * 100}% - 40px)`,
              }}
            />
          )}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-white mr-1 animate-pulse"></span>
              {formatTime(recordingTime)}
            </div>
          )}
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-9xl font-bold">
              {countdown}
            </div>
          )}
        </>
      )}

      {!cameraError && (
        <>
          <div className="absolute top-4 left-4 flex space-x-2">
            <Button variant="ghost" size="icon" className={`rounded-full text-white ${flashMode !== 'off' ? 'bg-white/20' : ''}`} onClick={toggleFlash}>
              <Zap className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className={`rounded-full text-white ${timerDuration !== 0 ? 'bg-white/20' : ''}`} onClick={toggleTimer}>
              <Timer className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-white" onClick={() => setIsMusicSheetOpen(true)}>
              <Music className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" className="rounded-full text-white" onClick={toggleCamera}>
              <FlipHorizontal className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full text-white ${captureMode === 'photo' ? 'bg-white/20' : ''}`}
              onClick={() => setCaptureMode('photo')}
            >
              Photo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full text-white ${captureMode === 'video' ? 'bg-white/20' : ''}`}
              onClick={() => setCaptureMode('video')}
            >
              Video
            </Button>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            {capturedImage ? (
              <Button size="icon" className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-600" onClick={handleRetake}>
                <Image className="h-8 w-8" />
              </Button>
            ) : isTimerActive ? (
              <Button size="lg" className="rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={cancelCountdown}>
                Cancel
              </Button>
            ) : (
              <Button size="icon" className={`w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 ${isCapturing ? 'scale-90 opacity-75 transition-all duration-200' : ''}`} onClick={captureMode === 'photo' ? handleCapture : (isRecording ? stopRecording : startRecording)}>
                {captureMode === 'photo' ? (
                  <Camera className="h-8 w-8" />
                ) : isRecording ? (
                  <Video className="h-8 w-8 text-red-500" />
                ) : (
                  <Video className="h-8 w-8" />
                )}
              </Button>
            )}
          </div>
          {capturedThumbnail && (
            <div className="absolute bottom-10 left-4">
              <img src={capturedThumbnail} alt="Thumbnail" className="w-16 h-16 rounded-md object-cover" />
            </div>
          )}
        </>
      )}
      <MusicSelectionSheet
        isOpen={isMusicSheetOpen}
        onClose={() => setIsMusicSheetOpen(false)}
        onSelectMusic={(music) => {
          console.log('Selected music:', music);
          setIsMusicSheetOpen(false);
        }}
      />
    </div>
  );
}



function UploadTab() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [coverTime, setCoverTime] = useState<number>(0);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [music, setMusic] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle video file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setCoverUrl(null);
    }
  };

  // Generate cover image from video
  const handleCaptureCover = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCoverUrl(canvas.toDataURL('image/jpeg'));
  };

  // Handle cover time slider
  const handleCoverTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCoverTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Simulate upload
  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert('Video uploaded! (Démo)');
    }, 2000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 overflow-y-auto">
      {!videoFile ? (
        <div className="flex flex-col items-center justify-center gap-6 h-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-xl p-8 hover:bg-gray-800 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mb-2 text-primary" />
            <span className="font-semibold text-lg">Select video to upload</span>
            <span className="text-gray-400 text-sm mt-2">MP4 or WebM, up to 60s, max 100MB</span>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl!}
              controls
              className="w-full h-full object-contain bg-black"
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.currentTime = coverTime;
              }}
              onTimeUpdate={handleCaptureCover}
            />
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Cover preview"
                className="absolute bottom-2 right-2 w-16 h-16 object-cover border-2 border-primary rounded shadow-lg bg-black"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Select cover</label>
            <input
              type="range"
              min={0}
              max={videoRef.current?.duration || 60}
              step={0.1}
              value={coverTime}
              onChange={handleCoverTimeChange}
              className="w-full accent-primary"
            />
            <button
              className="mt-2 px-3 py-1 bg-primary text-white rounded text-sm font-semibold hover:bg-primary/90"
              onClick={handleCaptureCover}
              type="button"
            >Capture cover</button>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-white resize-none"
              rows={2}
              maxLength={150}
              placeholder="Describe your video..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="text-xs text-gray-400 text-right">{description.length}/150</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Music (optional)</label>
            <input
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-white"
              placeholder="Add a sound or music..."
              value={music}
              onChange={e => setMusic(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Privacy</label>
            <select
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-white"
              value={privacy}
              onChange={e => setPrivacy(e.target.value as any)}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
            </select>
          </div>
          <button
            className="mt-4 w-full py-3 rounded-full bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary/90 disabled:opacity-60"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Post'}
          </button>
        </div>
      )}
    </div>
  );
}

// (Suppression du code dupliqué et des balises orphelines)


// --- LiveTab (TikTok style) ---


const LiveTab = () => {
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setCover(url);
    }
  };

  // Simulate Go Live
  const handleGoLive = () => {
    setIsLive(true);
    setTimeout(() => {
      alert('Live started! (Démo)');
    }, 1000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 overflow-y-auto">
      {!isLive ? (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-44 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-600"
                 onClick={() => fileInputRef.current?.click()}>
              {cover ? (
                <img src={cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">Add cover</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
            <span className="text-xs text-gray-400">Tap to upload a cover</span>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Live title</label>
            <input
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-white"
              placeholder="What's your live about?"
              maxLength={50}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <div className="text-xs text-gray-400 text-right">{title.length}/50</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Privacy</label>
            <select
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-white"
              value={privacy}
              onChange={e => setPrivacy(e.target.value as any)}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="flex items-center gap-4 justify-between">
            <button
              className={`flex-1 py-2 rounded-full font-semibold text-sm ${isCameraOn ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}
              onClick={() => setIsCameraOn(v => !v)}
              type="button"
            >
              <Camera className="inline-block mr-2 h-5 w-5" /> {isCameraOn ? 'Camera On' : 'Camera Off'}
            </button>
            <button
              className={`flex-1 py-2 rounded-full font-semibold text-sm ${isMicOn ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}
              onClick={() => setIsMicOn(v => !v)}
              type="button"
            >
              <Radio className="inline-block mr-2 h-5 w-5" /> {isMicOn ? 'Mic On' : 'Mic Off'}
            </button>
          </div>
          <button
            className="mt-4 w-full py-3 rounded-full bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary/90"
            onClick={handleGoLive}
            type="button"
          >Go Live</button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="w-32 h-44 rounded-xl bg-gray-800 flex items-center justify-center">
            {cover ? (
              <img src={cover} alt="Cover" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Camera className="h-12 w-12 text-gray-500" />
            )}
          </div>
          <h2 className="text-xl font-bold">You are live!</h2>
          <p className="text-gray-400">Your audience can now join your live stream.</p>
          <button
            className="mt-2 px-6 py-2 rounded-full bg-red-600 text-white font-bold text-lg shadow-lg hover:bg-red-700"
            onClick={() => setIsLive(false)}
            type="button"
          >End Live</button>
        </div>
      )}
    </div>
  );
};

const CreatePage = () => {
  const router = useRouter();
  const { activeTab, setActiveTab } = useCreate();

  const translateXValue = activeTab === 'record' ? 0 : activeTab === 'upload' ? 100 : 200;

  return (
    <div className="h-full w-full bg-black text-white flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/settings')}>
          <Settings />
        </Button>
        <h1 className="text-lg font-semibold">Create</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/friends')}>
          <Users />
        </Button>
      </header>


      <main className="flex-1 flex flex-col items-center justify-center pt-16">
        <div className="w-full max-w-md bg-gray-900 rounded-lg overflow-hidden relative shadow-lg flex min-h-[600px]">
          {/* Only render the active tab for correct layout and performance */}
          {activeTab === 'record' && (
            <div className="w-full h-full absolute inset-0"><RecordTab /></div>
          )}
          {activeTab === 'upload' && (
            <div className="w-full h-full absolute inset-0"><UploadTab /></div>
          )}
          {activeTab === 'live' && (
            <div className="w-full h-full absolute inset-0"><LiveTab /></div>
          )}
        </div>
      </main>

      <footer className="bg-black p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mx-auto">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 rounded-full h-12 p-1">
            <TabsTrigger value="record" className="rounded-full text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Video className="h-5 w-5 mr-2" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload" className="rounded-full text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Upload className="h-5 w-5 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="live" className="rounded-full text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Radio className="h-5 w-5 mr-2" />
              Live
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </footer>
    </div>
  );
};

const CreatePageWithProvider = () => (
  <CreateProvider>
    <CreatePage />
  </CreateProvider>
);

export default CreatePageWithProvider;
