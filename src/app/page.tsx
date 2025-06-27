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

export default function Home() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    
    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', handleSelect);

    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  return (
    <div className="h-full w-full bg-black">
      <Carousel 
        setApi={setApi} 
        className="w-full h-full"
        orientation="horizontal"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="h-full ml-0">
          {mockFeedItems.map((item, index) => (
            <CarouselItem key={item.id} className="p-0">
              <VideoCard item={item} isActive={index === current}/>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
