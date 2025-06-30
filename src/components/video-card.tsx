
'use client';

import type { FeedItem, User, Product } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Send, Play, Settings, Plus, Eye, PictureInPicture2, ShoppingBag, Download } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CommentSheet } from './comment-sheet';
import { Slider } from './ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Image from 'next/image';


interface VideoActionsProps {
  item: FeedItem;
  isLiked: boolean;
  likeCount: number;
  handleLikeClick: (e: React.MouseEvent) => void;
  isCommentSheetOpen: boolean;
  setIsCommentSheetOpen: (open: boolean) => void;
  videoOwnerId: string;
  viewCount: number;
}

const VideoActions = ({ item, isLiked, likeCount, handleLikeClick, isCommentSheetOpen, setIsCommentSheetOpen, videoOwnerId, viewCount }: VideoActionsProps) => {
  const [formattedLikeCount, setFormattedLikeCount] = useState('');
  const [formattedCommentCount, setFormattedCommentCount] = useState('');
  const [formattedShareCount, setFormattedShareCount] = useState('');
  const [formattedViewCount, setFormattedViewCount] = useState('');

  useEffect(() => {
    // This effect runs only on the client, after hydration,
    // to safely use locale-specific formatting and avoid hydration mismatches.
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      });
      setFormattedLikeCount(formatter.format(likeCount || 0));
      setFormattedCommentCount(formatter.format(item.comments || 0));
      setFormattedShareCount(formatter.format(item.shares || 0));
      setFormattedViewCount(formatter.format(viewCount || 0));
    } catch (e) {
      // Fallback for older environments that may not support the notation option.
      setFormattedLikeCount((likeCount || 0).toLocaleString());
      setFormattedCommentCount((item.comments || 0).toLocaleString());
      setFormattedShareCount((item.shares || 0).toLocaleString());
      setFormattedViewCount((viewCount || 0).toLocaleString() || '12K');
    }
  }, [likeCount, item.comments, item.shares, viewCount]);


  return (
    <div className="absolute bottom-20 right-2 flex flex-col gap-4 z-20" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col items-center h-auto text-white">
        <Eye className="h-6 w-6 text-white" />
        <span className="text-xs">{formattedViewCount}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
        onClick={handleLikeClick}
      >
        <Heart 
          className={cn("h-6 w-6 text-white transition-all active:scale-125", isLiked && "fill-red-500 text-red-500")}
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
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="text-xs">{formattedCommentCount}</span>
        </Button>
      </CommentSheet>
      <Button
        variant="ghost"
        size="icon"
        className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
      >
        <Send className="h-6 w-6 text-white" />
        <span className="text-xs">{formattedShareCount}</span>
      </Button>
    </div>
  );
};


const CreatorAvatar = ({ user, onFollow }: { user: User, onFollow: () => void }) => (
  <div className="relative">
    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
      <AvatarImage src={user.avatarUrl} alt={user.name} />
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <Button
      variant="ghost"
      size="icon"
      className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={(e) => {
          e.stopPropagation(); // Prevent tap-to-pause
          onFollow();
      }}
      aria-label={`Follow ${user.username}`}
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);


interface VideoCardProps {
  item: FeedItem;
  isActive: boolean;
}

// Helper functions for gesture calculations
const getDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};


