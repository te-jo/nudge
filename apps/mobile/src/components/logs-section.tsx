import type { EventWithRelations } from '@nudge/shared-types';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { useDeleteEvent, useEventHistory, useUpdateEvent } from '@/hooks/use-events';
import { relativeTime } from '@/lib/relative-time';

function dayKey(iso: string) {
  const date = new Date(iso);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((startOfToday.getTime() - new Date(dayKey(iso)).getTime()) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export function LogsSection() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useEventHistory();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [editing, setEditing] = useState<EventWithRelations | null>(null);
  const [note, setNote] = useState('');

  const events = useMemo(() => data?.pages.flat() ?? [], [data]);

  // Events arrive newest-first, so grouping preserves date order.
  const days = useMemo(() => {
    const groups: { key: string; label: string; events: EventWithRelations[] }[] = [];
    for (const event of events) {
      const key = dayKey(event.createdAt);
      const last = groups[groups.length - 1];
      if (last?.key === key) last.events.push(event);
      else groups.push({ key, label: dayLabel(event.createdAt), events: [event] });
    }
    return groups;
  }, [events]);

  function confirmDelete(event: EventWithRelations) {
    Alert.alert('Delete log', 'Delete this log entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteEvent.mutate(event.id, {
            onError: (err) =>
              Alert.alert(
                "Couldn't delete log",
                err instanceof Error ? err.message : 'Something went wrong.',
              ),
          }),
      },
    ]);
  }

  function openMenu(event: EventWithRelations) {
    Alert.alert(event.taskName ?? event.tagLabel, relativeTime(event.createdAt), [
      {
        text: event.note ? 'Edit note' : 'Add note',
        onPress: () => {
          setNote(event.note ?? '');
          setEditing(event);
        },
      },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(event) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function saveNote() {
    if (!editing) return;
    const trimmed = note.trim();
    updateEvent.mutate(
      { id: editing.id, input: { note: trimmed || null } },
      {
        onSuccess: () => setEditing(null),
        onError: (err) =>
          Alert.alert(
            "Couldn't save note",
            err instanceof Error ? err.message : 'Something went wrong.',
          ),
      },
    );
  }

  if (isLoading) {
    return (
      <View className="py-10">
        <ActivityIndicator />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <Text className="py-6 text-center text-gray-500 dark:text-gray-400">
        No logs yet. Scan a tag to record one.
      </Text>
    );
  }

  return (
    <View className="gap-5">
      {days.map((day) => (
        <View key={day.key} className="gap-2">
          <Text className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
            {day.label}
          </Text>

          <View className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
            {day.events.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => openMenu(event)}
                onLongPress={() => openMenu(event)}
                className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0 active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-900">
                <View className="flex-1 pr-3">
                  <Text className="text-base text-black dark:text-white" numberOfLines={1}>
                    {event.taskName ?? 'No task'}
                  </Text>
                  <Text
                    className="mt-0.5 text-sm text-gray-500 dark:text-gray-400"
                    numberOfLines={1}>
                    {[event.folderName, event.tagLabel, event.note].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(event.createdAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {hasNextPage ? (
        <Button
          title={isFetchingNextPage ? 'Loading…' : 'Load older'}
          variant="secondary"
          onPress={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
        />
      ) : null}

      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="mx-6 gap-4 rounded-xl bg-white p-4 dark:bg-gray-900">
            <Text className="text-base font-semibold text-black dark:text-white">Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              placeholderTextColor="#9ca3af"
              autoFocus
              onSubmitEditing={saveNote}
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-black dark:border-gray-700 dark:text-white"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} />
              </View>
              <View className="flex-1">
                <Button title="Save" onPress={saveNote} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
