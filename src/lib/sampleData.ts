// Sample data for testing localStorage migration
export const sampleAyraItems = [
  {
    id: 'sample-1',
    title: 'Neural Networks Fundamentals',
    type: 'note',
    content: 'Deep learning fundamentals including backpropagation, gradient descent, and neural network architectures. This covers the mathematical foundations and practical implementations.',
    keywords: ['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks'],
    tags: ['AI', 'Machine Learning', 'Deep Learning'],
    createdDate: '2024-01-15',
    created_at: '2024-01-15T10:30:00Z',
    source: 'Upload',
    space: 'Work'
  },
  {
    id: 'sample-2',
    title: 'React Best Practices Guide',
    type: 'link',
    url: 'https://react.dev/learn',
    content: 'Comprehensive guide to React development best practices including hooks, state management, performance optimization, and testing strategies.',
    keywords: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    tags: ['React', 'JavaScript', 'Frontend'],
    createdDate: '2024-01-20',
    created_at: '2024-01-20T14:15:00Z',
    source: 'react.dev',
    space: 'Personal'
  },
  {
    id: 'sample-3',
    title: 'Project Management Templates',
    type: 'pdf',
    content: 'Collection of project management templates including Gantt charts, risk assessment matrices, and stakeholder communication plans.',
    keywords: ['Project Management', 'Templates', 'Planning', 'Organization'],
    tags: ['Project Management', 'Templates', 'Planning'],
    createdDate: '2024-01-25',
    created_at: '2024-01-25T09:00:00Z',
    source: 'Upload',
    space: 'Work',
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmogPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAEIDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggMzkKPj4Kc3RyZWFtCkJUCi9GMSA3OCBUZgo1MCAgNzAwIFRkCihQcm9qZWN0IE1hbmFnZW1lbnQgVGVtcGxhdGVzKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIzNCAwMDAwMCBuIAowMDAwMDAwMzAwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzkwCiUlRU9G'
  },
  {
    id: 'sample-4',
    title: 'Design System Guidelines',
    type: 'image',
    content: 'Visual guidelines for our design system including color palettes, typography scales, spacing units, and component specifications.',
    keywords: ['Design System', 'UI/UX', 'Guidelines', 'Design'],
    tags: ['Design System', 'UI/UX', 'Design'],
    createdDate: '2024-02-01',
    created_at: '2024-02-01T11:45:00Z',
    source: 'Upload',
    space: 'Work'
  },
  {
    id: 'sample-5',
    title: 'Study Notes: Database Design',
    type: 'note',
    content: 'Comprehensive notes on database design principles including normalization, indexing strategies, query optimization, and ACID properties. Covers both SQL and NoSQL approaches.',
    keywords: ['Database', 'SQL', 'Design', 'Optimization', 'Study'],
    tags: ['Database', 'SQL', 'Study'],
    createdDate: '2024-02-05',
    created_at: '2024-02-05T16:20:00Z',
    source: 'Notes',
    space: 'School'
  }
];

// Utility function to populate localStorage with sample data for testing migration
export const populateSampleData = () => {
  localStorage.setItem('ayra.items', JSON.stringify(sampleAyraItems));
  console.log('Sample data populated in localStorage under "ayra.items"');
  console.log('Now log in to trigger the migration!');
};

// Utility function to clear sample data
export const clearSampleData = () => {
  localStorage.removeItem('ayra.items');
  console.log('Sample data cleared from localStorage');
};

// Check if sample data exists
export const hasSampleData = () => {
  return localStorage.getItem('ayra.items') !== null;
};

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).populateSampleData = populateSampleData;
  (window as any).clearSampleData = clearSampleData;
  (window as any).hasSampleData = hasSampleData;
  (window as any).resetMigration = () => {
    localStorage.removeItem('ayra.migrated');
    console.log('Migration flag cleared. Migration will run on next login.');
  };
  
  // Show help message in console
  console.log('🔧 Migration Testing Commands:');
  console.log('- populateSampleData() - Add sample items to localStorage');
  console.log('- clearSampleData() - Clear sample items from localStorage'); 
  console.log('- hasSampleData() - Check if sample data exists');
  console.log('- resetMigration() - Clear migration flag to allow re-migration');
  console.log('');
  console.log('To test migration: Run populateSampleData(), then log in to the app.');
}