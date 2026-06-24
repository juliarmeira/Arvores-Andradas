/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TreeInventory } from "./types";

export interface SpeciesItem {
  popular: string;
  scientific: string;
  origin: "Nativa" | "Exótica";
  description: string;
}

export const SPECIES_DIRECTORY: SpeciesItem[] = [
  {
    popular: "Ipê Amarelo",
    scientific: "Handroanthus albus",
    origin: "Nativa",
    description: "Árvore símbolo do Brasil, com florada amarela espetacular entre agosto e setembro. Altamente resistente.",
  },
  {
    popular: "Quaresmeira",
    scientific: "Pleroma granulosum",
    origin: "Nativa",
    description: "Famosa pelas flores roxo-violáceas abundante. Porte médio ideal para calçadas sob fiação elétrica.",
  },
  {
    popular: "Sibipiruna",
    scientific: "Caesalpinia peltophoroides",
    origin: "Nativa",
    description: "Copa ampla e arredondada com flores amarelas. Muito comum na arborização de avenidas e praças.",
  },
  {
    popular: "Jacarandá Mimoso",
    scientific: "Jacaranda mimosifolia",
    origin: "Nativa",
    description: "Folhagem plumosa e flores azul-violeta. Excelente para sombreamento em praças públicas.",
  },
  {
    popular: "Manacá-da-Serra",
    scientific: "Brunfelsia uniflora",
    origin: "Nativa",
    description: "Flores mudam de cor (branco para roxo). Excelente porte pequeno para calçadas estreitas.",
  },
  {
    popular: "Ipê Roxo",
    scientific: "Handroanthus heptaphyllus",
    origin: "Nativa",
    description: "Porte grande, floração exuberante roxa no inverno. Raízes profundas e seguras para calçadas largas.",
  },
  {
    popular: "Oiti",
    scientific: "Licania tomentosa",
    origin: "Nativa",
    description: "Folhagem densa e perene que proporciona sombra excelente. Porte médio-grande muito rústico.",
  },
  {
    popular: "Aroeira Salsa",
    scientific: "Schinus molle",
    origin: "Nativa",
    description: "Folhas finas pendentes e frutos vermelhos ornamentais. Extremamente resistente à seca.",
  },
  {
    popular: "Pitangueira",
    scientific: "Eugenia uniflora",
    origin: "Nativa",
    description: "Frutífera de pequeno porte, atrai avifauna urbana. Folhas aromáticas verde-brilhantes.",
  },
  {
    popular: "Pau-Brasil",
    scientific: "Paubrasilia echinata",
    origin: "Nativa",
    description: "Árvore histórica nacional. Porte médio-grande, flores amarelas perfumadas e tronco espinhoso característico.",
  },
];

