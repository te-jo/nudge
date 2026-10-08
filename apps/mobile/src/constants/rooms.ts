import type Feather from '@expo/vector-icons/Feather';
import type { ImageSource } from 'expo-image';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

/**
 * A place a tag can sit in a room. `x`/`y` are in the backgrounds' own
 * 402×874 design space; `key` is what's stored on the tag, so keep it stable.
 */
export type RoomSpot = { key: string; label: string; x: number; y: number };

/** Size the room backgrounds were drawn at. */
export const ROOM_DESIGN_SIZE = { width: 402, height: 874 };

/**
 * The room strip, in order. Add, remove or reorder here and both the pager
 * and the tab bar follow.
 */
export const ROOMS: {
  key: string;
  label: string;
  icon: FeatherName;
  background: ImageSource;
  spots: RoomSpot[];
}[] = [
  {
    key: 'living-room',
    label: 'Living room',
    icon: 'tv',
    background: require('@/assets/images/rooms/livingroom.svg'),
    spots: [
      { key: 'living-room.window', label: 'Window', x: 65, y: 400 },
      { key: 'living-room.lamp', label: 'Lamp', x: 258, y: 318 },
      { key: 'living-room.plant', label: 'Plant', x: 42, y: 505 },
      { key: 'living-room.books', label: 'Books', x: 340, y: 520 },
      { key: 'living-room.sofa', label: 'Sofa', x: 200, y: 620 },
    ],
  },
  {
    key: 'corner',
    label: 'Corner',
    icon: 'book-open',
    background: require('@/assets/images/rooms/corner.svg'),
    spots: [
      { key: 'corner.record', label: 'Record', x: 135, y: 445 },
      { key: 'corner.guitar', label: 'Guitar', x: 72, y: 640 },
      { key: 'corner.plant', label: 'Plant', x: 150, y: 600 },
      { key: 'corner.tv', label: 'TV', x: 282, y: 480 },
      { key: 'corner.cabinet', label: 'Cabinet', x: 282, y: 605 },
    ],
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: 'coffee',
    background: require('@/assets/images/rooms/kitchen.svg'),
    spots: [
      { key: 'kitchen.fridge', label: 'Fridge', x: 95, y: 400 },
      { key: 'kitchen.mug', label: 'Mug', x: 135, y: 505 },
      { key: 'kitchen.laptop', label: 'Laptop', x: 225, y: 495 },
      { key: 'kitchen.stool', label: 'Stool', x: 255, y: 640 },
    ],
  },
  {
    key: 'bedroom',
    label: 'Bedroom',
    icon: 'moon',
    background: require('@/assets/images/rooms/bedroom.svg'),
    spots: [
      { key: 'bedroom.coat', label: 'Coat', x: 45, y: 460 },
      { key: 'bedroom.dress', label: 'Dress', x: 150, y: 470 },
      { key: 'bedroom.window', label: 'Window', x: 240, y: 410 },
      { key: 'bedroom.bed', label: 'Bed', x: 250, y: 580 },
      { key: 'bedroom.suitcase', label: 'Suitcase', x: 38, y: 640 },
    ],
  },
  {
    key: 'bathroom',
    label: 'Bathroom',
    icon: 'droplet',
    background: require('@/assets/images/rooms/bathroom.svg'),
    spots: [
      { key: 'bathroom.picture-left', label: 'Left picture', x: 108, y: 345 },
      { key: 'bathroom.picture-right', label: 'Right picture', x: 210, y: 345 },
      { key: 'bathroom.box', label: 'Box', x: 172, y: 475 },
      { key: 'bathroom.washer', label: 'Washing machine', x: 160, y: 610 },
      { key: 'bathroom.basket', label: 'Laundry basket', x: 295, y: 610 },
    ],
  },
];
