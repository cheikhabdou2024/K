
'use client';

import * as React from 'react';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { VideoCard } from '@/components/video-card';
import type { FeedItem } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { mockFeedItems } from '@/lib/mock-data';


const LoadingScreen = () => (
  <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white gap-4">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="font-bold text-lg">Curating Your Feed...</p>
  </div>
);


export default function Home() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [feedItems, setFeedItems] = React.useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    setFeedItems(mockFeedItems);
    setIsLoading(false);
  }, []);

  // 3D Flip effect: more elastic, effortless, and powerful
  const onScroll = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slideNodes = api.slideNodes();

    api.scrollSnapList().forEach((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) {
              diffToTarget = scrollSnap - (1 + scrollProgress);
            }
            if (sign === 1) {
              diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          }
        });
      }

      // Elastic, effortless 3D flip: more pronounced and smooth
      const rotateY = diffToTarget * -75; // Increased from -60 for more pronounced rotation
      const translateX = diffToTarget * 50; // Increased from 40 for more movement
      const scale = 1 - Math.abs(diffToTarget) * 0.2; // Increased from 0.15 for more depth
      const opacity = Math.max(0.1, 1 - Math.abs(diffToTarget) * 0.8); // Increased from 0.7 for more fade
      const slideNode = slideNodes[index];
      if (slideNode) {
        slideNode.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1)'; // Adjusted timing and bezier for more elasticity
        slideNode.style.transform = `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`;
        slideNode.style.opacity = `${opacity}`;
        slideNode.style.zIndex = `${100 - Math.abs(diffToTarget) * 15}`; // Adjusted for smoother layering
        slideNode.style.boxShadow = Math.abs(diffToTarget) < 0.01 ? '0 12px 48px 0 rgba(160,32,240,0.35)' : 'none'; // More prominent shadow
      }
    });
  }, []);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      setCurrent(selectedIndex);
      api.slideNodes().forEach((node, index) => {
        node.style.zIndex = index === selectedIndex ? '1' : '0';
      });
    };
    
    const handleInit = () => {
      onScroll(api);
      handleSelect();
    }
    
    handleInit();

    api.on('select', handleSelect);
    api.on('scroll', onScroll);
    api.on('reInit', handleInit);

    return () => {
      if (api) {
        api.off('select', handleSelect);
        api.off('scroll', onScroll);
        api.off('reInit', handleInit);
      }
    };
  }, [api, onScroll]);

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!feedItems.length) {
     return (
       <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white gap-4 text-center p-4">
         <p className="font-bold text-2xl">Welcome to FlipTok!</p>
         <p className="text-muted-foreground">Could not load recommendations.</p>
         <p className="text-muted-foreground">Be the first to share something amazing!</p>
       </div>
     );
  }

  return (
    <div className="h-full w-full bg-black">
      <Carousel
        setApi={setApi}
        className="w-full h-full perspective"
        orientation="horizontal"
        opts={{
          loop: true,
          align: 'start',
        }}
      >
        <CarouselContent className={cn('h-full ml-0', 'transform-style-3d')}>
          {feedItems.map((item, index) => (
            <CarouselItem
              key={item.id}
              className={cn(
                'p-0 backface-hidden carousel-slide-3d',
                'origin-center'
              )}
            >
              <VideoCard item={item} isActive={index === current} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
