
export const forumThreads = [
  {
    id: '1',
    title: 'Struggling with Quantum Mechanics Problem Set 3',
    author: 'Alice Johnson',
    course: 'PHY301',
    upvotes: 23,
    replies: 7,
    timestamp: '2024-05-20T10:00:00.000Z',
    tags: ['quantum-mechanics', 'homework-help'],
    body: 'I\'m really stuck on question 2 of the latest problem set. Can anyone explain the concept of wave-particle duality in simpler terms? Any help would be appreciated!'
  },
  {
    id: '2',
    title: 'Best resources for understanding Functional Programming in CS202?',
    author: 'Bob Williams',
    course: 'CS202',
    upvotes: 45,
    replies: 12,
    timestamp: '2024-05-20T14:30:00.000Z',
    tags: ['functional-programming', 'resources', 'haskell'],
    body: 'I\'m finding the concepts of monads and functors in Haskell very abstract. Does anyone have recommendations for good tutorials, books, or video series that explain these topics clearly? The textbook is a bit dense.'
  },
  {
    id: '3',
    title: 'Midterm study group for HIST101',
    author: 'Charlie Brown',
    course: 'HIST101',
    upvotes: 15,
    replies: 4,
    timestamp: '2024-05-19T09:00:00.000Z',
    tags: ['study-group', 'midterm', 'american-revolution'],
    body: 'Looking to form a study group for the upcoming HIST101 midterm. I\'ve booked a room in the library for Wednesday afternoon. Let me know if you\'re interested in joining!'
  },
  {
    id: '4',
    title: 'Clarification on Lab 4 submission guidelines for BIO210',
    author: 'Diana Miller',
    course: 'BIO210',
    upvotes: 8,
    replies: 2,
    timestamp: '2024-05-18T18:00:00.000Z',
    tags: ['lab-report', 'submission', 'guidelines'],
    body: 'The instructions for Lab 4 mention a "results summary" section, but it\'s not in the provided template. Can someone clarify what\'s expected here? Is it a separate document?'
  },
   {
    id: '5',
    title: 'Tips for Creative Writing Workshop (ENG250)?',
    author: 'Eve Davis',
    course: 'ENG250',
    upvotes: 33,
    replies: 9,
    timestamp: '2024-05-21T11:00:00.000Z',
    tags: ['creative-writing', 'workshop', 'tips'],
    body: 'Hey everyone, I\'m new to creative writing workshops. Any advice on how to give and receive constructive criticism effectively? A bit nervous about sharing my work!'
  },
];

export const resourceLibrary = [
  {
    id: 'res1',
    name: 'Intro to Quantum Mechanics Lecture Notes',
    category: 'Lecture Notes',
    uploader: 'Prof. Davis',
    date: '2023-09-15',
    fileType: 'pdf',
  },
  {
    id: 'res2',
    name: 'Functional Programming Cheat Sheet',
    category: 'Cheat Sheet',
    uploader: 'Alice Johnson',
    date: '2023-10-02',
    fileType: 'pdf',
  },
  {
    id: 'res3',
    name: 'American Revolution Timeline',
    category: 'Study Guide',
    uploader: 'Charlie Brown',
    date: '2023-09-28',
    fileType: 'docx',
  },
  {
    id: 'res4',
    name: 'Cellular Respiration Diagram',
    category: 'Visual Aid',
    uploader: 'Admin',
    date: '2023-09-20',
    fileType: 'png',
  },
   {
    id: 'res5',
    name: 'Historical Analysis Essay Example',
    category: 'Example Work',
    uploader: 'Prof. Smith',
    date: '2023-10-05',
    fileType: 'pdf',
  },
];

export const events = [
  {
    id: 'evt-today-1',
    title: 'CS Club Project Showcase',
    date: new Date(),
    category: 'Club Activity',
    description: 'See the amazing projects our computer science club members have been working on this semester.',
  },
  {
    id: 'evt-today-2',
    title: 'History Dept. Mixer',
    date: new Date(),
    category: 'Social',
    description: 'Meet and greet with faculty and students from the history department. Refreshments will be served.',
  },
  {
    id: 'evt-tomorrow',
    title: 'Biology Study Session',
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    category: 'Study Group',
    description: 'A group study session for the upcoming BIO101 midterm. We will cover chapters 4-6.',
  },
  {
    id: 'evt1',
    title: 'University Hackathon 2024',
    date: new Date(new Date().setDate(new Date().getDate() + 7)),
    category: 'Competition',
    description: 'Annual coding competition open to all students.',
  },
  {
    id: 'evt2',
    title: 'Guest Lecture: AI in Modern Science',
    date: new Date(new Date().setDate(new Date().getDate() + 12)),
    category: 'Lecture',
    description: 'A talk by leading AI researcher Dr. Evelyn Reed.',
  },
  {
    id: 'evt3',
    title: 'Fall Semester Career Fair',
    date: new Date(new Date().setDate(new Date().getDate() + 20)),
    category: 'Career',
    description: 'Meet with top companies hiring for internships and full-time roles.',
  },
];

export const userProfile = {
    name: 'Campus User',
    email: 'student@university.edu',
    role: 'Student',
    avatar: 'https://placehold.co/100x100.png',
    bio: 'A passionate learner exploring the depths of computer science and history. Looking for mentorship in advanced algorithms.',
};
