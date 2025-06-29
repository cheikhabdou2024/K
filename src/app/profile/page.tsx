
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockFeedItems, mockMe, type FeedItem, type FirestoreUser } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Settings, Edit, Share2, Heart, LineChart, LogOut } from 'lucide-react';
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
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [userVideos, setUserVideos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = () => {
        setLoading(true);
        // Using mock data for the profile
        const myProfileData = mockMe;
        setUserData(myProfileData);
        
        // Filter mock feed items to get videos for this user
        const myVideos = mockFeedItems.filter(item => item.user.id === myProfileData.id);
        setUserVideos(myVideos);

        setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleSignOut = () => {
    toast({ title: 'Signed Out', description: 'This is a demo action.' });
    router.push('/');
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!userData) {
    // This case should ideally not be reached with mock data
    return <div>User not found</div>
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      <ProfileHeader user={userData} onSignOut={handleSignOut} />
      <ProfileContent user={userData} userVideos={userVideos} />
    </div>
  );
}
