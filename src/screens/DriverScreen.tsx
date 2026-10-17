import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReceiptPreview } from '../components/Receipt';
import { Button, Card, Dialog, Field, Segmented } from '../components/ui';
import { VanSeatMap } from '../components/VanSeatMap';
import { colors } from '../theme';
import { Reservation, ReservationStatus } from '../types';

// PIN de demostración para el prototipo (no hay backend ni cuentas reales).
export const DRIVER_PIN = '1234';

type Filter = 'todas' | ReservationStatus;

const statusLabel: Record<ReservationStatus, string> = {
  pendiente: 'Pendiente',
  validada: 'Validada',
  rechazada: 'Rechazada',
};
const statusColor: Record<ReservationStatus, string> = {
  pendiente: '#B7791F',
  validada: colors.success,
  rechazada: colors.danger,
};

type Props = {
  reservations: Reservation[];
  onUpdate: (id: string, status: ReservationStatus, note?: string) => Promise<boolean>;
  onClearAll: () => Promise<void>;
};

export function DriverScreen(props: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string>();

  if (!unlocked) {
    return (
      <Card title="3. Panel del conductor" subtitle="Ingresa el PIN de administrador para gestionar las reservas.">
        <Field
          label="PIN"
          placeholder="PIN de 4 dígitos (demo: 1234)"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={(v) => {
            setPin(v);
            setPinError(undefined);
          }}
          onSubmitEditing={() => (pin === DRIVER_PIN ? setUnlocked(true) : setPinError('PIN incorrecto.'))}
          error={pinError}
        />
        <Button
          title="Ingresar"
          onPress={() => (pin === DRIVER_PIN ? setUnlocked(true) : setPinError('PIN incorrecto.'))}
        />
      </Card>
    );
  }
  return <DriverDashboard {...props} onLock={() => { setUnlocked(false); setPin(''); }} />;
}

