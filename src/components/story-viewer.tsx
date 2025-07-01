'use client';

import { useState, useEffect, useRef } from 'react';
import { type Story } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Pause, Play, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useDrag } from '@use-gesture/react';
import { CommentSheet } from './comment-sheet';

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds

export function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);

  const currentUserStory = stories[currentIndex];

  const bind = useDrag(({ down, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
    if (!down && dy < -0.5 && vy > 0.5) {
      setIsCommentSheetOpen(true);
    }
  });

  useEffect(() => {
    const animate = (time: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time;
      }
      const elapsedTime = time - startTimeRef.current;
      const newProgress = (elapsedTime / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        goToNextStory();
      } else {
        setProgress(newProgress);
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (!isPaused) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [currentIndex, isPaused]);

  const resetTimer = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    startTimeRef.current = undefined;
    setProgress(0);
  };
  
  const goToNextStory = () => {
    resetTimer();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    resetTimer();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const togglePause = () => {
      setIsPaused(prev => !prev);
  }

  // Handle pointer down and up for pausing story progression
  const handlePointerDown = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsPaused(true);
  }
  const handlePointerUp = () => setIsPaused(false);


  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onContextMenu={(e) => e.preventDefault()}>
      <div {...bind()} className="relative w-full h-full max-w-md max-h-[95vh] sm:max-h-[80vh] aspect-[9/16] bg-muted rounded-lg overflow-hidden flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 z-20 grid grid-cols-1 gap-1">
            <Progress value={progress} className="h-1 bg-white/30" />
        </div>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserStory.user.avatarUrl} />
                    <AvatarFallback>{currentUserStory.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-sm drop-shadow-md">{currentUserStory.user.name}</span>
            </div>
             <Button variant="ghost" size="icon" className="text-white hover:bg-black/50" onClick={onClose}>
                <X />
             </Button>
        </div>
        
        {/* Image */}
        <div 
          className="flex-1 relative bg-black"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
            <Image
                src={currentUserStory.imageUrl}
                alt={`Story by ${currentUserStory.user.name}`}
                fill
                className="object-cover"
                priority
                data-ai-hint="user story"
            />
        </div>
        
        {/* Navigation Tappable Areas */}
        <div className="absolute inset-y-0 inset-x-0 grid grid-cols-2 z-10">
          <div onClick={goToPrevStory} className="h-full" aria-label="Previous Story"></div>
          <div onClick={goToNextStory} className="h-full" aria-label="Next Story"></div>
        </div>

        {/* Pause/Play overlay icon for visual feedback */}
        {isPaused && (
             <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                <button onClick={togglePause}>
                    <Play className="h-12 w-12 text-white/80" fill="white"/>
                </button>
             </div>
        )}
        <div className="absolute bottom-4 right-4 z-20">
            <CommentSheet
                open={isCommentSheetOpen}
                onOpenChange={setIsCommentSheetOpen}
                commentCount={currentUserStory.comments.length}
                videoOwnerId={currentUserStory.user.id}
            >
                <Button variant="ghost" size="icon" className="text-white hover:bg-black/50" onClick={() => setIsCommentSheetOpen(true)}>
                    <MessageCircle />
                </Button>
            </CommentSheet>
        </div>
      </div>
    </div>
  );
}
