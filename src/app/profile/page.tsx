
// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { FirestoreUser, FeedItem, FirestorePost } from '@/lib/mock-data';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Video, Settings, Edit, Share2, Heart, LineChart, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';


const ProfileHeader = ({ user, onSignOut }: { user: FirestoreUser, onSignOut: () => void }) => {
  const followers = user.stats.followers > 1000 ? `${(user.stats.followers/1000).toFixed(1)}k` : user.stats.followers;
  const likes = user.stats.likes > 1000 ? `${(user.stats.likes/1000).toFixed(1)}k` : user.stats.likes;

  return (
    <div className="relative p-4 md:p-6">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
         <Button variant="ghost" size="icon" onClick={onSignOut}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign Out</span>
        </Button>
      </div>
      <div className="flex flex-col items-center gap-4 pt-8">
        <Avatar className="w-24 h-24 border-4 border-primary">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-2xl font-bold font-headline">{user.name}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
        <div className="flex w-full justify-around text-center p-4 bg-muted/50 rounded-lg max-w-sm">
          <div>
            <p className="font-bold text-lg">{user.stats.following}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
          <div>
            <p className="font-bold text-lg">{followers}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div>
            <p className="font-bold text-lg">{likes}</p>
            <p className="text-sm text-muted-foreground">Likes</p>
          </div>
        </div>
        <p className="text-center max-w-md text-sm">{user.bio}</p>
        <div className="flex gap-2 w-full max-w-sm">
          <Button className="font-bold flex-1" asChild>
            <Link href="/profile/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button variant="outline" className="font-bold flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

const VideoGrid = ({ items }: { items: FeedItem[] }) => (
  <div className="grid grid-cols-3 gap-1 mt-2">
    {items.map((item) => (
      <div key={item.id} className="relative aspect-[9/16]">
        <Image
          src={item.thumbnailUrl}
          alt="video thumbnail"
          fill
          className="object-cover"
          data-ai-hint="video thumbnail"
        />
      </div>
    ))}
  </div>
);

const chartConfig = {
  views: { label: 'Views', color: 'hsl(var(--chart-1))' },
  likes: { label: 'Likes', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const AnalyticsContent = ({ user }: { user: FirestoreUser }) => (
  <div className="p-4 space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Profile Views (Last 7 Days)</CardTitle>
        <CardDescription>Total views on your profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={user.analytics.profileViews}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="views" fill="var(--color-views)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Monthly Likes</CardTitle>
        <CardDescription>Total likes received each month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={user.analytics.monthlyLikes}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="likes" fill="var(--color-likes)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  </div>
);

const ProfileContent = ({ user, userVideos }: { user: FirestoreUser, userVideos: FeedItem[] }) => {
  // `likedVideos` is still mock for now, will be implemented in a future step.
  const likedVideos: FeedItem[] = []; 

  return (
    <Tabs defaultValue="videos" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-primary/10 mx-auto max-w-sm">
        <TabsTrigger value="videos" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <Video className="h-4 w-4" /> Videos ({userVideos.length})
        </TabsTrigger>
        <TabsTrigger value="liked" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <Heart className="h-4 w-4" /> Liked ({likedVideos.length})
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <LineChart className="h-4 w-4" /> Analytics
        </TabsTrigger>
      </TabsList>
      <TabsContent value="videos">
        {userVideos.length > 0 ? <VideoGrid items={userVideos} /> : <div className="text-center py-10"><p className="text-muted-foreground">You haven't posted any videos yet.</p></div>}
      </TabsContent>
      <TabsContent value="liked">
        {likedVideos.length > 0 ? <VideoGrid items={likedVideos} /> : <div className="text-center py-10"><p className="text-muted-foreground">You haven't liked any videos yet.</p></div>}
      </TabsContent>
      <TabsContent value="analytics">
        <AnalyticsContent user={user} />
      </TabsContent>
    </Tabs>
  );
};


const LoadingSkeleton = () => (
  <div className="h-full overflow-y-auto pb-4 animate-pulse">
    <div className="relative p-4 md:p-6">
      <div className="flex flex-col items-center gap-4 pt-8">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <Skeleton className="h-20 w-full max-w-sm rounded-lg" />
        <div className="text-center max-w-md space-y-1">
            <Skeleton className="h-4 w-80 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2 w-full max-w-sm">
          <Skeleton className="h-11 flex-1 rounded-md" />
          <Skeleton className="h-11 flex-1 rounded-md" />
        </div>
      </div>
    </div>
    <Skeleton className="h-10 w-full max-w-sm mx-auto rounded-md" />
  </div>
)

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [userVideos, setUserVideos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading) return;
      if (!authUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch user profile
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const fetchedUserData = userDoc.data() as FirestoreUser;
          setUserData(fetchedUserData);
          
          // Fetch user's posts
          const postsQuery = query(collection(db, 'posts'), where('userId', '==', authUser.uid), orderBy('createdAt', 'desc'));
          const postsSnapshot = await getDocs(postsQuery);
          const postsData = postsSnapshot.docs.map(doc => {
              const post = doc.data() as FirestorePost;
              // Convert Firestore Timestamp to a plain object
              const createdAt = {
                  seconds: post.createdAt.seconds,
                  nanoseconds: post.createdAt.nanoseconds,
              };
              return { ...post, user: fetchedUserData, createdAt };
          });
          setUserVideos(postsData);

        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'User profile not found.' });
          router.push('/signup');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch profile data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, authLoading, router, toast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
      router.push('/login');
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to sign out.' });
    }
  }

  if (loading || authLoading) {
    return <LoadingSkeleton />;
  }

  if (!authUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        <User className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold font-headline">Your Profile Awaits</h2>
        <p className="text-muted-foreground max-w-xs">Log in or sign up to view your profile, share content, and connect with others.</p>
        <div className="flex gap-4">
          <Button asChild><Link href="/login">Log In</Link></Button>
          <Button variant="outline" asChild><Link href="/signup">Sign Up</Link></Button>
        </div>
      </div>
    );
  }

  if (!userData) {
      return <LoadingSkeleton />;
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      <ProfileHeader user={userData} onSignOut={handleSignOut} />
      <ProfileContent user={userData} userVideos={userVideos} />
    </div>
  );
}
