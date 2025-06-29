
'use client';

import type { FeedItem } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Send, Music, Play } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CommentSheet } from './comment-sheet';


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
}

const VideoActions = ({ item, isLiked, likeCount, handleLikeClick, isCommentSheetOpen, setIsCommentSheetOpen }: VideoActionsProps) => {
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

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(error => console.error("Video play failed:", error));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsCommentSheetOpen(false); // Close comments when swiping to new video
      }
    }

    // Cleanup timeouts when the component becomes inactive or unmounts
    return () => {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
      if (heartAnimationTimeout.current) {
        clearTimeout(heartAnimationTimeout.current);
      }
    };
  }, [isActive]);

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

  const handleTap = () => {
    // If a timeout is already set, it means this is a double tap
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
      triggerDoubleTapLike();
    } else {
      // Otherwise, it's a single tap. Set a timeout to handle play/pause
      tapTimeout.current = setTimeout(() => {
        togglePlay();
        tapTimeout.current = null;
      }, 300); // Wait 300ms to see if a second tap occurs
    }
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.isPrimary) {
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!e.isPrimary || !pointerStartRef.current) {
      return;
    }

    const start = pointerStartRef.current;
    const end = { x: e.clientX, y: e.clientY };
    pointerStartRef.current = null;

    const deltaX = Math.abs(end.x - start.x);
    const deltaY = end.y - start.y;

    // A valid swipe up must be primarily vertical.
    if (deltaY < -40 && deltaX < 30) {
        setIsCommentSheetOpen(true);
        // Cancel any pending single-tap action (play/pause).
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
        }
        return;
    }
    
    // Check if it's a tap (minimal movement)
    if (deltaX < 10 && Math.abs(deltaY) < 10) {
      handleTap();
    }
  };
  
  return (
    <div 
        className="w-full h-full relative bg-black grid place-items-center" 
        onPointerDown={handlePointerDown}
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
      />

      {showHeart && (
          <Heart fill="white" className="h-24 w-24 text-white col-start-1 row-start-1 z-20 pointer-events-none animate-like-heart" />
      )}
      
      {!isPlaying && (
          <Play className="h-20 w-20 text-white/70 pointer-events-none col-start-1 row-start-1 z-20" fill="white" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none col-start-1 row-start-1 z-10" />
      <VideoInfo item={item} />
      <VideoActions 
        item={item} 
        isLiked={isLiked} 
        likeCount={likeCount} 
        handleLikeClick={handleLikeClick}
        isCommentSheetOpen={isCommentSheetOpen}
        setIsCommentSheetOpen={setIsCommentSheetOpen}
      />
    </div>
  );
}
