'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { scanContentAction } from './actions';
import { useState, useRef, useEffect } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const FormSchema = z.object({
  caption: z.string().min(10, {
    message: 'Caption must be at least 10 characters.',
  }),
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

const fileToDataUri = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CreatePage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      caption: '',
    },
  });

  useEffect(() => {
    // Clean up the object URL to avoid memory leaks
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const handleFileChange = (file: File | null) => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    if (!file) {
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Video size cannot exceed ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
      return;
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select a valid video file (MP4, WebM, MOV, MKV).',
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!videoFile) {
      toast({
        variant: 'destructive',
        title: 'No video selected',
        description: 'Please upload a video to create a post.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const videoDataUri = await fileToDataUri(videoFile);
      const result = await scanContentAction(data.caption, videoDataUri);

      if (result.isSafe) {
        toast({
          title: 'Content is safe!',
          description: 'Your post has been successfully created.',
        });
        form.reset();
        handleFileChange(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Content moderation error',
          description: result.reason || 'This content violates our community guidelines.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'There was an error processing your video. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Create a New Post</h1>
        <p className="text-muted-foreground mt-2">
          Share your moment with the world. Your caption and video will be scanned by our AI for safety.
        </p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormItem>
            <FormLabel className="text-lg font-semibold font-headline">Video</FormLabel>
            <FormControl>
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                  accept={ACCEPTED_VIDEO_TYPES.join(',')}
                  className="hidden"
                />
                {!videoPreview ? (
                  <div
                    className={cn(
                      'relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors',
                      isDragging && 'border-primary bg-primary/10'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-center text-muted-foreground">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV, MKV (max 50MB)</p>
                  </div>
                ) : (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <video src={videoPreview} className="w-full h-full object-cover" controls muted />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full h-8 w-8"
                      onClick={() => handleFileChange(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold font-headline">Caption</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your video..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This will be the caption for your video post.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Scanning...' : 'Post'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
