
'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from './ui/button';
import { Heart, Send, Loader2, Trash2, Pause, Bookmark, Crown, CheckCircle2, Pin, ChevronDown, Smile, Sparkles, Shield, CalendarClock, Volume2, Mic, Square } from 'lucide-react';
import { mockComments, mockMe, type Comment as CommentType } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { scanCommentAction, generateTtsAction } from '@/app/comments/actions';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';

const TtsPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        // Ensure the audio element is reset for the next play
        if(audioRef.current) audioRef.current.currentTime = 0;
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0; // Always play from the start
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  useEffect(() => {
    // Cleanup audio element on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // Release memory
        audioRef.current = null;
      }
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-7 w-7 rounded-full text-primary hover:bg-primary/10",
        isPlaying && 'bg-primary/20'
      )}
      onClick={togglePlay}
      aria-label={isPlaying ? "Pause audio" : "Play comment text"}
    >
      {isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
};


const CommentItem = ({
  comment,
  onReply,
  videoOwnerId,
  isPinned,
  onPinComment,
  isViewingUserCreator,
  isModMode,
  isSelected,
  onSelectComment,
}: {
  comment: CommentType;
  onReply: (comment: CommentType) => void;
  videoOwnerId: string;
  isPinned: boolean;
  onPinComment: (id: string) => void;
  isViewingUserCreator: boolean;
  isModMode: boolean;
  isSelected: boolean;
  onSelectComment: (id: string) => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  const isCommentOwnerCreator = videoOwnerId === comment.user.id;
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    toast({
      title: newState ? 'Comment Saved' : 'Saved Comment Removed',
      description: newState ? "We'll add a place in your profile to view these soon." : undefined,
    });
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => prev + (newIsLiked ? 1 : -1));
  };

  return (
    <div className={cn("flex items-start gap-2 pr-4", { "ml-8": !!comment.parentId })} role="article" aria-labelledby={`comment-user-${comment.id}`}>
       {isModMode && (
        <div className="pt-2">
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectComment(comment.id)}
                aria-label={`Select comment by ${comment.user.username}`}
            />
        </div>
      )}
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.avatarUrl} />
        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        {isPinned && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5 px-1">
            <Pin className="h-3 w-3" />
            <span>Pinned by Creator</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
            <p id={`comment-user-${comment.id}`} className="text-xs text-muted-foreground">@{comment.user.username}</p>
            {isCommentOwnerCreator && (
                <Crown className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
            )}
            {comment.user.isVerified && !isCommentOwnerCreator && (
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 fill-sky-400" />
            )}
            {comment.isFirstTimeCommenter && (
                <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    <span>First Comment!</span>
                </div>
            )}
        </div>
        <div className="text-sm bg-muted p-3 rounded-xl rounded-tl-none w-fit max-w-full">
            {comment.replyTo && (
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Replying to <span className="text-primary hover:underline cursor-pointer">@{comment.replyTo.username}</span>
                </p>
            )}
            <div className="flex items-center gap-2">
              <div className='break-words flex-1'>
                {comment.text ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="m-0" {...props} />,
                      a: ({node, ...props}) => (
                        <a className="text-primary font-semibold hover:underline cursor-pointer" {...props} />
                      ),
                      code: ({node, inline, className, children, ...props}) => {
                        if (inline) {
                          return <code className="bg-primary/10 text-primary px-1 py-0.5 rounded-sm font-mono text-sm" {...props}>{children}</code>
                        }
                        return <code className={cn("font-mono", className)} {...props}>{children}</code>
                      },
                      pre: ({node, ...props}) => <pre className="bg-secondary p-2 rounded-md my-2 text-xs overflow-x-auto" {...props} />
                    }}
                  >
                    {comment.text.replace(/@(\w+)/g, '[@$1](/profile/$1)')}
                  </ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground italic">
                    <Mic className="h-4 w-4"/> 
                    <span>Voice comment</span>
                  </div>
                )}
              </div>
              {comment.audioUrl && <TtsPlayer audioUrl={comment.audioUrl} />}
            </div>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground px-2">
          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          <button className="font-semibold hover:underline" onClick={() => onReply(comment)}>Reply</button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <button
            onClick={handleLikeClick}
            className="h-8 w-8 flex items-center justify-center rounded-full transition-transform active:scale-125 focus:outline-none"
            aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
            aria-pressed={isLiked}
        >
            <Heart className={cn('h-4 w-4 text-muted-foreground transition-colors', isLiked && 'fill-red-500 text-red-500')} />
        </button>
        <span className="text-xs text-muted-foreground">{likeCount > 0 ? likeCount.toLocaleString() : ''}</span>
        <button onClick={handleBookmark} className="h-8 w-8 flex items-center justify-center rounded-full mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={isBookmarked ? 'Remove bookmark from comment' : 'Bookmark comment'} aria-pressed={isBookmarked}>
          <Bookmark className={cn('h-4 w-4 text-muted-foreground transition-colors', isBookmarked && 'fill-primary text-primary')} />
        </button>
         {isViewingUserCreator && !comment.parentId && (
            <button onClick={() => onPinComment(comment.id)} className="h-8 w-8 flex items-center justify-center rounded-full mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={isPinned ? 'Unpin comment' : 'Pin comment'} aria-pressed={isPinned}>
                <Pin className={cn('h-4 w-4 text-muted-foreground transition-colors', isPinned && 'fill-primary text-primary')} />
            </button>
        )}
      </div>
    </div>
  );
};

