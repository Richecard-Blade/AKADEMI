#!/usr/bin/env python3
"""
PhoneKey — Serveur local prêt à l'emploi
=========================================
Lance un serveur sur ton ordinateur.
Ouvre l'URL affichée sur ton smartphone → clavier instantané.

Dépendances : pip install websockets qrcode
Injection    : xdotool (Linux) | osascript (macOS) | pyautogui (Windows)
"""

import asyncio
import http.server
import json
import os
import platform
import re
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

# ─── Configuration ────────────────────────────────────────────────────────────

HTTP_PORT = 7832
WS_PORT   = 7833
PIN       = str(os.getenv("PHONEKEY_PIN", ""))   # optionnel : PHONEKEY_PIN=1234

# ─── Détection OS et injector ────────────────────────────────────────────────

OS = platform.system()   # 'Linux', 'Darwin', 'Windows'

def inject_text(text: str):
    """Injecte du texte brut dans l'application active."""
    try:
        if OS == "Linux":
            subprocess.run(["xdotool", "type", "--clearmodifiers", "--", text], check=True)
        elif OS == "Darwin":
            safe = text.replace("\\", "\\\\").replace('"', '\\"')
            subprocess.run(["osascript", "-e",
                f'tell application "System Events" to keystroke "{safe}"'], check=True)
        elif OS == "Windows":
            import pyautogui
            pyautogui.typewrite(text, interval=0.02)
    except FileNotFoundError as e:
        print(f"[ERREUR injection] Commande manquante : {e}")
    except Exception as e:
        print(f"[ERREUR injection] {e}")

def inject_key(key: str, modifiers: list[str]):
    """Injecte une touche spéciale avec modificateurs."""
    try:
        if OS == "Linux":
            combo = "+".join(modifiers + [key]) if modifiers else key
            subprocess.run(["xdotool", "key", "--clearmodifiers", combo], check=True)
        elif OS == "Darwin":
            _macos_key(key, modifiers)
        elif OS == "Windows":
            import pyautogui
            if modifiers:
                pyautogui.hotkey(*[m.lower() for m in modifiers], key)
            else:
                pyautogui.press(key)
    except FileNotFoundError as e:
        print(f"[ERREUR injection] Commande manquante : {e}")
    except Exception as e:
        print(f"[ERREUR injection] {e}")

def _macos_key(key: str, modifiers: list[str]):
    """Construit l'appel AppleScript pour touche spéciale."""
    # Mapping touches → AppleScript
    key_map = {
        "Return": "return", "BackSpace": "delete", "Escape": "escape",
        "Tab": "tab", "space": "space",
        "Left": "left arrow", "Right": "right arrow",
        "Up": "up arrow", "Down": "down arrow",
        "Home": "home", "End": "end", "Delete": "forward delete",
        "Page_Up": "page up", "Page_Down": "page down",
        **{f"F{i}": f"f{i}" for i in range(1, 13)},
    }
    mod_map = {"ctrl": "command down", "alt": "option down",
               "shift": "shift down", "super": "command down"}

    as_key  = key_map.get(key, key)
    as_mods = ", ".join(mod_map[m.lower()] for m in modifiers if m.lower() in mod_map)
    using   = f" using {{{as_mods}}}" if as_mods else ""
    script  = f'tell application "System Events" to key code (key code "{as_key}"){using}'
    subprocess.run(["osascript", "-e", script])

# ─── Clavier HTML embarqué ───────────────────────────────────────────────────

