
'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from './ui/button';
import { Heart, Send, Loader2, Mic, Trash2, Play, Pause, Bookmark, Crown, CheckCircle2, Pin, MessageSquareReply, ChevronDown, Smile } from 'lucide-react';
import { mockComments, mockMe, type Comment as CommentType } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { scanCommentAction, transcribeAudioAction } from '@/app/comments/actions';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const blobToDataUri = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const SoundWave = () => (
    <svg width="100" height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="10" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6" y1="8" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="10" y1="10" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="6" x2="14" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="11" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="22" y1="8" x2="22" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="4" x2="26" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="30" y1="10" x2="30" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="34" y1="8" x2="34" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="6" x2="38" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="42" y1="11" x2="42" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="46" y1="4" x2="46" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="50" y1="8" x2="50" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="54" y1="10" x2="54" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="58" y1="6" x2="58" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="62" y1="8" x2="62" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="66" y1="4" x2="66" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="70" y1="11" x2="70" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="74" y1="6" x2="74" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="78" y1="10" x2="78" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="82" y1="8" x2="82" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="86" y1="4" x2="86" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="8" x2="90" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="94" y1="10" x2="94" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="98" y1="10" x2="98" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-primary/10 w-fit">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={togglePlayPause}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
      <div className="relative w-[100px] h-[24px]">
        <div className="absolute inset-0 text-primary/30"><SoundWave /></div>
        <div className="absolute inset-0 h-full overflow-hidden text-primary" style={{ width: `${progress}%` }}><SoundWave /></div>
      </div>
    </div>
  );
};


const CommentItem = ({ comment, onReply, videoOwnerId, isPinned, onPinComment, isViewingUserCreator }: { comment: CommentType; onReply: (comment: CommentType) => void; videoOwnerId: string; isPinned: boolean; onPinComment: (id: string) => void; isViewingUserCreator: boolean; }) => {
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
    <div className={cn("flex items-start gap-3 pr-4", { "ml-8": !!comment.parentId })}>
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
        <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">@{comment.user.username}</p>
            {isCommentOwnerCreator && (
                <Crown className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
            )}
            {comment.user.isVerified && !isCommentOwnerCreator && (
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 fill-sky-400" />
            )}
        </div>
        <div className="text-sm bg-muted p-3 rounded-xl rounded-tl-none w-fit max-w-full">
            {comment.replyTo && (
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Replying to <span className="text-primary hover:underline cursor-pointer">@{comment.replyTo.username}</span>
                </p>
            )}
            {comment.audioUrl && <AudioPlayer audioUrl={comment.audioUrl} />}
            {comment.text && (
              <div className={cn(
                'break-words',
                comment.audioUrl ? 'pt-2 mt-2 border-t border-primary/20 text-muted-foreground' : ''
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p className="m-0" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      if (inline) {
                        return <code className="bg-primary/10 text-primary px-1 py-0.5 rounded-sm font-mono text-sm" {...props}>{children}</code>
                      }
                      return <code className={cn("font-mono", className)} {...props}>{children}</code>
                    },
                    pre: ({node, ...props}) => <pre className="bg-secondary p-2 rounded-md my-2 text-xs overflow-x-auto" {...props} />
                  }}
                >
                  {comment.text}
                </ReactMarkdown>
              </div>
            )}
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
        >
            <Heart className={cn('h-4 w-4 text-muted-foreground transition-colors', isLiked && 'fill-red-500 text-red-500')} />
        </button>
        <span className="text-xs text-muted-foreground">{likeCount > 0 ? likeCount.toLocaleString() : ''}</span>
        <button onClick={handleBookmark} className="h-8 w-8 flex items-center justify-center rounded-full mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bookmark className={cn('h-4 w-4 text-muted-foreground transition-colors', isBookmarked && 'fill-primary text-primary')} />
        </button>
         {isViewingUserCreator && !comment.parentId && (
            <button onClick={() => onPinComment(comment.id)} className="h-8 w-8 flex items-center justify-center rounded-full mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Pin className={cn('h-4 w-4 text-muted-foreground transition-colors', isPinned && 'fill-primary text-primary')} />
            </button>
        )}
      </div>
    </div>
  );
};

const AnimatedSoundWave = () => (
    <div className="flex items-center gap-0.5 h-4">
        {Array.from({length: 7}).map((_, i) => (
            <div key={i} className="w-0.5 bg-primary/80" style={{ animation: `sound-wave 1.2s ease-in-out infinite`, animationDelay: `${i * 0.1}s`, height: '100%' }}></div>
        ))}
        <style jsx>{`
            @keyframes sound-wave {
                0% { transform: scaleY(0.3); }
                25% { transform: scaleY(1); }
                50% { transform: scaleY(0.4); }
                75% { transform: scaleY(0.8); }
                100% { transform: scaleY(0.3); }
            }
        `}</style>
    </div>
)

