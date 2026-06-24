/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MapPin, Search, Plus, Navigation, Filter, Info, AlertTriangle, Eye } from "lucide-react";
import { TreeInventory } from "../types";

interface InteractiveMapProps {
  trees: TreeInventory[];
  onSelectTree: (tree: TreeInventory) => void;
  onStartSurveyAtCoords?: (lat: number, lng: number) => void;
}

export default function InteractiveMap({ trees, onSelectTree, onStartSurveyAtCoords }: InteractiveMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [selectedPin, setSelectedPin] = useState<TreeInventory | null>(null);

  // Center coordinates of Andradas for our local map projection
  const centerLat = -22.0682;
  const centerLng = -46.5694;

  // Projection helper: map real lat/lng to a 600x400 canvas coordinate
  const projectCoords = (lat: number, lng: number) => {
    // scale factor to zoom in on Andradas
    const scaleX = 8000; 
    const scaleY = -8000; // negative because screen y goes down
    const x = 300 + (lng - centerLng) * scaleX;
    const y = 200 + (lat - centerLat) * scaleY;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get current geolocation using browser API
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (onStartSurveyAtCoords) {
            onStartSurveyAtCoords(latitude, longitude);
          }
        },
        (error) => {
          alert("Não foi possível capturar o GPS automaticamente: " + error.message + ". Usando coordenadas padrão de Andradas.");
          if (onStartSurveyAtCoords) {
            onStartSurveyAtCoords(-22.0682, -46.5694);
          }
        }
      );
    } else {
      alert("Geolocalização não é suportada por este navegador.");
    }
  };

  // Filter trees based on search and urgency selection
  const filteredTrees = trees.filter(tree => {
    const matchesSearch = tree.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tree.species.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = filterUrgency === "all" || tree.intervention === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[750px] bg-cream/30 rounded-xl overflow-hidden border border-shadow-brand/5 neumorphic-raised">
      {/* Map Control Bar */}
      <div className="p-4 bg-cream/75 backdrop-blur-md border-b border-shadow-brand/5 flex flex-col md:flex-row gap-3 items-center justify-between z-10">
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-2.5 text-shadow-brand/40">
            <Search className="w-5 h-5"  strokeWidth={1.5}/>
          </span>
          <input
            type="text"
            placeholder="Buscar por rua ou espécie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/60 border-none focus:ring-2 focus:ring-palm rounded-full font-sans text-sm text-shadow-brand placeholder:text-shadow-brand/40 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full text-xs shadow-inner">
            <Filter className="w-3.5 h-3.5 text-palm" />
            <span className="font-sans text-shadow-brand/60 font-medium">Urgência:</span>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-transparent border-none text-shadow-brand font-bold focus:ring-0 p-0 text-xs"
            >
              <option value="all">Todas</option>
              <option value="Nenhuma">Nenhuma</option>
              <option value="Poda de Limpeza">Limpeza</option>
              <option value="Poda de Adequação">Adequação</option>
              <option value="Risco de Queda (Urgente)">Crítico/Queda</option>
            </select>
          </div>

          <button
            onClick={handleGetLocation}
            className="flex items-center gap-2 px-4 py-2 bg-palm hover:bg-palm-dark text-white rounded-full font-sans text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 animate-pulse"  strokeWidth={1.5}/>
            Vistoriar no Meu GPS
          </button>
        </div>
      </div>

      {/* Styled Vector Canvas Map */}
      <div 
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-cream-dark"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG Base Map representing Andradas major avenues */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-40 transition-transform duration-100"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center"
          }}
        >
          {/* Main Roads of Andradas */}
          <line x1="100" y1="50" x2="700" y2="350" stroke="#b2c2a2" strokeWidth="24" strokeLinecap="round" /> {/* Av. Ricarti Teixeira */}
          <line x1="300" y1="50" x2="300" y2="450" stroke="#b2c2a2" strokeWidth="16" strokeLinecap="round" /> {/* Rua Coronel Oliveira */}
          <line x1="50" y1="200" x2="750" y2="200" stroke="#b2c2a2" strokeWidth="20" strokeLinecap="round" /> {/* Major arterial street */}
          
          {/* Public parks as green squares */}
          <rect x="260" y="160" width="80" height="80" rx="10" fill="#a8c190" /> {/* Praça Dr. Alcides Mosconi */}
          <rect x="420" y="240" width="100" height="70" rx="10" fill="#a8c190" /> {/* Praça 22 de Fevereiro */}

          {/* Waterway (Ribeirão Andradas) */}
          <path d="M 0,380 Q 200,320 400,380 T 800,330" fill="none" stroke="#90b8c4" strokeWidth="12" strokeLinecap="round" />
        </svg>

        {/* Dynamic Pins placed on the map */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center"
          }}
        >
          {filteredTrees.map(tree => {
            const { x, y } = projectCoords(tree.coordinates.lat, tree.coordinates.lng);
            const isSelected = selectedPin?.id === tree.id;
            
            // Urgency color helper
            let pinColor = "bg-palm text-white";
            if (tree.intervention === "Risco de Queda (Urgente)") {
              pinColor = "bg-terracotta text-white animate-bounce";
            } else if (tree.intervention === "Poda de Adequação") {
              pinColor = "bg-amber-600 text-white";
            } else if (tree.intervention === "Poda de Limpeza") {
              pinColor = "bg-leaf text-white";
            }

            return (
              <button
                key={tree.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(tree);
                }}
                className={`absolute p-2 rounded-full shadow-lg pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${pinColor} ${isSelected ? "ring-4 ring-offset-2 ring-palm scale-125 z-30" : "hover:scale-110 z-20"}`}
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                {tree.intervention === "Risco de Queda (Urgente)" ? (
                  <AlertTriangle className="w-4 h-4"  strokeWidth={1.5}/>
                ) : (
                  <MapPin className="w-4 h-4"  strokeWidth={1.5}/>
                )}
              </button>
            );
          })}
        </div>

        {/* Visual Map Grid Controls */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center font-bold text-shadow-brand shadow-md hover:bg-white cursor-pointer active:scale-95"
          >
            +
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center font-bold text-shadow-brand shadow-md hover:bg-white cursor-pointer active:scale-95"
          >
            -
          </button>
          <button 
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-xs font-semibold text-shadow-brand shadow-md hover:bg-white cursor-pointer active:scale-95"
          >
            Reset
          </button>
        </div>

        {/* Double-click hint */}
        <div className="absolute left-4 bottom-4 bg-shadow-brand/70 px-3 py-1.5 rounded-full text-[11px] font-sans text-white/90 pointer-events-none">
          Dica: Clique em qualquer ponto do mapa para selecionar coordenadas.
        </div>

        {/* Interactive Click-to-Register Selector */}
        <div 
          className="absolute inset-0 z-0"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left - pan.x;
            const clickY = e.clientY - rect.top - pan.y;
            
            // Inverse project coords to lat/lng
            const scaleX = 8000;
            const scaleY = -8000;
            const clickedLng = centerLng + (clickX - 300) / scaleX;
            const clickedLat = centerLat + (clickY - 200) / scaleY;

            if (onStartSurveyAtCoords) {
              if (window.confirm(`Deseja iniciar um novo inventário florestal nesta coordenada aproximada?\n\nLat: ${clickedLat.toFixed(5)}\nLng: ${clickedLng.toFixed(5)}`)) {
                onStartSurveyAtCoords(clickedLat, clickedLng);
              }
            }
          }}
        />

        {/* Floating Detail Card for Selected Pin */}
        {selectedPin && (
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 bg-white rounded-2xl p-4 shadow-xl border border-shadow-brand/5 flex flex-col gap-3 z-20 animate-fade-in animate-duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 bg-palm/10 text-palm rounded-full text-[10px] font-semibold uppercase tracking-wider">
                  {selectedPin.plantType}
                </span>
                <h3 className="font-serif text-lg text-shadow-brand font-bold mt-1">
                  {selectedPin.species}
                </h3>
                <p className="text-xs text-shadow-brand/60 font-sans">
                  {selectedPin.address}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPin(null)}
                className="text-shadow-brand/30 hover:text-shadow-brand/60 p-1 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 py-1 text-xs font-sans">
              <div className="bg-cream/40 p-2 rounded-lg">
                <span className="text-shadow-brand/50 block text-[10px]">Urgência de Poda</span>
                <span className={`font-semibold ${selectedPin.intervention === "Risco de Queda (Urgente)" ? "text-terracotta" : "text-shadow-brand"}`}>
                  {selectedPin.intervention}
                </span>
              </div>
              <div className="bg-cream/40 p-2 rounded-lg">
                <span className="text-shadow-brand/50 block text-[10px]">Copa / Altura</span>
                <span className="font-semibold text-shadow-brand">
                  {selectedPin.height}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSelectTree(selectedPin);
                  setSelectedPin(null);
                }}
                className="flex-1 py-2 bg-palm hover:bg-palm-dark text-white rounded-full font-sans text-xs font-bold text-center shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5"  strokeWidth={1.5}/>
                Ver Ficha Completa
              </button>
              <button
                onClick={() => {
                  setSelectedPin(null);
                  // Trigger direct navigation to AI reporter for this tree
                  const reportTabButton = document.getElementById("tab-button-laudo");
                  if (reportTabButton) {
                    reportTabButton.click();
                    // Set selected tree for report
                    const select = document.getElementById("report-tree-selector") as HTMLSelectElement;
                    if (select) {
                      select.value = selectedPin.id;
                      select.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }
                }}
                className="px-3 py-2 border border-palm/20 hover:bg-palm/5 text-palm rounded-full font-sans text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                title="Gerar Laudo Técnico por IA"
              >
                Laudo IA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
