const getThreads = async () => {
  // Mock data as per requirements
  return [
    {
      id: 'thread_1',
      title: 'Best practices for IP litigation in 2024?',
      preview: 'I am looking for advice on recent changes in IP law...',
      category: 'Intellectual Property',
      tags: ['IP', 'Litigation', '2024'],
      votes: 45,
      replies: 12,
      views: 340,
      isSolved: true,
      postedAt: '2 days ago',
      author: {
        name: 'Sarah Jenning',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        role: 'Senior Associate',
      },
    },
    {
      id: 'thread_2',
      title: 'Handling difficult client expectations',
      preview: 'How do you manage clients who expect immediate results...',
      category: 'Client Relations',
      tags: ['Soft Skills', 'Management'],
      votes: 32,
      replies: 8,
      views: 210,
      isSolved: false,
      postedAt: '5 hours ago',
      author: {
        name: 'Mike Ross',
        avatar: 'https://i.pravatar.cc/150?u=mike',
        role: 'Junior Associate',
      },
    },
  ];
};

export const CommunityServices = {
  getThreads,
};
