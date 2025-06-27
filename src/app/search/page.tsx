'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { mockFeedItems, type FeedItem } from '@/lib/mock-data';
import { Search, PlayCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { searchAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

const ResultsGrid = ({ items }: { items: FeedItem[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    {items.map((item) => (
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
);

const LoadingSkeletons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        ))}
    </div>
)


export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Show trending items on initial load
    if (!query) {
      setResults(mockFeedItems);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) {
        setIsLoading(false);
        setResults(mockFeedItems);
        return;
    }
    setIsLoading(true);
    const searchResults = await searchAction(searchQuery);
    setResults(searchResults);
    setIsLoading(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
        handleSearch(newQuery);
    }, 500); // 500ms debounce delay
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
            placeholder="Search with AI..." 
            className="pl-10 h-12 text-base" 
            value={query}
            onChange={handleInputChange}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />}
      </div>

      <div>
        <h2 className="text-xl font-bold font-headline mb-4 text-primary">
            {query ? `Results for "${query}"` : 'Trending'}
        </h2>
        
        {isLoading ? (
            <LoadingSkeletons />
        ) : (
            results.length > 0 ? (
                <ResultsGrid items={results} />
            ) : (
                query && <p className="text-muted-foreground text-center py-10">No results found for your search.</p>
            )
        )}

      </div>
    </div>
  );
}
