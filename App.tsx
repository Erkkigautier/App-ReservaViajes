import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Segmented } from './src/components/ui';
import { DriverScreen } from './src/screens/DriverScreen';
import { PassengerScreen } from './src/screens/PassengerScreen';
import { isSeatTaken, loadReservations, newReservationCode, saveReservations } from './src/storage';
import { colors } from './src/theme';
import { Reservation, ReservationStatus } from './src/types';

type Role = 'pasajero' | 'conductor';

export default function App() {
  const [role, setRole] = useState<Role>('pasajero');
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const refresh = useCallback(async () => setReservations(await loadReservations()), []);

  useEffect(() => {
    refresh();
  }, [refresh, role]);

  const create = async (data: Omit<Reservation, 'id' | 'code' | 'createdAt' | 'status'>) => {
    // Se relee el almacenamiento para no pisar un asiento reservado desde otra pestaña.
    const current = await loadReservations();
    if (isSeatTaken(current, data.seat)) {
      setReservations(current);
      return null;
    }
    const reservation: Reservation = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: newReservationCode(),
      createdAt: new Date().toISOString(),
      status: 'pendiente',
    };
    const next = [...current, reservation];
    await saveReservations(next);
    setReservations(next);
    return reservation;
  };

  const update = async (id: string, status: ReservationStatus, driverNote?: string) => {
    const current = await loadReservations();
    const target = current.find((r) => r.id === id);
    if (!target) return false;
    const others = current.filter((r) => r.id !== id);
    if (status !== 'rechazada' && isSeatTaken(others, target.seat)) return false;
    const next = current.map((r) => (r.id === id ? { ...r, status, driverNote } : r));
    await saveReservations(next);
    setReservations(next);
    return true;
  };

  const clearAll = async () => {
    await saveReservations([]);
    setReservations([]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>ReservaViajes</Text>
        <Text style={styles.tagline}>Viajes y tours en van · reserva tu asiento</Text>
        <View style={{ marginTop: 12 }}>
          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: 'pasajero', label: 'Pasajero' },
              { value: 'conductor', label: 'Conductor' },
            ]}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {role === 'pasajero' ? (
          <PassengerScreen reservations={reservations} onCreate={create} />
        ) : (
          <DriverScreen reservations={reservations} onUpdate={update} onClearAll={clearAll} />
        )}
        <Text style={styles.footer}>Prototipo: los datos se guardan solo en este dispositivo.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: '#0F2A5F',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) + 12 : Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800' },
  tagline: { color: '#C7D2FE', fontSize: 13, marginTop: 2 },
  content: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});
