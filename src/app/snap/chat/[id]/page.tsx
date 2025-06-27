'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockChats } from '@/lib/mock-data';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock messages for demonstration
const mockMessages = [
  { id: 1, text: 'Hey, how are you?', sender: 'them', timestamp: '10:00 AM' },
  { id: 2, text: 'I\'m good, thanks! How about you?', sender: 'me', timestamp: '10:01 AM' },
  { id: 3, text: 'Doing great! Just saw your new video, it was awesome!', sender: 'them', timestamp: '10:01 AM' },
  { id: 4, text: 'Haha, thanks! Glad you liked it.', sender: 'me', timestamp: '10:02 AM' },
  { id: 5, text: 'Did you see the latest trending challenge?', sender: 'me', timestamp: '10:03 AM' },
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id;

  const chat = mockChats.find((c) => c.id === chatId);

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Chat not found.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="flex items-center gap-4 p-2 sm:p-4 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Avatar>
          <AvatarImage src={chat.user.avatarUrl} alt={chat.user.name} />
          <AvatarFallback>{chat.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="font-bold text-lg">{chat.user.name}</h2>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {mockMessages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                  message.sender === 'me'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                }`}
              >
                <p>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-2 sm:p-4 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input placeholder="Type a message..." className="flex-1" />
          <Button size="icon" className="bg-primary">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
