'use client';

import * as React from 'react';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { VideoCard } from '@/components/video-card';
import { mockFeedItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function Home() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // This function directly manipulates the slide's transform style to avoid
  // frequent React re-renders, which is the key to a smooth animation.
  const onScroll = React.useCallback((api: CarouselApi) => {
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

      const rotateY = diffToTarget * -90;
      const translateX = diffToTarget * 100;
      const slideNode = slideNodes[index];
      if (slideNode) {
        slideNode.style.transform = `translateX(${translateX}%) rotateY(${rotateY}deg)`;
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
      // Update z-index for all slides to ensure the active one is on top
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
    // Use 'reInit' to re-apply styles when the carousel is resized or its options change
    api.on('reInit', handleInit);

    return () => {
      if (api) {
        api.off('select', handleSelect);
        api.off('scroll', onScroll);
        api.off('reInit', handleInit);
      }
    };
  }, [api, onScroll]);

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
          {mockFeedItems.map((item, index) => (
            <CarouselItem
              key={item.id}
              className={cn(
                'p-0 backface-hidden',
                'origin-center'
                // The transform style is now applied directly via the onScroll callback
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
