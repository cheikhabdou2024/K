


export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  isVerified?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  purchaseUrl: string;
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
    commentSentiment: { sentiment: string; count: number }[];
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
  views: number;
  product?: Product;
  createdAt: { seconds: number; nanoseconds: number; };
}

// Represents a post with its user data populated for use in the client.
export interface FeedItem extends Omit<FirestorePost, 'userId' | 'createdAt'> {
  user: User;
  isLiked?: boolean;
  product?: Product;
  createdAt?: { seconds: number; nanoseconds: number; }; // Replicate Timestamp structure for client
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
  isFirstTimeCommenter?: boolean;
}

export interface Story {
  id: string;
  user: User;
  imageUrl: string;
  comments: Comment[];
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
  { id: 'user-5', name: 'TechGuru Chris', username: 'techchris', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-6', name: 'Crafty Diana', username: 'craftydiana', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-7', name: 'Wanderlust Barry', username: 'fasttravels', avatarUrl: 'https://placehold.co/100x100.png', isVerified: true },
  { id: 'user-8', name: 'Fit Carol', username: 'captainfit', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-9', name: 'Comedy Pete', username: 'parkerlaughs', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user-10', name: 'Tony Pets', username: 'ironpets', avatarUrl: 'https://placehold.co/100x100.png', isVerified: true },
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
    commentSentiment: [
      { sentiment: 'Positive', count: 1253 },
      { sentiment: 'Neutral', count: 489 },
      { sentiment: 'Negative', count: 132 },
    ],
  },
};

