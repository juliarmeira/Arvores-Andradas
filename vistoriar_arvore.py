import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import google.generativeai as genai
except ImportError:
    print("Erro: instale o pacote: pip install google-generativeai")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Erro: instale o pacote: pip install Pillow")
    sys.exit(1)

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
MODELO_PADRAO = "gemini-2.0-flash"

PROMPT_VISTORIA = """Você é um botânico forense e fiscal ambiental especializado em vistorias técnicas para avaliação de corte de árvores. Analise a foto com rigor técnico e gere um LAUDO TÉCNICO no formato abaixo:

---
LAUDO DE VISTORIA TÉCNICA – IDENTIFICAÇÃO E AVALIAÇÃO FITOSSANITÁRIA
---

1. IDENTIFICAÇÃO DA ESPÉCIE
   Nome científico:
   Nomes populares:
   Família:
   Origem (nativa/exótica):

2. CARACTERÍSTICAS DA ÁRVORE
   Porte estimado (altura, diâmetro de tronco, copa):
   Estádio de desenvolvimento (jovem/adulto/senil):

3. AVALIAÇÃO FITOSSANITÁRIA (examine a imagem em busca de):
   - Sinais de pragas e doenças (cupins, fungos, brocas, cancros)
   - Danos mecânicos (rachaduras, podas inadequadas, lesões)
   - Deformidades no tronco ou copa
   - Inclinação/perigo de queda
   - Afloramento radicular e danos a calçadas/muros
   - Estado geral da casca e folhagem
   - Presença de matacão, ocos ou apodrecimento
   Nível de risco: (Baixo / Médio / Alto)

4. CONFLITO COM ESTRUTURAS URBANAS
   (Baseie-se apenas no que é visível: calçada, muro, fiação, construção)

5. RECOMENDAÇÃO TÉCNICA
   - Parecer para corte: (FAVORÁVEL / DESFAVORÁVEL / NECESSITA AVALIAÇÃO PRESENCIAL)
   - Justificativa técnica:
   - Condicionantes (se aplicável):
   - Medidas mitigatórias sugeridas (ex: plantio compensatório):

6. GRAU DE CONFIANÇA DA IDENTIFICAÇÃO
   (Alto / Médio / Baixo - justifique)
---

IMPORTANTE: Seja conservador. Se não for possível avaliar algo pela foto, indique "Não é possível avaliar pela imagem disponível."""

def stamp():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def data_iso():
    return datetime.now().strftime("%d/%m/%Y")

def data_hora():
    return datetime.now().strftime("%d/%m/%Y às %H:%M")

def perguntar(texto, padrao=""):
    resp = input(texto).strip()
    return resp if resp else padrao

def extrair_parecer(laudo):
    import re
    m = re.search(r"Parecer para corte:\s*(FAVORÁVEL|DESFAVORÁVEL|NECESSITA AVALIAÇÃO PRESENCIAL)", laudo, re.IGNORECASE)
    return m.group(1).upper() if m else "NÃO IDENTIFICADO"

def extrair_especie(laudo):
    import re
    m = re.search(r"Nome científico:\s*(.+)", laudo)
    return m.group(1).strip() if m else "Não identificada"

def analisar_com_gemini(caminho_imagem):
    imagem = Image.open(caminho_imagem)
    print(f"  Imagem: {caminho_imagem} ({imagem.size[0]}x{imagem.size[1]}px)")
    print("  Analisando...")
    genai.configure(api_key=API_KEY)
    modelo = genai.GenerativeModel(MODELO_PADRAO)
    resposta = modelo.generate_content(
        [PROMPT_VISTORIA, imagem],
        generation_config={"temperature": 0.15, "max_output_tokens": 8192},
    )
    if not resposta.text:
        raise ValueError("Resposta vazia do modelo")
    return resposta.text.strip()

