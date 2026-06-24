/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TreeInventory, PlantingLocation } from "../types";
import { Search, Filter, Download, Eye, Trash2, Calendar, FileSpreadsheet, MapPin, Sparkles, Heart } from "lucide-react";

interface DatabaseExplorerProps {
  trees: TreeInventory[];
  onSelectTree: (tree: TreeInventory) => void;
  onDeleteTree: (id: string) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export default function DatabaseExplorer({ trees, onSelectTree, onDeleteTree, onExportCSV, onExportJSON }: DatabaseExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [selectedTreeDetails, setSelectedTreeDetails] = useState<TreeInventory | null>(null);

  // Filter local listings
  const filteredTrees = trees.filter(tree => {
    const matchesSearch = 
      tree.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.referencePoint || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = filterLocation === "all" || tree.plantingLocation === filterLocation;
    const matchesUrgency = filterUrgency === "all" || tree.intervention === filterUrgency;

    return matchesSearch && matchesLocation && matchesUrgency;
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-[#212C1B]">
      
      {/* Editorial Header */}
      <div className="border-b border-[#212C1B]/5 pb-3">
        <h2 className="font-serif text-lg font-bold text-[#212C1B] flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-[#657F38]" /> Acervo Arbóreo Urbano
        </h2>
        <p className="font-sans text-[11px] text-[#212C1B]/60 mt-0.5">
          Visualizando {filteredTrees.length} de {trees.length} exemplares mapeados em Andradas.
        </p>
      </div>

      {/* 💾 COMPACT PORTRAIT FILTERS PANEL */}
      <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#657F38]/10 flex flex-col gap-3 shadow-inner">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por espécie ou rua..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#212C1B]/5 focus:ring-2 focus:ring-[#657F38] font-sans text-xs text-[#212C1B] placeholder:text-[#212C1B]/40 shadow-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#212C1B]/40"  strokeWidth={1.5}/>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Location Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#212C1B]/50 px-1">Local</span>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#212C1B]/5 font-sans text-xs text-[#212C1B] focus:ring-2 focus:ring-[#657F38] shadow-sm font-semibold"
            >
              <option value="all">Todos</option>
              <option value="Calçada">Calçada</option>
              <option value="Praça/Parque">Praça/Parque</option>
              <option value="Canteiro Central">Canteiro</option>
              <option value="Propriedade Privada">Privado</option>
              <option value="Área Verde/Mata">Área Verde</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#212C1B]/50 px-1">Urgência</span>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#212C1B]/5 font-sans text-xs text-[#212C1B] focus:ring-2 focus:ring-[#657F38] shadow-sm font-semibold"
            >
              <option value="all">Todas</option>
              <option value="Nenhuma">Nenhuma</option>
              <option value="Poda de Limpeza">Limpeza</option>
              <option value="Poda de Adequação">Adequação</option>
              <option value="Risco de Queda (Urgente)">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📋 MOBILE LIST OF TREES */}
      {filteredTrees.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center border border-dashed border-[#212C1B]/10 font-sans text-xs text-[#212C1B]/50">
          Nenhum exemplar corresponde aos filtros de busca.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredTrees.map((tree) => {
            let urgencyStyle = "bg-[#657F38]/10 text-[#657F38]";
            if (tree.intervention === "Risco de Queda (Urgente)") urgencyStyle = "bg-[#D57640]/10 text-[#D57640]";
            else if (tree.intervention === "Poda de Adequação") urgencyStyle = "bg-amber-100 text-amber-800";

            return (
              <div 
                key={tree.id}
                className="bg-white rounded-2xl p-4 border border-[#657F38]/10 shadow-organic-sm flex flex-col gap-3.5 hover:shadow-organic-md transition-all relative overflow-hidden"
              >
                {/* Visual flower accent for native trees */}
                {tree.plantType.includes("Nativa") && (
                  <div className="absolute right-[-10px] top-[-10px] w-12 h-12 text-[#9EAB57]/10 pointer-events-none">
                    <Heart className="w-full h-full transform rotate-45 fill-current" />
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-organic-leaf-1 overflow-hidden bg-[#ECE7DC]/50 flex-shrink-0 border border-[#212C1B]/5">
                    {tree.photos.tree ? (
                      <img 
                        src={tree.photos.tree} 
                        alt={tree.species} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#657F38] bg-[#657F38]/10 font-serif font-bold text-base">
                        {tree.species.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 bg-[#657F38]/10 text-[#657F38] rounded-full text-[8px] font-bold uppercase tracking-wider">
                        {tree.plantType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${urgencyStyle}`}>
                        {tree.intervention === "Risco de Queda (Urgente)" ? "Crítico" : tree.intervention}
                      </span>
                    </div>
                    <h3 className="font-serif text-sm text-[#212C1B] font-bold truncate">
                      {tree.species}
                    </h3>
                    <p className="text-[10px] text-[#212C1B]/60 font-sans truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#212C1B]/40"  strokeWidth={1.5}/>
                      {tree.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#212C1B]/5 pt-3">
                  <div className="flex items-center gap-1 text-[9px] font-sans text-[#212C1B]/40">
                    <Calendar className="w-3 h-3" />
                    Mês ideal: <span className="font-bold text-[#657F38]">{tree.suggestedMonth}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSelectedTreeDetails(tree)}
                      className="px-3.5 py-1.5 bg-[#FAF7F0] hover:bg-[#ECE7DC] text-[#657F38] rounded-full font-sans text-[10px] font-bold border border-[#657F38]/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3"  strokeWidth={1.5}/> Ver Ficha
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a vistoria de ${tree.species} em ${tree.address}?`)) {
                          onDeleteTree(tree.id);
                        }
                      }}
                      className="p-1.5 border border-[#D57640]/20 hover:bg-[#D57640]/5 text-[#D57640] rounded-full flex items-center justify-center cursor-pointer transition-all"
                      title="Excluir Vistoria"
                    >
                      <Trash2 className="w-3.5 h-3.5"  strokeWidth={1.5}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📑 ACTIONS EXPORT ROW */}
      <div className="grid grid-cols-2 gap-2 border-t border-[#212C1B]/10 pt-4">
        <button
          onClick={onExportCSV}
          className="px-3 py-2 bg-[#657F38] hover:bg-[#4d6622] text-white rounded-full font-sans text-[10px] font-bold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Planilha Excel (CSV)
        </button>
        <button
          onClick={onExportJSON}
          className="px-3 py-2 border border-[#657F38]/30 hover:bg-[#657F38]/5 text-[#657F38] rounded-full font-sans text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Backup Local (JSON)
        </button>
      </div>

      {/* FLOATING DETAILED PANEL FOR INDIVIDUAL TREES */}
      {selectedTreeDetails && (
        <div className="fixed inset-0 bg-[#212C1B]/60 backdrop-blur-sm z-50 flex items-end justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-md max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5 shadow-2xl relative border-t-4 border-[#657F38] animate-scale-up">
            
            <button
              onClick={() => setSelectedTreeDetails(null)}
              className="absolute right-5 top-5 text-[#212C1B]/40 hover:text-[#212C1B] font-bold text-xs cursor-pointer bg-[#FAF7F0] px-3 py-1.5 rounded-full border border-[#212C1B]/5 shadow-organic-sm"
            >
              ✕ Fechar
            </button>

            <div className="mt-2">
              <span className="px-2.5 py-0.5 bg-[#657F38]/10 text-[#657F38] rounded-full text-[9px] font-bold uppercase tracking-wider">
                {selectedTreeDetails.plantType} • {selectedTreeDetails.plantingLocation}
              </span>
              <h2 className="font-serif text-xl text-[#212C1B] font-bold mt-2">
                {selectedTreeDetails.species}
              </h2>
              <p className="font-sans text-[10px] text-[#212C1B]/60 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#657F38]"  strokeWidth={1.5}/> {selectedTreeDetails.address}
              </p>
            </div>

            {/* Photos Carousel Grid */}
            <div className="flex flex-col gap-2">
              <h4 className="font-serif text-xs font-bold text-[#212C1B]/80 px-1">Registros Fotográficos</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { slot: "tree", label: "Árvore" },
                  { slot: "trunk", label: "Tronco" },
                  { slot: "leaf", label: "Folha" },
                  { slot: "flowerFruit", label: "Flora" },
                  { slot: "damage", label: "Dano" }
                ].map((ph) => {
                  const img = selectedTreeDetails.photos[ph.slot as keyof typeof selectedTreeDetails.photos];
                  return (
                    <div key={ph.slot} className="aspect-square bg-[#FAF7F0] rounded-xl overflow-hidden border border-[#212C1B]/5 relative flex items-center justify-center text-center">
                      {img ? (
                        <img src={img} alt={ph.label} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-sans text-[8px] text-[#212C1B]/40 italic">Sem foto</span>
                      )}
                      <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[7px] py-0.5 rounded font-bold font-sans">
                        {ph.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#657F38]/10 text-xs">
                <span className="text-[#212C1B]/50 block font-bold text-[8px] uppercase">Altura</span>
                <span className="font-bold text-[#212C1B] text-sm">{selectedTreeDetails.height}</span>
              </div>
              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#657F38]/10 text-xs">
                <span className="text-[#212C1B]/50 block font-bold text-[8px] uppercase">Tronco (Diâmetro)</span>
                <span className="font-bold text-[#212C1B] text-sm">{selectedTreeDetails.girth}</span>
              </div>
            </div>

            {/* Health Checklist Overview */}
            <div className="border-t border-[#212C1B]/10 pt-4 flex flex-col gap-2">
              <h4 className="font-serif text-xs font-bold text-[#212C1B]/80 px-1">Checklist Sanitário</h4>
              <div className="flex flex-col gap-1.5 text-[11px] font-sans">
                {Object.entries(selectedTreeDetails.healthCheck)
                  .filter(([_, value]) => value === true)
                  .map(([key]) => {
                    let text = key;
                    if (key === "trunkInclined") text = "Inclinação acentuada / Risco mecânico";
                    if (key === "trunkCracks") text = "Fendas / Ocos estruturais profundos";
                    if (key === "trunkFungi") text = "Presença de basidiomicetos / cogumelos";
                    if (key === "trunkPests") text = "Infestação de cupins / formigas";
                    if (key === "trunkBorer") text = "Presença ativa de brocas";
                    if (key === "canopyDry") text = "Galhada seca / Definhamento foliar";
                    if (key === "canopyBroken") text = "Galhos suspensos com risco de queda";
                    if (key === "canopyParasite") text = "Infestação de erva-de-passarinho";
                    if (key === "rootsDamage") text = "Surgimento de raízes rompendo piso";
                    if (key === "rootsStrangling") text = "Anelamento radicular prejudicial";

                    return (
                      <div key={key} className="flex items-center gap-2 bg-[#D57640]/5 text-[#D57640] px-3 py-2 rounded-xl border border-[#D57640]/15">
                        <span className="w-1.5 h-1.5 bg-[#D57640] rounded-full flex-shrink-0 animate-ping" />
                        <span className="font-semibold">{text}</span>
                      </div>
                    );
                  })}
                {Object.values(selectedTreeDetails.healthCheck).every(v => !v) && (
                  <div className="text-center py-2 text-[#657F38] font-bold bg-[#657F38]/5 rounded-xl border border-[#657F38]/10 text-xs">
                    ✓ Exemplar saudável, sem anomalias registradas!
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col gap-2 border-t border-[#212C1B]/5 pt-4">
              <button
                onClick={() => {
                  setSelectedTreeDetails(null);
                  const btn = document.getElementById("tab-button-laudo");
                  if (btn) btn.click();
                  setTimeout(() => {
                    const sel = document.getElementById("report-tree-selector") as HTMLSelectElement;
                    if (sel) {
                      sel.value = selectedTreeDetails.id;
                      sel.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }, 200);
                }}
                className="w-full py-2.5 bg-[#D57640] hover:bg-[#ba5e2a] text-white rounded-full font-sans text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5"  strokeWidth={1.5}/> Gerar Laudo Técnico IA (Gemini)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
