export type ReservationStatus = 'pendiente' | 'validada' | 'rechazada';

export type Receipt = {
  name: string;
  uri: string;
  mimeType?: string;
};

export type Reservation = {
  id: string;
  code: string;
  createdAt: string;
  fullName: string;
  dni: string;
  age: number;
  origin: string;
  destination: string;
  needsReturn: boolean;
  seat: number;
  receipt: Receipt;
  status: ReservationStatus;
  driverNote?: string;
};
