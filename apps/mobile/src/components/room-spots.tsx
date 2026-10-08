import type { Tag } from '@nudge/shared-types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ROOMS, ROOM_DESIGN_SIZE, type RoomSpot } from '@/constants/rooms';
import { useSetTagSpot, useTags } from '@/hooks/use-tags';

const DOT = 28;

const SPOT_LABELS = new Map(
  ROOMS.flatMap((room) => room.spots.map((spot) => [spot.key, `${room.label} · ${spot.label}`])),
);

/**
 * Yellow dots over a room background, one per spot. An empty dot opens a
 * picker to place a tag there; a filled dot opens its tag, and a long press
 * takes the tag off the spot.
 *
 * `width`/`height` must be the size the background is drawn at, so the dots
 * line up with the same `contentFit="cover"` scaling.
 */
export function RoomSpots({
  spots,
  width,
  height,
}: {
  spots: RoomSpot[];
  width: number;
  height: number;
}) {
  const router = useRouter();
  const tags = useTags();
  const setTagSpot = useSetTagSpot();
  const [picking, setPicking] = useState<RoomSpot | null>(null);

  const scale = Math.max(width / ROOM_DESIGN_SIZE.width, height / ROOM_DESIGN_SIZE.height);
  const offsetX = (width - ROOM_DESIGN_SIZE.width * scale) / 2;
  const offsetY = (height - ROOM_DESIGN_SIZE.height * scale) / 2;

  const tagBySpot = new Map((tags.data ?? []).flatMap((tag) => (tag.spot ? [[tag.spot, tag]] : [])));

  function confirmRemove(tag: Tag, spot: RoomSpot) {
    Alert.alert(`Remove "${tag.label}"?`, `It will no longer sit on the ${spot.label.toLowerCase()}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setTagSpot.mutate(
            { tagId: tag.id, spot: null },
            { onError: (err) => Alert.alert("Couldn't remove tag", err.message) },
          ),
      },
    ]);
  }

  return (
    <>
      {spots.map((spot) => {
        const tag = tagBySpot.get(spot.key);
        return (
          <View
            key={spot.key}
            pointerEvents="box-none"
            className="absolute items-center"
            style={{
              left: offsetX + spot.x * scale - DOT / 2,
              top: offsetY + spot.y * scale - DOT / 2,
              width: DOT,
            }}>
            <Pressable
              hitSlop={8}
              accessibilityLabel={tag ? `${tag.label} on ${spot.label}` : `Place a tag on ${spot.label}`}
              onPress={() => (tag ? router.push(`/tags/${tag.id}`) : setPicking(spot))}
              onLongPress={tag ? () => confirmRemove(tag, spot) : undefined}
              style={{ width: DOT, height: DOT }}
              className="items-center justify-center">
              {tag ? (
                <View className="h-6 w-6 rounded-full border-2 border-white bg-yellow-400 shadow" />
              ) : (
                <View className="h-4 w-4 rounded-full border-2 border-yellow-400 bg-yellow-300/50" />
              )}
            </Pressable>
            {tag ? (
              // Wider than the dot, centred under it.
              <View pointerEvents="none" className="absolute items-center" style={{ top: DOT, width: 120 }}>
                <Text
                  numberOfLines={1}
                  className="rounded-md bg-white/85 px-1.5 py-0.5 text-xs font-medium text-black">
                  {tag.label}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}

      <SpotPicker
        spot={picking}
        tags={tags.data ?? []}
        onClose={() => setPicking(null)}
        onPick={(tag) => {
          if (!picking) return;
          setTagSpot.mutate(
            { tagId: tag.id, spot: picking.key },
            {
              onSuccess: () => setPicking(null),
              onError: (err) => Alert.alert("Couldn't place tag", err.message),
            },
          );
        }}
        onRegister={() => {
          if (!picking) return;
          setPicking(null);
          router.push({ pathname: '/tags/register', params: { spot: picking.key } });
        }}
      />
    </>
  );
}

function SpotPicker({
  spot,
  tags,
  onClose,
  onPick,
  onRegister,
}: {
  spot: RoomSpot | null;
  tags: Tag[];
  onClose: () => void;
  onPick: (tag: Tag) => void;
  onRegister: () => void;
}) {
  return (
    <Modal visible={!!spot} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-black">
        <ScrollView contentContainerClassName="gap-4 p-4">
          <Text className="text-xl font-bold text-black dark:text-white">
            Place a tag on the {spot?.label.toLowerCase()}
          </Text>

          {tags.length === 0 ? (
            <Text className="text-gray-500 dark:text-gray-400">No tags yet — register one below.</Text>
          ) : (
            <View className="overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
              {tags.map((tag) => (
                <Pressable
                  key={tag.id}
                  onPress={() => onPick(tag)}
                  className="border-b border-gray-100 px-4 py-3 active:bg-gray-100 dark:border-gray-800 dark:active:bg-gray-800">
                  <Text className="text-base text-black dark:text-white">{tag.label}</Text>
                  {/* Picking a tag that's already placed moves it here. */}
                  {tag.spot ? (
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Currently on {SPOT_LABELS.get(tag.spot) ?? tag.spot} — will move
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}

          <Button title="Register new tag" onPress={onRegister} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}
