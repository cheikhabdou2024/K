import type { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

export interface FirestoreUser extends User {
  email: string;
  bio: string;
  stats: {
    following: number;
    followers: number;
    likes: number;
  };
  analytics: {
    profileViews: { day: string; views: number }[];
    monthlyLikes: { month: string; likes: number }[];
  };
}

export interface Sound {
  id: string;
  title: string;
}

// Represents the data structure for a post document in Firestore.
export interface FirestorePost {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  sound: Sound;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Timestamp;
}

// Represents a post with its user data populated for use in the client.
export interface FeedItem extends Omit<FirestorePost, 'userId' | 'createdAt'> {
  user: User;
  isLiked?: boolean;
  createdAt: { seconds: number; nanoseconds: number; }; // Replicate Timestamp structure for client
}


export interface Comment {
  id:string;
  user: User;
  text?: string;
  audioUrl?: string;
  timestamp: string;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
}

export interface Chat {
    id: string;
    user: User;
    lastMessage: string;
    timestamp: string;
}

const users: User[] = [
  { id: 'user-1', name: 'Jane Doe', username: 'janedoe', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-2', name: 'John Smith', username: 'johnsmith', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-3', name: 'Alex Ray', username: 'alexray', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-4', name: 'Mia Wong', username: 'miawong', avatarUrl: 'https://placehold.co/100x100.png' },
];

export const mockFeedItems: FeedItem[] = [
  {
    id: '1',
    user: users[1],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    caption: 'Amazing sunset views from my trip! #travel #sunset',
    sound: { id: 'sound-1', title: 'Original Sound - johnsmith' },
    likes: 12345,
    comments: 678,
    shares: 910,
    isLiked: true,
    createdAt: { seconds: 1672531200, nanoseconds: 0 } // Jan 1, 2023
  },
  {
    id: '2',
    user: users[2],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    caption: 'Trying out the new dance challenge! Did I nail it? 🕺 #dancechallenge',
    sound: { id: 'sound-2', title: 'Viral Hits - Trending Sounds' },
    likes: 234567,
    comments: 1234,
    shares: 5678,
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },
  {
    id: '3',
    user: users[3],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    caption: 'My daily skincare routine. ✨ #skincare #beautyhacks',
    sound: { id: 'sound-3', title: 'Lo-fi Chill - AestheticVibes' },
    likes: 89012,
    comments: 345,
    shares: 678,
    isLiked: true,
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },
  {
    id: '4',
    user: users[0],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    caption: 'Cooking up a storm in the kitchen! 🍝 #recipe #foodtok',
    sound: { id: 'sound-4', title: 'Original Sound - ChefSounds' },
    likes: 54321,
    comments: 987,
    shares: 123,
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },
];

export const mockComments: Comment[] = [
    { id: 'comment-1', user: users[2], text: "Wow, this looks amazing!", timestamp: "2h ago" },
    { id: 'comment-2', user: users[3], text: "Great content, keep it up!", timestamp: "1h ago" },
    { id: 'comment-3', user: users[1], text: "Love this! So creative.", timestamp: "30m ago" },
    { id: 'comment-4', user: users[0], audioUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", timestamp: "15m ago" },
];

export const mockStories: Story[] = users.slice(1).map((user, index) => ({
    id: `story-${index + 1}`,
    user,
    imageUrl: 'https://placehold.co/200x300.png'
}));

export const mockChats: Chat[] = [
    { id: 'chat-1', user: users[1], lastMessage: 'Hey, how are you?', timestamp: '10m ago' },
    { id: 'chat-2', user: users[2], lastMessage: 'See you tomorrow!', timestamp: '1h ago' },
    { id: 'chat-3', user: users[3], lastMessage: 'That was hilarious 😂', timestamp: '3h ago' },
];
