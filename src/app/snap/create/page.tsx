'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, Send, RefreshCw, Loader2 } from 'lucide-react';

export default function CreateStoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handlePost = async () => {
    if (!capturedImage) return;
    setIsPosting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsPosting(false);
    toast({
      title: 'Story Posted!',
      description: 'Your story is now visible to your friends.',
    });
    router.push('/snap');
  };

  const renderContent = () => {
    if (hasCameraPermission === null) {
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
      <>
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transform scale-x-[-1] ${capturedImage ? 'hidden' : 'block'}`}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        {capturedImage && (
          <img src={capturedImage} alt="Captured story" className="w-full h-full object-cover" />
        )}

        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
            onClick={() => router.push('/snap')}
            disabled={isPosting}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute bottom-8 w-full flex justify-center items-center gap-8">
            {capturedImage ? (
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
                        {isPosting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Send className="mr-2 h-5 w-5" />}
                        {isPosting ? 'Posting...' : 'Send Story'}
                    </Button>
                </>
            ) : (
                <button
                    className="h-20 w-20 rounded-full border-4 border-white bg-white/30 transition-colors hover:bg-white/50"
                    onClick={handleCapture}
                    aria-label="Capture photo"
                />
            )}
        </div>
      </>
    );
  };

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center">
        {renderContent()}
    </div>
  );
}
