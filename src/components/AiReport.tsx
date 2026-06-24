/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TreeInventory } from "../types";
import { Brain, FileText, Sparkles, Printer, Copy, RefreshCw, Heart, AlertCircle } from "lucide-react";

interface AiReportProps {
  trees: TreeInventory[];
  selectedTreeId?: string;
}

// Inline Lightweight Markdown Parser into pristine styled HTML
function SimpleMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  
  return (
    <div className="font-sans text-xs text-[#212C1B] leading-relaxed space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="font-serif text-lg text-[#212C1B] font-bold border-b border-[#212C1B]/10 pb-1.5 mt-4">
              {trimmed.replace("# ", "")}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="font-serif text-sm text-[#657F38] font-bold mt-3 mb-1">
              {trimmed.replace("## ", "")}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="font-serif text-xs text-[#212C1B] font-bold mt-2.5 mb-0.5">
              {trimmed.replace("### ", "")}
            </h3>
          );
        }
        
        // Bullet list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const itemText = trimmed.substring(2);
          return (
            <li key={idx} className="ml-4 list-disc text-[#212C1B]/90 my-0.5">
              {renderBoldText(itemText)}
            </li>
          );
        }

        // Empty line
        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />;
        }

        // Regular paragraph with bold text parsing
        return (
          <p key={idx} className="my-1.5 text-[#212C1B]/85 font-sans leading-relaxed text-justify">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Basic parser for **bold text**
function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold text-[#212C1B]">{part}</strong>;
    }
    return part;
  });
}

