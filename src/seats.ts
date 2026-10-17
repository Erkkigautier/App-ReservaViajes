// Distribución de la van vista desde el techo.
// 'D' es el asiento del conductor (no seleccionable); los números son asientos de pasajeros.
export type SeatCell = number | 'D';

export const FRONT_ROW: SeatCell[] = ['D', 1];
export const BACK_ROWS: SeatCell[][] = [
  [2, 3, 4],
  [5, 6, 7],
];

export const PASSENGER_SEATS = [1, 2, 3, 4, 5, 6, 7];
