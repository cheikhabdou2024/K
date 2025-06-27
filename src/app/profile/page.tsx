
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockUser, mockFeedItems } from '@/lib/mock-data';
import { User, Video, Settings, Edit, Share2, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const ProfileHeader = () => (
    <div className="relative p-4 md:p-6">
    <div className="absolute top-4 right-4">
      <Button variant="ghost" size="icon">
        <Settings className="h-5 w-5" />
        <span className="sr-only">Settings</span>
      </Button>
    </div>
    <div className="flex flex-col items-center gap-4 pt-8">
      <Avatar className="w-24 h-24 border-4 border-primary">
        <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
        <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <h1 className="text-2xl font-bold font-headline">{mockUser.name}</h1>
        <p className="text-muted-foreground">@{mockUser.username}</p>
      </div>
      <div className="flex w-full justify-around text-center p-4 bg-muted/50 rounded-lg max-w-sm">
        <div>
          <p className="font-bold text-lg">{mockUser.stats.following}</p>
          <p className="text-sm text-muted-foreground">Following</p>
        </div>
        <div>
          <p className="font-bold text-lg">{mockUser.stats.followers}</p>
          <p className="text-sm text-muted-foreground">Followers</p>
        </div>
        <div>
          <p className="font-bold text-lg">{mockUser.stats.likes}</p>
          <p className="text-sm text-muted-foreground">Likes</p>
        </div>
      </div>
      <p className="text-center max-w-md text-sm">{mockUser.bio}</p>
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

const VideoGrid = ({ items }: { items: { id: string, thumbnailUrl: string }[] }) => (
    <div className="grid grid-cols-3 gap-1 mt-2">
        {items.map((item) => (
            <div key={item.id} className="relative aspect-[9/16]">
                <Image src={item.thumbnailUrl} alt="video thumbnail" fill className="object-cover" data-ai-hint="video thumbnail" />
            </div>
        ))}
    </div>
);

const ProfileContent = () => {
    const userVideos = mockFeedItems.filter(item => item.user.id === mockUser.id);
    const likedVideos = mockFeedItems.filter(item => item.isLiked);

    return (
        <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary/10 mx-auto max-w-sm">
            <TabsTrigger value="videos" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Video className="h-4 w-4" /> Videos ({userVideos.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Heart className="h-4 w-4" /> Liked ({likedVideos.length})
            </TabsTrigger>
            </TabsList>
            <TabsContent value="videos">
                {userVideos.length > 0 ? (
                    <VideoGrid items={userVideos} />
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">You haven't posted any videos yet.</p>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="liked">
                {likedVideos.length > 0 ? (
                    <VideoGrid items={likedVideos} />
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">You haven't liked any videos yet.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
};

export default function ProfilePage() {
  return (
    <div className="h-full overflow-y-auto pb-4">
      <ProfileHeader />
      <ProfileContent />
    </div>
  );
}
