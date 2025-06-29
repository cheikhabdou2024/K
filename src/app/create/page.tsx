
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { scanContentAction } from './actions';
import { useState, useRef, useEffect } from 'react';
import { Loader2, UploadCloud, X, Music, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockSoundLibrary, type Sound } from '@/lib/mock-data';

const FormSchema = z.object({
  caption: z.string().min(1, {
    message: 'Caption cannot be empty.',
  }),
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
const AI_EFFECTS = ['None', 'Cartoon', '8-Bit', 'Sketch', 'Noir', 'Pop Art'];

const fileToDataUri = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
const RightActionBar = ({ onSoundClick, onEffectClick, selectedSound, selectedEffect } : { onSoundClick: () => void, onEffectClick: (effect: string) => void, selectedSound: Sound, selectedEffect: string }) => (
  <div className="absolute top-1/4 right-2 z-20 flex flex-col items-center gap-6">
    <Sheet>
      <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-1.5 text-white text-xs font-semibold">
            <div className="h-10 w-10 bg-black/50 rounded-full flex items-center justify-center">
              <Music className="h-5 w-5" />
            </div>
            <span>Sound</span>
          </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60%] flex flex-col">
          <SheetHeader><SheetTitle>Select a Sound</SheetTitle></SheetHeader>
          <ScrollArea className="flex-1 -mx-6">
            <div className="flex flex-col gap-1 px-6">
                {mockSoundLibrary.map((sound) => (
                    <Button
                        key={sound.id}
                        variant={selectedSound.id === sound.id ? 'default' : 'ghost'}
                        onClick={onSoundClick}
                        className="justify-start text-base py-6"
                    >
                        {sound.title}
                    </Button>
                ))}
            </div>
          </ScrollArea>
      </SheetContent>
    </Sheet>
    
    <Sheet>
      <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-1.5 text-white text-xs font-semibold">
            <div className="h-10 w-10 bg-black/50 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <span>Effects</span>
          </button>
      </SheetTrigger>
       <SheetContent side="bottom" className="h-auto flex flex-col">
          <SheetHeader><SheetTitle>Select an AI Effect</SheetTitle></SheetHeader>
           <div className="flex flex-wrap gap-2 py-4">
              {AI_EFFECTS.map((effect) => (
                  <Button
                      key={effect}
                      type="button"
                      variant={selectedEffect === effect ? 'default' : 'outline'}
                      onClick={() => onEffectClick(effect)}
                  >
                      {effect}
                  </Button>
              ))}
          </div>
       </SheetContent>
    </Sheet>
  </div>
);

const FileUploader = ({ onFileChange } : { onFileChange: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFileChange(e.dataTransfer.files[0]);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
        accept={ACCEPTED_VIDEO_TYPES.join(',')}
        className="hidden"
      />
      <div
        className={cn(
          'h-full w-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors',
          isDragging && 'border-primary bg-primary/10'
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <UploadCloud className="h-16 w-16 text-muted-foreground" />
        <p className="mt-4 text-center text-lg text-muted-foreground">
          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm text-muted-foreground mt-2">MP4, WebM, MOV, MKV (max 50MB)</p>
      </div>
    </>
  );
};


export default function CreatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [selectedSound, setSelectedSound] = useState<Sound>(mockSoundLibrary[0]);
  const [selectedEffect, setSelectedEffect] = useState<string>('None');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      caption: '',
    },
  });

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const handleFileChange = (file: File | null) => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);

    if (!file) {
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'File too large' });
      return;
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type' });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };
  
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!videoFile) return;

    setIsSubmitting(true);
    try {
      const videoDataUri = await fileToDataUri(videoFile);
      const scanResult = await scanContentAction(data.caption, videoDataUri);

      if (!scanResult.isSafe) {
        toast({
          variant: 'destructive',
          title: 'Content moderation error',
          description: scanResult.reason,
        });
        setIsSubmitting(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: 'Post Successful! (Demo)',
        description: `Video with sound "${selectedSound.title}" and effect "${selectedEffect}" would be live.`,
      });
      
      form.reset();
      handleFileChange(null);
      router.push('/');

    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative h-full w-full bg-black text-white">
      {!videoPreview ? (
        <FileUploader onFileChange={handleFileChange} />
      ) : (
        <>
          <video
            src={videoPreview}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="absolute top-4 left-4 z-20 bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
            disabled={isSubmitting}
          >
            <ArrowLeft />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleFileChange(null)}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-destructive/80 rounded-full h-10 w-10"
            disabled={isSubmitting}
          >
            <X />
          </Button>
          
          <RightActionBar
             onSoundClick={() => { /* Logic to handle sound selection */ }}
             onEffectClick={setSelectedEffect}
             selectedSound={selectedSound}
             selectedEffect={selectedEffect}
          />
          
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Add caption..."
                          className="bg-black/50 border-white/30 text-white placeholder:text-gray-300 resize-none min-h-[40px] max-h-[120px]"
                          rows={1}
                          {...field}
                          onInput={(e) => {
                            const textarea = e.currentTarget;
                            textarea.style.height = "auto";
                            textarea.style.height = `${textarea.scrollHeight}px`;
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" disabled={isSubmitting} className="font-bold">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post
                </Button>
              </form>
            </Form>
          </div>
        </>
      )}
    </div>
  );
}
