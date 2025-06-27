import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { mockStories, mockChats } from '@/lib/mock-data';
import { Search, Camera } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Stories = () => (
  <div className="px-4">
    <h2 className="text-lg font-bold font-headline text-primary mb-2">Stories</h2>
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max space-x-4 pb-4">
        <div className="flex flex-col items-center space-y-1 w-20">
          <button className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </button>
          <span className="text-xs w-full truncate text-center">Add Story</span>
        </div>
        {mockStories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1 w-20">
            <div className="h-16 w-16 rounded-full p-0.5 border-2 border-primary">
              <Avatar className="h-full w-full">
                <AvatarImage src={story.user.avatarUrl} alt={story.user.name} />
                <AvatarFallback>{story.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs w-full truncate text-center">{story.user.name}</span>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-1" />
    </ScrollArea>
  </div>
);

const Chats = () => (
  <div className="flex-1 px-4">
    <h2 className="text-lg font-bold font-headline text-primary mb-2">Chats</h2>
    <div className="space-y-1">
      {mockChats.map((chat) => (
        <div key={chat.id} className="flex items-center p-2 rounded-lg hover:bg-primary/10 cursor-pointer">
          <Avatar className="h-12 w-12 mr-4">
            <AvatarImage src={chat.user.avatarUrl} alt={chat.user.name} />
            <AvatarFallback>{chat.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{chat.user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
          </div>
          <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
        </div>
      ))}
    </div>
  </div>
);

export default function SnapPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="p-4">
        <h1 className="text-3xl font-bold font-headline text-primary">Snap</h1>
      </header>
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search friends" className="pl-10 h-10" />
        </div>
      </div>
      <Stories />
      <Separator className="my-4" />
      <div className="flex-1 overflow-y-auto">
        <Chats />
      </div>
    </div>
  );
}
