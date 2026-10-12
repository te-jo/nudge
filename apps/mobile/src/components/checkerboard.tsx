import { View } from 'react-native';

/** The flat colour the room backgrounds used to carry themselves. */
const LIGHT = '#F8F9F9';
/** The alternating square. */
const DARK = '#E5E7EB';
/** Square edge in screen px — the one knob for how coarse the pattern looks. */
const SQUARE = 132;

/**
 * Checkered backdrop for a room page: the old flat colour plus a light grey,
 * alternating. The room SVGs are transparent, so this shows through wherever
 * the illustration doesn't paint.
 *
 * Plain Views rather than a pattern fill — no SVG runtime in the app, and at
 * this square size it's well under a hundred nodes.
 */
export function Checkerboard({ width, height }: { width: number; height: number }) {
  const columns = Math.ceil(width / SQUARE);
  const rows = Math.ceil(height / SQUARE);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width, height, backgroundColor: LIGHT }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} className="flex-row" style={{ height: SQUARE }}>
          {Array.from({ length: columns }, (_, column) => (
            <View
              key={column}
              style={{
                width: SQUARE,
                backgroundColor: (row + column) % 2 === 0 ? 'transparent' : DARK,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