const emojiCategories = [
  {
    name: 'Smileys & People',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '👽', '👾', '🤖', '🎃', '👋', '🤚', '🖐️', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👍', '👎', '✊', '👊', '👏', '🙌', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '👃', '👀', '👁️', '👅', '👄', '❤️', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
  {
    name: 'Animals & Nature',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦦', '🦥', '🐁', '🐀', '🐿️', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌚', '🌝', '🌛', '🌜', '⭐', '🌟', '💫', '✨', '☄️', '🪐', '🔥', '💧', '🌊'],
  },
  {
    name: 'Food & Drink',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '핫도그', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🧊'],
  },
  {
    name: 'Objects',
    emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🗑️', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '🧾', '💎', '⚖️', '🦯', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🔑', '🗝️', '🛋️', '🪑', '🛌', '🛏️', '🚪', '🪞', '🪟', '🧳', '🖼️', '🗺️', '⛱️', '🗿', '🎈', '🎉', '🎊', '🎁', '🎀', '🧧', '💌', '📮', '🗳️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '📅', '📆', '🗒️', '📈', '📉', '📊', '📋', '📌', '📎', '📏', '📐', '✂️', '🗃️', '🗄️']
  }
];


export function CommentSheet({
  commentCount,
  children,
  open,
  onOpenChange,
  videoOwnerId,
}: {
  commentCount: number;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  videoOwnerId: string;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState(mockComments);
  const [isSending, setIsSending] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
  const [pinnedCommentId, setPinnedCommentId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [fullyExpandedThreads, setFullyExpandedThreads] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('newest');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Moderation state
  const [isModMode, setIsModMode] = useState(false);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const isViewingUserCreator = videoOwnerId === mockMe.id;
  
  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const commentThreads = useMemo(() => {
    const repliesMap = new Map<string, CommentType[]>();
    const threads: CommentType[] = [];

    comments.forEach(comment => {
        if (comment.parentId) {
            if (!repliesMap.has(comment.parentId)) {
                repliesMap.set(comment.parentId, []);
            }
            repliesMap.get(comment.parentId)!.push(comment);
        } else {
            threads.push(comment);
        }
    });

    const sortedThreads = [...threads].sort((a, b) => {
      switch (sortBy) {
        case 'top':
          return b.likes - a.likes;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most-replied': {
            const repliesA = repliesMap.get(a.id)?.length || 0;
            const repliesB = repliesMap.get(b.id)?.length || 0;
            return repliesB - repliesA;
        }
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const populatedThreads = sortedThreads.map(thread => ({
        ...thread,
        replies: (repliesMap.get(thread.id) || []).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));
    
    if (!pinnedCommentId) return populatedThreads;
    
    const pinnedThreadIndex = populatedThreads.findIndex(t => t.id === pinnedCommentId);
    if (pinnedThreadIndex > -1) {
        const pinnedThread = populatedThreads[pinnedThreadIndex];
        const otherThreads = populatedThreads.filter(t => t.id !== pinnedCommentId);
        return [pinnedThread, ...otherThreads];
    }
    return populatedThreads;
  }, [comments, pinnedCommentId, sortBy]);

  const handlePinComment = (commentId: string) => {
    if (!commentThreads.some(thread => thread.id === commentId && !thread.parentId)) {
        toast({
            variant: "destructive",
            title: 'Pinning Failed',
            description: 'Only top-level comments can be pinned.',
        });
        return;
    }
    setPinnedCommentId(currentId => {
        const newPinnedId = currentId === commentId ? null : commentId;
        toast({
            title: newPinnedId ? 'Comment pinned' : 'Comment unpinned',
            description: newPinnedId ? 'This comment will now appear at the top.' : undefined,
        });
        return newPinnedId;
    });
  };
  
  const toggleReplies = (threadId: string) => {
    setExpandedThreads(prev => {
        const newSet = new Set(prev);
        if (newSet.has(threadId)) {
            newSet.delete(threadId);
            setFullyExpandedThreads(fullPrev => {
                const fullNewSet = new Set(fullPrev);
                fullNewSet.delete(threadId);
                return fullNewSet;
            });
        } else {
            newSet.add(threadId);
        }
        return newSet;
    });
  };

  const handleSend = async ({ text, audioDataUri }: { text?: string; audioDataUri?: string }) => {
    setIsSending(true);
    try {
      let newComment: CommentType | null = null;
      const baseComment = {
        id: `comment-${Date.now()}`,
        user: mockMe,
        createdAt: new Date(),
        likes: 0,
        ...(replyingTo && {
          replyTo: replyingTo.user,
          parentId: replyingTo.parentId || replyingTo.id,
        }),
      };
      
      if (text) {
        const [scanResult, ttsResult] = await Promise.all([
          scanCommentAction(text),
          generateTtsAction(text),
        ]);

        if (!scanResult.isSafe) {
          toast({
            variant: 'destructive',
            title: 'Comment Blocked',
            description: scanResult.reason || 'This comment violates our community guidelines.',
          });
          return;
        }

        newComment = { ...baseComment, text: text, audioUrl: ttsResult.audioDataUri };
        setCommentText('');

      } else if (audioDataUri) {
        // Here you might want to add audio content scanning in the future
        newComment = { ...baseComment, audioUrl: audioDataUri };
      }

      if (newComment) {
        setComments(prev => [newComment!, ...prev]);
        if (replyingTo) {
          setExpandedThreads(prev => new Set(prev).add(replyingTo.parentId || replyingTo.id));
        }
      }
      setReplyingTo(null);

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
      if (!commentText.trim()) return;
      handleSend({ text: commentText });
  }

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            handleSend({ audioDataUri: base64String });
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Recording started...", description: "Tap the square to stop and send." });
      } catch (error) {
        console.error("Mic error:", error);
        toast({ variant: 'destructive', title: "Microphone access denied", description: "Please enable microphone permissions in your browser settings." });
      }
    }
  };
  
  const handleScheduleComment = async () => {
    if (!commentText.trim() || !scheduledDate) return;

    setIsSending(true);
    setPopoverOpen(false); // Close popover

    try {
      // In a real app, this would call a backend service to store the scheduled comment.
      // For this demo, we just simulate it with a timeout and a toast.
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Comment Scheduled (Demo)",
        description: `Your reply will be posted on ${scheduledDate.toLocaleString()}.`,
      });
      
      setCommentText('');
      setReplyingTo(null);
      setScheduledDate(undefined);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to schedule comment. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleModMode = () => {
    setIsModMode(prev => {
        if (prev) { // if turning off mod mode
            setSelectedComments(new Set());
        }
        return !prev;
    });
  };

  const handleSelectComment = (commentId: string) => {
    setSelectedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
            newSet.delete(commentId);
        } else {
            newSet.add(commentId);
        }
        return newSet;
    });
  };

  const handleBulkDelete = () => {
    const allIdsToDelete = new Set(selectedComments);
    comments.forEach(comment => {
        if (comment.parentId && selectedComments.has(comment.parentId)) {
            allIdsToDelete.add(comment.id);
        }
    });

    setComments(prev => prev.filter(c => !allIdsToDelete.has(c.id)));
    toast({
        title: `${selectedComments.size} comment thread(s) deleted`,
        description: `A total of ${allIdsToDelete.size} comments were removed.`,
    });
    setSelectedComments(new Set());
    setIsModMode(false);
  };


  return (
    <Drawer shouldScaleBackground={false} open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        className="h-[60%] flex flex-col z-[70]"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader className="p-4 pb-2">
            <div className="flex justify-between items-center gap-2">
                 {isViewingUserCreator ? (
                    <Button variant={isModMode ? "secondary" : "outline"} size="sm" onClick={toggleModMode} className="w-[120px]">
                        {isModMode ? 'Cancel' : <><Shield className="h-4 w-4" /><span>Moderate</span></>}
                    </Button>
                ) : <div className="w-[120px]" /> /* Spacer */}
                <DrawerTitle className="text-center flex-1">{comments.length.toLocaleString()} Comments</DrawerTitle>
                <div className="w-[140px] flex justify-end">
                  <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px] h-9 text-xs" aria-label="Sort comments by">
                          <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="most-replied">Most Replied</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
            </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 my-2">
            <div className="space-y-4 p-4">
                {commentThreads.map((thread) => {
                    const REPLIES_PREVIEW_COUNT = 2;
                    const isExpanded = expandedThreads.has(thread.id);
                    const isFullyExpanded = fullyExpandedThreads.has(thread.id);
                    const repliesToShow = isExpanded 
                        ? thread.replies.slice(0, isFullyExpanded ? thread.replies.length : REPLIES_PREVIEW_COUNT)
                        : [];
                    const canShowMore = isExpanded && !isFullyExpanded && thread.replies.length > REPLIES_PREVIEW_COUNT;
                    const remainingRepliesCount = thread.replies.length - REPLIES_PREVIEW_COUNT;
                    
                    return (
                        <div key={thread.id}>
                            <CommentItem 
                                comment={thread}
                                onReply={setReplyingTo}
                                videoOwnerId={videoOwnerId}
                                isPinned={thread.id === pinnedCommentId}
                                onPinComment={handlePinComment}
                                isViewingUserCreator={isViewingUserCreator}
                                isModMode={isModMode}
                                isSelected={selectedComments.has(thread.id)}
                                onSelectComment={handleSelectComment}
                            />
                            
                            {isExpanded && thread.replies && thread.replies.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    {repliesToShow.map(reply => (
                                        <CommentItem 
                                            key={reply.id} 
                                            comment={reply} 
                                            onReply={setReplyingTo}
                                            videoOwnerId={videoOwnerId}
                                            isPinned={false} // Replies cannot be pinned directly
                                            onPinComment={handlePinComment}
                                            isViewingUserCreator={isViewingUserCreator}
                                            isModMode={isModMode}
                                            isSelected={selectedComments.has(reply.id)}
                                            onSelectComment={handleSelectComment}
                                        />
                                    ))}
                                </div>
                            )}

                            {thread.replies && thread.replies.length > 0 && (
                                <div className="ml-8 pl-3 mt-2 flex items-center gap-4">
                                    <Button variant="ghost" size="sm" onClick={() => toggleReplies(thread.id)} className="text-muted-foreground hover:bg-muted">
                                        <div className="w-6 h-px bg-border mr-2"></div>
                                        {isExpanded ? 'Hide replies' : `View ${thread.replies.length} replies`}
                                        <ChevronDown className={cn('h-4 w-4 ml-1 transition-transform', isExpanded && 'rotate-180')} />
                                    </Button>

                                    {canShowMore && (
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setFullyExpandedThreads(prev => new Set(prev).add(thread.id));
                                        }} className="text-muted-foreground hover:bg-muted">
                                            View {remainingRepliesCount} more replies
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
        <div className="p-4 bg-background border-t">
          {isModMode ? (
            selectedComments.size > 0 ? (
                 <div className="flex items-center justify-between h-10">
                    <div className="text-sm font-medium">
                        {selectedComments.size} selected
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedComments(new Set())}>Deselect All</Button>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground flex items-center justify-center h-10">
                    Select comments to moderate.
                </div>
            )
          ) : (
            <>
              {replyingTo && (
                <div className="px-2 pb-2 text-sm text-muted-foreground flex justify-between items-center">
                  <span>Replying to @{replyingTo.user.username}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-auto px-2 text-xs" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
              )}
                 <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={mockMe.avatarUrl} />
                        <AvatarFallback>{mockMe.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative flex items-center">
                        <Input 
                            placeholder="Add a comment..." 
                            className="flex-1 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring pr-10" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={isSending || isRecording}
                            aria-label="Add a text comment"
                        />
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:text-primary" aria-label="Open emoji picker">
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 h-96 p-0 mb-2 z-[80]">
                                <ScrollArea className="h-full">
                                    <div className="p-2">
                                    {emojiCategories.map((category, catIndex) => (
                                        <div key={category.name}>
                                            <h3 className="text-sm font-semibold text-muted-foreground px-2 py-1">{category.name}</h3>
                                            <div className="grid grid-cols-8 gap-1">
                                                {category.emojis.map((emoji, emojiIndex) => (
                                                    <button
                                                        key={`${catIndex}-${emojiIndex}`}
                                                        type="button"
                                                        className="text-2xl rounded-md hover:bg-muted p-1 transition-colors"
                                                        onClick={() => setCommentText(prev => prev + emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-1">
                        {isViewingUserCreator && (
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10" aria-label="Schedule comment" disabled={!commentText.trim()}>
                                        <CalendarClock className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4 z-[80]">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Schedule Response</h4>
                                            <p className="text-sm text-muted-foreground">
                                            Select a future date and time to post your comment.
                                            </p>
                                        </div>
                                        <Calendar
                                            mode="single"
                                            selected={scheduledDate}
                                            onSelect={setScheduledDate}
                                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                        />
                                        <Input
                                            type="time"
                                            className="w-full"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                                const newDate = scheduledDate ? new Date(scheduledDate) : new Date();
                                                if (newDate < new Date()) { // if date is in past, set to today
                                                    newDate.setFullYear(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                                                }
                                                newDate.setHours(hours, minutes, 0, 0);
                                                setScheduledDate(newDate);
                                            }}
                                        />
                                        <Button
                                            onClick={handleScheduleComment}
                                            disabled={!scheduledDate || scheduledDate < new Date() || isSending}
                                            className="w-full"
                                        >
                                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Schedule
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                         {commentText.trim().length > 0 ? (
                            <Button type="submit" size="icon" variant="ghost" className="bg-transparent rounded-full" disabled={isSending} aria-label="Send comment">
                                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
                            </Button>
                         ) : (
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={handleMicClick}
                                disabled={isSending}
                                className="rounded-full text-primary hover:bg-primary/10"
                                aria-label={isRecording ? 'Stop recording' : 'Record audio comment'}
                            >
                                {isRecording ? <Square className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" /> : <Mic className="h-5 w-5" />}
                            </Button>
                         )}
                    </div>
                </form>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
