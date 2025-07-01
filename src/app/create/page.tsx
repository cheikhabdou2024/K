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
      const img = new Image();
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
};

const UploadTab = () => {
  const [mediaFiles, setMediaFiles] = useState<{
    src: string;
    type: string;
    date?: string;
    duration?: number;
    size?: string;
  }[]>([]);
  const [itemsToShow, setItemsToShow] = useState(12); // Initial number of items to show
  const itemsPerPage = 12; // Number of items to load per page
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0); // New state for processing progress

  const processFiles = async (files: FileList) => {
    setProcessingProgress(0); // Reset progress at the start of processing
    const totalFiles = files.length;
    let processedCount = 0;

    const processedFiles = await Promise.all(Array.from(files).map(async (file) => {
      let src = URL.createObjectURL(file);
      let size = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      let duration: number | undefined = undefined;

      if (file.type.startsWith('image/')) {
        const compressedImage = await compressImage(file);
        src = compressedImage.src;
        size = compressedImage.size;
      } else if (file.type.startsWith('video/')) {
        duration = await getMediaDuration(src);
      }

      processedCount++;
      setProcessingProgress(Math.floor((processedCount / totalFiles) * 100));

      return {
        src,
        type: file.type,
        date: file.lastModifiedDate?.toLocaleDateString(),
        size,
        duration,
      };
    }));

    setMediaFiles((prevMedia) => [...prevMedia, ...processedFiles]);
    setProcessingProgress(0); // Reset after completion
  };

  const compressImage = (file: File): Promise<{ src: string; size: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set a maximum width/height for compression, maintain aspect ratio
        const maxWidth = 1024;
        const maxHeight = 1024;
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
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              src: URL.createObjectURL(blob),
              size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
            });
          } else {
            resolve({ src: img.src, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });
          }
        }, 'image/jpeg', 0.7); // Compress to JPEG with 70% quality
      };
      img.onerror = () => {
        resolve({ src: img.src, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });
      };
    });
  };

  const getMediaDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0); // Resolve with 0 if there's an error loading metadata
      };
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50 && itemsToShow < filteredMedia.length) {
        // Load more items when scrolled near the bottom
        setItemsToShow((prev) => prev + itemsPerPage);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      processFiles(event.dataTransfer.files);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [mediaFiles, itemsToShow, filter]); // Re-attach listener if mediaFiles, itemsToShow, or filter change

  const filteredMedia = mediaFiles.filter((media) => {
    if (filter === 'photos') {
      return media.type.startsWith('image/');
    }
    if (filter === 'videos') {
      return media.type.startsWith('video/');
    }
    return true;
  });

  return (
    <div
      className="w-full h-full bg-gray-700 flex flex-col p-4 relative flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold z-10">
          Drop files here
        </div>
      )}
      {processingProgress > 0 && processingProgress < 100 && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white z-20">
          <p className="text-lg font-semibold mb-2">Processing files...</p>
          <div className="w-3/4 h-4 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100 ease-out"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2">{processingProgress}%</p>
        </div>
      )}
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex-1 flex flex-col">
          {filteredMedia.length > 0 ? (
            <div ref={scrollContainerRef} className="grid grid-cols-3 gap-1 overflow-y-auto flex-1">
              {filteredMedia.slice(0, itemsToShow).map((media, index) => (
                <div key={index} className="relative w-full h-32 bg-gray-800 flex items-center justify-center overflow-hidden group">
                  {media.type.startsWith('image/') ? (
                    <img src={media.src} alt={`Uploaded ${index}`} className="object-cover w-full h-full" />
                  ) : (
                    <video src={media.src} controls className="object-cover w-full h-full" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {media.date && <p>Date: {media.date}</p>}
                    {media.size && <p>Size: {media.size}</p>}
                    {media.duration !== undefined && <p>Duration: {formatDuration(media.duration)}</p>}
                  </div>
                </div>
              ))}
              {itemsToShow < filteredMedia.length && (
                <div className="col-span-3 flex justify-center py-4">
                  <p className="text-white">Loading more...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white text-center">
              <p>No {filter === 'photos' ? 'photos' : filter === 'videos' ? 'videos' : 'media'} selected. Choose from your library to get started!</p>
            </div>
          )}

          <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg mt-4">
            <Button
              onClick={handleChoosePhoto}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg w-full mb-4"
            >
              <Image className="h-6 w-6 mr-2" />
              Choose from Photo Library
            </Button>

            <div className="flex justify-center space-x-2 w-full">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="text-white flex-1"
              >
                All
              </Button>
              <Button
                variant={filter === 'photos' ? 'default' : 'outline'}
                onClick={() => setFilter('photos')}
                className="text-white flex-1"
              >
                Photos
              </Button>
              <Button
                variant={filter === 'videos' ? 'default' : 'outline'}
                onClick={() => setFilter('videos')}
                className="text-white flex-1"
              >
                Videos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
    }
  };

  const getMediaDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0); // Resolve with 0 if there's an error loading metadata
      };
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50 && itemsToShow < filteredMedia.length) {
        // Load more items when scrolled near the bottom
        setItemsToShow((prev) => prev + itemsPerPage);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      processFiles(event.dataTransfer.files);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [mediaFiles, itemsToShow, filter]); // Re-attach listener if mediaFiles, itemsToShow, or filter change

  const filteredMedia = mediaFiles.filter((media) => {
    if (filter === 'photos') {
      return media.type.startsWith('image/');
    }
    if (filter === 'videos') {
      return media.type.startsWith('video/');
    }
    return true;
  });

  return (
    <div
      className="w-full h-full bg-gray-700 flex flex-col p-4 relative flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold z-10">
          Drop files here
        </div>
      )}
      <>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex-1 flex flex-col">
          {filteredMedia.length > 0 ? (
            <div ref={scrollContainerRef} className="grid grid-cols-3 gap-1 overflow-y-auto flex-1">
              {filteredMedia.slice(0, itemsToShow).map((media, index) => (
                <div key={index} className="relative w-full h-32 bg-gray-800 flex items-center justify-center overflow-hidden group">
                  {media.type.startsWith('image/') ? (
                    <img src={media.src} alt={`Uploaded ${index}`} className="object-cover w-full h-full" />
                  ) : (
                    <video src={media.src} controls className="object-cover w-full h-full" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {media.date && <p>Date: {media.date}</p>}
                    {media.size && <p>Size: {media.size}</p>}
                    {media.duration !== undefined && <p>Duration: {formatDuration(media.duration)}</p>}
                  </div>
                </div>
              ))}
              {itemsToShow < filteredMedia.length && (
                <div className="col-span-3 flex justify-center py-4">
                  <p className="text-white">Loading more...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white text-center">
              <p>No {filter === 'photos' ? 'photos' : filter === 'videos' ? 'videos' : 'media'} selected. Choose from your library to get started!</p>
            </div>
          )}

          <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg mt-4">
            <Button
              onClick={handleChoosePhoto}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg w-full mb-4"
            >
              <Image className="h-6 w-6 mr-2" />
              Choose from Photo Library
            </Button>

            <div className="flex justify-center space-x-2 w-full">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="text-white flex-1"
              >
                All
              </Button>
              <Button
                variant={filter === 'photos' ? 'default' : 'outline'}
                onClick={() => setFilter('photos')}
                className="text-white flex-1"
              >
                Photos
              </Button>
              <Button
                variant={filter === 'videos' ? 'default' : 'outline'}
                onClick={() => setFilter('videos')}
                className="text-white flex-1"
              >
                Videos
              </Button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

const LiveTab = () => {
  return (
    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
      <p className="text-white">Live Tab Content</p>
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
        <div className="w-full max-w-md bg-gray-900 rounded-lg overflow-hidden relative shadow-lg" style={{ paddingTop: '177.77%' }}>
          <div className="absolute inset-0">
            <div className="h-full w-full flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${translateXValue}%)` }}>
              <RecordTab />
              <UploadTab />
              <LiveTab />
            </div>
          </div>
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
