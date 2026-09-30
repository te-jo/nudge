import type Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

/**
 * The room strip, in order. Add, remove or reorder here and both the pager
 * and the tab bar follow.
 */
export const ROOMS: { key: string; label: string; icon: FeatherName }[] = [
  { key: 'living-room', label: 'Living room', icon: 'tv' },
  { key: 'corner', label: 'Corner', icon: 'book-open' },
  { key: 'kitchen', label: 'Kitchen', icon: 'coffee' },
  { key: 'bedroom', label: 'Bedroom', icon: 'moon' },
  { key: 'bathroom', label: 'Bathroom', icon: 'droplet' },
];
