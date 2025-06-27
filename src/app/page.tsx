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
  const [slideTransforms, setSlideTransforms] = React.useState<
    { rotateY: number; translateX: number }[]
  >([]);

  const onScroll = React.useCallback((api: CarouselApi) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();

    const newTransforms = api.scrollSnapList().map((scrollSnap, index) => {
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

      return { rotateY, translateX };
    });
    setSlideTransforms(newTransforms);
  }, []);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    onScroll(api);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
    api.on('scroll', onScroll);
    api.on('reInit', onScroll);

    return () => {
        if (api) {
            api.off('select');
            api.off('scroll');
            api.off('reInit');
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
                )}
                style={{
                  transform: `translateX(${
                    slideTransforms[index]?.translateX ?? 0
                  }%) rotateY(${slideTransforms[index]?.rotateY ?? 0}deg)`,
                  zIndex: current === index ? 1 : 0,
                }}
              >
                <VideoCard item={item} isActive={index === current} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
    </div>
  );
}
