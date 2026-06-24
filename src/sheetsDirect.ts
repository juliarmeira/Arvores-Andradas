/**
 * Serviço de integração direta com Google Sheets via Apps Script.
 * Não depende do servidor Express - chama o Apps Script direto do navegador.
 */

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";

const HEADERS = ["ID","Latitude","Longitude","Endereço","Ponto de Referência","Local de Plantio","Espécie","Certeza","Tipo de Planta","Foto Árvore","Foto Tronco","Foto Folha","Foto Flor/Fruto","Foto Dano","Porte","Tronco DBH","Inclinação Tronco","Rachaduras Tronco","Fungos Tronco","Pragas Tronco","Broca Tronco","Copa Seca","Galhos Quebrados","Parasitas Copa","Raízes Calçada","Raízes Estrangulamento","Rede Elétrica","Sinalização","Muros/Telhados","Acessibilidade","Intervenção","Mês Poda","Data Última Poda","Histórico Podas","Observações","Técnico","Data Criação"];

export function isSheetsConfigured(): boolean {
  return !!SCRIPT_URL;
}

export async function checkHealth(): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const res = await fetch(`${SCRIPT_URL}?action=health`);
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

function treeToArray(tree: any): any[] {
  return [
    tree.id,
    tree.coordinates?.lat,
    tree.coordinates?.lng,
    tree.address,
    tree.referencePoint || "",
    tree.plantingLocation,
    tree.species,
    tree.certainty,
    tree.plantType,
    tree.photos?.tree ? "Sim" : "Não",
    tree.photos?.trunk ? "Sim" : "Não",
    tree.photos?.leaf ? "Sim" : "Não",
    tree.photos?.flowerFruit ? "Sim" : "Não",
    tree.photos?.damage ? "Sim" : "Não",
    tree.height,
    tree.girth,
    tree.healthCheck?.trunkInclined,
    tree.healthCheck?.trunkCracks,
    tree.healthCheck?.trunkFungi,
    tree.healthCheck?.trunkPests,
    tree.healthCheck?.trunkBorer,
    tree.healthCheck?.canopyDry,
    tree.healthCheck?.canopyBroken,
    tree.healthCheck?.canopyParasite,
    tree.healthCheck?.rootsDamage,
    tree.healthCheck?.rootsStrangling,
    tree.urbanInterferences?.powerGrid,
    tree.urbanInterferences?.signaling,
    tree.urbanInterferences?.wallsTelhados,
    tree.urbanInterferences?.accessibility,
    tree.intervention,
    tree.suggestedMonth,
    tree.lastPruningDate || "",
    tree.pruningHistory || "",
    tree.finalObservations || "",
    tree.technicianName,
    tree.createdAt,
  ];
}

function rowToTree(row: any): any {
  return {
    id: row["ID"] || "",
    coordinates: { lat: parseFloat(row["Latitude"]) || -22.0682, lng: parseFloat(row["Longitude"]) || -46.5694 },
    address: row["Endereço"] || "",
    referencePoint: row["Ponto de Referência"] || "",
    plantingLocation: row["Local de Plantio"] || "Calçada",
    species: row["Espécie"] || "",
    certainty: row["Certeza"] || "Tenho certeza",
    plantType: row["Tipo de Planta"] || "Árvore Nativa",
    photos: { tree: null, trunk: null, leaf: null, flowerFruit: null, damage: null },
    height: row["Porte"] || "Médio",
    girth: row["Tronco DBH"] || "Médio",
    healthCheck: {
      trunkInclined: row["Inclinação Tronco"] === true || row["Inclinação Tronco"] === "TRUE",
      trunkCracks: row["Rachaduras Tronco"] === true || row["Rachaduras Tronco"] === "TRUE",
      trunkFungi: row["Fungos Tronco"] === true || row["Fungos Tronco"] === "TRUE",
      trunkPests: row["Pragas Tronco"] === true || row["Pragas Tronco"] === "TRUE",
      trunkBorer: row["Broca Tronco"] === true || row["Broca Tronco"] === "TRUE",
      canopyDry: row["Copa Seca"] === true || row["Copa Seca"] === "TRUE",
      canopyBroken: row["Galhos Quebrados"] === true || row["Galhos Quebrados"] === "TRUE",
      canopyParasite: row["Parasitas Copa"] === true || row["Parasitas Copa"] === "TRUE",
      rootsDamage: row["Raízes Calçada"] === true || row["Raízes Calçada"] === "TRUE",
      rootsStrangling: row["Raízes Estrangulamento"] === true || row["Raízes Estrangulamento"] === "TRUE",
    },
    urbanInterferences: {
      powerGrid: row["Rede Elétrica"] === true || row["Rede Elétrica"] === "TRUE",
      signaling: row["Sinalização"] === true || row["Sinalização"] === "TRUE",
      wallsTelhados: row["Muros/Telhados"] === true || row["Muros/Telhados"] === "TRUE",
      accessibility: row["Acessibilidade"] === true || row["Acessibilidade"] === "TRUE",
    },
    intervention: row["Intervenção"] || "Nenhuma",
    suggestedMonth: row["Mês Poda"] || "JUN",
    lastPruningDate: row["Data Última Poda"] || "",
    pruningHistory: row["Histórico Podas"] || "",
    finalObservations: row["Observações"] || "",
    technicianName: row["Técnico"] || "Eng. Júlia Reis Meira",
    createdAt: row["Data Criação"] || new Date().toISOString(),
  };
}

async function postScript(action: string, data?: any): Promise<any> {
  const body = data !== undefined ? JSON.stringify({ data }) : undefined;
  const res = await fetch(`${SCRIPT_URL}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    redirect: "follow",
    body,
  });
  return res.json();
}

async function getScript(action: string): Promise<any> {
  const res = await fetch(`${SCRIPT_URL}?action=${action}`, { redirect: "follow" });
  return res.json();
}

export async function fetchAllTrees(): Promise<any[]> {
  if (!SCRIPT_URL) return [];
  try {
    const result = await getScript("getAllTrees");
    if (result.success && result.data) {
      return result.data.map((row: any) => rowToTree(row));
    }
    return [];
  } catch {
    return [];
  }
}

export async function addTreeToSheet(tree: any): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const result = await postScript("addTree", treeToArray(tree));
    return result.success === true;
  } catch {
    return false;
  }
}

export async function updateTreeInSheet(tree: any): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const result = await fetch(`${SCRIPT_URL}?action=updateTree`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({ id: tree.id, data: treeToArray(tree) }),
    });
    const json = await result.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function deleteTreeFromSheet(id: string): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    const result = await fetch(`${SCRIPT_URL}?action=deleteTree`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({ id }),
    });
    const json = await result.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function syncTrees(localTrees: any[]): Promise<{ data: any[]; uploaded: number; downloaded: number }> {
  const sheetTrees = await fetchAllTrees();
  
  const localMap = new Map(localTrees.map((t: any) => [t.id, t]));
  const sheetMap = new Map(sheetTrees.map((t: any) => [t.id, t]));
  
  const toUpload = localTrees.filter((t: any) => !sheetMap.has(t.id));
  for (const tree of toUpload) {
    await addTreeToSheet(tree);
  }
  
  const toDownload = sheetTrees.filter((t: any) => !localMap.has(t.id));
  
  const merged = new Map<string, any>();
  localTrees.forEach((t: any) => merged.set(t.id, t));
  toDownload.forEach((t: any) => merged.set(t.id, t));
  
  return {
    data: Array.from(merged.values()),
    uploaded: toUpload.length,
    downloaded: toDownload.length,
  };
}
