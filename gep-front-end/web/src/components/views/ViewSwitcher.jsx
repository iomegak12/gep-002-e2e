import { LayoutGrid, LayoutList, Columns } from 'lucide-react';
import { Tabs } from '@/components/primitives/Tabs';

export const VIEW_MODES = ['grid', 'card', 'kanban'];

const ITEMS = [
  { value: 'grid', label: 'Grid', icon: <LayoutList className="h-3.5 w-3.5" /> },
  { value: 'card', label: 'Card', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { value: 'kanban', label: 'Kanban', icon: <Columns className="h-3.5 w-3.5" /> },
];

export function ViewSwitcher({ value = 'grid', onChange, className }) {
  return <Tabs value={value} onChange={onChange} items={ITEMS} className={className} />;
}
