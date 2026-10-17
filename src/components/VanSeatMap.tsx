import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BACK_ROWS, FRONT_ROW, SeatCell } from '../seats';
import { colors } from '../theme';

export type SeatState = 'libre' | 'seleccionado' | 'ocupado' | 'pendiente' | 'validado';

const seatColor: Record<SeatState, string> = {
  libre: colors.seatFree,
  seleccionado: colors.seatSelected,
  ocupado: colors.seatTaken,
  pendiente: colors.seatPending,
  validado: colors.seatTaken,
};

type Props = {
  getSeatState: (seat: number) => SeatState;
  onSeatPress?: (seat: number) => void;
  // Solo se puede pulsar un asiento en estos estados (por defecto: libre y seleccionado).
  pressableStates?: SeatState[];
  legend: { state: SeatState; label: string }[];
};

const SEAT = 64;

export function VanSeatMap({
  getSeatState,
  onSeatPress,
  pressableStates = ['libre', 'seleccionado'],
  legend,
}: Props) {
  const renderCell = (cell: SeatCell) => {
    if (cell === 'D') {
      return (
        <View key="D" accessibilityLabel="Asiento del conductor" style={styles.seatWrap}>
          <SeatShape color={colors.seatDriver} />
          <SteeringWheel />
          <Text style={styles.driverLabel}>Conductor</Text>
        </View>
      );
    }
    const state = getSeatState(cell);
    const enabled = !!onSeatPress && pressableStates.includes(state);
    return (
      <Pressable
        key={cell}
        accessibilityRole="button"
        accessibilityLabel={`Asiento ${cell}, ${state}`}
        accessibilityState={{ disabled: !enabled, selected: state === 'seleccionado' }}
        disabled={!enabled}
        onPress={() => onSeatPress?.(cell)}
        style={({ pressed }) => [styles.seatWrap, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <SeatShape color={seatColor[state]} />
        <Text style={[styles.seatNumber, state === 'pendiente' && { color: colors.text }]}>{cell}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.vanOuter}>
        <View style={[styles.mirror, { left: -16 }]} />
        <View style={[styles.mirror, { right: -16 }]} />
        <View style={styles.hood}>
          <View style={styles.vent} />
        </View>
        <View style={styles.cabin}>
          <View style={styles.dashboard}>
            <View style={styles.dashScreen} />
          </View>
          <View style={styles.frontRow}>{FRONT_ROW.map(renderCell)}</View>
          <View style={styles.partition}>
            <View style={styles.dot} />
            <View style={styles.partitionLine} />
            <View style={styles.dot} />
          </View>
          {BACK_ROWS.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map(renderCell)}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.legend}>
        {legend.map((l) => (
          <View key={l.state} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: seatColor[l.state] }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SeatShape({ color }: { color: string }) {
  return (
    <View style={styles.seat}>
      <View style={[styles.cushion, { backgroundColor: color }]} />
      <View style={styles.armrest} />
    </View>
  );
}

function SteeringWheel() {
  return (
    <View style={styles.wheel} pointerEvents="none">
      <View style={styles.wheelSpokeH} />
      <View style={styles.wheelSpokeV} />
      <View style={styles.wheelHub} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  vanOuter: {
    width: 260,
    backgroundColor: colors.van,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderWidth: 2,
    borderColor: colors.vanDark,
    padding: 10,
    paddingTop: 0,
  },
  mirror: {
    position: 'absolute',
    top: 120,
    width: 20,
    height: 8,
    borderRadius: 3,
    backgroundColor: colors.vanDark,
  },
  hood: { height: 70, alignItems: 'center', justifyContent: 'center' },
  vent: { width: 70, height: 12, borderRadius: 6, backgroundColor: '#9EA2A8' },
  cabin: {
    backgroundColor: colors.vanFloor,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingBottom: 14,
  },
  dashboard: {
    height: 24,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: colors.vanDark,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 14,
  },
  dashScreen: { width: 60, height: 10, borderRadius: 4, backgroundColor: '#7C8087' },
  frontRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  partition: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.vanDark,
    height: 18,
    borderRadius: 4,
    marginVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  partitionLine: { flex: 1, height: 3, backgroundColor: '#9EA2A8', borderRadius: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9CCD1' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  seatWrap: { width: SEAT, height: SEAT + 6, alignItems: 'center', justifyContent: 'center' },
  seat: { position: 'absolute', top: 0, left: 0, width: SEAT, height: SEAT + 6 },
  cushion: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    bottom: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  armrest: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SEAT * 0.6,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 6,
    borderColor: '#111',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  seatNumber: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  driverLabel: { position: 'absolute', bottom: 10, fontSize: 9, fontWeight: '700', color: colors.text },
  wheel: {
    position: 'absolute',
    top: -14,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 5,
    borderColor: '#8A8E94',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSpokeH: { position: 'absolute', width: 34, height: 4, backgroundColor: '#8A8E94' },
  wheelSpokeV: { position: 'absolute', top: 17, width: 4, height: 18, backgroundColor: '#8A8E94' },
  wheelHub: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6D7177' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 16, height: 16, borderRadius: 4 },
  legendText: { fontSize: 13, color: colors.text },
});