export default function AiReport({ trees, selectedTreeId }: AiReportProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [reportText, setReportText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Auto-select tree if passed from parent components
  useEffect(() => {
    if (selectedTreeId) {
      setSelectedId(selectedTreeId);
    } else if (trees.length > 0 && !selectedId) {
      setSelectedId(trees[0].id);
    }
  }, [selectedTreeId, trees]);

  // Loading animation message rotating
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const activeTree = trees.find(t => t.id === selectedId);

  const handleGenerateReport = async () => {
    if (!activeTree) {
      alert("Por favor, selecione uma árvore cadastrada para gerar o laudo.");
      return;
    }

    setLoading(true);
    setError(null);
    setReportText("");

    try {
      const response = await fetch("/api/generate-laudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tree: activeTree })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro na comunicação com o servidor Gemini.");
      }

      const data = await response.json();
      setReportText(data.laudo);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ocorreu um erro ao conectar-se ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    alert("Laudo Técnico copiado em formato Markdown!");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laudo Técnico - Prefeitura de Andradas</title>
            <style>
              body { font-family: 'Georgia', serif; padding: 40px; color: #212c1b; line-height: 1.6; background-color: #faf7f0; }
              h1, h2, h3 { color: #657f38; }
              h1 { border-bottom: 2px solid #657f38; padding-bottom: 8px; }
              p { text-align: justify; margin: 12px 0; }
              li { margin: 6px 0; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 4px double #657f38; padding-bottom: 20px; }
              .signatures { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; font-size: 13px; }
              .sig-line { border-top: 1px solid #212c1b; width: 220px; margin-bottom: 4px; padding-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>ESTADO DE MINAS GERAIS</h2>
              <h3>Prefeitura Municipal de Andradas</h3>
              <h4>DEPARTAMENTO DE MEIO AMBIENTE E GESTÃO DE RISCOS</h4>
            </div>
            ${reportText
              .replace(/#\s(.*)/g, "<h1>$1</h1>")
              .replace(/##\s(.*)/g, "<h2>$1</h2>")
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/-\s(.*)/g, "<li>$1</li>")}
            
            <div class="signatures">
              <div>
                <div class="sig-line"></div>
                <strong>Eng. Júlia Reis Meira</strong><br/>Engenharia Florestal - DMA/Andradas
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const loadingMessages = [
    "Compilando coordenadas de campo...",
    "Analisando fitossanidade com o cérebro do Gemini IA...",
    "Avaliando riscos mecânicos e conflitos com rede de alta tensão...",
    "Redigindo laudo técnico oficial estruturado..."
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-[#212C1B]">
      
      {/* Introduction */}
      <div className="border-b border-[#212C1B]/5 pb-3">
        <h2 className="font-serif text-lg font-bold text-[#212C1B] flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-[#D57640] fill-[#D57640]" /> Diagnóstico Técnico IA
        </h2>
        <p className="font-sans text-[11px] text-[#212C1B]/60 mt-0.5">
          Gere laudos e diagnósticos de manejo florestal estruturados com apoio de IA.
        </p>
      </div>

      {/* 🌳 SECTOR SELECTOR BAR */}
      <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#657F38]/10 flex flex-col gap-3 shadow-inner">
        <div className="flex flex-col gap-1">
          <label className="font-sans text-[10px] font-bold text-[#212C1B]/75 uppercase px-1">
            Selecione a Árvore Cadastrada:
          </label>
          <select
            id="report-tree-selector"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setReportText("");
              setError(null);
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#212C1B]/5 font-sans text-xs text-[#212C1B] focus:ring-2 focus:ring-[#657F38] shadow-sm font-bold"
          >
            <option value="">Selecione um exemplar...</option>
            {trees.map(t => (
              <option key={t.id} value={t.id}>
                {t.species} — {t.address.split(",")[0]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedId}
          className="w-full py-2 bg-[#657F38] hover:bg-[#4d6622] disabled:bg-[#212C1B]/15 disabled:cursor-not-allowed text-white rounded-full font-sans text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Brain className="w-4 h-4"  strokeWidth={1.5}/>
          {loading ? "Processando..." : "Gerar Laudo Técnico"}
        </button>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-3.5 bg-[#D57640]/5 rounded-xl border border-[#D57640]/15 flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 text-[#D57640] flex-shrink-0 mt-0.5" />
          <div className="font-sans text-xs text-[#D57640]">
            <span className="font-bold">Erro de comunicação:</span> {error}
            <button 
              onClick={handleGenerateReport}
              className="block underline font-bold mt-1 hover:text-[#ba5e2a]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* LOADING SCREEN WITH STEPS */}
      {loading && (
        <div className="bg-white rounded-2xl p-6 border border-[#657F38]/10 shadow-organic-sm flex flex-col items-center justify-center text-center gap-3.5 py-12">
          <div className="w-12 h-12 rounded-full border-4 border-[#657F38] border-t-transparent animate-spin flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-[#657F38]"  strokeWidth={1.5}/>
          </div>
          <h3 className="font-serif text-sm font-bold text-[#212C1B] animate-pulse">
            O Gemini está analisando sua amostra...
          </h3>
          <p className="font-sans text-[10px] text-[#212C1B]/60 max-w-xs h-10 leading-relaxed">
            {loadingMessages[loadingStage]}
          </p>
        </div>
      )}

      {/* CHOOSE SELECTION WATERMARK */}
      {!loading && !reportText && !error && (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-[#657F38]/20 text-center flex flex-col items-center justify-center gap-2 shadow-organic-sm">
          <Sparkles className="w-6 h-6 text-[#9EAB57]/60"  strokeWidth={1.5}/>
          <p className="font-sans text-xs text-[#212C1B]/60 max-w-xs leading-relaxed">
            Selecione uma árvore acima e clique em <span className="font-bold">Gerar Laudo Técnico</span> para redigir o diagnóstico oficial do Departamento de Meio Ambiente.
          </p>
        </div>
      )}

      {/* COMPLETED REPORT DOCUMENT PREVIEW */}
      {!loading && reportText && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* Actions toolbar */}
          <div className="flex justify-end gap-1.5">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-1.5 bg-[#FAF7F0] hover:bg-[#ECE7DC] text-[#212C1B] border border-[#212C1B]/10 rounded-full font-sans text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar Texto
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#657F38] hover:bg-[#4d6622] text-white rounded-full font-sans text-[10px] font-bold shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>

          {/* Styled paper-like report card */}
          <div className="bg-white rounded-[2rem] p-6 border border-[#657F38]/15 shadow-organic-md flex flex-col gap-5 relative select-text overflow-hidden">
            {/* Stamp watermark for premium official aesthetic */}
            <div className="absolute right-4 top-4 w-16 h-16 border-2 border-[#657F38]/15 rounded-full flex items-center justify-center text-center font-serif text-[7px] font-bold text-[#657F38]/15 rotate-12 pointer-events-none select-none uppercase">
              Prefeitura<br/>Andradas<br/>M. Ambiente
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-double border-[#212C1B]/20 pb-3.5 text-center">
              <span className="font-serif text-[9px] font-bold uppercase tracking-wider text-[#212C1B]/50">
                Estado de Minas Gerais
              </span>
              <h1 className="font-serif text-sm font-bold text-[#212C1B] mt-0.5 uppercase tracking-tight">
                Prefeitura de Andradas
              </h1>
              <span className="font-sans text-[9px] font-bold text-[#657F38] uppercase tracking-wider block mt-0.5">
                Laudo Técnico de Manejo e Fitossanidade
              </span>
            </div>

            {/* Content rendering */}
            <SimpleMarkdownRenderer content={reportText} />

            {/* Signature Block */}
            <div className="border-t border-[#212C1B]/10 pt-4 mt-6 flex flex-col items-center text-center text-[10px] font-sans">
              <div className="border-t border-[#212C1B]/40 w-40 pt-1 text-[#212C1B] font-bold">
                Eng. Júlia Reis Meira
              </div>
              <span className="text-[#212C1B]/50 text-[8px]">CREA-MG 154.212/D</span>
              <span className="text-[#212C1B]/40 text-[8px] uppercase">Departamento de Meio Ambiente</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
