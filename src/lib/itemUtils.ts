import { Item } from './data';
import { CortexItem } from '@/components/manage/cortex-data';

// Helper function to convert database Item to UI CortexItem
export function itemToCortexItem(item: Item): CortexItem {
  return {
    id: item.id,
    title: item.title,
    url: item.file_path || `/preview/${item.id}`,
    type: item.type.charAt(0).toUpperCase() + item.type.slice(1) as 'Note' | 'PDF' | 'Link' | 'Image',
    createdDate: new Date(item.created_at).toISOString().split('T')[0],
    source: item.source || 'Upload',
    keywords: [], // Tags would need to be fetched separately
    space: 'Personal' as 'Personal' | 'Work' | 'School' | 'Team', // Default mapping
    content: item.content,
    description: item.content?.substring(0, 150),
    file_path: item.file_path
  };
}

// Helper function to convert array of Items to CortexItems
export function itemsToCortexItems(items: Item[]): CortexItem[] {
  return items.map(itemToCortexItem);
}