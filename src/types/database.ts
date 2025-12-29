export interface Provincia {
  id: number;
  nombre_provincia: string;
  capital_provincia: string;
  region: 'Costa' | 'Sierra' | 'Oriente' | 'Insular';
}

export interface Ciudad {
  id: number;
  provincia_id: number;
  nombre_ciudad: string;
}

export interface Terminal {
  id: number;
  ciudad_id: number;
  nombre_terminal: string;
  direccion: string;
}