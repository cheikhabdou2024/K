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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const FormSchema = z.object({
  caption: z.string().min(10, {
    message: 'Caption must be at least 10 characters.',
  }),
});

export default function CreatePage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      caption: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    const result = await scanContentAction(data.caption);
    setIsSubmitting(false);

    if (result.isSafe) {
      toast({
        title: 'Content is safe!',
        description: 'Your post has been successfully created.',
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Content moderation error',
        description: result.reason || 'This content violates our community guidelines.',
      });
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Create a New Post</h1>
        <p className="text-muted-foreground mt-2">
          Share your moment with the world. Your caption will be scanned by our AI for safety.
        </p>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    rows={6}
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
