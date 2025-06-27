'use client';

import type { FeedItem } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Send, Music, Play } from 'lucide-react';
import { CommentSheet } from './comment-sheet';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  item: FeedItem;
  isActive: boolean;
}

const VideoActions = ({ item }: { item: FeedItem }) => {
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.likes);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    // In a real app, you'd call an API to update the like status.
  };

  return (
    <div className="absolute bottom-20 right-2 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
        onClick={handleLikeClick}
      >
        <Heart 
          className={cn("h-8 w-8 text-white transition-colors", isLiked && "fill-red-500 text-red-500")}
        />
        <span className="text-xs">{likeCount.toLocaleString()}</span>
      </Button>
      <CommentSheet commentCount={item.comments}>
        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
        >
          <MessageCircle className="h-8 w-8 text-white" />
          <span className="text-xs">{item.comments}</span>
        </Button>
      </CommentSheet>
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
      >
        <Send className="h-8 w-8 text-white" />
        <span className="text-xs">{item.shares}</span>
      </Button>
    </div>
  );
};


const VideoInfo = ({ item }: { item: FeedItem }) => (
  <div className="absolute bottom-4 left-4 right-4 text-white" onClick={(e) => e.stopPropagation()}>
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

export function VideoCard({ item, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(error => console.error("Video play failed:", error));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
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
  
  return (
    <div className="w-full h-full relative bg-black grid place-items-center" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={item.videoUrl}
        loop
        muted
        playsInline
        className="w-full h-full object-cover col-start-1 row-start-1"
        poster={item.thumbnailUrl}
        data-ai-hint="short form video"
      />
      {!isPlaying && (
          <Play className="h-20 w-20 text-white/70 pointer-events-none col-start-1 row-start-1" fill="white" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none col-start-1 row-start-1" />
      <VideoInfo item={item} />
      <VideoActions item={item} />
    </div>
  );
}
