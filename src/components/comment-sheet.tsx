'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { MessageCircle, Mic, Send, Trash2, Play, Pause, Square, Loader2 } from 'lucide-react';
import { mockComments } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';
import { scanCommentAction } from '@/app/comments/actions';

const VoiceCommentPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };
  
  return (
    <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg">
       <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden"
        />
      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={togglePlayPause}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Progress value={progress} className="h-2 flex-1" />
    </div>
  )
}

const blobToDataUri = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export function CommentSheet({
  commentCount,
  children,
}: {
  commentCount: number;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const supportedMimeTypes = [
        'audio/mp4', // Preferred, supported by Gemini
        'audio/webm', // Fallback
      ];
      const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      discardRecording();
      startRecording();
    }
  };

  const discardRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
  }

  const handleSend = async () => {
    if (!audioURL && !commentText.trim()) {
      return;
    }
    setIsSending(true);
    try {
      let result;
      if (audioURL) {
        const audioBlob = await fetch(audioURL).then(res => res.blob());
        const audioDataUri = await blobToDataUri(audioBlob);
        result = await scanCommentAction(audioDataUri, 'audio');
      } else {
        result = await scanCommentAction(commentText, 'text');
      }

      if (result.isSafe) {
        toast({ title: 'Success', description: 'Comment sent!' });
        discardRecording();
        setCommentText('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Content moderation error',
          description: result.reason,
        });
      }
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send comment. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Sheet onOpenChange={(open) => !open && stopRecording()}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[80%] flex flex-col rounded-t-2xl"
      >
        <SheetHeader className="text-center">
          <SheetTitle className="font-headline">{commentCount} Comments</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 my-4">
          <div className="space-y-4 pr-4">
            {mockComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={comment.user.avatarUrl} />
                  <AvatarFallback>
                    {comment.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{comment.user.name}</p>
                   {comment.text && (
                    <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                      <p className="text-sm">{comment.text}</p>
                    </div>
                   )}
                   {comment.audioUrl && <VoiceCommentPlayer src={comment.audioUrl} />}
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-auto p-0 flex items-center gap-2 border-t pt-4">
          {audioURL ? (
            <div className="flex w-full items-center gap-2">
               <VoiceCommentPlayer src={audioURL} />
               <Button size="icon" variant="destructive" onClick={discardRecording} disabled={isSending}>
                  <Trash2 className="h-5 w-5" />
               </Button>
            </div>
          ) : (
             <Input 
              placeholder="Add a comment..." 
              className="flex-1" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isRecording || isSending}
            />
          )}
          <Button size="icon" variant="ghost" onClick={handleMicClick} disabled={!!audioURL || isSending}>
             {isRecording ? <Square className="h-5 w-5 text-red-500 fill-red-500" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button size="icon" className="bg-primary" onClick={handleSend} disabled={isSending || isRecording}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
