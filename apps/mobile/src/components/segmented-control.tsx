import { Pressable, Text, View } from 'react-native';

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: readonly T[];
  value: T;
  onChange: (segment: T) => void;
}) {
  return (
    <View className="flex-row rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
      {segments.map((segment) => {
        const selected = segment === value;
        return (
          <Pressable
            key={segment}
            onPress={() => onChange(segment)}
            className={`flex-1 items-center rounded-lg py-2 ${
              selected ? 'bg-white dark:bg-gray-700' : ''
            }`}>
            <Text
              className={
                selected
                  ? 'font-semibold text-black dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }>
              {segment}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
