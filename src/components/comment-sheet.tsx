
'use client';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Heart, Send, Loader2 } from 'lucide-react';
import { mockComments, mockMe, type Comment as CommentType } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { scanCommentAction } from '@/app/comments/actions';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const CommentItem = ({ comment }: { comment: CommentType }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(count => count + (!isLiked ? 1 : -1));
  };

  return (
    <div className="flex items-start gap-3 pr-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.avatarUrl} />
        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">@{comment.user.username}</p>
        <p className="text-sm">{comment.text}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>{comment.timestamp}</span>
          <button className="font-semibold hover:underline">Reply</button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLike}>
          <Heart className={cn("h-4 w-4", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </Button>
        <span className="text-xs text-muted-foreground">{likeCount > 0 ? likeCount.toLocaleString() : ''}</span>
      </div>
    </div>
  );
};


export function CommentSheet({
  commentCount,
  children,
}: {
  commentCount: number;
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState(mockComments);
  const [isSending, setIsSending] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSend = async () => {
    if (!commentText.trim()) return;
    setIsSending(true);

    try {
      const result = await scanCommentAction(commentText);

      if (result.isSafe) {
        const newComment: CommentType = {
          id: `comment-${Date.now()}`,
          user: mockMe,
          timestamp: 'Just now',
          text: commentText,
          likes: 0,
        };
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Content moderation error',
          description: result.reason,
        });
      }
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send comment. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[60%] flex flex-col rounded-t-2xl p-0"
      >
        <div className="text-center py-4 relative">
          <p className="font-semibold">{comments.length.toLocaleString()} Comments</p>
          {/* The close button is already part of SheetContent */}
        </div>
        <Separator />
        <ScrollArea className="flex-1 my-2">
          <div className="space-y-6 px-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-4 bg-background">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={mockMe.avatarUrl} />
                    <AvatarFallback>{mockMe.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder="Add a comment..." 
                  className="flex-1 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSending}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    variant="ghost"
                    className="bg-transparent" 
                    disabled={isSending || !commentText.trim()}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
                </Button>
            </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
