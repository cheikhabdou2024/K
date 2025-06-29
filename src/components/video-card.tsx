
'use client';

import type { FeedItem } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Send, Music, Play } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CommentSheet } from './comment-sheet';
import { Slider } from './ui/slider';


interface VideoActionsProps {
  item: {
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  likeCount: number;
  handleLikeClick: (e: React.MouseEvent) => void;
  isCommentSheetOpen: boolean;
  setIsCommentSheetOpen: (open: boolean) => void;
  videoOwnerId: string;
}

const VideoActions = ({ item, isLiked, likeCount, handleLikeClick, isCommentSheetOpen, setIsCommentSheetOpen, videoOwnerId }: VideoActionsProps) => {
  const [formattedLikeCount, setFormattedLikeCount] = useState('');
  const [formattedCommentCount, setFormattedCommentCount] = useState('');
  const [formattedShareCount, setFormattedShareCount] = useState('');


  useEffect(() => {
    // This effect runs only on the client, after hydration,
    // so it's safe to use locale-specific formatting.
    setFormattedLikeCount(likeCount.toLocaleString());
    setFormattedCommentCount(item.comments.toLocaleString());
    setFormattedShareCount(item.shares.toLocaleString());
  }, [likeCount, item.comments, item.shares]);


  return (
    <div className="absolute bottom-20 right-2 flex flex-col gap-4 z-10" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
        onClick={handleLikeClick}
      >
        <Heart 
          className={cn("h-8 w-8 text-white transition-all active:scale-125", isLiked && "fill-red-500 text-red-500")}
        />
        <span className="text-xs">{formattedLikeCount}</span>
      </Button>
      <CommentSheet
        commentCount={item.comments}
        open={isCommentSheetOpen}
        onOpenChange={setIsCommentSheetOpen}
        videoOwnerId={videoOwnerId}
      >
        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
        >
          <MessageCircle className="h-8 w-8 text-white" />
          <span className="text-xs">{formattedCommentCount}</span>
        </Button>
      </CommentSheet>
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
      >
        <Send className="h-8 w-8 text-white" />
        <span className="text-xs">{formattedShareCount}</span>
      </Button>
    </div>
  );
};


const VideoInfo = ({ item }: { item: FeedItem }) => (
  <div className="absolute bottom-4 left-4 right-4 text-white z-10" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center gap-2">
      <Avatar className="w-10 h-10 border-2 border-white">
        <AvatarImage src={item.user.avatarUrl} />
        <AvatarFallback>{item.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <p className="font-bold text-lg">@{item.user.username}</p>
      <Button variant="outline" className="text-primary border-primary h-8 ml-2 bg-transparent backdrop-blur-sm">Follow</Button>
    </div>
    <p className="mt-2 text-sm">{item.caption}</p>
    <div className="flex items-center gap-2 mt-2">
      <Music className="h-4 w-4" />
      <p className="text-sm font-semibold">{item.sound.title}</p>
    </div>
  </div>
);

interface VideoCardProps {
  item: FeedItem;
  isActive: boolean;
}

export function VideoCard({ item, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartAnimationTimeout = useRef<NodeJS.Timeout>();

  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.likes);
  
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const wasPlayingBeforeCommentOpen = useRef(false);

  // New state for preview feature
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        // Don't play if we're in preview mode from a previous long press
        if (!isPreviewing) {
            videoRef.current.play().catch(error => console.error("Video play failed:", error));
            setIsPlaying(true);
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsCommentSheetOpen(false);
        setIsPreviewing(false); // Reset preview state when swiping away
      }
    }

    // Cleanup timeouts when the component becomes inactive or unmounts
    return () => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      if (heartAnimationTimeout.current) clearTimeout(heartAnimationTimeout.current);
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    };
  }, [isActive, isPreviewing]);

  // Update video progress for the slider
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
        if (video.duration) {
            setVideoProgress((video.currentTime / video.duration) * 100);
        }
    };

    video.addEventListener('timeupdate', updateProgress);

    return () => {
        video.removeEventListener('timeupdate', updateProgress);
    };
  }, []);


  useEffect(() => {
    if (!isActive) return; // Only for the active video
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isCommentSheetOpen) {
      // Comments are open
      if (!videoElement.paused) {
        wasPlayingBeforeCommentOpen.current = true;
        videoElement.pause();
        setIsPlaying(false);
      }
    } else {
      // Comments are closed
      if (wasPlayingBeforeCommentOpen.current && videoElement.paused) {
        videoElement.play().catch(error => console.error("Video play failed:", error));
        setIsPlaying(true);
      }
      wasPlayingBeforeCommentOpen.current = false; // Reset the flag
    }
  }, [isCommentSheetOpen, isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleLikeClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(count => count + (newIsLiked ? 1 : -1));
    // In a real app, you would call an API here to persist the like.
  };
  
  const triggerDoubleTapLike = () => {
    if (!isLiked) {
      handleLikeClick();
    }
      
    setShowHeart(true);
    if (heartAnimationTimeout.current) {
      clearTimeout(heartAnimationTimeout.current);
    }
    heartAnimationTimeout.current = setTimeout(() => {
      setShowHeart(false);
    }, 800);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    longPressTimeout.current = setTimeout(() => {
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
        }
        setIsPreviewing(true);
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
        longPressTimeout.current = null;
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!e.isPrimary || !pointerStartRef.current || !longPressTimeout.current) return;
    
    const moveThreshold = 10;
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    
    if (isPreviewing) {
        setIsPreviewing(false);
        if (videoRef.current && isActive) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
        pointerStartRef.current = null; 
        return;
    }

    if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
    }

    if (!pointerStartRef.current) return;

    const start = pointerStartRef.current;
    const end = { x: e.clientX, y: e.clientY };
    pointerStartRef.current = null;

    const deltaX = Math.abs(end.x - start.x);
    const deltaY = end.y - start.y;

    if (deltaY < -40 && deltaX < 30) {
        setIsCommentSheetOpen(true);
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
        }
        return;
    }
    
    if (deltaX < 10 && Math.abs(deltaY) < 10) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
        triggerDoubleTapLike();
      } else {
        tapTimeout.current = setTimeout(() => {
          togglePlay();
          tapTimeout.current = null;
        }, 300);
      }
    }
  };
  
  return (
    <div 
        className={cn("w-full h-full relative bg-black grid place-items-center", !isPreviewing && "cursor-pointer")} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
    >
      <video
        ref={videoRef}
        src={item.videoUrl}
        loop
        playsInline
        className="w-full h-full object-cover col-start-1 row-start-1"
        poster={item.thumbnailUrl}
        data-ai-hint="short form video"
        // Mute video while scrubbing for a better UX
        muted={isPreviewing}
      />

      {showHeart && (
          <Heart fill="white" className="h-24 w-24 text-white col-start-1 row-start-1 z-20 pointer-events-none animate-like-heart" />
      )}
      
      {!isPlaying && !isPreviewing && (
          <Play className="h-20 w-20 text-white/70 pointer-events-none col-start-1 row-start-1 z-20" fill="white" />
      )}

      {!isPreviewing && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none col-start-1 row-start-1 z-10" />
            <VideoInfo item={item} />
            <VideoActions 
                item={item} 
                isLiked={isLiked} 
                likeCount={likeCount} 
                handleLikeClick={handleLikeClick}
                isCommentSheetOpen={isCommentSheetOpen}
                setIsCommentSheetOpen={setIsCommentSheetOpen}
                videoOwnerId={item.user.id}
            />
          </>
      )}

      {isPreviewing && (
        <div className="absolute bottom-4 left-4 right-4 z-30 px-2">
            <Slider
                value={[videoProgress]}
                onValueChange={(value) => {
                    if (videoRef.current && videoRef.current.duration) {
                        const newTime = (value[0] / 100) * videoRef.current.duration;
                        videoRef.current.currentTime = newTime;
                    }
                }}
            />
        </div>
      )}
    </div>
  );
}
