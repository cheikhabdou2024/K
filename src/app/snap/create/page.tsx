'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, Send, RefreshCw, Loader2, FlipHorizontal, Music } from 'lucide-react';
import MusicSelectionSheet from '@/components/music-selection-sheet';

export default function CreateStoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState('record');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<{ id: string; title: string; artist: string; category: string; duration: string; previewUrl: string } | null>(null);
  const [isMusicSheetOpen, setIsMusicSheetOpen] = useState(false);

  const handleSelectMusic = (music: { id: string; title: string; artist: string; category: string; duration: string; previewUrl: string }) => {
    setSelectedMusic(music);
    setIsMusicSheetOpen(false);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let audioSource: MediaElementAudioSourceNode | null = null;
    let cameraAudioSource: MediaStreamAudioSourceNode | null = null;
    let destination: MediaStreamAudioDestinationNode | null = null;

    const setupCamera = async () => {
      setIsCameraInitializing(true);
      setRecordedChunks([]);
      if (activeTab !== 'record') {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
        setHasCameraPermission(null);
        setCapturedImage(null);
        setRecordedVideoUrl(null);
        setIsRecording(false);
        setRecordingTime(0);
        setIsCameraInitializing(false);
        return;
      }

      if (captureMode === 'photo') {
        setIsRecording(false);
        setRecordingTime(0);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        setIsCameraInitializing(false);
        return;
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: true, // Request audio from camera
        });

        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
        setHasCameraPermission(true);
        setIsCameraInitializing(false);

        // Setup audio context for mixing
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        destination = audioContext.createMediaStreamDestination();

        // Connect camera audio to destination
        cameraAudioSource = audioContext.createMediaStreamSource(videoStream);
        cameraAudioSource.connect(destination);

        // If music is selected, add it to the mix
        if (selectedMusic && selectedMusic.previewUrl) {
          const audio = new Audio(selectedMusic.previewUrl);
          audio.loop = true; // Loop the music preview
          audio.volume = 0.5; // Adjust volume as needed
          audioSource = audioContext.createMediaElementSource(audio);
          audioSource.connect(destination);
          audio.play();
        }

        // Combine video and mixed audio streams
        const combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...destination.stream.getAudioTracks(),
        ]);

        if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
          mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9' });
        } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
          mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp8' });
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/mp4' });
        } else {
          console.error('No supported MIME type for MediaRecorder');
          toast({
            variant: 'destructive',
            title: 'Recording Not Supported',
            description: 'Your browser does not support video recording.',
          });
          return;
        }

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunks, { type: mediaRecorderRef.current?.mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          setRecordedChunks([]);
        };
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        setIsCameraInitializing(false);
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [activeTab, facingMode, captureMode, selectedMusic]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const startRecording = () => {
    if (mediaRecorderRef.current && videoRef.current) {
      setRecordedChunks([]);
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRecordedVideoUrl(null);
    setIsRecording(false);
  };

  const handleFlipCamera = () => {
    setFacingMode((prevMode) => (prevMode === 'user' ? 'environment' : 'user'));
  };

  const handlePost = async () => {
    if (!capturedImage && !recordedVideoUrl) return;
    setIsPosting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsPosting(false);
    toast({
      title: 'Story Posted!',
      description: 'Your story is now visible to your friends.',
    });
    router.push('/snap');
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    if (isCameraInitializing && hasCameraPermission === null) {
      return (
         <div className="flex flex-col items-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2">Requesting camera access...</p>
         </div>
      );
    }
    
    if (hasCameraPermission === false) {
      return (
          <div className="p-4 w-full max-w-md">
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please allow camera access in your browser settings. You may need to refresh the page after granting permission.
                </AlertDescription>
            </Alert>
          </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
            onClick={() => router.push('/snap')}
            disabled={isPosting}
          >
            <X className="h-6 w-6" />
          </Button>
          {activeTab === 'record' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
              onClick={() => setIsMusicSheetOpen(true)}
              disabled={isPosting}
            >
              <Music className="h-6 w-6" />
            </Button>
          )}
          {activeTab === 'record' && isRecording && (
            <div className="text-white text-lg font-bold bg-red-500 px-3 py-1 rounded-md">
              {formatTime(recordingTime)}
            </div>
          )}
          {activeTab === 'record' && hasCameraPermission && !capturedImage && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
              onClick={handleFlipCamera}
              disabled={isPosting}
            >
              <FlipHorizontal className="h-6 w-6" />
            </Button>
          )}
        </div>

        {activeTab === 'record' && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transform ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-[1]'} aspect-9/16 ${capturedImage || recordedVideoUrl ? 'hidden' : 'block'}`}
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {capturedImage && (
              <img src={capturedImage} alt="Captured story" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-lg" />
            )}
            {recordedVideoUrl && (
              <video
                src={recordedVideoUrl}
                controls
                className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-lg"
              />
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="text-white">Upload content here</div>
        )}

        {activeTab === 'live' && (
          <div className="text-white">Go live here</div>
        )}

        <MusicSelectionSheet
          isOpen={isMusicSheetOpen}
          onClose={() => setIsMusicSheetOpen(false)}
          onSelectMusic={handleSelectMusic}
        />

        <div className="absolute bottom-8 w-full flex flex-col items-center gap-4 sm:gap-8">
            <div className="flex space-x-4">
                <Button
                    variant={activeTab === 'record' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('record')}
                    className="rounded-full"
                >
                    Record
                </Button>
                <Button
                    variant={activeTab === 'upload' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('upload')}
                    className="rounded-full"
                >
                    Upload
                </Button>
                <Button
                    variant={activeTab === 'live' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('live')}
                    className="rounded-full"
                >
                    Live
                </Button>
            </div>
            {activeTab === 'record' && (
                <div className="flex flex-col items-center gap-4 sm:gap-8">
                    <div className="flex space-x-2 p-1 bg-black/50 rounded-full">
                        <Button
                            variant={captureMode === 'photo' ? 'default' : 'ghost'}
                            onClick={() => setCaptureMode('photo')}
                            className="rounded-full text-white"
                        >
                            Photo
                        </Button>
                        <Button
                            variant={captureMode === 'video' ? 'default' : 'ghost'}
                            onClick={() => setCaptureMode('video')}
                            className="rounded-full text-white"
                        >
                            Video
                        </Button>
                    </div>
                    <div className="flex justify-center items-center gap-4 sm:gap-8">
                {capturedImage || recordedVideoUrl ? (
                <>
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full font-bold bg-black/50 text-white border-white/50 hover:bg-white/20"
                        onClick={handleRetake}
                        disabled={isPosting}
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Retake
                    </Button>
                    <Button
                        size="lg"
                        className="rounded-full font-bold bg-primary"
                        onClick={handlePost}
                        disabled={isPosting}
                    >
                        {isPosting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Send className="mr-2 h-5 w-5" />} {isPosting ? 'Posting...' : 'Send Story'}
                    </Button>
                </>
            ) : (
                <button
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white/30 hover:bg-white/50'}`}
                    onClick={captureMode === 'photo' ? handleCapture : (isRecording ? stopRecording : startRecording)}
                    aria-label={captureMode === 'photo' ? 'Capture photo' : (isRecording ? 'Stop recording' : 'Start recording')}
                >
                    {isRecording && <div className="h-8 w-8 rounded-full bg-white" />}
                </button>
            )}
                </div>
            </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center">
      {renderContent()}
    </div>
  );
}