function DriverDashboard({ reservations, onUpdate, onClearAll, onLock }: Props & { onLock: () => void }) {
  const [filter, setFilter] = useState<Filter>('pendiente');
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [decideError, setDecideError] = useState<string>();

  const count = (s: ReservationStatus) => reservations.filter((r) => r.status === s).length;
  const active = reservations.filter((r) => r.status !== 'rechazada');
  const list = [...reservations]
    .filter((r) => filter === 'todas' || r.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = reservations.find((r) => r.id === openId) ?? null;

  const show = (r: Reservation) => {
    setNote(r.driverNote ?? '');
    setDecideError(undefined);
    setOpenId(r.id);
  };

  const decide = async (status: ReservationStatus) => {
    if (!open) return;
    const ok = await onUpdate(open.id, status, note.trim() || undefined);
    if (!ok) {
      setDecideError(`El asiento ${open.seat} ya fue tomado por otra reserva.`);
      return;
    }
    setOpenId(null);
  };

  return (
    <View>
      <View style={styles.stats}>
        <Stat label="Pendientes" value={count('pendiente')} color={statusColor.pendiente} />
        <Stat label="Validadas" value={count('validada')} color={statusColor.validada} />
        <Stat label="Libres" value={7 - active.length} color={colors.primary} />
      </View>

      <Card title="Ocupación de la van" subtitle="Toca un asiento ocupado para ver su reserva.">
        <VanSeatMap
          getSeatState={(s) => {
            const r = active.find((x) => x.seat === s);
            return !r ? 'libre' : r.status === 'validada' ? 'validado' : 'pendiente';
          }}
          pressableStates={['pendiente', 'validado']}
          onSeatPress={(s) => {
            const r = active.find((x) => x.seat === s);
            if (r) show(r);
          }}
          legend={[
            { state: 'libre', label: 'Libre' },
            { state: 'pendiente', label: 'Por validar' },
            { state: 'validado', label: 'Validado' },
          ]}
        />
      </Card>

      <Card title="Solicitudes de reserva">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'pendiente', label: 'Pendientes' },
            { value: 'validada', label: 'Validadas' },
            { value: 'rechazada', label: 'Rechazadas' },
            { value: 'todas', label: 'Todas' },
          ]}
        />
        <View style={{ marginTop: 12, gap: 8 }}>
          {list.length === 0 ? <Text style={styles.empty}>No hay solicitudes en esta vista.</Text> : null}
          {list.map((r) => (
            <Pressable key={r.id} onPress={() => show(r)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <View style={styles.seatBadge}>
                <Text style={styles.seatBadgeText}>{r.seat}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{r.fullName}</Text>
                <Text style={styles.rowSub}>
                  {r.origin} → {r.destination}
                  {r.needsReturn ? ' · con retorno' : ''}
                </Text>
                <Text style={styles.rowSub}>
                  {r.code} · {new Date(r.createdAt).toLocaleString('es-PE')}
                </Text>
              </View>
              <Text style={[styles.status, { color: statusColor[r.status], borderColor: statusColor[r.status] }]}>
                {statusLabel[r.status]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Cerrar sesión" variant="secondary" onPress={onLock} style={{ flex: 1 }} />
        <Button title="Reiniciar viaje" variant="danger" onPress={() => setConfirmClear(true)} style={{ flex: 1 }} />
      </View>

      <Dialog visible={!!open} title={open ? `Reserva ${open.code}` : ''} onClose={() => setOpenId(null)}>
        {open ? (
          <ScrollView style={{ maxHeight: 520 }}>
            <Text style={[styles.status, styles.statusLarge, { color: statusColor[open.status], borderColor: statusColor[open.status] }]}>
              {statusLabel[open.status]}
            </Text>
            <Info label="Pasajero" value={open.fullName} />
            <Info label="DNI" value={open.dni} />
            <Info label="Edad" value={`${open.age} años`} />
            <Info label="Origen / recojo" value={open.origin} />
            <Info label="Destino" value={open.destination} />
            <Info label="Retorno" value={open.needsReturn ? 'Sí' : 'No'} />
            <Info label="Asiento" value={String(open.seat)} />
            <Text style={styles.infoLabel}>Comprobante de pago</Text>
            <ReceiptPreview receipt={open.receipt} height={220} />
            <View style={{ height: 12 }} />
            <Field label="Nota para el registro (opcional)" placeholder="Ej. Monto no coincide" value={note} onChangeText={setNote} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Rechazar" variant="danger" onPress={() => decide('rechazada')} style={{ flex: 1 }} disabled={open.status === 'rechazada'} />
              <Button title="Validar" variant="success" onPress={() => decide('validada')} style={{ flex: 1 }} disabled={open.status === 'validada'} />
            </View>
            {decideError ? <Text style={[styles.hint, { color: colors.danger }]}>{decideError}</Text> : null}
            {open.status === 'rechazada' ? (
              <Text style={styles.hint}>El asiento quedó libre. Validarla de nuevo solo es posible si sigue libre.</Text>
            ) : null}
            <Button title="Cerrar" variant="secondary" onPress={() => setOpenId(null)} style={{ marginTop: 10 }} />
          </ScrollView>
        ) : null}
      </Dialog>

      <Dialog visible={confirmClear} title="¿Reiniciar el viaje?" onClose={() => setConfirmClear(false)}>
        <Text style={styles.hint}>Se borrarán todas las reservas guardadas en este dispositivo y los 7 asientos quedarán libres.</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Button title="Cancelar" variant="secondary" onPress={() => setConfirmClear(false)} style={{ flex: 1 }} />
          <Button
            title="Borrar todo"
            variant="danger"
            style={{ flex: 1 }}
            onPress={async () => {
              await onClearAll();
              setConfirmClear(false);
            }}
          />
        </View>
      </Dialog>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.muted },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFCFD',
  },
  seatBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.seatFree,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBadgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  status: {
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  statusLarge: { alignSelf: 'flex-start', marginBottom: 10, fontSize: 13 },
  info: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F1F3' },
  infoLabel: { fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 6 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right', marginTop: 6 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 },
});
