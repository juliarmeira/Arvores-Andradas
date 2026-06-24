/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlantingLocation = 'Calçada' | 'Praça/Parque' | 'Canteiro Central' | 'Propriedade Privada' | 'Área Verde/Mata';

export type IdentificationCertainty = 'Tenho certeza' | 'É apenas um palpite' | 'Não sei identificar';

export type PlantType = 'Árvore Nativa' | 'Arbusto / Flor';

export type TreeHeight = 'Pequeno' | 'Médio' | 'Grande';

export type TreeGirth = 'Fino' | 'Médio' | 'Grosso';

export type InterventionType = 'Nenhuma' | 'Poda de Limpeza' | 'Poda de Adequação' | 'Risco de Queda (Urgente)';

export interface TreePhotos {
  tree: string | null;        // Base64 or placeholder reference
  trunk: string | null;       // Base64 or placeholder reference
  leaf: string | null;        // Base64 or placeholder reference
  flowerFruit: string | null; // Base64 or placeholder reference
  damage: string | null;      // Base64 or placeholder reference
}

export interface HealthCheck {
  // Tronco e Base
  trunkInclined: boolean;      // Árvore apresenta inclinação acentuada?
  trunkCracks: boolean;        // Presença de rachaduras profundas ou buracos grandes no tronco?
  trunkFungi: boolean;         // Presença de fungos/cogumelos (orelha-de-pau) na madeira?
  trunkPests: boolean;         // Presença de pragas na base (cupins, excesso de formigas)?
  trunkBorer: boolean;         // Sinais de furos no tronco com pó de serra (indicativo de broca)?
  
  // Copa e Galhos
  canopyDry: boolean;          // Presença de galhos secos ou mortos?
  canopyBroken: boolean;       // Presença de galhos grandes quebrados e pendurados?
  canopyParasite: boolean;     // Presença de erva-de-passarinho ou outras plantas parasitas infestando a copa?
  
  // Raízes
  rootsDamage: boolean;        // Raízes danificando gravemente o calçamento ou asfalto?
  rootsStrangling: boolean;    // Raízes estrangulando o próprio tronco?
}

export interface UrbanInterferences {
  powerGrid: boolean;          // Copa em conflito com a rede elétrica?
  signaling: boolean;          // Obstruindo a iluminação pública ou sinalização de trânsito?
  wallsTelhados: boolean;      // Encostando ou danificando muros/telhados de terceiros?
  accessibility: boolean;      // Atrapalhando a acessibilidade de pedestres ou cadeirantes na calçada?
}

export interface TreeInventory {
  id: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  referencePoint: string;
  plantingLocation: PlantingLocation;
  species: string;
  certainty: IdentificationCertainty;
  plantType: PlantType;
  photos: TreePhotos;
  height: TreeHeight;
  girth: TreeGirth;
  healthCheck: HealthCheck;
  urbanInterferences: UrbanInterferences;
  intervention: InterventionType;
  suggestedMonth: string;
  lastPruningDate: string;
  pruningHistory: string;
  finalObservations: string;
  createdAt: string;
  technicianName: string;
}

export interface DashboardStats {
  totalMonitored: number;
  criticalRisks: number;
  vitalityIndex: number;
}