def gerar_html(dados):
    estilo = """
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 2.5cm; color: #000; }
  h1 { text-align: center; font-size: 16pt; border-bottom: 2px solid #000; padding-bottom: 8px; }
  h2 { font-size: 13pt; margin-top: 20px; border-bottom: 1px solid #666; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  td { padding: 4px 8px; vertical-align: top; }
  td:first-child { font-weight: bold; width: 200px; }
  .parecer-favoravel { background: #d4edda; color: #155724; padding: 12px; border: 1px solid #c3e6cb; border-radius: 4px; font-weight: bold; text-align: center; font-size: 14pt; }
  .parecer-desfavoravel { background: #f8d7da; color: #721c24; padding: 12px; border: 1px solid #f5c6cb; border-radius: 4px; font-weight: bold; text-align: center; font-size: 14pt; }
  .parecer-presencial { background: #fff3cd; color: #856404; padding: 12px; border: 1px solid #ffeeba; border-radius: 4px; font-weight: bold; text-align: center; font-size: 14pt; }
  .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; border-top: 1px solid #999; padding-top: 10px; }
  .assinatura { margin-top: 60px; text-align: center; }
  .assinatura hr { width: 300px; }
  pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
</style>"""

    classes_parecer = {
        "FAVORÁVEL": "parecer-favoravel",
        "DESFAVORÁVEL": "parecer-desfavoravel",
        "NECESSITA AVALIAÇÃO PRESENCIAL": "parecer-presencial",
    }
    classe = classes_parecer.get(dados["parecer"], "parecer-presencial")

    justificativa = dados.get("justificativa", "")
    condicionantes = dados.get("condicionantes", "")

    html_just = f"<h2>JUSTIFICATIVA COMPLEMENTAR</h2><pre>{justificativa}</pre>" if justificativa else ""
    html_cond = f"<h2>CONDICIONANTES / RECOMENDAÇÕES</h2><pre>{condicionantes}</pre>" if condicionantes else ""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Parecer Técnico - {dados["numero"]}</title>{estilo}</head>
<body>
<h1>PARECER TÉCNICO DE VISTORIA AMBIENTAL</h1>

<table>
  <tr><td>Nº do Parecer:</td><td>{dados["numero"]}</td></tr>
  <tr><td>Data da Vistoria:</td><td>{dados["data_vistoria"]}</td></tr>
  <tr><td>Fiscal Responsável:</td><td>{dados["fiscal"]}</td></tr>
  <tr><td>Matrícula:</td><td>{dados["matricula"]}</td></tr>
  <tr><td>Solicitante:</td><td>{dados["solicitante"]}</td></tr>
  <tr><td>Endereço:</td><td>{dados["endereco"]}</td></tr>
  <tr><td>Bairro:</td><td>{dados["bairro"]}</td></tr>
  <tr><td>Cidade/UF:</td><td>{dados["cidade"]}</td></tr>
  <tr><td>Coordenadas:</td><td>{dados["coordenadas"]}</td></tr>
  <tr><td>Foto:</td><td>{dados["foto"]}</td></tr>
</table>

<h2>LAUDO TÉCNICO</h2>
<pre>{dados["laudo"]}</pre>

<h2>PARECER FINAL</h2>
<div class="{classe}">{dados["parecer"]}</div>

{html_just}
{html_cond}

<div class="assinatura">
  <p>{dados["data_parecer"]}</p>
  <hr>
  <p>{dados["fiscal"]}<br>Fiscal de Meio Ambiente<br>Matrícula {dados["matricula"]}</p>
</div>

<div class="footer">
  <p>Documento gerado por ferramenta assistiva de IA. O fiscal responsável deve validar todas as informações antes da emissão oficial.</p>
