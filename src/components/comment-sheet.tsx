
'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from './ui/button';
import { Heart, Send, Loader2, Mic, Trash2, Play, Pause, Bookmark, Crown, CheckCircle2 } from 'lucide-react';
import { mockComments, mockMe, type Comment as CommentType } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { scanCommentAction } from '@/app/comments/actions';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const SoundWave = () => (
    <svg width="100" height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="10" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6" y1="8" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="10" y1="10" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="6" x2="14" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="11" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="22" y1="8" x2="22" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="4" x2="26" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="30" y1="10" x2="30" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="34" y1="8" x2="34" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="6" x2="38" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="42" y1="11" x2="42" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="46" y1="4" x2="46" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="8" x2="50" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="54" y1="10" x2="54" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="58" y1="6" x2="58" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="62" y1="8" x2="62" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="66" y1="4" x2="66" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="70" y1="11" x2="70" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="74" y1="6" x2="74" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="78" y1="10" x2="78" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="82" y1="8" x2="82" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="86" y1="4" x2="86" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="8" x2="90" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="94" y1="10" x2="94" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="98" y1="10" x2="98" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-primary/10 w-fit">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={togglePlayPause}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
      <div className="relative w-[100px] h-[24px]">
        <div className="absolute inset-0 text-primary/30"><SoundWave /></div>
        <div className="absolute inset-0 h-full overflow-hidden text-primary" style={{ width: `${progress}%` }}><SoundWave /></div>
      </div>
    </div>
  );
};


