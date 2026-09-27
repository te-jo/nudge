import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { LogsSection } from '@/components/logs-section';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { TagsSection } from '@/components/tags-section';
import { TasksSection } from '@/components/tasks-section';

const SEGMENTS = ['Logs', 'Tasks', 'Tags'] as const;
type Segment = (typeof SEGMENTS)[number];

function isSegment(value: string | undefined): value is Segment {
  return !!value && (SEGMENTS as readonly string[]).includes(value);
}

export default function LibraryScreen() {
  // `view` lets other screens deep-link to a segment (Home's "See all"), and
  // `uid` arrives when a scan found an unregistered tag.
  const { view, uid } = useLocalSearchParams<{ view?: string; uid?: string }>();
  const [segment, setSegment] = useState<Segment>(
    isSegment(view) ? view : uid ? 'Tags' : 'Logs',
  );

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-bold text-black dark:text-white">Library</Text>

        <SegmentedControl segments={SEGMENTS} value={segment} onChange={setSegment} />

        {segment === 'Logs' ? <LogsSection /> : null}
        {segment === 'Tasks' ? <TasksSection /> : null}
        {segment === 'Tags' ? <TagsSection uid={uid} /> : null}
      </ScrollView>
    </Screen>
  );
}