</div>
</body>
</html>"""

def main():
    print("\n" + "=" * 64)
    print("  SISTEMA DE VISTORIA AMBIENTAL - PARECER DE CORTE DE ÁRVORE")
    print("=" * 64 + "\n")

    if not API_KEY:
        print("Erro: defina a variavel GEMINI_API_KEY")
        print("  set GEMINI_API_KEY=sua_chave_aqui")
        print("  Chave gratuita: https://aistudio.google.com/apikey\n")
        sys.exit(1)

    if len(sys.argv) < 2:
        print(f"Uso: {sys.argv[0]} caminho/da/foto.jpg\n")
        sys.exit(1)

    caminho_foto = sys.argv[1]
    if not os.path.isfile(caminho_foto):
        print(f"Erro: arquivo nao encontrado: {caminho_foto}")
        sys.exit(1)

    print("--- DADOS DA VISTORIA ---\n")
    dados = {
        "foto": os.path.abspath(caminho_foto),
        "numero": perguntar("  Numero do parecer / protocolo: ") or f"PEA-{stamp()}",
        "data_vistoria": perguntar(f"  Data da vistoria (Enter = hoje): ") or data_iso(),
        "fiscal": perguntar("  Nome do fiscal responsavel: "),
        "matricula": perguntar("  Matricula / RF: "),
        "solicitante": perguntar("  Solicitante (nome do requerente): "),
        "endereco": perguntar("  Logradouro: "),
        "bairro": perguntar("  Bairro: "),
        "cidade": perguntar("  Cidade / UF: "),
        "coordenadas": perguntar("  Coordenadas GPS (opcional): ") or "Nao informado",
    }

    print("\n--- ANALISANDO FOTO COM IA ---")
    print(f"  Imagem: {caminho_foto}")
    print("  Identificando especie e avaliando saude...\n")

    try:
        laudo = analisar_com_gemini(caminho_foto)
    except Exception as e:
        print(f"\nErro na analise: {e}")
        sys.exit(1)

    dados["parecer"] = extrair_parecer(laudo)
    dados["especie"] = extrair_especie(laudo)
    dados["laudo"] = laudo

    print("=" * 64)
    print(laudo)
    print("=" * 64)
    print(f"\n>>> PARECER: {dados['parecer']} <<<\n")

    dados["justificativa"] = perguntar("Justificativa complementar do fiscal (opcional, Enter para pular):\n  ")
    dados["condicionantes"] = perguntar("Condicionantes / recomendacoes (opcional, Enter para pular):\n  ")
    dados["data_parecer"] = data_hora()

    print("\n--- GERANDO RELATORIOS ---")

    base = Path(caminho_foto).stem
    ts = stamp()
    txt_path = Path(f"parecer_{base}_{ts}.txt")
    html_path = Path(f"parecer_{base}_{ts}.html")

    linhas = [
        "=" * 70,
        "  PARECER TECNICO DE VISTORIA AMBIENTAL",
        "=" * 70,
        "",
        f"Numero do Parecer:     {dados['numero']}",
        f"Data da Vistoria:      {dados['data_vistoria']}",
        f"Fiscal Responsavel:    {dados['fiscal']}",
        f"Matricula:             {dados['matricula']}",
        f"Solicitante:           {dados['solicitante']}",
        f"Logradouro:            {dados['endereco']}",
        f"Bairro:                {dados['bairro']}",
        f"Cidade/UF:             {dados['cidade']}",
        f"Coordenadas:           {dados['coordenadas']}",
        f"Foto:                  {dados['foto']}",
        "",
        "-" * 70,
        "ESPECIE IDENTIFICADA: " + dados['especie'],
        "PARECER PARA CORTE:   " + dados['parecer'],
        "-" * 70,
        "",
        "LAUDO TECNICO:",
        "",
        laudo,
        "",
    ]
    txt = "\n".join(linhas)

    if dados["justificativa"]:
        txt += "\n\nJUSTIFICATIVA COMPLEMENTAR DO FISCAL:\n" + dados["justificativa"] + "\n"
    if dados["condicionantes"]:
        txt += "\nCONDICIONANTES / RECOMENDACOES:\n" + dados["condicionantes"] + "\n"

    txt += "\n" + "-" * 70 + "\n"
    txt += f"Parecer emitido em: {dados['data_parecer']}\n"
    txt += f"Fiscal: {dados['fiscal']} - Matr. {dados['matricula']}\n\n"
    txt += "Nota: Este parecer foi elaborado com auxilio de ferramenta de IA.\n"
    txt += "O fiscal responsavel deve validar todas as informacoes antes da emissao oficial.\n"

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(txt)
    print(f"  TXT:  {txt_path.resolve()}")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(gerar_html(dados))
    print(f"  HTML: {html_path.resolve()}")

    print(f"\n=== RELATORIOS GERADOS COM SUCESSO ===")
    print(f"  Especie: {dados['especie']}")
    print(f"  Parecer: {dados['parecer']}")
    print(f"  Proximo passo: abra o .html no navegador para imprimir em PDF\n")

if __name__ == "__main__":
    main()