const CommentItem = ({ comment, onReply, videoOwnerId }: { comment: CommentType; onReply: (comment: CommentType) => void; videoOwnerId: string; }) => {
  const [reaction, setReaction] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const isLongPress = useRef(false);
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  const reactions = ['❤️', '😂', '🔥', '😮', '👍'];
  const isCreator = videoOwnerId === comment.user.id;
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    toast({
      title: newState ? 'Comment Saved' : 'Saved Comment Removed',
      description: newState ? "We'll add a place in your profile to view these soon." : undefined,
    });
  };

  const handleReactionSelect = (newReaction: string) => {
    if (reaction === newReaction) {
      // Un-reacting
      setReaction(null);
      setLikeCount(l => l - 1);
    } else if (reaction) {
      // Changing reaction, like count stays the same
      setReaction(newReaction);
    } else {
      // First time reacting
      setReaction(newReaction);
      setLikeCount(l => l + 1);
    }
    setPickerOpen(false);
  };

  const handlePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setPickerOpen(true);
    }, 500);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleClick = () => {
    if (!isLongPress.current) {
      handleReactionSelect('❤️'); // Default to a heart on short click
    }
  };

  return (
    <div className={cn("flex items-start gap-3 pr-4", { "ml-8": comment.replyTo })}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.avatarUrl} />
        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">@{comment.user.username}</p>
            {isCreator && (
                <Crown className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
            )}
            {comment.user.isVerified && !isCreator && (
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 fill-sky-400" />
            )}
        </div>
        <div className="text-sm bg-muted p-3 rounded-xl rounded-tl-none w-fit max-w-full">
            {comment.replyTo && (
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Replying to <span className="text-primary hover:underline cursor-pointer">@{comment.replyTo.username}</span>
                </p>
            )}
            {comment.text && <p>{comment.text}</p>}
            {comment.audioUrl && <AudioPlayer audioUrl={comment.audioUrl} />}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground px-2">
          <span>{comment.timestamp}</span>
          <button className="font-semibold hover:underline" onClick={() => onReply(comment)}>Reply</button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <Popover open={isPickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
                <button
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onClick={handleClick}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-8 w-8 flex items-center justify-center rounded-full transition-transform active:scale-125 focus:outline-none"
                >
                    {reaction ? (
                        <span className="text-xl transform transition-transform hover:scale-125">{reaction}</span>
                    ) : (
                        <Heart className={cn('h-4 w-4 text-muted-foreground')} />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 rounded-full bg-background/80 backdrop-blur-sm border-border shadow-lg">
                <div className="flex gap-1">
                    {reactions.map(r => (
                        <button key={r} onClick={() => handleReactionSelect(r)} className="p-1.5 rounded-full hover:bg-muted text-xl transition-transform hover:scale-125 focus:outline-none">
                            {r}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground">{likeCount > 0 ? likeCount.toLocaleString() : ''}</span>
        <button onClick={handleBookmark} className="h-8 w-8 flex items-center justify-center rounded-full mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bookmark className={cn('h-4 w-4 text-muted-foreground transition-colors', isBookmarked && 'fill-primary text-primary')} />
        </button>
      </div>
    </div>
  );
};

const AnimatedSoundWave = () => (
    <div className="flex items-center gap-0.5 h-4">
        {Array.from({length: 7}).map((_, i) => (
            <div key={i} className="w-0.5 bg-primary/80" style={{ animation: `sound-wave 1.2s ease-in-out infinite`, animationDelay: `${i * 0.1}s`, height: '100%' }}></div>
        ))}
        <style jsx>{`
            @keyframes sound-wave {
                0% { transform: scaleY(0.3); }
                25% { transform: scaleY(1); }
                50% { transform: scaleY(0.4); }
                75% { transform: scaleY(0.8); }
                100% { transform: scaleY(0.3); }
            }
        `}</style>
    </div>
)


export function CommentSheet({
  commentCount,
  children,
  open,
  onOpenChange,
  videoOwnerId,
}: {
  commentCount: number;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  videoOwnerId: string;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState(mockComments);
  const [isSending, setIsSending] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const formatTime = (time: number) => new Date(time * 1000).toISOString().substr(14, 5);

  const cleanupRecording = () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleSend({ audioUrl });
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Microphone access denied',
        description: 'Please allow microphone access in your browser settings.',
      });
    }
  };
  
  const handlePauseRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
          setIsPaused(true);
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      }
  }

  const handleResumeRecording = () => {
       if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
          setIsPaused(false);
          recordingTimerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
      }
  }

  const handleStopAndSend = () => {
      setIsSending(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state !== 'inactive') {
          mediaRecorderRef.current?.stop();
      }
  }
  
  const handleCancelRecording = () => {
      cleanupRecording();
  }
  
  const handleSend = async ({ text, audioUrl }: { text?: string; audioUrl?: string }) => {
    if (!text?.trim() && !audioUrl) return;
    setIsSending(true);

    try {
      const scanContent = text || audioUrl || '';
      const result = await scanCommentAction(scanContent);

      if (result.isSafe) {
        const newComment: CommentType = {
          id: `comment-${Date.now()}`,
          user: mockMe,
          timestamp: 'Just now',
          likes: 0,
          ...(text && { text }),
          ...(audioUrl && { audioUrl }),
          ...(replyingTo && { replyTo: replyingTo.user }),
        };

        if (replyingTo) {
          setComments(prev => {
            const newComments = [...prev];
            const directParentIndex = newComments.findIndex(c => c.id === replyingTo.id);

            if (directParentIndex === -1) {
              return [newComment, ...prev]; // Fallback if parent disappears
            }

            // Find the last comment in the thread following the parent
            let lastInThreadIndex = directParentIndex;
            for (let i = directParentIndex + 1; i < newComments.length; i++) {
              if (newComments[i].replyTo) {
                lastInThreadIndex = i;
              } else {
                // Reached the next top-level comment
                break;
              }
            }

            newComments.splice(lastInThreadIndex + 1, 0, newComment);
            return newComments;
          });
        } else {
          setComments(prev => [newComment, ...prev]);
        }
        
        setCommentText('');
        setReplyingTo(null);
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
      cleanupRecording();
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend({ text: commentText });
  }

  return (
    <Drawer shouldScaleBackground={false} open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        className="h-[60%] flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader className="text-center p-4 pb-2">
            <DrawerTitle>{comments.length.toLocaleString()} Comments</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="flex-1 my-2">
          <div className="space-y-6 p-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onReply={setReplyingTo} videoOwnerId={videoOwnerId} />
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 bg-background border-t">
          {replyingTo && (
            <div className="px-2 pb-2 text-sm text-muted-foreground flex justify-between items-center">
              <span>Replying to @{replyingTo.user.username}</span>
              <Button variant="ghost" size="icon" className="h-6 w-auto px-2 text-xs" onClick={() => setReplyingTo(null)}>
                Cancel
              </Button>
            </div>
          )}
          {isRecording ? (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleCancelRecording} className="text-destructive hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-5 w-5"/>
                </Button>
                <div className="flex-1 bg-muted rounded-full h-10 flex items-center justify-between px-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-primary" onClick={isPaused ? handleResumeRecording : handlePauseRecording}>
                        {isPaused ? <Mic className="h-4 w-4" /> : <Pause className="h-4 w-4 fill-current" />}
                    </Button>
                    {isPaused ? <p className="text-sm text-muted-foreground">Paused</p> : <AnimatedSoundWave />}
                    <span className="font-mono text-sm text-muted-foreground">{formatTime(recordingTime)}</span>
                </div>
                <Button size="icon" onClick={handleStopAndSend} disabled={isSending} className="bg-primary rounded-full">
                    {isSending ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
          ) : (
             <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={mockMe.avatarUrl} />
                    <AvatarFallback>{mockMe.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder="Add a comment..." 
                  className="flex-1 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSending}
                />
                {commentText.trim() ? (
                    <Button type="submit" size="icon" variant="ghost" className="bg-transparent rounded-full" disabled={isSending}>
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
                    </Button>
                ) : (
                     <Button type="button" size="icon" variant="ghost" className="bg-transparent rounded-full" onClick={handleStartRecording} disabled={isSending}>
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5 text-primary" />}
                    </Button>
                )}
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
