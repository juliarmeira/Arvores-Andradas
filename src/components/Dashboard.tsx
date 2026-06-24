/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Activity, 
  ArrowRight, 
  FileSpreadsheet, 
  Plus, 
  QrCode, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Trees,
  Leaf,
  Flower,
  Heart
} from "lucide-react";
import { TreeInventory } from "../types";

interface DashboardProps {
  trees: TreeInventory[];
  onStartNewSurvey: () => void;
  onSelectTree: (tree: TreeInventory) => void;
  onNavigateToTab: (tab: string) => void;
  onExportCSV: () => void;
}

export default function Dashboard({ trees, onStartNewSurvey, onSelectTree, onNavigateToTab, onExportCSV }: DashboardProps) {
  // Compute dynamic stats based on local state database
  const totalMonitored = trees.length + 24810; // Seeded database context + our local records
  const criticalCount = trees.filter(t => t.intervention === "Risco de Queda (Urgente)").length + 140;
  
  // Dynamic average vitality
  const localUrgent = trees.filter(t => t.intervention === "Risco de Queda (Urgente)").length;
  const localAdequacy = trees.filter(t => t.intervention === "Poda de Adequação").length;
  const localLimpeza = trees.filter(t => t.intervention === "Poda de Limpeza").length;
  const totalLocal = trees.length;
  
  let vitalityFactor = 94.2; // Base percentage
  if (totalLocal > 0) {
    const penaltyPoints = (localUrgent * 10 + localAdequacy * 4 + localLimpeza * 1) / totalLocal;
    vitalityFactor = Math.max(70, Math.min(99.8, 94.2 - penaltyPoints));
  }

  // Get localized prioritized interventions list (trees requiring urgent care)
  const priorityTrees = trees.filter(
    t => t.intervention === "Risco de Queda (Urgente)" || t.intervention === "Poda de Adequação"
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* 🌸 WARM DESIGNER WELCOME HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-tr from-[#657F38]/10 via-[#9EAB57]/5 to-transparent p-5 rounded-3xl border border-[#657F38]/10 flex flex-col gap-2">
        <div className="absolute right-2 top-2 text-[#9EAB57] opacity-10 pointer-events-none select-none">
          <Leaf className="w-16 h-16 transform rotate-12"  strokeWidth={1.5}/>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#657F38] font-bold bg-[#657F38]/10 px-2.5 py-1 rounded-full">
            Prefeitura de Andradas • MG
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#D57640] font-sans font-bold bg-[#D57640]/10 px-2.5 py-1 rounded-full">
            <Heart className="w-2.5 h-2.5 fill-[#D57640]" /> Meio Ambiente
          </span>
        </div>
        <h1 className="font-serif text-2xl text-[#212C1B] tracking-tight font-bold mt-1">
          Olá, Eng. Júlia Meira
        </h1>
        <p className="font-sans text-xs text-[#212C1B]/70 leading-relaxed max-w-[280px]">
          Seu painel ambiental está atualizado. Vamos mapear, catalogar e proteger nossas espécies hoje?
        </p>
      </section>

      {/* 📊 OPTIMIZED ORGANIC METRICS BENTO GRID */}
      <section className="flex flex-col gap-3.5">
        <h2 className="font-serif text-sm font-bold text-[#212C1B]/80 px-1 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#657F38]"  strokeWidth={1.5}/> Estatísticas de Cobertura
        </h2>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Total Monitored Trees - Leaf Shaped Accent */}
          <div 
            onClick={() => onNavigateToTab("database")}
            className="bg-white p-4 rounded-organic-leaf-1 border border-[#657F38]/10 hover:border-[#657F38]/30 transition-all cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden shadow-organic-sm group"
          >
            <div className="absolute right-[-15px] bottom-[-15px] text-[#657F38]/5 pointer-events-none select-none">
              <Trees className="w-20 h-20"  strokeWidth={1.5}/>
            </div>
            <div className="flex justify-between items-center">
              <span className="p-2.5 bg-[#657F38]/10 text-[#657F38] rounded-full group-hover:bg-[#657F38] group-hover:text-[#FAF7F0] transition-colors">
                <Trees className="w-4 h-4"  strokeWidth={1.5}/>
              </span>
              <span className="text-[8px] uppercase font-sans tracking-wider font-bold text-[#212C1B]/40">
                Total Geral
              </span>
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#212C1B] font-bold leading-none">
                {totalMonitored.toLocaleString("pt-BR")}
              </h3>
              <p className="font-sans text-[10px] text-[#657F38] font-bold mt-1.5 flex items-center gap-1">
                Árvores <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* Critical Risks identified - Terracotta Accent */}
          <div 
            onClick={() => onNavigateToTab("map")}
            className="bg-white p-4 rounded-organic-leaf-2 border border-[#D57640]/10 hover:border-[#D57640]/30 transition-all cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden shadow-organic-sm group"
          >
            <div className="absolute right-[-15px] bottom-[-15px] text-[#D57640]/5 pointer-events-none select-none">
              <ShieldAlert className="w-20 h-20"  strokeWidth={1.5}/>
            </div>
            <div className="flex justify-between items-center">
              <span className="p-2.5 bg-[#D57640]/10 text-[#D57640] rounded-full group-hover:bg-[#D57640] group-hover:text-white transition-colors">
                <ShieldAlert className="w-4 h-4"  strokeWidth={1.5}/>
              </span>
              <span className="text-[8px] uppercase font-sans tracking-wider font-bold text-[#212C1B]/40">
                Riscos Críticos
              </span>
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#D57640] font-bold leading-none">
                {criticalCount}
              </h3>
              <p className="font-sans text-[10px] text-[#D57640] font-bold mt-1.5 flex items-center gap-1">
                Atenção Urgente <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>

        {/* Vitality Index - Large horizontal curved banner */}
        <div className="bg-gradient-to-r from-[#FAF7F0] via-white to-[#FAF7F0] p-4 rounded-3xl border border-[#212C1B]/5 flex items-center justify-between shadow-organic-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#9EAB57]/10 text-[#9EAB57] rounded-full">
              <Activity className="w-5 h-5"  strokeWidth={1.5}/>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#212C1B]/40 block leading-none mb-1">
                Índice de Saúde Florestal
              </span>
              <p className="font-sans text-xs text-[#212C1B]/60 leading-tight">
                Vitalidade coletiva em Andradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-2xl text-[#212C1B] font-bold leading-none">
              {vitalityFactor.toFixed(1)}%
            </span>
            <div className="w-10 h-10 rounded-full border-4 border-[#657F38] border-t-transparent animate-spin flex-shrink-0"></div>
          </div>
        </div>
      </section>

      {/* 🚀 QUICK TOOLS GRID */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-sm font-bold text-[#212C1B]/80 px-1 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#D57640]"  strokeWidth={1.5}/> Ações e Ferramentas Rápidas
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {/* Create new survey */}
          <button 
            onClick={onStartNewSurvey}
            className="bg-white p-3.5 rounded-full flex flex-col items-center gap-2 group transition-all active:scale-95 cursor-pointer border border-[#212C1B]/5 hover:border-[#657F38]/20 shadow-organic-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#657F38]/10 text-[#657F38] flex items-center justify-center group-hover:bg-[#657F38] group-hover:text-white transition-all">
              <Plus className="w-4.5 h-4.5"  strokeWidth={1.5}/>
            </div>
            <span className="font-sans text-[9px] font-bold text-[#212C1B]/80 text-center leading-tight">
              Cadastrar
            </span>
          </button>

          {/* Simulate Tag scanner */}
          <button 
            onClick={() => {
              alert("Iniciando leitor de QR Code/NFC...\n\nO leitor simula a identificação das placas/tags de alumínio físicas fixadas no tronco das árvores catalogadas em Andradas.");
              const randomTree = trees[Math.floor(Math.random() * trees.length)];
              if (randomTree) {
                if (confirm(`Tag lida com sucesso! Placa #AND-${Math.floor(1000 + Math.random() * 9000)} associada a um exemplar de ${randomTree.species}.\n\nDeseja abrir a ficha técnica desta árvore?`)) {
                  onSelectTree(randomTree);
                }
              } else {
                alert("Nenhuma árvore cadastrada para simulação de tag QR Code.");
              }
            }}
            className="bg-white p-3.5 rounded-2xl flex flex-col items-center gap-2 group transition-all active:scale-95 cursor-pointer border border-[#212C1B]/5 hover:border-[#657F38]/20 shadow-organic-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#657F38]/10 text-[#657F38] flex items-center justify-center group-hover:bg-[#657F38] group-hover:text-white transition-all">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <span className="font-sans text-[9px] font-bold text-[#212C1B]/80 text-center leading-tight">
              Placa Física
            </span>
          </button>

          {/* Export to spreadsheet CSV */}
          <button 
            onClick={onExportCSV}
            className="bg-white p-3.5 rounded-full flex flex-col items-center gap-2 group transition-all active:scale-95 cursor-pointer border border-[#212C1B]/5 hover:border-[#657F38]/20 shadow-organic-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#657F38]/10 text-[#657F38] flex items-center justify-center group-hover:bg-[#657F38] group-hover:text-white transition-all">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <span className="font-sans text-[9px] font-bold text-[#212C1B]/80 text-center leading-tight">
              Exportar CSV
            </span>
          </button>

          {/* Open AI helper panel */}
          <button 
            onClick={() => onNavigateToTab("laudo")}
            className="bg-white p-3.5 rounded-2xl flex flex-col items-center gap-2 group transition-all active:scale-95 cursor-pointer border border-[#212C1B]/5 hover:border-[#D57640]/20 shadow-organic-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#D57640]/10 text-[#D57640] flex items-center justify-center group-hover:bg-[#D57640] group-hover:text-white transition-all">
              <Sparkles className="w-4.5 h-4.5"  strokeWidth={1.5}/>
            </div>
            <span className="font-sans text-[9px] font-bold text-[#212C1B]/80 text-center leading-tight">
              Laudo IA
            </span>
          </button>
        </div>
      </section>

      {/* 📋 PRIORITIZED INTERVENTIONS (MOBILE LIST) */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-serif text-sm font-bold text-[#212C1B]/80 flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-[#657F38]"  strokeWidth={1.5}/> Casos Críticos Pendentes
          </h2>
          <button 
            onClick={() => onNavigateToTab("database")}
            className="text-[#657F38] hover:text-[#4d6622] font-sans text-[10px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
          >
            Ver todos ({trees.length})
          </button>
        </div>

        {priorityTrees.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-[#657F38]/25 text-center flex flex-col items-center gap-2 shadow-organic-sm">
            <p className="font-sans text-xs text-[#212C1B]/50 leading-relaxed max-w-[200px]">
              Nenhum caso local de alta urgência cadastrado no momento.
            </p>
            <button
              onClick={onStartNewSurvey}
              className="px-4 py-1.5 bg-[#657F38] hover:bg-[#4d6622] text-[#FAF7F0] rounded-full font-sans text-[10px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5"  strokeWidth={1.5}/> Mapear Árvore
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {priorityTrees.slice(0, 3).map((tree) => (
              <div 
                key={tree.id}
                className="bg-white rounded-2xl p-3.5 border border-[#212C1B]/5 shadow-organic-sm flex flex-col gap-3 hover:shadow-organic-md transition-all"
              >
                <div className="flex gap-3">
                  {/* Circular/leaf photo container */}
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
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider mb-1 w-max ${tree.intervention === "Risco de Queda (Urgente)" ? "bg-[#D57640]/10 text-[#D57640]" : "bg-amber-100 text-amber-800"}`}>
                      {tree.intervention === "Risco de Queda (Urgente)" ? "Risco de Queda" : "Poda de Adequação"}
                    </span>
                    <h4 className="font-serif text-sm text-[#212C1B] font-bold truncate">
                      {tree.species}
                    </h4>
                    <p className="text-[10px] text-[#212C1B]/60 font-sans truncate mt-0.5">
                      {tree.address}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onSelectTree(tree)}
                    className="flex-1 py-1.5 bg-[#657F38] hover:bg-[#4d6622] text-[#FAF7F0] rounded-full font-sans text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    Ficha Técnica
                  </button>
                  <button 
                    onClick={() => onNavigateToTab("map")}
                    className="px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#ECE7DC] text-[#212C1B] rounded-full border border-[#212C1B]/10 transition-all cursor-pointer flex items-center justify-center"
                    title="Ver no Mapa"
                  >
                    <Search className="w-3.5 h-3.5"  strokeWidth={1.5}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
