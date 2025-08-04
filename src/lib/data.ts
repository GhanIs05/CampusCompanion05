

export const forumThreads = [
  {
    id: '1',
    title: 'Struggling with Thermodynamics Problem Set 3',
    author: 'Alice Johnson',
    course: 'Thermodynamics',
    upvotes: 23,
    replies: 7,
    timestamp: '2024-05-20T10:00:00.000Z',
    tags: ['thermodynamics', 'homework-help'],
    body: 'I\'m really stuck on question 2 of the latest problem set regarding entropy. Can anyone explain the concept of the Carnot cycle in simpler terms? Any help would be appreciated!'
  },
  {
    id: '2',
    title: 'Best resources for understanding VHDL for Digital Logic Design?',
    author: 'Bob Williams',
    course: 'Digital Logic Design',
    upvotes: 45,
    replies: 12,
    timestamp: '2024-05-20T14:30:00.000Z',
    tags: ['digital-logic', 'resources', 'vhdl'],
    body: 'I\'m finding the syntax for state machines in VHDL very tricky. Does anyone have recommendations for good tutorials, books, or video series that explain these topics clearly? The textbook is a bit dense.'
  },
  {
    id: '3',
    title: 'Midterm study group for Statics & Structures',
    author: 'Charlie Brown',
    course: 'Statics & Structures',
    upvotes: 15,
    replies: 4,
    timestamp: '2024-05-19T09:00:00.000Z',
    tags: ['study-group', 'midterm', 'statics'],
    body: 'Looking to form a study group for the upcoming CIV100 midterm. I\'ve booked a room in the engineering building for Wednesday afternoon. Let me know if you\'re interested in joining!'
  },
  {
    id: '4',
    title: 'Clarification on Lab 4 submission guidelines for Biomechanics',
    author: 'Diana Miller',
    course: 'Biomechanics',
    upvotes: 8,
    replies: 2,
    timestamp: '2024-05-18T18:00:00.000Z',
    tags: ['lab-report', 'submission', 'guidelines'],
    body: 'The instructions for Lab 4 mention a "force plate data analysis" section, but it\'s not in the provided template. Can someone clarify what\'s expected here? Is it a separate script?'
  },
   {
    id: '5',
    title: 'Tips for the final project in Chemical Reaction Engineering?',
    author: 'Eve Davis',
    course: 'Chemical Reaction Engineering',
    upvotes: 33,
    replies: 9,
    timestamp: '2024-05-21T11:00:00.000Z',
    tags: ['final-project', 'reactors', 'tips'],
    body: 'Hey everyone, I\'m starting the final design project for CHE330. I am a bit overwhelmed by the possibilities! Any advice on selecting the right reactor type and optimizing the process conditions?'
  },
];

export const resourceLibrary = [
  {
    id: 'res1',
    name: 'Intro to Thermodynamics Lecture Notes',
    category: 'Lecture Notes',
    uploader: 'Prof. Davis',
    date: '2023-09-15',
    fileType: 'pdf',
    url: 'https://example.com/download/quantum-notes.pdf'
  },
  {
    id: 'res2',
    name: 'VHDL Quick Reference Sheet',
    category: 'Cheat Sheet',
    uploader: 'Alice Johnson',
    date: '2023-10-02',
    fileType: 'pdf',
    url: 'https://example.com/download/fp-cheatsheet.pdf'
  },
  {
    id: 'res3',
    name: 'Truss Analysis Study Guide',
    category: 'Study Guide',
    uploader: 'Charlie Brown',
    date: '2023-09-28',
    fileType: 'docx',
    url: 'https://example.com/download/revolution-timeline.docx'
  },
  {
    id: 'res4',
    name: 'Chemical Reactor Design Flowchart',
    category: 'Visual Aid',
    uploader: 'Admin',
    date: '2023-09-20',
    fileType: 'png',
    url: 'https://example.com/download/respiration.png'
  },
   {
    id: 'res5',
    name: 'Biomechanics Lab Report Example',
    category: 'Example Work',
    uploader: 'Prof. Smith',
    date: '2023-10-05',
    fileType: 'pdf',
    url: 'https://example.com/download/history-essay.pdf'
  },
];

export const events = [
  {
    id: 'evt-today-1',
    title: 'ECE Club Project Showcase',
    date: new Date(),
    category: 'Club Activity',
    description: 'See the amazing projects our electrical and computer engineering club members have been working on this semester.',
  },
  {
    id: 'evt-today-2',
    title: 'Civil Engineering Dept. Mixer',
    date: new Date(),
    category: 'Social',
    description: 'Meet and greet with faculty and students from the civil engineering department. Refreshments will be served.',
  },
  {
    id: 'evt-tomorrow',
    title: 'Mechanical Engineering Study Session',
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    category: 'Study Group',
    description: 'A group study session for the upcoming Thermodynamics midterm. We will cover chapters 4-6.',
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
    title: 'Guest Lecture: AI in Modern Engineering',
    date: new Date(new Date().setDate(new Date().getDate() + 12)),
    category: 'Lecture',
    description: 'A talk by leading AI researcher Dr. Evelyn Reed.',
  },
  {
    id: 'evt3',
    title: 'Fall Semester Engineering Career Fair',
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
