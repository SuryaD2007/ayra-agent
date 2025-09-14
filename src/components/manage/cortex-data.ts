
export type CortexItem = {
  id: string;
  title: string;
  url: string;
  type: 'Note' | 'PDF' | 'Link' | 'Image';
  createdDate: string;
  source: string;
  keywords: string[];
  space: 'Personal' | 'Work' | 'School' | 'Team';
  content?: string;
  description?: string;
  dataUrl?: string;
  favicon?: string;
  file_path?: string;
  size_bytes?: number;
};

export const cortexItems: CortexItem[] = [
  {
    id: '1',
    title: 'Neural networks fundamentals',
    url: '/preview/neural-networks',
    type: 'Note',
    createdDate: '2023-04-15',
    source: 'Upload',
    keywords: ['AI', 'Machine Learning', 'Deep Learning'],
    space: 'Work'
  },
  {
    id: '2',
    title: 'Cloud architecture patterns',
    url: '/preview/cloud-patterns',
    type: 'PDF',
    createdDate: '2023-05-22',
    source: 'Upload',
    keywords: ['Cloud', 'Architecture', 'Patterns'],
    space: 'Work'
  },
  {
    id: '3',
    title: 'UX research methods',
    url: '/preview/ux-research',
    type: 'Link',
    createdDate: '2023-06-10',
    source: 'medium.com',
    keywords: ['UX', 'Research', 'Design'],
    space: 'Personal'
  },
  {
    id: '4',
    title: 'Product strategy',
    url: '/preview/product-strategy',
    type: 'Image',
    createdDate: '2023-07-05',
    source: 'Upload',
    keywords: ['Product', 'Strategy', 'Management'],
    space: 'Team'
  },
  {
    id: '5',
    title: 'JavaScript patterns',
    url: '/preview/js-patterns',
    type: 'PDF',
    createdDate: '2023-08-18',
    source: 'github.com',
    keywords: ['JavaScript', 'Patterns', 'Development'],
    space: 'School'
  }
];

export const columns = [
  { id: 'title', name: 'Title', sortable: true },
  { id: 'type', name: 'Type', sortable: true },
  { id: 'keywords', name: 'Tags', sortable: false },
  { id: 'createdDate', name: 'Date Added', sortable: true },
  { id: 'source', name: 'Source', sortable: true }
];
