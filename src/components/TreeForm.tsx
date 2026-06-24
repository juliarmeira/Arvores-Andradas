/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TreeInventory, PlantingLocation, IdentificationCertainty, PlantType, TreeHeight, TreeGirth, InterventionType } from "../types";
import { SPECIES_DIRECTORY } from "../data";
import { MapPin, Search, Sparkles, Navigation, Plus, Camera, Check, AlertTriangle, ArrowLeft, ChevronRight, Info, Eye } from "lucide-react";

interface TreeFormProps {
  initialCoordinates?: { lat: number; lng: number } | null;
  onSave: (tree: Partial<TreeInventory>) => void;
  onCancel: () => void;
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Standard sample image libraries for high-quality mock data simulation
const PRESET_IMAGES = {
  tree: [
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=400"
  ],
  trunk: [
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=400"
  ],
  leaf: [
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&q=80&w=400"
  ],
  flower: [
    "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1601574901173-cf3a2670f894?auto=format&fit=crop&q=80&w=400"
  ],
  damage: [
    "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&q=80&w=400"
  ]
};

export default function TreeForm({ initialCoordinates, onSave, onCancel }: TreeFormProps) {
  const [step, setStep] = useState<number>(1);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);

  // Form States
  const [coordinates, setCoordinates] = useState({
    lat: initialCoordinates?.lat || -22.0682,
    lng: initialCoordinates?.lng || -46.5694
  });
  const [address, setAddress] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [plantingLocation, setPlantingLocation] = useState<PlantingLocation>("Calçada");
  
  // Species identifying states
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [certainty, setCertainty] = useState<IdentificationCertainty>("Tenho certeza");
  const [plantType, setPlantType] = useState<PlantType>("Árvore Nativa");
  const [showSpeciesSuggest, setShowSpeciesSuggest] = useState(false);

  // Step 2: Photos and Dimensions
  const [photos, setPhotos] = useState<Record<string, string | null>>({
    tree: null,
    trunk: null,
    leaf: null,
    flowerFruit: null,
    damage: null
  });
  const [showCameraSim, setShowCameraSim] = useState<string | null>(null);
  const [height, setHeight] = useState<TreeHeight>("Médio");
  const [girth, setGirth] = useState<TreeGirth>("Médio");

  // Step 3: Health checklist
  const [healthCheck, setHealthCheck] = useState({
    trunkInclined: false,
    trunkCracks: false,
    trunkFungi: false,
    trunkPests: false,
    trunkBorer: false,
    canopyDry: false,
    canopyBroken: false,
    canopyParasite: false,
    rootsDamage: false,
    rootsStrangling: false
  });

  const [urbanInterferences, setUrbanInterferences] = useState({
    powerGrid: false,
    signaling: false,
    wallsTelhados: false,
    accessibility: false
  });

  // Step 4: Management & Notes
  const [intervention, setIntervention] = useState<InterventionType>("Nenhuma");
  const [suggestedMonth, setSuggestedMonth] = useState<string>("JUN");
  const [lastPruningDate, setLastPruningDate] = useState<string>("");
  const [pruningHistory, setPruningHistory] = useState("");
  const [finalObservations, setFinalObservations] = useState("");

  // GPS Automatic Capture Handler
  const handleCaptureGPS = () => {
    setIsCapturingGPS(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsCapturingGPS(false);
          // Autofill address via mock reverse-geocoding or tell the user
          setAddress(prev => prev || `Coordenadas capturadas próximas à latitude ${position.coords.latitude.toFixed(5)}`);
        },
        (error) => {
          alert("Não foi possível acessar o GPS do aparelho: " + error.message + ". Usando coordenadas manuais.");
          setIsCapturingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      alert("Seu navegador não oferece suporte à geolocalização.");
      setIsCapturingGPS(false);
    }
  };

  // Species auto-suggest filtering
  const filteredSpecies = SPECIES_DIRECTORY.filter(s =>
    s.popular.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    s.scientific.toLowerCase().includes(speciesSearch.toLowerCase())
  );