def build_html(ws_port: int, pin: str, local_ip: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>PhoneKey</title>
<style>
  *{{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}}
  body{{margin:0;background:#0F0F1A;color:#EEE;font-family:system-ui,sans-serif;
        display:flex;flex-direction:column;height:100dvh;overflow:hidden}}
  #topbar{{display:flex;align-items:center;justify-content:space-between;
            padding:8px 14px;background:#1A1A2E;border-bottom:1px solid #2A2A5E;flex-shrink:0}}
  #logo{{font-weight:700;font-size:15px;color:#EEE}}
  #status{{font-size:12px;font-weight:500;padding:3px 10px;border-radius:20px}}
  .s-ok{{background:#0a3325;color:#00C896}}
  .s-err{{background:#3a0a0a;color:#FF4757}}
  .s-wait{{background:#2a2a0a;color:#FFB800}}
  #preview{{flex-shrink:0;background:#16213E;padding:8px 12px;font-size:14px;
             color:#8888BB;min-height:38px;border-bottom:1px solid #2A2A5E;
             word-break:break-all;max-height:60px;overflow:hidden}}
  #tabs{{display:flex;background:#1A1A2E;border-bottom:1px solid #2A2A5E;flex-shrink:0}}
  .tab{{flex:1;padding:8px 4px;text-align:center;font-size:12px;color:#8888BB;
         cursor:pointer;border-bottom:2px solid transparent}}
  .tab.active{{color:#E94560;border-bottom-color:#E94560}}
  #layout{{flex:1;overflow-y:auto;background:#16213E;padding:6px 3px}}
  .row{{display:flex;justify-content:center;margin:2px 0}}
  .key{{background:#0F3460;border:none;border-radius:8px;color:#FFF;
         font-size:15px;font-weight:600;min-height:48px;min-width:28px;
         flex:1;margin:2px;display:flex;align-items:center;justify-content:center;
         cursor:pointer;border-bottom:3px solid #091F3A;position:relative;
         transition:background 80ms,transform 80ms;-webkit-touch-callout:none;
         flex-direction:column;gap:2px}}
  .key:active,.key.pressed{{background:#E94560;border-bottom-width:0;transform:translateY(2px)}}
  .key.mod{{background:#1A1A4E}}
  .key.mod.active{{background:#E94560}}
  .key.wide{{flex:2}}
  .key.wider{{flex:3}}
  .key.widest{{flex:5}}
  .key .sub{{font-size:9px;color:#8888BB;position:absolute;top:4px;right:5px}}
  #quickbar{{display:flex;background:#1A1A2E;border-top:1px solid #2A2A5E;
              padding:6px 4px;flex-shrink:0}}
  .qbtn{{flex:1;background:transparent;border:none;color:#8888BB;font-size:11px;
          padding:4px 2px;cursor:pointer;text-align:center}}
  .qbtn:active{{color:#E94560}}
  #pin-screen{{position:fixed;inset:0;background:#0F0F1A;display:flex;
                flex-direction:column;align-items:center;justify-content:center;gap:16px;
                z-index:100}}
  #pin-screen h2{{color:#EEE;margin:0}}
  #pin-input{{background:#1A1A2E;border:2px solid #2A2A5E;border-radius:12px;
               color:#EEE;font-size:28px;letter-spacing:12px;padding:12px 20px;
               width:200px;text-align:center}}
  #pin-btn{{background:#E94560;border:none;border-radius:12px;color:#FFF;
             font-size:16px;font-weight:600;padding:12px 32px;cursor:pointer}}
</style>
</head>
<body>

{'<div id="pin-screen"><h2>🔐 PhoneKey</h2><p style="color:#8888BB">Entrez le PIN du serveur</p><input id="pin-input" type="password" inputmode="numeric" maxlength="8" placeholder="• • • •"><button id="pin-btn">Connecter</button></div>' if pin else ''}

<div id="topbar">
  <span id="logo">⌨ PhoneKey</span>
  <span id="status" class="s-wait">Connexion…</span>
</div>
<div id="preview" id="prev">…</div>
<div id="tabs">
  <div class="tab active" onclick="switchTab('qwerty')">QWERTY</div>
  <div class="tab" onclick="switchTab('special')">Spéciaux</div>
  <div class="tab" onclick="switchTab('macros')">Macros</div>
  <div class="tab" onclick="switchTab('numpad')">Pavé</div>
</div>
<div id="layout"></div>
<div id="quickbar">
  <button class="qbtn" onclick="sendCombo(['ctrl'],'c')">Copier</button>
  <button class="qbtn" onclick="sendCombo(['ctrl'],'v')">Coller</button>
  <button class="qbtn" onclick="sendCombo(['ctrl'],'a')">Tout sél.</button>
  <button class="qbtn" onclick="sendCombo(['ctrl'],'z')">Annuler</button>
  <button class="qbtn" onclick="sendCombo(['ctrl','shift'],'z')">Rétablir</button>
</div>

<script>
const WS_URL = "ws://{local_ip}:{ws_port}";
const PIN    = "{pin}";
const LAYOUTS = {{
  qwerty: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l","BackSpace:⌫:wide"],
    ["SHIFT:⇧:wide:mod","z","x","c","v","b","n","m","ENTER:↵:wide"],
    ["CTRL:Ctrl:wide:mod","ALT:Alt:mod","SPACE: :widest","LEFT:←","RIGHT:→","ESC:Esc"]
  ],
  special: [
    ["F1","F2","F3","F4","F5","F6"],
    ["F7","F8","F9","F10","F11","F12"],
    ["INS:Ins","DEL:Del","HOME:Home","END:End","PGUP:PgUp","PGDN:PgDn"],
    ["UP:↑","DOWN:↓","LEFT:←","RIGHT:→","TAB:Tab","ESC:Esc"],
    ["PRTSC:PrtSc","NUMLK:NumLk","CAPS:CapsLk:mod","SUPER:⊞:mod"]
  ],
  macros: [
    ["macro:Git commit:_git_commit:wider","macro:npm run dev:npm run dev:wider"],
    ["macro:Cordialement\\n:_sign:wider","macro:TODO\\: :_todo:wider"],
    ["macro:console.log():_clog:wider","macro:SELECT * FROM :_sql:wider"],
    ["macro:→ :→ ","macro:✓ :✓ ","macro:✗ :✗ ","macro:… :… "]
  ],
  numpad: [
    ["7","8","9","DIVIDE:/"],
    ["4","5","6","MULTIPLY:*"],
    ["1","2","3","MINUS:-"],
    ["NUMPAD0:0:wider","DECIMAL:.","RETURN:↵","PLUS:+"]
  ]
}};
const MACRO_TEXT = {{
  _git_commit:"git commit -m \\"feat: \\"",
  _sign:"Cordialement,\\n",
  _todo:"TODO: ",
  _clog:"console.log('', );",
  _sql:"SELECT * FROM "
}};

let ws, mods={{}}, connected=false, tab="qwerty", prevText="";

function connect() {{
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {{ connected=true; setStatus("Connecté ✓","s-ok");
    if(PIN) {{ ws.send(JSON.stringify({{type:"auth",pin:PIN}})); }} }};
  ws.onclose = () => {{ connected=false; setStatus("Déconnecté","s-err");
    setTimeout(connect, 2000); }};
  ws.onerror = () => setStatus("Erreur réseau","s-err");
  ws.onmessage = e => {{ const d=JSON.parse(e.data);
    if(d.type==="ack"&&d.preview!==undefined) updatePreview(d.preview); }};
}}

function setStatus(t,cls) {{
  const el=document.getElementById("status");
  el.textContent=t; el.className="s-ok s-err s-wait".split(" ")
    .reduce((a,c)=>{{a.className=a.className.replace(c,"");return a;}},el).className;
  el.className=cls;
}}

function send(msg) {{
  if(ws&&ws.readyState===1) ws.send(JSON.stringify(msg));
}}

function sendKey(key, extra=[]) {{
  const activeMods=Object.keys(mods).filter(m=>mods[m]);
  send({{type:"key", key, modifiers:[...activeMods,...extra]}});
  // auto-release shift after 1 key
  if(mods.shift && key!=="SHIFT") {{ mods.shift=false; renderLayout(); }}
}}

function sendText(text) {{ send({{type:"text", text}}); }}
function sendCombo(ms,key) {{ send({{type:"key", key:key.toUpperCase(), modifiers:ms}}); }}

function pressKey(def) {{
  const parts = def.split(":");
  const id    = parts[0];
  if(id==="macro") {{ handleMacro(parts[2]||parts[1]); return; }}
  const isMod = ["SHIFT","CTRL","ALT","SUPER","CAPS"].includes(id);
  if(isMod) {{
    const mk = id.toLowerCase();
    mods[mk] = !mods[mk];
    renderLayout();
    return;
  }}
  if(id.length===1) {{ sendKey(mods.shift ? id.toUpperCase() : id); }}
  else              {{ sendKey(id); }}
}}

function handleMacro(val) {{
  const text = MACRO_TEXT[val] || val;
  sendText(text);
}}

function switchTab(t) {{
  tab=t;
  document.querySelectorAll(".tab").forEach((el,i)=>
    el.classList.toggle("active", ["qwerty","special","macros","numpad"][i]===t));
  renderLayout();
}}

function renderLayout() {{
  const rows = LAYOUTS[tab];
  const el   = document.getElementById("layout");
  el.innerHTML = rows.map(row=>
    `<div class="row">${{row.map(def=>{{
      const p=def.split(":");
      const id=p[0], label=p[1]||p[0], size=p[2]||"", cls=p[3]||"";
      const isMod=["SHIFT","CTRL","ALT","SUPER","CAPS"].includes(id);
      const isActive=isMod && mods[id.toLowerCase()];
      return `<button class="key ${{size}} ${{cls}} ${{isActive?"active":""}}"
        ontouchstart="pressKey('${{def}}')" onclick="pressKey('${{def}}')"
        >${{label}}</button>`;
    }}).join("")}}</div>`
  ).join("");
}}

function updatePreview(text) {{
  prevText=text;
  const el=document.getElementById("preview");
  el.textContent=text||"…";
}}

// PIN screen
if(PIN) {{
  document.getElementById("pin-btn").onclick = () => {{
    const entered=document.getElementById("pin-input").value;
    localStorage.setItem("pk_pin",entered);
    location.reload();
  }};
  const saved=localStorage.getItem("pk_pin");
  if(saved) document.getElementById("pin-input").value=saved;
}}

renderLayout();
connect();
</script>
</body>
</html>"""

# ─── WebSocket handler ────────────────────────────────────────────────────────

authenticated_clients: set = set()
preview_text = ""

async def ws_handler(websocket):
    global preview_text
    client = websocket.remote_address
    print(f"[+] Smartphone connecté : {client[0]}")

    try:
        async for raw in websocket:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type", "")

            # Authentification PIN
            if PIN and websocket not in authenticated_clients:
                if mtype == "auth" and msg.get("pin") == PIN:
                    authenticated_clients.add(websocket)
                    await websocket.send(json.dumps({"type": "auth_ok"}))
                    print(f"[✓] Client {client[0]} authentifié")
                else:
                    await websocket.send(json.dumps({"type": "auth_fail"}))
                    continue

            if mtype == "text":
                text = msg.get("text", "")
                if text:
                    print(f"[→] Texte : {repr(text)}")
                    preview_text = (preview_text + text)[-60:]
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(None, inject_text, text)
                    await websocket.send(json.dumps({"type": "ack", "preview": preview_text}))

            elif mtype == "key":
                key  = msg.get("key", "")
                mods = msg.get("modifiers", [])
                if key:
                    print(f"[→] Touche : {'+'.join(mods + [key]) if mods else key}")
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(None, inject_key, key, mods)
                    # Mise à jour preview pour les touches spéciales
                    if key == "BackSpace" and not mods:
                        preview_text = preview_text[:-1]
                    elif key == "Return" and not mods:
                        preview_text = ""
                    await websocket.send(json.dumps({"type": "ack", "preview": preview_text}))

    except Exception as e:
        if "ConnectionClosed" not in type(e).__name__:
            print(f"[!] Erreur client : {e}")
    finally:
        authenticated_clients.discard(websocket)
        print(f"[-] Smartphone déconnecté : {client[0]}")

# ─── HTTP server (sert le clavier HTML) ──────────────────────────────────────

class KeyboardHandler(http.server.BaseHTTPRequestHandler):
    html_content: bytes = b""

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(self.html_content))
        self.end_headers()
        self.wfile.write(self.html_content)

    def log_message(self, *args):
        pass  # Silence les logs HTTP

# ─── Obtenir IP locale ────────────────────────────────────────────────────────

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

# ─── Afficher QR code dans le terminal ───────────────────────────────────────

def print_qr(url: str):
    try:
        import qrcode
        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
    except ImportError:
        pass  # QR code optionnel

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    import websockets

    local_ip = get_local_ip()
    url      = f"http://{local_ip}:{HTTP_PORT}"
    ws_url   = f"ws://{local_ip}:{WS_PORT}"

    # Construire le HTML avec l'IP et port corrects
    html = build_html(WS_PORT, PIN, local_ip)
    KeyboardHandler.html_content = html.encode("utf-8")

    # Lancer HTTP server dans un thread séparé
    http_server = http.server.HTTPServer(("0.0.0.0", HTTP_PORT), KeyboardHandler)
    t = threading.Thread(target=http_server.serve_forever, daemon=True)
    t.start()

    # Affichage
    print("\n" + "═" * 52)
    print("  ⌨  PhoneKey — Clavier smartphone activé")
    print("═" * 52)
    print(f"\n  📱 Sur ton smartphone, ouvre :")
    print(f"\n      {url}\n")
    print_qr(url)
    if PIN:
        print(f"  🔐 PIN requis : {PIN}")
    print(f"  💻 OS détecté : {OS}")
    print(f"  🔌 WebSocket  : {ws_url}")
    print("\n  Ctrl+C pour arrêter\n" + "═" * 52 + "\n")

    # Vérifier xdotool sur Linux
    if OS == "Linux":
        r = subprocess.run(["which", "xdotool"], capture_output=True)
        if r.returncode != 0:
            print("  ⚠  xdotool non trouvé. Installe-le :")
            print("     sudo apt install xdotool    (Ubuntu/Debian)")
            print("     sudo dnf install xdotool    (Fedora)")
            print("     sudo pacman -S xdotool      (Arch)\n")

    # Lancer WebSocket server
    async def serve():
        async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
            print("  [✓] Serveur prêt. En attente de connexion smartphone…\n")
            await asyncio.Future()

    asyncio.run(serve())

if __name__ == "__main__":
    main()