const videoPool = [
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg' },
    { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg' },
];

export const mockFeedItems: FeedItem[] = [
  // --- Original Videos ---
  {
    id: '1',
    user: users[1],
    ...videoPool[0],
    caption: 'Amazing sunset views from my trip! #travel #sunset #nature',
    sound: { id: 'sound-1', title: 'Original Sound - johnsmith' },
    likes: 12345,
    comments: 678,
    shares: 910,
    views: 1200000,
    isLiked: true,
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },
  {
    id: '2',
    user: users[2],
    ...videoPool[1],
    caption: 'Trying out the new dance challenge! Did I nail it? 🕺 #dancechallenge #dance',
    sound: { id: 'sound-2', title: 'Viral Hits - Trending Sounds' },
    likes: 234567,
    comments: 1234,
    shares: 5678,
    views: 5400000,
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },
  {
    id: '3',
    user: users[3],
    ...videoPool[2],
    caption: 'My daily skincare routine. ✨ #skincare #beautyhacks #lifestyle',
    sound: { id: 'sound-3', title: 'Lo-fi Chill - AestheticVibes' },
    likes: 89012,
    comments: 345,
    shares: 678,
    views: 543000,
    isLiked: true,
    product: {
      id: 'prod-1',
      name: 'Glow Serum',
      price: 49.99,
      imageUrl: 'https://placehold.co/400x400.png',
      purchaseUrl: 'https://example.com/shop/glow-serum'
    },
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },
  {
    id: '4',
    user: users[0],
    ...videoPool[3],
    caption: 'Cooking up a storm in the kitchen! 🍝 #recipe #foodtok #cooking',
    sound: { id: 'sound-4', title: 'Original Sound - ChefSounds' },
    likes: 54321,
    comments: 987,
    shares: 123,
    views: 876000,
    createdAt: { seconds: 1672531200, nanoseconds: 0 }
  },

  // --- New Videos ---
  
  // Comedy
  {
    id: '5',
    user: users[8], // Comedy Pete
    ...videoPool[4],
    caption: 'That moment when you realize it\'s Monday tomorrow. #comedy #mondayblues #relatable',
    sound: { id: 'sound-5', title: 'Funny Bone Beats' },
    likes: 98765,
    comments: 1203,
    shares: 4500,
    views: 2100000,
    createdAt: { seconds: 1672617600, nanoseconds: 0 }
  },
  
  // Fitness
  {
    id: '6',
    user: users[7], // Fit Carol
    ...videoPool[5],
    caption: '10-minute morning workout to start your day right! #fitness #workout #healthylifestyle',
    sound: { id: 'sound-6', title: 'Workout Punks - High Energy' },
    likes: 45000,
    comments: 500,
    shares: 2000,
    views: 750000,
    product: {
      id: 'prod-2',
      name: 'Pro-Grip Yoga Mat',
      price: 75.50,
      imageUrl: 'https://placehold.co/400x400.png',
      purchaseUrl: 'https://example.com/shop/yoga-mat'
    },
    createdAt: { seconds: 1672704000, nanoseconds: 0 }
  },
  
  // Pets & Animals
  {
    id: '7',
    user: users[9], // Tony Pets
    ...videoPool[6],
    caption: 'My dog\'s reaction to seeing a squirrel is priceless. 😂 #pets #dogsoftiktok #cuteanimals',
    sound: { id: 'sound-7', title: 'Happy Paws' },
    likes: 1.2 * 1000000,
    comments: 8000,
    shares: 50000,
    views: 15 * 1000000,
    isLiked: true,
    createdAt: { seconds: 1672790400, nanoseconds: 0 }
  },
  
  // Science & Tech
  {
    id: '8',
    user: users[4], // TechGuru Chris
    ...videoPool[7],
    caption: 'Unboxing the new Vision Pro! Is it worth the hype? #tech #unboxing #gadgets',
    sound: { id: 'sound-8', title: 'Future Tech - Electronic' },
    likes: 150000,
    comments: 2500,
    shares: 10000,
    views: 3500000,
    createdAt: { seconds: 1672876800, nanoseconds: 0 }
  },
  
  // DIY & Crafts
  {
    id: '9',
    user: users[5], // Crafty Diana
    ...videoPool[8],
    caption: 'Transforming old jeans into a stylish tote bag! #diy #crafts #upcycling',
    sound: { id: 'sound-9', title: 'Creative Minds' },
    likes: 78000,
    comments: 950,
    shares: 6000,
    views: 1200000,
    createdAt: { seconds: 1672963200, nanoseconds: 0 }
  },
  
  // Travel
  {
    id: '10',
    user: users[6], // Wanderlust Barry
    ...videoPool[0],
    caption: 'Hidden gems in Kyoto you HAVE to see. 🇯🇵 #travel #japan #kyoto',
    sound: { id: 'sound-10', title: 'Japan Travel Lo-fi' },
    likes: 320000,
    comments: 4000,
    shares: 15000,
    views: 4800000,
    isLiked: true,
    createdAt: { seconds: 1673049600, nanoseconds: 0 }
  },
  
  // Fashion
  {
    id: '11',
    user: users[0],
    ...videoPool[1],
    caption: '5 ways to style a basic white tee. Which one is your favorite? #fashion #stylehacks #outfitideas',
    sound: { id: 'sound-11', title: 'Catwalk - Fashion Beats' },
    likes: 110000,
    comments: 1800,
    shares: 7500,
    views: 2200000,
    product: {
      id: 'prod-3',
      name: 'Organic Cotton Tee',
      price: 29.99,
      imageUrl: 'https://placehold.co/400x400.png',
      purchaseUrl: 'https://example.com/shop/cotton-tee'
    },
    createdAt: { seconds: 1673136000, nanoseconds: 0 }
  },

  // Satisfying Content
  {
    id: '12',
    user: users[3],
    ...videoPool[2],
    caption: 'The most satisfying kinetic sand cutting. #asmr #satisfying #relaxing',
    sound: { id: 'sound-12', title: 'Gentle Whispers ASMR' },
    likes: 850000,
    comments: 5000,
    shares: 40000,
    views: 11000000,
    createdAt: { seconds: 1673222400, nanoseconds: 0 }
  },

  // Books & Reading
  {
    id: '13',
    user: users[1],
    ...videoPool[3],
    caption: 'My top 5 thriller books that will keep you up all night! 📚 #booktok #reading #thrillerbooks',
    sound: { id: 'sound-13', title: 'Quiet Library Ambiance' },
    likes: 62000,
    comments: 1500,
    shares: 8000,
    views: 950000,
    createdAt: { seconds: 1673308800, nanoseconds: 0 }
  },

  // Home Decor
  {
    id: '14',
    user: users[5], // Crafty Diana
    ...videoPool[4],
    caption: 'My cozy corner makeover on a budget! What do you think? #homedecor #interiordesign #budgetfriendly',
    sound: { id: 'sound-14', title: 'Acoustic Morning' },
    likes: 95000,
    comments: 2100,
    shares: 9200,
    views: 1800000,
    createdAt: { seconds: 1673395200, nanoseconds: 0 }
  },
  
  // Sports
  {
    id: '15',
    user: users[7], // Fit Carol
    ...videoPool[5],
    caption: 'Some of the most clutch moments in basketball history. #sports #basketball #nba',
    sound: { id: 'sound-15', title: 'Stadium Anthems - Epic' },
    likes: 450000,
    comments: 3200,
    shares: 22000,
    views: 7000000,
    createdAt: { seconds: 1673481600, nanoseconds: 0 }
  },
  
  // Life Hacks
  {
    id: '16',
    user: users[2],
    ...videoPool[6],
    caption: 'You\'ve been opening chip bags wrong your whole life! #lifehacks #tipsandtricks #kitchenhacks',
    sound: { id: 'sound-16', title: 'Upbeat and Quirky' },
    likes: 680000,
    comments: 6300,
    shares: 35000,
    views: 9500000,
    createdAt: { seconds: 1673568000, nanoseconds: 0 }
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
    { id: 'comment-1', user: users[2], text: "Wow, this looks **amazing**!", createdAt: new Date("2024-07-22T10:00:00Z"), likes: 125, audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'reply-1-1', user: users[0], text: "I agree! The colors are stunning.", createdAt: new Date("2024-07-22T10:02:00Z"), likes: 10, parentId: 'comment-1', replyTo: users[2], audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'reply-1-2', user: users[3], text: "Where was this taken?", createdAt: new Date("2024-07-22T10:05:00Z"), likes: 25, parentId: 'comment-1', replyTo: users[2], audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'reply-1-3', user: users[1], text: "Seriously, need the location ASAP!", createdAt: new Date("2024-07-22T10:08:00Z"), likes: 18, parentId: 'comment-1', replyTo: users[3], audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'reply-1-4', user: users[2], text: "It's from my trip to the Amalfi Coast! Highly recommend.", createdAt: new Date("2024-07-22T10:15:00Z"), likes: 50, parentId: 'comment-1', replyTo: users[3], audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'comment-2', user: users[3], text: "Great content, _keep it up_!", createdAt: new Date("2024-07-22T11:00:00Z"), likes: 88, isFirstTimeCommenter: true, audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    {
        id: 'comment-audio',
        user: users[1],
        // NOTE: This is a video URL used as a placeholder for an audio file.
        // The <audio> tag can often play the audio track from video files.
        audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        text: "This is a test of the audio comment system. It seems to work pretty well!",
        createdAt: new Date("2024-07-22T12:00:00Z"),
        likes: 42
    },
    { id: 'comment-3', user: users[1], text: "Love this! So creative.", createdAt: new Date("2024-07-22T11:30:00Z"), likes: 231, audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'comment-4', user: users[0], text: "This is my ~~least~~ favorite so far!", createdAt: new Date("2024-07-22T11:45:00Z"), likes: 45, replyTo: users[1], parentId: 'comment-3', audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'comment-5', user: users[2], text: "For anyone wondering, here is the code: `console.log('hello');`", createdAt: new Date("2024-07-22T11:50:00Z"), likes: 15, audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'comment-6', user: users[0], text: "A multi-line example:\n```javascript\nfunction greet() {\n  return 'Hello, World!';\n}\n```", createdAt: new Date("2024-07-22T11:55:00Z"), likes: 22, audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    { id: 'comment-7', user: users[3], text: "Hey @janedoe, check this out! Awesome work.", createdAt: new Date("2024-07-22T12:10:00Z"), likes: 5, audioUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }
];

export const mockStories: Story[] = users.slice(1).map((user, index) => ({
    id: `story-${index + 1}`,
    user,
    imageUrl: 'https://placehold.co/200x300.png',
    comments: mockComments.slice(index, index + 5),
}));

export const mockChats: Chat[] = [
    { id: 'chat-1', user: users[1], lastMessage: 'Hey, how are you?', timestamp: '10m ago' },
    { id: 'chat-2', user: users[2], lastMessage: 'See you tomorrow!', timestamp: '1h ago' },
    { id: 'chat-3', user: users[3], lastMessage: 'That was hilarious 😂', timestamp: '3h ago' },
];