  const selectSpecies = (name: string) => {
    setSpecies(name);
    setSpeciesSearch(name);
    setShowSpeciesSuggest(false);
  };

  // Handle image uploaded from disk or simulated from our presets
  const handleUploadPhoto = (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [slot]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatePhoto = (slot: string, imgUrl: string) => {
    setPhotos(prev => ({ ...prev, [slot]: imgUrl }));
    setShowCameraSim(null);
  };

  // Validations before moving to next steps
  const handleNextStep = () => {
    if (step === 1) {
      const finalSelectedSpecies = species || customSpecies;
      if (!address.trim()) {
        alert("O campo de Logradouro / Endereço aproximado é de preenchimento obrigatório.");
        return;
      }
      if (!finalSelectedSpecies) {
        alert("Por favor, selecione ou digite uma espécie.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = (status: "finalizado" | "rascunho") => {
    const finalSelectedSpecies = species || customSpecies;
    const data: Partial<TreeInventory> = {
      coordinates,
      address,
      referencePoint,
      plantingLocation,
      species: finalSelectedSpecies,
      certainty,
      plantType,
      photos: {
        tree: photos.tree,
        trunk: photos.trunk,
        leaf: photos.leaf,
        flowerFruit: photos.flowerFruit,
        damage: photos.damage
      },
      height,
      girth,
      healthCheck,
      urbanInterferences,
      intervention,
      suggestedMonth,
      lastPruningDate,
      pruningHistory,
      finalObservations,
      technicianName: "Eng. Júlia Reis Meira" // Authenticated municipal technician context
    };

    onSave(data);
  };

  return (
    <div className="bg-white rounded-organic-card p-5 md:p-6 border border-[#657F38]/10 shadow-organic-md relative animate-fade-in">
      {/* Wizard Progress Bar Header */}
      <div className="flex flex-col gap-2 mb-6 border-b border-[#212C1B]/5 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#657F38] font-bold">
              Passo {step} de 4
            </p>
            <h2 className="font-serif text-lg text-[#212C1B] font-bold mt-1">
              {step === 1 && "Localização e Espécie"}
              {step === 2 && "Fotos e Dimensões"}
              {step === 3 && "Condição Sanitária e Riscos"}
              {step === 4 && "Gestão e Cronograma"}
            </h2>
          </div>
          <div className="text-right">
            <span className="font-sans text-xs font-bold text-[#657F38]">
              {step === 1 && "25% concluído"}
              {step === 2 && "50% concluído"}
              {step === 3 && "75% concluído"}
              {step === 4 && "Pronto para envio"}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#212C1B]/5">
          <div 
            className="h-full bg-[#657F38] rounded-full transition-all duration-300"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      {/* STEP 1: LOCALIZAÇÃO E ESPÉCIE */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          {/* Coordinates Block */}
          <div className="p-4 bg-cream/45 rounded-xl border border-shadow-brand/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-palm/10 text-palm rounded-full">
                <MapPin className="w-6 h-6"  strokeWidth={1.5}/>
              </span>
              <div>
                <h4 className="font-serif text-sm font-bold text-shadow-brand">Coordenadas de Campo (GPS)</h4>
                <p className="font-sans text-xs text-shadow-brand/60">
                  Lat: {coordinates.lat.toFixed(5)} • Lng: {coordinates.lng.toFixed(5)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCaptureGPS}
              disabled={isCapturingGPS}
              className="px-4 py-2 bg-palm hover:bg-palm-dark text-white rounded-full font-sans text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Navigation className={`w-3.5 h-3.5 ${isCapturingGPS ? "animate-spin" : ""}`}  strokeWidth={1.5}/>
              {isCapturingGPS ? "Capturando..." : "Capturar GPS Atual"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Logradouro / Endereço Aproximado *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Paulista, 1578 ou Centro, Andradas"
                className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
              />
            </div>

            {/* Reference point */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Ponto de Referência
              </label>
              <input
                type="text"
                value={referencePoint}
                onChange={(e) => setReferencePoint(e.target.value)}
                placeholder="Ex: Em frente ao Banco, próximo à faixa de pedestres"
                className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planting site dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Local de Plantio
              </label>
              <select
                value={plantingLocation}
                onChange={(e) => setPlantingLocation(e.target.value as PlantingLocation)}
                className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
              >
                <option value="Calçada">Calçada</option>
                <option value="Praça/Parque">Praça / Parque</option>
                <option value="Canteiro Central">Canteiro Central</option>
                <option value="Propriedade Privada">Propriedade Privada</option>
                <option value="Área Verde/Mata">Área Verde / Mata</option>
              </select>
            </div>

            {/* Plant type choice (Nativa vs Arbusto) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Tipo de Planta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPlantType("Árvore Nativa")}
                  className={`py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${plantType === "Árvore Nativa" ? "bg-palm text-white border-palm shadow" : "bg-white border-shadow-brand/10 text-shadow-brand hover:bg-cream/10"}`}
                >
                  <span className="material-symbols-outlined text-2xl">nature</span>
                  Árvore Nativa
                </button>
                <button
                  type="button"
                  onClick={() => setPlantType("Arbusto / Flor")}
                  className={`py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${plantType === "Arbusto / Flor" ? "bg-palm text-white border-palm shadow" : "bg-white border-shadow-brand/10 text-shadow-brand hover:bg-cream/10"}`}
                >
                  <span className="material-symbols-outlined text-2xl">potted_plant</span>
                  Arbusto / Flor
                </button>
              </div>
            </div>
          </div>

          {/* Species searchable selection */}
          <div className="flex flex-col gap-4 border-t border-shadow-brand/5 pt-4">
            <h3 className="font-serif text-lg text-shadow-brand font-bold">Identificação da Espécie</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search database species */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="font-sans text-xs font-bold text-shadow-brand/80">
                  Pesquisar Espécie Cadastrada (Nome Popular ou Científico)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={speciesSearch}
                    onChange={(e) => {
                      setSpeciesSearch(e.target.value);
                      setShowSpeciesSuggest(true);
                      if (!e.target.value) setSpecies("");
                    }}
                    onFocus={() => setShowSpeciesSuggest(true)}
                    placeholder="Procure pelo nome popular ou científico..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-shadow-brand/40"  strokeWidth={1.5}/>
                </div>

                {/* Suggest dropdown */}
                {showSpeciesSuggest && speciesSearch.length > 0 && (
                  <div className="absolute top-[4.2rem] left-0 right-0 max-h-48 overflow-y-auto bg-white rounded-[2rem] border border-shadow-brand/10 shadow-lg z-50 flex flex-col">
                    {filteredSpecies.map(s => (
                      <button
                        key={s.popular}
                        type="button"
                        onClick={() => selectSpecies(s.popular)}
                        className="px-4 py-2 text-left hover:bg-cream/30 text-xs font-sans text-shadow-brand border-b border-shadow-brand/5 last:border-0"
                      >
                        <span className="font-bold">{s.popular}</span> • <span className="italic">{s.scientific}</span> ({s.origin})
                      </button>
                    ))}
                    {filteredSpecies.length === 0 && (
                      <div className="px-4 py-3 text-xs font-sans text-shadow-brand/50 italic text-center">
                        Nenhuma espécie encontrada. Digite ao lado para cadastrar nova.
                      </div>
                    )}
                  </div>
                )}
                {species && (
                  <p className="text-xs text-palm font-bold mt-1">
                    ✓ Selecionado: {species}
                  </p>
                )}
              </div>

              {/* Or register custom species */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-bold text-shadow-brand/80">
                  Ou adicione uma Nova Espécie à base de dados
                </label>
                <input
                  type="text"
                  value={customSpecies}
                  onChange={(e) => {
                    setCustomSpecies(e.target.value);
                    if (e.target.value) {
                      setSpecies(""); // Clear search selection if typing custom
                      setSpeciesSearch("");
                    }
                  }}
                  placeholder="Ex: Quaresmeira Vermelha, Amendoim Bravo"
                  className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
                />
                {customSpecies && (
                  <p className="text-xs text-terracotta font-bold mt-1">
                    ★ Nova espécie a ser adicionada: {customSpecies}
                  </p>
                )}
              </div>
            </div>

            {/* Identification certainty level */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Nível de Certeza da Identificação
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Tenho certeza", "É apenas um palpite", "Não sei identificar"] as IdentificationCertainty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setCertainty(level)}
                    className={`px-5 py-2.5 rounded-full font-sans text-xs font-bold transition-all border cursor-pointer active:scale-95 ${certainty === level ? "bg-palm text-white border-palm shadow-sm" : "bg-white border-shadow-brand/10 text-shadow-brand hover:bg-cream/10"}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FOTOS E DIMENSÕES */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          {/* Photos Upload Area */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end border-b border-shadow-brand/5 pb-2">
              <h3 className="font-serif text-lg text-shadow-brand font-bold">Registros Fotográficos</h3>
              <span className="text-shadow-brand/50 font-sans text-xs">Até 5 fotos (Upload ou Câmera)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2">
              {/* Image slot cards */}
              {[
                { slot: "tree", label: "Árvore Inteira", desc: "Visão Geral" },
                { slot: "trunk", label: "Tronco e Base", desc: "Foco nas raízes" },
                { slot: "leaf", label: "Folhas", desc: "Validação botânica" },
                { slot: "flower", label: "Flores / Frutos", desc: "Confirmação" },
                { slot: "damage", label: "Danos / Pragas", desc: "Opcional" }
              ].map((item) => (
                <div 
                  key={item.slot}
                  className="aspect-square bg-white rounded-[2rem] border-2 border-dashed border-shadow-brand/10 p-3 hover:border-palm transition-all flex flex-col items-center justify-center text-center relative group shadow-sm overflow-hidden"
                >
                  {photos[item.slot] ? (
                    <div className="absolute inset-0 w-full h-full">
                      <img 
                        src={photos[item.slot]!} 
                        alt={item.label} 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => ({ ...prev, [item.slot]: null }))}
                        className="absolute right-2 top-2 bg-shadow-brand/70 text-white rounded-full p-1 hover:bg-shadow-brand cursor-pointer z-10 font-bold text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 h-full w-full">
                      <button
                        type="button"
                        onClick={() => setShowCameraSim(item.slot)}
                        className="w-10 h-10 bg-cream-dark/50 text-palm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer"
                        title="Simular Câmera de Campo"
                      >
                        <Camera className="w-5 h-5"  strokeWidth={1.5}/>
                      </button>
                      <span className="font-sans text-[11px] font-bold text-shadow-brand leading-tight">
                        {item.label}
                      </span>
                      <span className="font-sans text-[9px] text-shadow-brand/40">
                        {item.desc}
                      </span>
                      
                      {/* Hidden actual file uploader */}
                      <label className="text-[10px] text-palm/75 hover:underline cursor-pointer font-sans font-semibold mt-1">
                        ou de Arquivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadPhoto(item.slot, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Camera preset simulators */}
          {showCameraSim && (
            <div className="p-4 bg-cream/45 rounded-xl border border-palm/20 flex flex-col gap-3 shadow-inner animate-fade-in animate-duration-150">
              <div className="flex justify-between items-center">
                <span className="font-sans text-xs font-bold text-palm flex items-center gap-1.5">
                  <Camera className="w-4 h-4"  strokeWidth={1.5}/> Simulador de Câmera Fotográfica de Campo (Andradas)
                </span>
                <button 
                  onClick={() => setShowCameraSim(null)}
                  className="text-shadow-brand/40 hover:text-shadow-brand/70 text-xs font-bold"
                >
                  ✕ Fechar
                </button>
              </div>
              <p className="font-sans text-[11px] text-shadow-brand/60">
                Selecione um exemplo botânico realista abaixo para preencher o registro fotográfico de campo:
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {(PRESET_IMAGES[showCameraSim as keyof typeof PRESET_IMAGES] || PRESET_IMAGES.tree).map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulatePhoto(showCameraSim, url)}
                    className="w-24 h-24 rounded-lg overflow-hidden border border-shadow-brand/10 hover:border-palm hover:ring-2 hover:ring-palm/30 flex-shrink-0 cursor-pointer transition-all"
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Porte e Diâmetro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-shadow-brand/5 pt-4">
            {/* Height (Porte) Selection */}
            <div className="flex flex-col gap-3">
              <h4 className="font-serif text-base font-bold text-shadow-brand">Porte / Altura Estimada</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: "Pequeno", desc: "Até 4m, não atinge fiação urbana" },
                  { value: "Médio", desc: "4m a 8m, alcança fiação elétrica ou telhado térreo" },
                  { value: "Grande", desc: "Acima de 8m, ultrapassa telhados ou alta tensão" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setHeight(item.value as TreeHeight)}
                    className={`p-3 text-left rounded-xl border font-sans transition-all flex justify-between items-center cursor-pointer ${height === item.value ? "bg-palm text-white border-palm shadow-sm" : "bg-white border-shadow-brand/10 text-shadow-brand hover:bg-cream/10"}`}
                  >
                    <div>
                      <p className="text-xs font-bold">{item.value}</p>
                      <p className={`text-[10px] ${height === item.value ? "text-white/85" : "text-shadow-brand/50"}`}>{item.desc}</p>
                    </div>
                    {height === item.value && <Check className="w-4 h-4 text-white"  strokeWidth={1.5}/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Girth Trunk (DBH) Selection */}
            <div className="flex flex-col gap-3">
              <h4 className="font-serif text-base font-bold text-shadow-brand">Espessura do Tronco (DBH)</h4>
              <div className="flex flex-col gap-2">
                {[
                  { value: "Fino", desc: "É possível fechar as mãos ao redor do tronco" },
                  { value: "Médio", desc: "É possível abraçar a árvore completamente" },
                  { value: "Grosso", desc: "Não é possível fechar o abraço ao redor" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setGirth(item.value as TreeGirth)}
                    className={`p-3 text-left rounded-xl border font-sans transition-all flex justify-between items-center cursor-pointer ${girth === item.value ? "bg-palm text-white border-palm shadow-sm" : "bg-white border-shadow-brand/10 text-shadow-brand hover:bg-cream/10"}`}
                  >
                    <div>
                      <p className="text-xs font-bold">{item.value}</p>
                      <p className={`text-[10px] ${girth === item.value ? "text-white/85" : "text-shadow-brand/50"}`}>{item.desc}</p>
                    </div>
                    {girth === item.value && <Check className="w-4 h-4 text-white"  strokeWidth={1.5}/>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONDIÇÃO SANITÁRIA E RISCOS */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-1.5 border-b border-shadow-brand/5 pb-2">
            <span className="p-1.5 bg-terracotta/10 text-terracotta rounded-full">
              <AlertTriangle className="w-5 h-5 animate-pulse"  strokeWidth={1.5}/>
            </span>
            <h3 className="font-serif text-lg text-shadow-brand font-bold">Diagnóstico Sanitário e Riscos (Checklist Sim/Não)</h3>
          </div>

          {/* Tronco e Base */}
          <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-shadow-brand/5">
            <h4 className="font-serif text-sm font-bold text-palm border-b border-palm/10 pb-1.5 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">texture</span> Tronco e Base
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { field: "trunkInclined", label: "Árvore apresenta inclinação acentuada?" },
                { field: "trunkCracks", label: "Presença de rachaduras profundas ou buracos grandes no tronco?" },
                { field: "trunkFungi", label: "Presença de fungos ou orelhas-de-pau (decompositores) na madeira?" },
                { field: "trunkPests", label: "Presença de pragas na base (cupins, excesso de formigas carregadoras)?" },
                { field: "trunkBorer", label: "Sinais de furos no tronco com serragem (presença de broca)?" }
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between py-2 border-b border-shadow-brand/5 last:border-0 font-sans text-xs">
                  <span className="text-shadow-brand/80 font-medium">{item.label}</span>
                  <div className="flex rounded-full bg-cream-dark p-1 shadow-inner gap-1">
                    <button
                      type="button"
                      onClick={() => setHealthCheck(prev => ({ ...prev, [item.field]: true }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${healthCheck[item.field as keyof typeof healthCheck] ? "bg-terracotta text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthCheck(prev => ({ ...prev, [item.field]: false }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${!healthCheck[item.field as keyof typeof healthCheck] ? "bg-palm text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copa e Galhos */}
          <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-shadow-brand/5">
            <h4 className="font-serif text-sm font-bold text-palm border-b border-palm/10 pb-1.5 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">nature</span> Copa e Galhos
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { field: "canopyDry", label: "Presença de galhos secos ou mortos na copa?" },
                { field: "canopyBroken", label: "Presença de galhos grandes quebrados e pendurados?" },
                { field: "canopyParasite", label: "Presença de erva-de-passarinho ou outras plantas parasitas?" }
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between py-2 border-b border-shadow-brand/5 last:border-0 font-sans text-xs">
                  <span className="text-shadow-brand/80 font-medium">{item.label}</span>
                  <div className="flex rounded-full bg-cream-dark p-1 shadow-inner gap-1">
                    <button
                      type="button"
                      onClick={() => setHealthCheck(prev => ({ ...prev, [item.field]: true }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${healthCheck[item.field as keyof typeof healthCheck] ? "bg-terracotta text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthCheck(prev => ({ ...prev, [item.field]: false }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${!healthCheck[item.field as keyof typeof healthCheck] ? "bg-palm text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raízes */}
          <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-shadow-brand/5">
            <h4 className="font-serif text-sm font-bold text-palm border-b border-palm/10 pb-1.5 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">psychology_alt</span> Raízes
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { field: "rootsDamage", label: "Raízes danificando gravemente o calçamento público ou asfalto?" },
                { field: "rootsStrangling", label: "Raízes estrangulando o próprio tronco?" }
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between py-2 border-b border-shadow-brand/5 last:border-0 font-sans text-xs">
                  <span className="text-shadow-brand/80 font-medium">{item.label}</span>
                  <div className="flex rounded-full bg-cream-dark p-1 shadow-inner gap-1">
                    <button
                      type="button"
                      onClick={() => setHealthCheck(prev => ({ ...prev, [item.field]: true }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${healthCheck[item.field as keyof typeof healthCheck] ? "bg-terracotta text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthCheck(prev => ({ ...prev, [item.field]: false }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${!healthCheck[item.field as keyof typeof healthCheck] ? "bg-palm text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interferências Urbanas */}
          <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-shadow-brand/5">
            <h4 className="font-serif text-sm font-bold text-palm border-b border-palm/10 pb-1.5 mb-3">Interferências Urbanas</h4>
            <div className="flex flex-col gap-2">
              {[
                { field: "powerGrid", label: "Copa em conflito ou encostando na rede elétrica pública?" },
                { field: "signaling", label: "Obstruindo iluminação pública ou placas de trânsito?" },
                { field: "wallsTelhados", label: "Encostando ou gerando quebras em muros/telhados vizinhos?" },
                { field: "accessibility", label: "Raízes/porte atrapalhando a acessibilidade de pedestres ou cadeirantes?" }
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between py-2 border-b border-shadow-brand/5 last:border-0 font-sans text-xs">
                  <span className="text-shadow-brand/80 font-medium">{item.label}</span>
                  <div className="flex rounded-full bg-cream-dark p-1 shadow-inner gap-1">
                    <button
                      type="button"
                      onClick={() => setUrbanInterferences(prev => ({ ...prev, [item.field]: true }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${urbanInterferences[item.field as keyof typeof urbanInterferences] ? "bg-terracotta text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrbanInterferences(prev => ({ ...prev, [item.field]: false }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${!urbanInterferences[item.field as keyof typeof urbanInterferences] ? "bg-palm text-white shadow" : "text-shadow-brand/50 hover:bg-white/40"}`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: GESTÃO E OBSERVACÕES */}
      {step === 4 && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Visual Intervension Needed */}
            <div className="flex flex-col gap-3">
              <h4 className="font-serif text-base font-bold text-shadow-brand border-b border-shadow-brand/5 pb-1">
                Necessidade Visual de Intervenção
              </h4>
              <div className="flex flex-col gap-2 font-sans text-xs">
                {[
                  { value: "Nenhuma", style: "border-l-4 border-palm" },
                  { value: "Poda de Limpeza", style: "border-l-4 border-leaf" },
                  { value: "Poda de Adequação", style: "border-l-4 border-amber-500" },
                  { value: "Risco de Queda (Urgente)", style: "border-l-4 border-terracotta" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setIntervention(item.value as InterventionType)}
                    className={`p-3 text-left rounded-xl border bg-white cursor-pointer hover:bg-cream/10 transition-all flex justify-between items-center ${item.style} ${intervention === item.value ? "ring-2 ring-palm border-transparent shadow-sm" : "border-shadow-brand/10"}`}
                  >
                    <span className="font-bold text-shadow-brand">{item.value}</span>
                    {intervention === item.value && <Check className="w-4 h-4 text-palm"  strokeWidth={1.5}/>}
                  </button>
                ))}
              </div>
            </div>

            {/* suggested month picks (months grid from Ref 2) */}
            <div className="flex flex-col gap-3">
              <h4 className="font-serif text-base font-bold text-shadow-brand border-b border-shadow-brand/5 pb-1">
                Mês Sugerido para Próxima Poda
              </h4>
              <p className="font-sans text-[11px] text-shadow-brand/50">
                Selecione o mês ideal para manutenção preventiva / corretiva.
              </p>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSuggestedMonth(m)}
                    className={`py-2 px-1 rounded-lg font-sans text-xs font-bold transition-all text-center border cursor-pointer active:scale-95 ${suggestedMonth === m ? "bg-palm text-white border-palm shadow-sm" : "bg-white border-shadow-brand/10 text-shadow-brand hover:bg-cream/10"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-shadow-brand/5 pt-4">
            {/* Last Pruning Date */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Data da Última Poda
              </label>
              <input
                type="date"
                value={lastPruningDate}
                onChange={(e) => setLastPruningDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-full font-sans text-sm text-shadow-brand"
              />
            </div>

            {/* Pruning history notes */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Observação sobre Histórico de Podas
              </label>
              <textarea
                value={pruningHistory}
                onChange={(e) => setPruningHistory(e.target.value)}
                placeholder="Ex: Poda drástica anterior evidente, fiação refeita."
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
              />
            </div>

            {/* Observations text */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-shadow-brand/80">
                Relatos da Comunidade ou Observações Adicionais
              </label>
              <textarea
                value={finalObservations}
                onChange={(e) => setFinalObservations(e.target.value)}
                placeholder="Insira detalhes adicionais, reclamações de moradores ou detalhes não mapeados anteriormente..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-shadow-brand/10 focus:ring-2 focus:ring-palm rounded-lg font-sans text-sm text-shadow-brand"
              />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAVIGATION ACTIONS */}
      <div className="flex justify-between items-center mt-10 pt-4 border-t border-shadow-brand/10">
        <button
          type="button"
          onClick={step === 1 ? onCancel : handlePrevStep}
          className="flex items-center gap-1.5 text-shadow-brand/70 hover:text-shadow-brand font-sans text-xs font-bold px-4 py-2 hover:bg-shadow-brand/5 rounded-full cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4"  strokeWidth={1.5}/>
          {step === 1 ? "Cancelar" : "Voltar"}
        </button>

        <div className="flex gap-2">
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-palm hover:bg-palm-dark text-white rounded-full font-sans text-xs font-bold shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              Próximo
              <ChevronRight className="w-4 h-4"  strokeWidth={1.5}/>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleFinalSubmit("rascunho")}
                className="px-4 py-2.5 border-2 border-palm/20 hover:bg-palm/5 text-palm rounded-full font-sans text-xs font-bold transition-all cursor-pointer"
              >
                Salvar Rascunho
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit("finalizado")}
                className="px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white rounded-full font-sans text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Finalizar Inventário
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
