import Image from 'next/image';
import type { FeedItem } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Send, Music } from 'lucide-react';
import { CommentSheet } from './comment-sheet';

interface VideoCardProps {
  item: FeedItem;
}

const VideoActions = ({ item }: { item: FeedItem }) => (
  <div className="absolute bottom-20 right-2 flex flex-col gap-4">
    <Button
      variant="ghost"
      size="icon"
      className="flex flex-col h-auto text-white hover:bg-transparent hover:text-white"
    >
      <Heart className="h-8 w-8 text-white fill-transparent" />
      <span className="text-xs">{item.likes}</span>
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

const VideoInfo = ({ item }: { item: FeedItem }) => (
  <div className="absolute bottom-4 left-4 right-4 text-white">
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

export function VideoCard({ item }: VideoCardProps) {
  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      <Image
        src={item.videoUrl}
        alt={item.caption}
        layout="fill"
        objectFit="cover"
        className="opacity-90"
        data-ai-hint="short form video"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <VideoInfo item={item} />
      <VideoActions item={item} />
    </div>
  );
}
