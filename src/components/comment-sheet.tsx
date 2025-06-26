'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { MessageCircle, Mic, Send } from 'lucide-react';
import { mockComments } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

export function CommentSheet({
  commentCount,
  children,
}: {
  commentCount: number;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[80%] flex flex-col rounded-t-2xl"
      >
        <SheetHeader className="text-center">
          <SheetTitle className="font-headline">{commentCount} Comments</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 my-4">
          <div className="space-y-4 pr-4">
            {mockComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={comment.user.avatarUrl} />
                  <AvatarFallback>
                    {comment.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                    <p className="font-semibold text-sm">{comment.user.name}</p>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-auto p-0 flex items-center gap-2 border-t pt-4">
          <Input placeholder="Add a comment..." className="flex-1" />
          <Button size="icon" variant="ghost">
            <Mic className="h-5 w-5" />
          </Button>
          <Button size="icon" className="bg-primary">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
