import type { EventWithRelations } from "@nudge/shared-types";
import { Text, View } from "react-native";

export function EventRow({ event }: { event: EventWithRelations }) {
  const title = event.taskName ?? event.tagLabel;
  const time = new Date(event.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <View className="flex-1 pr-3">
        <Text className="text-base font-medium text-black dark:text-white">{title}</Text>
        {event.note ? (
          <Text className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{event.note}</Text>
        ) : null}
      </View>
      <Text className="text-sm text-gray-500 dark:text-gray-400">{time}</Text>
    </View>
  );
}