// Seeded real records in Andradas, Minas Gerais (coords near -22.0682, -46.5694)
export const PRE_SEEDED_TREES: TreeInventory[] = [
  {
    id: "tree-1",
    coordinates: { lat: -22.0664, lng: -46.5682 }, // Praça Dr. Alcides Mosconi
    address: "Praça Dr. Alcides Mosconi, Centro, Andradas - MG",
    referencePoint: "Em frente à Igreja Matriz",
    plantingLocation: "Praça/Parque",
    species: "Jacarandá Mimoso",
    certainty: "Tenho certeza",
    plantType: "Árvore Nativa",
    photos: {
      tree: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=600",
      trunk: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600",
      leaf: null,
      flowerFruit: null,
      damage: null,
    },
    height: "Grande",
    girth: "Grosso",
    healthCheck: {
      trunkInclined: false,
      trunkCracks: false,
      trunkFungi: false,
      trunkPests: false,
      trunkBorer: false,
      canopyDry: true, // Needs cleaning
      canopyBroken: false,
      canopyParasite: true, // Parasite weed present
      rootsDamage: false,
      rootsStrangling: false,
    },
    urbanInterferences: {
      powerGrid: false,
      signaling: false,
      wallsTelhados: false,
      accessibility: false,
    },
    intervention: "Poda de Limpeza",
    suggestedMonth: "Julho",
    lastPruningDate: "2024-05-15",
    pruningHistory: "Poda de manutenção realizada em 2024. Presença de erva-de-passarinho identificada.",
    finalObservations: "Árvore histórica muito querida pela população local. Necessita retirada cuidadosa das parasitas para evitar enfraquecimento.",
    createdAt: "2026-05-12T14:30:00.000Z",
    technicianName: "Eng. Júlia Reis Meira",
  },
  {
    id: "tree-2",
    coordinates: { lat: -22.0691, lng: -46.5714 }, // Praça 22 de Fevereiro
    address: "Praça 22 de Fevereiro, Centro, Andradas - MG",
    referencePoint: "Próximo à área de playground infantil",
    plantingLocation: "Praça/Parque",
    species: "Ipê Amarelo",
    certainty: "Tenho certeza",
    plantType: "Árvore Nativa",
    photos: {
      tree: "https://images.unsplash.com/photo-1601574901173-cf3a2670f894?auto=format&fit=crop&q=80&w=600",
      trunk: null,
      leaf: null,
      flowerFruit: null,
      damage: null,
    },
    height: "Médio",
    girth: "Médio",
    healthCheck: {
      trunkInclined: true, // leaning
      trunkCracks: true, // deep holes
      trunkFungi: false,
      trunkPests: false,
      trunkBorer: false,
      canopyDry: false,
      canopyBroken: true, // hanging branch
      canopyParasite: false,
      rootsDamage: false,
      rootsStrangling: false,
    },
    urbanInterferences: {
      powerGrid: true, // electrical interference
      signaling: true, // blocks light
      wallsTelhados: false,
      accessibility: false,
    },
    intervention: "Risco de Queda (Urgente)",
    suggestedMonth: "Junho",
    lastPruningDate: "2023-11-20",
    pruningHistory: "Histórico de podas drásticas sucessivas. Visível enfraquecimento do colo e bifurcação comprometida.",
    finalObservations: "Árvore apresenta inclinação de 25 graus voltada para o parquinho das crianças. Requer escoramento imediato ou laudo para supressão controlada e substituição.",
    createdAt: "2026-06-18T10:15:00.000Z",
    technicianName: "Eng. Júlia Reis Meira",
  },
  {
    id: "tree-3",
    coordinates: { lat: -22.0715, lng: -46.5705 }, // Calçada comercial
    address: "Rua Coronel Oliveira, 380, Centro, Andradas - MG",
    referencePoint: "Ao lado da Farmácia Central",
    plantingLocation: "Calçada",
    species: "Sibipiruna",
    certainty: "É apenas um palpite",
    plantType: "Árvore Nativa",
    photos: {
      tree: null,
      trunk: null,
      leaf: null,
      flowerFruit: null,
      damage: null,
    },
    height: "Médio",
    girth: "Médio",
    healthCheck: {
      trunkInclined: false,
      trunkCracks: false,
      trunkFungi: false,
      trunkPests: false,
      trunkBorer: false,
      canopyDry: false,
      canopyBroken: false,
      canopyParasite: false,
      rootsDamage: true, // damaging pavement
      rootsStrangling: false,
    },
    urbanInterferences: {
      powerGrid: true,
      signaling: false,
      wallsTelhados: true,
      accessibility: true, // blocking sidewalk
    },
    intervention: "Poda de Adequação",
    suggestedMonth: "Agosto",
    lastPruningDate: "2025-01-10",
    pruningHistory: "Poda realizada de forma inadequada por terceiros (fiação comercial).",
    finalObservations: "Raízes superficiais estão levantando as lajotas da calçada, criando risco de tropeço para pedestres. Necessário adequação do calçamento com calçada ecológica ao redor da base.",
    createdAt: "2026-06-20T16:45:00.000Z",
    technicianName: "Fisc. Silva Júnior",
  }
];
