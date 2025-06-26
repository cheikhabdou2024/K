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

  return (
    <div className="h-full w-full bg-black">
      <Carousel setApi={setApi} className="w-full h-full">
        <CarouselContent>
          {mockFeedItems.map((item, index) => (
            <CarouselItem key={index}>
              <VideoCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
