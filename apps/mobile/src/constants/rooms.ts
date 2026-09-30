import type Feather from '@expo/vector-icons/Feather';
import type { ImageSource } from 'expo-image';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

/**
 * The room strip, in order. Add, remove or reorder here and both the pager
 * and the tab bar follow.
 */
export const ROOMS: { key: string; label: string; icon: FeatherName; background: ImageSource }[] = [
  {
    key: 'living-room',
    label: 'Living room',
    icon: 'tv',
    background: require('@/assets/images/rooms/livingroom.svg'),
  },
  {
    key: 'corner',
    label: 'Corner',
    icon: 'book-open',
    background: require('@/assets/images/rooms/corner.svg'),
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: 'coffee',
    background: require('@/assets/images/rooms/kitchen.svg'),
  },
  {
    key: 'bedroom',
    label: 'Bedroom',
    icon: 'moon',
    background: require('@/assets/images/rooms/bedroom.svg'),
  },
  {
    key: 'bathroom',
    label: 'Bathroom',
    icon: 'droplet',
    background: require('@/assets/images/rooms/bathroom.svg'),
  },
];
