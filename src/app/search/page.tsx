import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { mockFeedItems } from '@/lib/mock-data';
import { Search, PlayCircle } from 'lucide-react';
import Image from 'next/image';

export default function SearchPage() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-20">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search users, hashtags, sounds..." className="pl-10 h-12 text-base" />
      </div>

      <div>
        <h2 className="text-xl font-bold font-headline mb-4 text-primary">Trending</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {mockFeedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group relative">
              <CardContent className="p-0">
                <div className="aspect-video relative">
                  <Image src={item.thumbnailUrl} alt={item.caption} fill className="object-cover" data-ai-hint="video thumbnail"/>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="p-2">
                  <p className="font-semibold text-sm truncate">{item.caption}</p>
                  <p className="text-xs text-muted-foreground">@{item.user.username}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
