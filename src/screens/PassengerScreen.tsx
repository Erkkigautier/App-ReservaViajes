import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { pickReceipt, ReceiptPreview } from '../components/Receipt';
import { Button, Card, Dialog, Field, Segmented } from '../components/ui';
import { VanSeatMap } from '../components/VanSeatMap';
import { isSeatTaken } from '../storage';
import { colors } from '../theme';
import { Receipt, Reservation } from '../types';

type Form = {
  fullName: string;
  dni: string;
  age: string;
  origin: string;
  destination: string;
  needsReturn: 'si' | 'no';
};

const emptyForm: Form = { fullName: '', dni: '', age: '', origin: '', destination: '', needsReturn: 'no' };

type Errors = Partial<Record<keyof Form | 'receipt' | 'seat', string>>;

function validate(form: Form, receipt: Receipt | null, seat: number | null): Errors {
  const e: Errors = {};
  if (form.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Ingresa nombres y apellidos.';
  if (!/^\d{8}$/.test(form.dni)) e.dni = 'El DNI debe tener 8 dígitos.';
  const age = Number(form.age);
  if (!Number.isInteger(age) || age < 1 || age > 120) e.age = 'Ingresa una edad válida.';
  if (!form.origin.trim()) e.origin = 'Indica el punto de origen o recojo.';
  if (!form.destination.trim()) e.destination = 'Indica el punto de destino.';
  if (!receipt) e.receipt = 'Adjunta la boleta o factura del pago.';
  if (seat == null) e.seat = 'Selecciona y confirma un asiento.';
  return e;
}

type Props = {
  reservations: Reservation[];
  onCreate: (r: Omit<Reservation, 'id' | 'code' | 'createdAt' | 'status'>) => Promise<Reservation | null>;
};

export function PassengerScreen({ reservations, onCreate }: Props) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [candidate, setCandidate] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Reservation | null>(null);
  const [conflict, setConflict] = useState(false);

  const clearError = (k: keyof Errors) => setErrors(({ [k]: _, ...rest }) => rest);
  const set = (k: keyof Form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    clearError(k);
  };
  const chooseReceipt = async () => {
    const picked = await pickReceipt();
    if (picked) {
      setReceipt(picked);
      clearError('receipt');
    }
  };

  const submit = async () => {
    const e = validate(form, receipt, seat);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const result = await onCreate({
      fullName: form.fullName.trim(),
      dni: form.dni,
      age: Number(form.age),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      needsReturn: form.needsReturn === 'si',
      seat: seat!,
      receipt: receipt!,
    });
    setSaving(false);
    if (!result) {
      setSeat(null);
      setConflict(true);
      return;
    }
    setCreated(result);
  };

  const reset = () => {
    setCreated(null);
    setForm(emptyForm);
    setReceipt(null);
    setSeat(null);
    setErrors({});
  };

  const freeCount = [1, 2, 3, 4, 5, 6, 7].filter((s) => !isSeatTaken(reservations, s)).length;

  return (
    <View>
      <Card title="1. Datos del pasajero" subtitle="Completa tus datos y adjunta el comprobante de pago.">
        <Field
          label="Nombres completos"
          placeholder="Ej. María López Quispe"
          value={form.fullName}
          onChangeText={set('fullName')}
          error={errors.fullName}
        />
        <View style={styles.twoCols}>
          <View style={{ flex: 2 }}>
            <Field
              label="DNI"
              placeholder="8 dígitos"
              keyboardType="number-pad"
              maxLength={8}
              value={form.dni}
              onChangeText={(v) => set('dni')(v.replace(/\D/g, ''))}
              error={errors.dni}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Edad"
              placeholder="Años"
              keyboardType="number-pad"
              maxLength={3}
              value={form.age}
              onChangeText={(v) => set('age')(v.replace(/\D/g, ''))}
              error={errors.age}
            />
          </View>
        </View>
        <Field
          label="Punto de origen o recojo"
          placeholder="Ej. Plaza de Armas"
          value={form.origin}
          onChangeText={set('origin')}
          error={errors.origin}
        />
        <Field
          label="Punto de destino"
          placeholder="Ej. Terminal Norte"
          value={form.destination}
          onChangeText={set('destination')}
          error={errors.destination}
        />
        <Text style={styles.label}>¿Requiere retorno?</Text>
        <Segmented
          value={form.needsReturn}
          onChange={(v) => setForm((f) => ({ ...f, needsReturn: v }))}
          options={[
            { value: 'no', label: 'No' },
            { value: 'si', label: 'Sí' },
          ]}
        />
        <Text style={[styles.label, { marginTop: 16 }]}>Boleta o factura del pago</Text>
        {receipt ? (
          <View style={{ gap: 8 }}>
            <ReceiptPreview receipt={receipt} />
            <Button title="Cambiar archivo" variant="secondary" onPress={chooseReceipt} />
          </View>
        ) : (
          <Button
            title="Cargar foto o archivo (JPG, PNG, PDF)"
            variant="secondary"
            onPress={chooseReceipt}
          />
        )}
        {errors.receipt ? <Text style={styles.error}>{errors.receipt}</Text> : null}
      </Card>

      <Card
        title="2. Elige tu asiento"
        subtitle={`Toca un asiento libre para seleccionarlo. Quedan ${freeCount} de 7 disponibles.`}
      >
        <VanSeatMap
          getSeatState={(s) => (s === seat ? 'seleccionado' : isSeatTaken(reservations, s) ? 'ocupado' : 'libre')}
          onSeatPress={(s) => {
            setCandidate(s);
            setConfirmOpen(true);
          }}
          legend={[
            { state: 'libre', label: 'Libre' },
            { state: 'seleccionado', label: 'Tu asiento' },
            { state: 'ocupado', label: 'Ocupado' },
          ]}
        />
        <Text style={styles.selected}>
          {seat ? `Asiento seleccionado: ${seat}` : 'Aún no has seleccionado un asiento.'}
        </Text>
        {errors.seat ? <Text style={[styles.error, { textAlign: 'center' }]}>{errors.seat}</Text> : null}
      </Card>

      <Button title={saving ? 'Guardando…' : 'Guardar y reservar'} onPress={submit} disabled={saving} />
      {Object.keys(errors).length ? (
        <Text style={[styles.error, { textAlign: 'center', marginTop: 8 }]}>Revisa los campos marcados.</Text>
      ) : null}

      <Dialog visible={confirmOpen} title={`¿Confirmas el asiento ${candidate}?`} onClose={() => setConfirmOpen(false)}>
        <Text style={styles.dialogText}>
          {seat && seat !== candidate
            ? `Reemplazará tu selección actual (asiento ${seat}).`
            : 'Este asiento quedará asignado a tu reserva al guardar el registro.'}
        </Text>
        <View style={styles.dialogActions}>
          <Button title="Cancelar" variant="secondary" onPress={() => setConfirmOpen(false)} style={{ flex: 1 }} />
          <Button
            title="Confirmar"
            variant="success"
            style={{ flex: 1 }}
            onPress={() => {
              setSeat(candidate);
              clearError('seat');
              setConfirmOpen(false);
            }}
          />
        </View>
      </Dialog>

      <Dialog visible={!!created} title="¡Reserva registrada!" onClose={reset}>
        {created ? (
          <>
            <Text style={styles.code}>{created.code}</Text>
            <Text style={styles.dialogText}>
              Asiento {created.seat} · {created.origin} → {created.destination}
              {created.needsReturn ? ' (con retorno)' : ''}
            </Text>
            <Text style={styles.dialogText}>
              Tu reserva está activa y el conductor validará tu comprobante de pago. Guarda este código.
            </Text>
            <Button title="Hacer otra reserva" onPress={reset} style={{ marginTop: 8 }} />
          </>
        ) : null}
      </Dialog>

      <Dialog visible={conflict} title="Asiento no disponible" onClose={() => setConflict(false)}>
        <Text style={styles.dialogText}>Otra persona acaba de reservar ese asiento. Elige otro, por favor.</Text>
        <Button title="Entendido" onPress={() => setConflict(false)} />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  twoCols: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  selected: { textAlign: 'center', marginTop: 12, fontSize: 15, fontWeight: '600', color: colors.text },
  dialogText: { fontSize: 15, color: colors.muted, marginBottom: 14, lineHeight: 21 },
  dialogActions: { flexDirection: 'row', gap: 10 },
  code: { fontSize: 28, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 8, letterSpacing: 1 },
});
