
'use client';

import * as React from 'react';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { VideoCard } from '@/components/video-card';
import { type FeedItem, type FirestorePost, type User } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
  <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white gap-4">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="font-bold text-lg">Loading Feed...</p>
  </div>
);

export default function Home() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [feedItems, setFeedItems] = React.useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(postsQuery);

        const postsData = querySnapshot.docs.map(doc => ({ ...doc.data() as FirestorePost, id: doc.id }));

        const feedItemsWithUsers: FeedItem[] = await Promise.all(
          postsData.map(async (post) => {
            const userDoc = await getDoc(doc(db, 'users', post.userId));
            const user = userDoc.data() as User;
            // Convert Firestore Timestamp to a plain object for client-side compatibility
            const createdAt = {
                seconds: post.createdAt.seconds,
                nanoseconds: post.createdAt.nanoseconds,
            };
            return { ...post, user, createdAt };
          })
        );
        
        setFeedItems(feedItemsWithUsers);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
         <p className="text-muted-foreground">It looks like there are no videos yet.</p>
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
                'p-0 backface-hidden',
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