const emojiCategories = [
  {
    name: 'Smileys & People',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '👽', '👾', '🤖', '🎃', '👋', '🤚', '🖐️', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👍', '👎', '✊', '👊', '👏', '🙌', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '👃', '👀', '👁️', '👅', '👄', '❤️', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
  {
    name: 'Animals & Nature',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦦', '🦥', '🐁', '🐀', '🐿️', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌚', '🌝', '🌛', '🌜', '⭐', '🌟', '💫', '✨', '☄️', '🪐', '🔥', '💧', '🌊'],
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
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
          return new Date(b.createdAt).getTime() - new Date(b.createdAt).getTime();
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

  const formatTime = (time: number) => new Date(time * 1000).toISOString().substr(14, 5);

  const cleanupRecording = () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());

        try {
            const audioDataUri = await blobToDataUri(audioBlob);
            const { transcription } = await transcribeAudioAction(audioDataUri);
            await handleSend({ audioUrl, text: transcription });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Transcription Failed',
                description: 'Sending audio comment without transcription.',
            });
            await handleSend({ audioUrl });
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Microphone access denied',
        description: 'Please allow microphone access in your browser settings.',
      });
    }
  };
  
  const handlePauseRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.pause();
          setIsPaused(true);
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      }
  }

  const handleResumeRecording = () => {
       if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
          setIsPaused(false);
          recordingTimerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
      }
  }

  const handleStopAndSend = () => {
      setIsSending(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state !== 'inactive') {
          mediaRecorderRef.current?.stop();
      }
  }
  
  const handleCancelRecording = () => {
      cleanupRecording();
  }
  
  const handleSend = async ({ text, audioUrl }: { text?: string; audioUrl?: string }) => {
    const contentToScan = text || '';
    if (!contentToScan && !audioUrl) {
        setIsSending(false);
        cleanupRecording();
        return;
    }

    if(!audioUrl) setIsSending(true);

    try {
      const scanResult = await scanCommentAction(contentToScan);

      if (!scanResult.isSafe) {
        toast({
          variant: 'destructive',
          title: 'Comment Blocked',
          description: scanResult.reason || 'This comment violates our community guidelines.',
        });
        setIsSending(false);
        cleanupRecording();
        return;
      }

      const newComment: CommentType = {
        id: `comment-${Date.now()}`,
        user: mockMe,
        createdAt: new Date(),
        likes: 0,
        ...(text && { text }),
        ...(audioUrl && { audioUrl }),
        ...(replyingTo && {
          replyTo: replyingTo.user,
          parentId: replyingTo.parentId || replyingTo.id, // Reply to parent thread
        }),
      };
      
      setComments(prev => [newComment, ...prev]);
      
      if (replyingTo) {
          setExpandedThreads(prev => new Set(prev).add(replyingTo.parentId || replyingTo.id));
      }
      
      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send comment. Please try again.',
      });
    } finally {
      setIsSending(false);
      if(audioUrl) {
        cleanupRecording();
      }
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend({ text: commentText });
  }

  return (
    <Drawer shouldScaleBackground={false} open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        className="h-[60%] flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader className="text-center p-4 pb-2">
            <div className="relative">
              <DrawerTitle>{comments.length.toLocaleString()} Comments</DrawerTitle>
              <div className="absolute -top-1 right-0">
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
                                isViewingUserCreator={videoOwnerId === mockMe.id}
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
                                            isViewingUserCreator={videoOwnerId === mockMe.id}
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
          {replyingTo && (
            <div className="px-2 pb-2 text-sm text-muted-foreground flex justify-between items-center">
              <span>Replying to @{replyingTo.user.username}</span>
              <Button variant="ghost" size="icon" className="h-6 w-auto px-2 text-xs" onClick={() => setReplyingTo(null)}>
                Cancel
              </Button>
            </div>
          )}
          {isRecording ? (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleCancelRecording} className="text-destructive hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-5 w-5"/>
                </Button>
                <div className="flex-1 bg-muted rounded-full h-10 flex items-center justify-between px-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-primary" onClick={isPaused ? handleResumeRecording : handlePauseRecording}>
                        {isPaused ? <Mic className="h-4 w-4" /> : <Pause className="h-4 w-4 fill-current" />}
                    </Button>
                    {isPaused ? <p className="text-sm text-muted-foreground">Paused</p> : <AnimatedSoundWave />}
                    <span className="font-mono text-sm text-muted-foreground">{formatTime(recordingTime)}</span>
                </div>
                <Button size="icon" onClick={handleStopAndSend} disabled={isSending} className="bg-primary rounded-full">
                    {isSending ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
          ) : (
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
                        disabled={isSending}
                    />
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                                <Smile className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 h-96 p-0 mb-2">
                            <ScrollArea className="h-full">
                                <div className="p-2">
                                {emojiCategories.map(category => (
                                    <div key={category.name}>
                                        <h3 className="text-sm font-semibold text-muted-foreground px-2 py-1">{category.name}</h3>
                                        <div className="grid grid-cols-8 gap-1">
                                            {category.emojis.map((emoji, index) => (
                                                <button
                                                    key={`${category.name}-${index}`}
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
                {commentText.trim() ? (
                    <Button type="submit" size="icon" variant="ghost" className="bg-transparent rounded-full" disabled={isSending}>
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
                    </Button>
                ) : (
                     <Button type="button" size="icon" variant="ghost" className="bg-transparent rounded-full" onClick={handleStartRecording} disabled={isSending}>
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5 text-primary" />}
                    </Button>
                )}
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
