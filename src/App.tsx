/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trees, 
  LayoutGrid, 
  MapPin, 
  Database, 
  Brain, 
  Plus, 
  RefreshCw, 
  User, 
  Menu, 
  X,
  Sparkles,
  Leaf,
  Flower,
  Cloud,
  CloudOff
} from "lucide-react";
import { TreeInventory } from "./types";
import { PRE_SEEDED_TREES } from "./data";
import Dashboard from "./components/Dashboard";
import TreeForm from "./components/TreeForm";
import InteractiveMap from "./components/InteractiveMap";
import DatabaseExplorer from "./components/DatabaseExplorer";
import AiReport from "./components/AiReport";

const LOCAL_STORAGE_KEY = "andradas_tree_inventory";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [trees, setTrees] = useState<TreeInventory[]>([]);
  const [selectedTreeForVistoria, setSelectedTreeForVistoria] = useState<TreeInventory | null>(null);
  const [selectedReportTreeId, setSelectedReportTreeId] = useState<string>("");
  const [initialCoordinates, setInitialCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // UI states
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sheetsConnected, setSheetsConnected] = useState<boolean | null>(null);

  // Load initial database from localStorage or seed fallback
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setTrees(JSON.parse(saved));
      } catch (err) {
        console.error("Erro ao carregar dados salvos. Usando padrão.", err);
        setTrees(PRE_SEEDED_TREES);
      }
    } else {
      setTrees(PRE_SEEDED_TREES);
    }
    
    // Check Google Sheets connection on startup
    checkSheetsConnection();
  }, []);

  // Check if Google Sheets API is available
  const checkSheetsConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sheets/health`);
      const result = await response.json();
      setSheetsConnected(result.connected);
    } catch (error) {
      setSheetsConnected(false);
    }
  };

  // Sync with Google Sheets
  const handleSyncDatabase = async () => {
    setSyncing(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sheets/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localTrees: trees }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTrees(result.data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result.data));
        
        const stats = result.stats;
        if (stats.uploaded > 0 || stats.downloaded > 0) {
          showToast(`✓ Sincronizado! ${stats.uploaded} enviados, ${stats.downloaded} recebidos da planilha.`);
        } else {
          showToast("✓ Base sincronizada com o Google Planilhas!");
        }
      } else {
        showToast("⚠ Erro ao sincronizar. Dados mantidos localmente.");
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
      showToast("⚠ Sem conexão. Dados mantidos localmente.");
    } finally {
      setSyncing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add/Update trees
  const handleSaveTree = async (treeData: Partial<TreeInventory>) => {
    let updated: TreeInventory[];
    let savedTree: TreeInventory;

    if (selectedTreeForVistoria) {
      // Edit mode
      savedTree = { ...selectedTreeForVistoria, ...treeData, createdAt: new Date().toISOString() } as TreeInventory;
      updated = trees.map(t => 
        t.id === selectedTreeForVistoria.id ? savedTree : t
      );
      showToast("✓ Ficha cadastral atualizada com sucesso!");
    } else {
      // Create new
      savedTree = {
        id: `tree-${Date.now()}`,
        coordinates: treeData.coordinates || { lat: -22.0682, lng: -46.5694 },
        address: treeData.address || "Endereço não informado",
        referencePoint: treeData.referencePoint || "",
        plantingLocation: treeData.plantingLocation || "Calçada",
        species: treeData.species || "Espécie não cadastrada",
        certainty: treeData.certainty || "Tenho certeza",
        plantType: treeData.plantType || "Árvore Nativa",
        photos: treeData.photos || { tree: null, trunk: null, leaf: null, flowerFruit: null, damage: null },
        height: treeData.height || "Médio",
        girth: treeData.girth || "Médio",
        healthCheck: treeData.healthCheck || {
          trunkInclined: false, trunkCracks: false, trunkFungi: false, trunkPests: false, trunkBorer: false,
          canopyDry: false, canopyBroken: false, canopyParasite: false, rootsDamage: false, rootsStrangling: false
        },
        urbanInterferences: treeData.urbanInterferences || {
          powerGrid: false, signaling: false, wallsTelhados: false, accessibility: false
        },
        intervention: treeData.intervention || "Nenhuma",
        suggestedMonth: treeData.suggestedMonth || "JUN",
        lastPruningDate: treeData.lastPruningDate || "",
        pruningHistory: treeData.pruningHistory || "",
        finalObservations: treeData.finalObservations || "",
        createdAt: new Date().toISOString(),
        technicianName: treeData.technicianName || "Eng. Júlia Reis Meira"
      };

      updated = [savedTree, ...trees];
      showToast("✓ Nova árvore inventariada com sucesso!");
    }

    // Save to localStorage immediately
    setTrees(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    
    // Try to sync with Google Sheets in background
    if (sheetsConnected !== false) {
      try {
        const endpoint = selectedTreeForVistoria 
          ? `${API_BASE_URL}/api/sheets/trees/${savedTree.id}`
          : `${API_BASE_URL}/api/sheets/trees`;
        
        const method = selectedTreeForVistoria ? "PUT" : "POST";
        
        await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedTree),
        });
      } catch (error) {
        console.warn("Erro ao salvar na planilha (dados mantidos localmente):", error);
      }
    }

    setSelectedTreeForVistoria(null);
    setInitialCoordinates(null);
    setActiveTab("database");
  };

  const handleDeleteTree = async (id: string) => {
    const updated = trees.filter(t => t.id !== id);
    setTrees(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    showToast("✓ Registro removido do banco municipal.");
    
    // Try to sync with Google Sheets in background
    if (sheetsConnected !== false) {
      try {
        await fetch(`${API_BASE_URL}/api/sheets/trees/${id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn("Erro ao remover da planilha:", error);
      }
    }
  };

  // Excel CSV Export compiled dynamically
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for Portuguese accents compatibility in Excel
    csvContent += "ID;Espécie;Tipo;Local de Plantio;Porte;Tronco;Endereço;Referência;Intervenção;Mês Sugerido;Data da Última Poda;Técnico Responsável;Data de Cadastro\n";
    
    trees.forEach(t => {
      csvContent += `"${t.id}";"${t.species}";"${t.plantType}";"${t.plantingLocation}";"${t.height}";"${t.girth}";"${t.address}";"${t.referencePoint || ""}";"${t.intervention}";"${t.suggestedMonth}";"${t.lastPruningDate || ""}";"${t.technicianName}";"${t.createdAt}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Andradas_Inventario_Arboreo_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Planilha CSV exportada!");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(trees, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Andradas_Inventario_Arboreo_Backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Backup JSON exportado com sucesso!");
  };

  // Route parameters helper
  const handleStartSurveyAtCoords = (lat: number, lng: number) => {
    setInitialCoordinates({ lat, lng });
    setSelectedTreeForVistoria(null);
    setActiveTab("new-survey");
  };

  const handleSelectTreeForEdit = (tree: TreeInventory) => {
    setSelectedTreeForVistoria(tree);
    setInitialCoordinates(null);
    setActiveTab("new-survey");
  };

  const handleCancelSurvey = () => {
    setSelectedTreeForVistoria(null);
    setInitialCoordinates(null);
    setActiveTab("dashboard");
  };

  const menuItems = [
    { id: "dashboard", label: "Início", icon: LayoutGrid },
    { id: "new-survey", label: "Vistoriar", icon: Plus },
    { id: "map", label: "Mapa", icon: MapPin },
    { id: "database", label: "Base", icon: Database },
    { id: "laudo", label: "Laudo IA", icon: Brain }
  ];

  // Mobile App Core Render
  const renderMobileAppContent = () => (
    <div className="w-full min-h-screen flex flex-col bg-[#FAF7F0] relative overflow-hidden text-[#212C1B]">
      
      {/* Decorative monstera leaf watermarks */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none select-none mix-blend-multiply" style={{ backgroundImage: "url('/monstera-pattern.svg')", backgroundSize: "300px", backgroundRepeat: "repeat" }}></div>

      {/* STUNNING TOP PROFILE HEADER - Rounded Floating with Overlapping Colors */}
      <header className="mx-4 mt-6 px-5 pt-4 pb-4 bg-gradient-to-tr from-[#ECE7DC]/90 to-[#9EAB57]/20 backdrop-blur-md flex items-center justify-between z-10 rounded-[2rem] border border-white/40 shadow-organic-md">
        <div className="flex items-center gap-3">
          {/* Female professional profile avatar with gold-leaf outline */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#657F38] to-[#9EAB57] p-[2px] shadow-sm">
              <div className="w-full h-full rounded-full bg-[#FAF7F0] overflow-hidden flex items-center justify-center">
                <User className="w-5 h-5 text-[#657F38]" strokeWidth={1.5} />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#9EAB57] border-2 border-[#FAF7F0] rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-serif text-sm font-bold tracking-tight text-[#212C1B] leading-none">
                Júlia Reis Meira
              </h2>
              <Sparkles className="w-3 h-3 text-[#D57640] animate-pulse" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-sans font-bold text-[#657F38] tracking-wider uppercase">
              Eng. Florestal • Andradas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Sheets Connection Status */}
          <div 
            className={`flex items-center justify-center p-2.5 rounded-full border shadow-organic-sm ${
              sheetsConnected === true 
                ? "bg-green-50 border-green-200 text-green-600" 
                : sheetsConnected === false 
                  ? "bg-red-50 border-red-200 text-red-500" 
                  : "bg-white/80 border-[#212C1B]/5 text-gray-400"
            }`}
            title={sheetsConnected === true ? "Conectado ao Google Planilhas" : sheetsConnected === false ? "Desconectado - apenas local" : "Verificando conexão..."}
          >
            {sheetsConnected === true ? (
              <Cloud className="w-4 h-4" strokeWidth={1.5} />
            ) : sheetsConnected === false ? (
              <CloudOff className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <RefreshCw className="w-4 h-4 animate-pulse" strokeWidth={1.5} />
            )}
          </div>
          
          {/* Municipal Sync Status Button */}
          <button 
            onClick={handleSyncDatabase}
            disabled={syncing}
            className="flex items-center justify-center p-2.5 rounded-full bg-white/80 hover:bg-white border border-[#212C1B]/5 text-[#657F38] shadow-organic-sm active:scale-95 transition-all"
            title="Sincronizar com Google Planilhas"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* CORE VIEWPORT SCROLLABLE CONTAINER */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 pb-28">
        {activeTab === "dashboard" && (
          <Dashboard
            trees={trees}
            onStartNewSurvey={() => handleStartSurveyAtCoords(-22.0682, -46.5694)}
            onSelectTree={handleSelectTreeForEdit}
            onNavigateToTab={setActiveTab}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === "new-survey" && (
          <TreeForm
            initialCoordinates={initialCoordinates || (selectedTreeForVistoria ? selectedTreeForVistoria.coordinates : null)}
            onSave={handleSaveTree}
            onCancel={handleCancelSurvey}
          />
        )}

        {activeTab === "map" && (
          <InteractiveMap
            trees={trees}
            onSelectTree={handleSelectTreeForEdit}
            onStartSurveyAtCoords={handleStartSurveyAtCoords}
          />
        )}

        {activeTab === "database" && (
          <DatabaseExplorer
            trees={trees}
            onSelectTree={handleSelectTreeForEdit}
            onDeleteTree={handleDeleteTree}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        )}

        {activeTab === "laudo" && (
          <AiReport
            trees={trees}
            selectedTreeId={selectedReportTreeId}
          />
        )}
      </div>

      {/* PREMIUM FEMININE BOTANICAL BOTTOM TAB NAVIGATION BAR */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl h-16 shadow-organic-lg border border-[#212C1B]/5 px-3 flex items-center justify-between z-30 select-none">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                // If clicking survey tab, reset selected item
                if (item.id === "new-survey") {
                  setSelectedTreeForVistoria(null);
                  setInitialCoordinates(null);
                }
                setActiveTab(item.id);
              }}
              className="flex flex-col items-center justify-center flex-1 py-1.5 transition-all relative group cursor-pointer"
            >
              {isActive ? (
                <div className="flex flex-col items-center justify-center animate-fade-in animate-duration-200">
                  {/* Glowing active indicator backing resembling a soft round leaf petal */}
                  <div className="absolute top-[-20px] w-12 h-12 bg-[#657F38] text-[#FAF7F0] rounded-full flex items-center justify-center shadow-lg border-4 border-[#FAF7F0] transition-all transform scale-110 -translate-y-1">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[9px] font-sans font-bold text-[#657F38] mt-8">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all">
                  <Icon className="w-5 h-5 text-[#212C1B]/50 group-hover:text-[#657F38] transition-colors" strokeWidth={1.5} />
                  <span className="text-[9px] font-sans font-medium text-[#212C1B]/40 group-hover:text-[#657F38] mt-1">
                    {item.label}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return renderMobileAppContent();
}
