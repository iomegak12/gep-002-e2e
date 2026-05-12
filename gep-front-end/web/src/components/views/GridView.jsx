import { DataTable } from '@/components/data/DataTable';

/**
 * Thin wrapper around DataTable to keep the GridView name aligned with the ViewSwitcher.
 * Lets us extend grid-specific UI later (row density toggle, column chooser, etc.)
 * without touching consumers.
 */
export function GridView(props) {
  return <DataTable {...props} />;
}