export function VideoCard({ item, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartAnimationTimeout = useRef<NodeJS.Timeout>();
  const optionsMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPress = useRef(false);

  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.likes);
  
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const wasPlayingBeforeCommentOpen = useRef(false);

  const [videoProgress, setVideoProgress] = useState(0);
  const { toast } = useToast();
  const [quality, setQuality] = useState('Auto');
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);


  // State and refs for pinch-to-zoom
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pointersRef = useRef(new Map());
  const initialPinchDistanceRef = useRef(0);
  const wasGestureActiveRef = useRef(false);
  const lastScaleRef = useRef(1);
  
  useEffect(() => {
    // Check for Picture-in-Picture support on the client
    if (typeof window !== 'undefined' && 'pictureInPictureEnabled' in document) {
        setIsPipSupported(document.pictureInPictureEnabled);
    }
  }, []);


  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isActive) {
        video.play().catch(error => console.error("Video play failed:", error));
        setIsPlaying(true);
      } else {
        video.pause();
        video.currentTime = 0;
        setIsPlaying(false);
        setIsCommentSheetOpen(false);
        // Reset zoom and other states when video becomes inactive
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }

    // Cleanup all timeouts when the component becomes inactive or unmounts
    return () => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      if (heartAnimationTimeout.current) clearTimeout(heartAnimationTimeout.current);
      if (optionsMenuTimeoutRef.current) clearTimeout(optionsMenuTimeoutRef.current);
    };
  }, [isActive]);

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
    wasGestureActiveRef.current = false;
    wasLongPress.current = false;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (pointersRef.current.size === 1) {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        
        optionsMenuTimeoutRef.current = setTimeout(() => {
            if (tapTimeout.current) {
                clearTimeout(tapTimeout.current);
                tapTimeout.current = null;
            }
            wasLongPress.current = true;
            setIsOptionsDialogOpen(true);
            if(isPlaying) togglePlay();
        }, 500);
    }
    
    if (pointersRef.current.size === 2) {
        if (tapTimeout.current) clearTimeout(tapTimeout.current);
        if (optionsMenuTimeoutRef.current) clearTimeout(optionsMenuTimeoutRef.current);

        const points = Array.from(pointersRef.current.values());
        initialPinchDistanceRef.current = getDistance(points[0] as any, points[1] as any);
        lastScaleRef.current = scale;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;

    if (pointerStartRef.current && optionsMenuTimeoutRef.current) {
        const moveDistance = getDistance(pointerStartRef.current, { x: e.clientX, y: e.clientY });
        if (moveDistance > 10) {
            clearTimeout(optionsMenuTimeoutRef.current);
            optionsMenuTimeoutRef.current = null;
        }
    }

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (pointersRef.current.size === 2) {
        wasGestureActiveRef.current = true;
        const points = Array.from(pointersRef.current.values());
        const currentDistance = getDistance(points[0] as any, points[1] as any);
        const newScale = Math.max(1, Math.min(lastScaleRef.current * (currentDistance / initialPinchDistanceRef.current), 4));
        setScale(newScale);
    } else if (pointersRef.current.size === 1 && scale > 1) {
        wasGestureActiveRef.current = true;
        if (!pointerStartRef.current) return;
        const currentPos = { x: e.clientX, y: e.clientY };
        const deltaX = currentPos.x - pointerStartRef.current.x;
        const deltaY = currentPos.y - pointerStartRef.current.y;

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const rect = videoElement.getBoundingClientRect();
        const maxPosX = Math.max(0, (rect.width * scale - rect.width) / 2);
        const maxPosY = Math.max(0, (rect.height * scale - rect.height) / 2);
        
        const newX = Math.max(-maxPosX, Math.min(maxPosX, position.x + deltaX));
        const newY = Math.max(-maxPosY, Math.min(maxPosY, position.y + deltaY));

        setPosition({ x: newX, y: newY });
        pointerStartRef.current = currentPos;
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);

    if (optionsMenuTimeoutRef.current) clearTimeout(optionsMenuTimeoutRef.current);
    
    if (wasLongPress.current) {
        if(pointersRef.current.size < 1) pointerStartRef.current = null;
        return;
    }
    
    if (wasGestureActiveRef.current) {
        if (scale < 1.05) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
        lastScaleRef.current = scale;
        if(pointersRef.current.size < 2) initialPinchDistanceRef.current = 0;

        if (pointersRef.current.size === 1) {
            const remainingPointer = Array.from(pointersRef.current.values())[0] as any;
            pointerStartRef.current = { x: remainingPointer.x, y: remainingPointer.y };
        } else if(pointersRef.current.size < 1) {
             pointerStartRef.current = null;
        }
        return;
    }
    
    if (!pointerStartRef.current) return;
    
    const start = pointerStartRef.current;
    const end = { x: e.clientX, y: e.clientY };
    const moveDistance = getDistance(start, end);

    if (moveDistance < 10) {
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
    
    pointerStartRef.current = null;
  };
  
  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    toast({
      title: "Quality Changed (Demo)",
      description: `Video quality has been set to ${newQuality}.`,
    });
  };
  
  const handlePipClick = async () => {
    if (!videoRef.current) return;

    try {
        if (videoRef.current !== document.pictureInPictureElement) {
            await videoRef.current.requestPictureInPicture();
        } else {
            await document.exitPictureInPicture();
        }
        setIsOptionsDialogOpen(false);
    } catch (error) {
        console.error('PiP Error:', error);
        toast({
            variant: 'destructive',
            title: 'Picture-in-Picture Failed',
            description: 'Could not enter Picture-in-Picture mode.',
        });
    }
  };

  const handleDownloadClick = () => {
    toast({
        title: "Download Started (Demo)",
        description: "In a real app, the video would begin downloading.",
    });
    setIsOptionsDialogOpen(false);
  }

  const handleFollow = () => {
    toast({ title: `Followed ${item.user.username} (Demo)` });
  };


  return (
    <div className="w-full h-full bg-black flex flex-col">
        <div 
            className="flex-1 relative grid place-items-center min-h-0 cursor-pointer touch-none overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerCancel={handlePointerUp}
        >
            <video
                ref={videoRef}
                src={item.videoUrl}
                loop
                playsInline
                className="w-full h-full object-cover col-start-1 row-start-1 transition-transform duration-100 ease-out"
                poster={item.thumbnailUrl}
                data-ai-hint="short form video"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center'
                }}
            />

            {showHeart && (
                <Heart fill="white" className="h-24 w-24 text-white col-start-1 row-start-1 z-20 pointer-events-none animate-like-heart" />
            )}
            
            {!isPlaying && (
                <Play className="h-20 w-20 text-white/70 pointer-events-none col-start-1 row-start-1 z-20" fill="white" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none col-start-1 row-start-1 z-10" />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <CreatorAvatar user={item.user} onFollow={handleFollow} />
            </div>
            
            <VideoActions 
                item={item} 
                isLiked={isLiked} 
                likeCount={likeCount} 
                handleLikeClick={handleLikeClick}
                isCommentSheetOpen={isCommentSheetOpen}
                setIsCommentSheetOpen={setIsCommentSheetOpen}
                videoOwnerId={item.user.id}
                viewCount={item.views}
            />

            <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
                <DialogContent className="bg-black/80 border-white/20 text-white" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-1">
                    <Button variant="ghost" className="justify-start text-base p-3 h-auto" onClick={handleDownloadClick}>
                        <Download className="mr-3 h-5 w-5" /> Download
                    </Button>

                    {isPipSupported && (
                        <Button variant="ghost" className="justify-start text-base p-3 h-auto" onClick={handlePipClick}>
                            <PictureInPicture2 className="mr-3 h-5 w-5" /> Picture-in-Picture
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="justify-start text-base p-3 h-auto w-full">
                                <Settings className="mr-3 h-5 w-5" /> Settings
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            side="right"
                            className="bg-black/70 border-white/30 text-white min-w-[120px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenuLabel>Quality</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={quality} onValueChange={handleQualityChange}>
                                {['Auto', '1080p', '720p', '360p'].map((q) => (
                                <DropdownMenuRadioItem key={q} value={q}>
                                    {q}
                                </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {item.product && (
                        <Button variant="ghost" className="justify-start text-base p-3 h-auto" onClick={() => { setIsProductSheetOpen(true); setIsOptionsDialogOpen(false); }}>
                            <ShoppingBag className="mr-3 h-5 w-5" /> Shop This Video
                        </Button>
                    )}
                </div>
                </DialogContent>
            </Dialog>
            
            {item.product && (
                <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
                <SheetContent
                    side="bottom"
                    className="h-auto max-h-[75%] bg-background text-foreground z-[70]"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <SheetHeader>
                    <SheetTitle className="text-center">Shop This Video</SheetTitle>
                    </SheetHeader>
                    <div className="py-4 flex flex-col items-center gap-4">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border">
                        <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" data-ai-hint="product image" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-semibold">{item.product.name}</h3>
                        <p className="text-2xl font-bold text-primary">${item.product.price.toFixed(2)}</p>
                    </div>
                    <Button asChild size="lg" className="w-full max-w-sm font-bold">
                        <a href={item.product.purchaseUrl} target="_blank" rel="noopener noreferrer">
                            Buy Now
                        </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">You will be redirected to an external site to complete your purchase.</p>
                    </div>
                </SheetContent>
                </Sheet>
            )}
        </div>
        <div
            className={cn(
                "h-2 px-4 flex items-center transition-opacity duration-300",
                !isPlaying && isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={(e) => e.stopPropagation()}
        >
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
    </div>
  );
}
