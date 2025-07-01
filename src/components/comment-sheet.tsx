'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from './ui/button';
import { Heart, Send, Loader2, Trash2, Pause, Bookmark, Crown, CheckCircle2, Pin, ChevronDown, Smile, Sparkles, CalendarClock, Volume2, Mic, Square, Play, XIcon } from 'lucide-react';
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
import { Calendar } from './ui/calendar';


import { useDrag } from '@use-gesture/react';

const StaticAudioVisualizer = ({ barCount = 30 }: { barCount?: number }) => {
  const bars = useMemo(() => 
      Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-primary"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
    )), [barCount]);

  return (
    <div className="flex h-8 items-center justify-center gap-0.5 w-full">
      {bars}
    </div>
  );
};


const AudioPreview = ({ audioUrl, onSend, onDiscard, isSending }: { audioUrl: string; onSend: () => void; onDiscard: () => void; isSending: boolean; }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioUrl); // Clean up the object URL
            }
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-2 w-full h-10">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-primary" onClick={onDiscard} disabled={isSending}>
                <XIcon className="h-5 w-5" />
            </Button>
            <div className="flex-1 flex items-center gap-2 bg-muted px-3 rounded-full">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={togglePlay} disabled={isSending}>
                    {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
                </Button>
                <StaticAudioVisualizer />
            </div>
            <Button size="icon" className="bg-primary rounded-full h-9 w-9" onClick={onSend} disabled={isSending}>
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    );
};


const TtsPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        if(audioRef.current) audioRef.current.currentTime = 0;
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, []);

  if (!audioUrl) return null;

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
}: {
  comment: CommentType;
  onReply: (comment: CommentType) => void;
  videoOwnerId: string;
  isPinned: boolean;
  onPinComment: (id: string) => void;
  isViewingUserCreator: boolean;
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
                      code: ({node, inline, className, children, ...props}: {node?: any; inline?: boolean; className?: string; children?: React.ReactNode}) => {
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

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  const sheetContentRef = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);

  const bind = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      if (down) {
        setY(my > 0 ? my : 0);
      } else {
        if (my > window.innerHeight * 0.2 || (vy > 0.5 && dy > 0)) {
          onOpenChange?.(false);
        } 
        setY(0);
      }
    },
    { axis: 'y', from: () => [0, y], bounds: { top: 0 } }
  );

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

    const sortedThreads = [...threads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
  }, [comments, pinnedCommentId]);

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
        
      } else if (audioDataUri) {
        // In a real app, you might want to add audio content scanning
        newComment = { ...baseComment, audioUrl: audioDataUri };
      }

      if (newComment) {
        setComments(prev => [newComment!, ...prev]);
        if (replyingTo) {
          setExpandedThreads(prev => new Set(prev).add(replyingTo.parentId || replyingTo.id));
        }
      }
      setCommentText('');
      setReplyingTo(null);
      setRecordedAudio(null);

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

  const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudio({ url: audioUrl, blob: audioBlob });
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
        toast({ title: "Recording started...", description: "Tap the square to stop." });
      } catch (error) {
        console.error("Mic error:", error);
        toast({ variant: 'destructive', title: "Microphone access denied", description: "Please enable microphone permissions in your browser settings." });
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      }
  };

  const handleMicClick = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  }

  const handleSendAudio = () => {
      if (!recordedAudio) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          handleSend({ audioDataUri: base64String });
      };
      reader.readAsDataURL(recordedAudio.blob);
  }
  
  const handleScheduleComment = async () => {
    if (!commentText.trim() || !scheduledDate) return;

    setIsSending(true);
    setPopoverOpen(false);

    try {
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

  const formatRecordingTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>{children}</SheetTrigger>
      <SheetContent
        ref={sheetContentRef}
        side="bottom"
        className="h-[60%] flex flex-col z-[70] bg-background p-0"
        style={{ transform: `translateY(${y}px)` }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
                <div {...bind()} className="p-4 pb-2 text-center relative cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-2" />
            <SheetTitle>{comments.length.toLocaleString()} Comments</SheetTitle>
            <div className="absolute right-2 top-2">
                <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <XIcon className="h-4 w-4" />
                    </Button>
                </SheetClose>
            </div>
        </div>
        <Tabs defaultValue="all" className="w-full px-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
            </TabsList>
        </Tabs>
        <ScrollArea
          className="flex-1 my-2"
        >
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
                            />
                            
                            {isExpanded && thread.replies && thread.replies.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    {repliesToShow.map(reply => (
                                        <CommentItem 
                                            key={reply.id} 
                                            comment={reply} 
                                            onReply={setReplyingTo}
                                            videoOwnerId={videoOwnerId}
                                            isPinned={false}
                                            onPinComment={handlePinComment}
                                            isViewingUserCreator={isViewingUserCreator}
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
        <div
          className="p-4 bg-background border-t"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {recordedAudio ? (
                <AudioPreview 
                    audioUrl={recordedAudio.url} 
                    onSend={handleSendAudio}
                    onDiscard={() => setRecordedAudio(null)}
                    isSending={isSending}
                />
          ) : isRecording ? (
                <div className="flex items-center gap-2 w-full h-10">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={mockMe.avatarUrl} />
                        <AvatarFallback>{mockMe.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center font-mono text-red-500">
                        {formatRecordingTime(recordingTime)}
                    </div>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleMicClick}
                        disabled={isSending}
                        className="rounded-full text-primary hover:bg-primary/10"
                        aria-label="Stop recording"
                    >
                       <Square className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
                    </Button>
                </div>
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
                                                if (newDate < new Date()) { 
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
                               <Mic className="h-5 w-5" />
                            </Button>
                         )}
                    </div>
                </form>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}