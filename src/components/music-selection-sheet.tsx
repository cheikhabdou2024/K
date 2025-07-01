import React, { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Music, Search, Play, Pause } from 'lucide-react';

interface MusicSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMusic: (music: { id: string; title: string; artist: string; category: string; duration: string; previewUrl: string }) => void;
}

const categories = ['Trending', 'Pop', 'Hip-Hop'];

const mockMusicData = [
  { id: '1', title: 'Song Title 1', artist: 'Artist Name 1', category: 'Trending', duration: '3:15', previewUrl: '/audio/preview1.mp3' },
  { id: '2', title: 'Song Title 2', artist: 'Artist Name 2', category: 'Pop', duration: '2:40', previewUrl: '/audio/preview2.mp3' },
  { id: '3', title: 'Song Title 3', artist: 'Artist Name 3', category: 'Hip-Hop', duration: '4:00', previewUrl: '/audio/preview3.mp3' },
  { id: '4', title: 'Song Title 4', artist: 'Artist Name 4', category: 'Trending', duration: '3:30', previewUrl: '/audio/preview4.mp3' },
  { id: '5', title: 'Song Title 5', artist: 'Artist Name 5', category: 'Pop', duration: '2:55', previewUrl: '/audio/preview5.mp3' },
  { id: '6', title: 'Song Title 6', artist: 'Artist Name 6', category: 'Hip-Hop', duration: '3:45', previewUrl: '/audio/preview6.mp3' },
  { id: '7', title: 'Song Title 7', artist: 'Artist Name 7', category: 'Trending', duration: '3:10', previewUrl: '/audio/preview7.mp3' },
  { id: '8', title: 'Song Title 8', artist: 'Artist Name 8', category: 'Pop', duration: '2:30', previewUrl: '/audio/preview8.mp3' },
  { id: '9', title: 'Song Title 9', artist: 'Artist Name 9', category: 'Hip-Hop', duration: '4:10', previewUrl: '/audio/preview9.mp3' },
  { id: '10', title: 'Song Title 10', artist: 'Artist Name 10', category: 'Trending', duration: '3:20', previewUrl: '/audio/preview10.mp3' },
  { id: '11', title: 'Song Title 11', artist: 'Artist Name 11', category: 'Pop', duration: '2:48', previewUrl: '/audio/preview11.mp3' },
  { id: '12', title: 'Song Title 12', artist: 'Artist Name 12', category: 'Hip-Hop', duration: '3:50', previewUrl: '/audio/preview12.mp3' },
  { id: '13', title: 'Song Title 13', artist: 'Artist Name 13', category: 'Trending', duration: '3:05', previewUrl: '/audio/preview13.mp3' },
  { id: '14', title: 'Song Title 14', artist: 'Artist Name 14', category: 'Pop', duration: '2:50', previewUrl: '/audio/preview14.mp3' },
  { id: '15', title: 'Song Title 15', artist: 'Artist Name 15', category: 'Hip-Hop', duration: '3:35', previewUrl: '/audio/preview15.mp3' },
];

const MusicSelectionSheet: React.FC<MusicSelectionSheetProps> = ({ isOpen, onClose, onSelectMusic }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredMusic = mockMusicData.filter(music =>
    (music.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    music.artist.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedCategory || music.category === selectedCategory)
  );

  const handlePlayPreview = (music: typeof mockMusicData[0]) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (playingMusicId === music.id) {
      setPlayingMusicId(null);
    } else {
      if (music.previewUrl) {
        audioRef.current = new Audio(music.previewUrl);
        audioRef.current.volume = 0.5; // Set a default volume
        audioRef.current.play();
        setPlayingMusicId(music.id);

        audioRef.current.onended = () => {
          setPlayingMusicId(null);
        };
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-3/4 rounded-t-lg">
        <SheetHeader>
          <SheetTitle className="text-center">Select Music</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search music..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100%-240px)]">
          <div className="p-4">
            {filteredMusic.map((music) => (
              <div key={music.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-semibold">{music.title}</p>
                  <p className="text-sm text-gray-500">{music.artist} - {music.duration}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {music.previewUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlayPreview(music)}
                    >
                      {playingMusicId === music.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button onClick={() => onSelectMusic(music)}>Select</Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MusicSelectionSheet;
