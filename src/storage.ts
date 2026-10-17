import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reservation } from './types';

// Prototipo: las reservas se guardan solo en este dispositivo/navegador.
const KEY = 'reservaviajes:reservas:v1';

export async function loadReservations(): Promise<Reservation[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Reservation[]) : [];
}

export async function saveReservations(list: Reservation[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export function isSeatTaken(list: Reservation[], seat: number): boolean {
  return list.some((r) => r.seat === seat && r.status !== 'rechazada');
}

export function newReservationCode(): string {
  const n = Math.floor(Math.random() * 36 ** 5).toString(36).toUpperCase().padStart(5, '0');
  return `RV-${n}`;
}
