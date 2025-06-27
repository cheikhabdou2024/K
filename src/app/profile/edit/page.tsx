
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { mockUser } from '@/lib/mock-data';
import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores.' }),
  bio: z.string().max(160, { message: 'Bio cannot be longer than 160 characters.' }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(mockUser.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: mockUser.name,
      username: mockUser.username,
      bio: mockUser.bio,
    },
    mode: 'onChange',
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'Image too large',
          description: 'Please select an image smaller than 5MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you would update the user data here.
    console.log('Updated profile data:', { ...data, avatar: avatarPreview });
    
    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
    router.push('/profile');
    setIsSubmitting(false);
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 h-full overflow-y-auto">
      <header className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <ArrowLeft />
              <span className="sr-only">Back to profile</span>
            </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">Edit Profile</h1>
      </header>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-center">
                <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-primary">
                        <AvatarImage src={avatarPreview || ''} alt={mockUser.name} />
                        <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleAvatarChange}
                    />
                    <Button
                        type="button"
                        size="icon"
                        className="absolute bottom-1 right-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Camera className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                    <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                    <Input placeholder="your_username" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Tell us a little about yourself"
                        className="resize-none"
                        rows={4}
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

          <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
