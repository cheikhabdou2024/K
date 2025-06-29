
import type { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  isVerified?: boolean;
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
  createdAt: Date;
  likes: number;
  replyTo?: User;
  parentId?: string;
  replies?: Comment[];
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
  { id: 'user-1', name: 'Jane Doe', username: 'janedoe', avatarUrl: 'https://placehold.co/100x100.png', isVerified: true },
  { id: 'user-2', name: 'John Smith', username: 'johnsmith', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-3', name: 'Alex Ray', username: 'alexray', avatarUrl: 'https://placehold.co/100x100.png', isVerified: true },
  { id: 'user-4', name: 'Mia Wong', username: 'miawong', avatarUrl: 'https://placehold.co/100x100.png' },
];

export const mockMe: FirestoreUser = {
  id: 'user-1',
  name: 'Jane Doe',
  username: 'janedoe',
  email: 'jane.doe@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  isVerified: true,
  bio: 'Just a girl who loves to create and share videos! Follow for daily fun. 💃',
  stats: {
    following: 120,
    followers: 18500,
    likes: 345000,
  },
  analytics: {
    profileViews: [
      { day: 'Mon', views: 230 },
      { day: 'Tue', views: 345 },
      { day: 'Wed', views: 450 },
      { day: 'Thu', views: 380 },
      { day: 'Fri', views: 560 },
      { day: 'Sat', views: 780 },
      { day: 'Sun', views: 650 },
    ],
    monthlyLikes: [
      { month: 'Jan', likes: 12000 },
      { month: 'Feb', likes: 18000 },
      { month: 'Mar', likes: 25000 },
      { month: 'Apr', likes: 31000 },
      { month: 'May', likes: 29000 },
      { month: 'Jun', likes: 42000 },
    ],
  },
};


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

export const mockSoundLibrary: Sound[] = [
    { id: 'sound-1', title: 'Original Sound' },
    { id: 'sound-2', title: 'Viral Hits - Trending Sounds' },
    { id: 'sound-3', title: 'Lo-fi Chill - AestheticVibes' },
    { id: 'sound-4', title: 'Upbeat Pop - Summer Vibes' },
    { id: 'sound-5', title: 'Epic Movie Trailer' },
    { id: 'sound-6', title: 'Acoustic Folk - Gentle Mood' },
    { id: 'sound-7', title: '80s Synthwave - Retro Future' },
];

export const mockComments: Comment[] = [
    { id: 'comment-1', user: users[2], text: "Wow, this looks **amazing**!", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), likes: 125 },
    { id: 'comment-2', user: users[3], text: "Great content, _keep it up_!", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1), likes: 88 },
    { id: 'comment-3', user: users[1], text: "Love this! So creative.", createdAt: new Date(Date.now() - 1000 * 60 * 30), likes: 231 },
    { id: 'comment-4', user: users[0], text: "This is my ~~least~~ favorite so far!", createdAt: new Date(Date.now() - 1000 * 60 * 15), likes: 45, replyTo: users[1], parentId: 'comment-3' },
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
