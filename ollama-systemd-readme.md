# Run Ollama as a systemd service (WSL / Linux)

This guide shows how to install **Ollama**, run it as a **systemd** service, set sane environment variables, and (optionally) expose it to your LAN when running inside **WSL2**.

> Works on Ubuntu, Debian, Oracle Linux, etc. WSL2 needs systemd enabled first.

---

## 1) Prereqs

- **NVIDIA GPU + driver** installed on Windows (if using WSL2).
- **WSL2** enabled and updated:
  ```powershell
  wsl --version
  wsl --update
  ```
- In your Linux shell:
  ```bash
  # Tools
  sudo apt/dnf install -y curl procps-ng || true
  # Confirm GPU visible (WSL): you should see your GPU
  nvidia-smi
  ```

---

## 2) Enable systemd in WSL2 (WSL only)

Inside your Linux distro (e.g., Ubuntu/Oracle Linux):
```bash
sudo nano /etc/wsl.conf
```
Add:
```ini
[boot]
systemd=true
```
Back in **Windows PowerShell**:
```powershell
wsl --shutdown
```
Re-open the distro and verify:
```bash
cat /proc/1/comm   # should print: systemd
```

> On a normal Linux (non-WSL) you can skip this step.

---

## 3) Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
which ollama && ollama --version
# Often installs to /usr/local/bin/ollama
```

---

## 4) Create the systemd service

Create the main unit (if the installer didn’t already):
```bash
sudo tee /etc/systemd/system/ollama.service >/dev/null <<'UNIT'
[Unit]
Description=Ollama LLM server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
# Adjust path if `which ollama` shows a different one
ExecStart=/usr/local/bin/ollama serve
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT
```

### 4.1 Add an override with environment variables

This fixes common WSL issues (e.g., `$HOME is not defined`) and sets useful defaults.

```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf >/dev/null <<'EOF'
[Service]
# Ensure HOME is set when running under systemd
Environment=HOME=/root

# Ollama server binding (safe default: local only)
Environment=OLLAMA_HOST=127.0.0.1:11434

# GPU/throughput tuning (tweak for your GPU)
Environment=OLLAMA_NUM_GPU_LAYERS=28
Environment=OLLAMA_NUM_CTX=8192
Environment=OLLAMA_KEEP_ALIVE=10m

# Where to store models (change if desired)
Environment=OLLAMA_MODELS=/var/lib/ollama

# Ensure a sensible working directory exists
WorkingDirectory=/root
EOF

# Create model dir if using the path above
sudo mkdir -p /var/lib/ollama
sudo chown -R root:root /var/lib/ollama
```

> If you prefer running as a non-root user, add `User=<youruser>` to the main unit and set `HOME`/`WorkingDirectory` accordingly; `chown -R <youruser>:<youruser> /var/lib/ollama`.

---

## 5) Start and enable the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ollama
systemctl status ollama --no-pager
```

You should see “**Active: active (running)**”.

---

## 6) Verify the API

```bash
curl http://127.0.0.1:11434/api/version
curl http://127.0.0.1:11434/api/tags
```

If you get JSON, you’re ready to pull/run models (e.g., `ollama pull llama3:8b-instruct-q4_K_M`).

---

## 7) Logs & troubleshooting

- Follow logs live:
  ```bash
  journalctl -u ollama -f
  ```
- Last 50 lines:
  ```bash
  journalctl -u ollama -n 50 --no-pager -l
  ```
- Check listening port:
  ```bash
  sudo ss -lntp | grep 11434 || echo "nothing on 11434"
  ```

**Common fixes:**

- **`panic: $HOME is not defined`** → Add `Environment=HOME=...` in the override (shown above).
- **Wrong binary path** → Ensure `ExecStart` matches `which ollama` (often `/usr/local/bin/ollama`).
- **Port in use** → Find process with `ss -lntp | grep 11434`, kill it, restart service.
- **GPU init errors** → Test CPU-only:
  ```bash
  OLLAMA_NUM_GPU_LAYERS=0 /usr/local/bin/ollama serve
  ```
  If CPU works, check NVIDIA driver/WSL GPU support (`nvidia-smi` in WSL).

---

## 8) (WSL only) Expose to your LAN (optional)

WSL2 is NAT’d; use **Windows portproxy** to forward a Windows port to WSL.

1) Get WSL IP:
   ```bash
   ip -4 addr show eth0 | awk '/inet /{print $2}' | cut -d/ -f1
   ```
2) In **Windows PowerShell (Admin)**:
   ```powershell
   # Replace <WSL_IP> with the IP above. Adjust subnet if needed.
   netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=11434 `
     connectaddress=<WSL_IP> connectport=11434

   New-NetFirewallRule -DisplayName "Ollama 11434 LAN" `
     -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434 `
     -RemoteAddress 192.168.1.0/24
   ```
3) From another device on your network:
   ```
   curl http://<your-windows-LAN-ip>:11434/api/tags
   ```

> If you don’t need LAN access, keep Ollama bound to `127.0.0.1` (default) for safety.

---

## 9) Change settings later

Edit the override:
```bash
sudo systemctl edit ollama
# (add/edit Environment= lines)
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Show effective env + working dir:
```bash
systemctl show -p Environment -p WorkingDirectory ollama
```

---

## 10) Quick uninstall / clean up

```bash
sudo systemctl disable --now ollama
sudo rm -f /etc/systemd/system/ollama.service
sudo rm -rf /etc/systemd/system/ollama.service.d
sudo systemctl daemon-reload

# (optional) remove models if you set OLLAMA_MODELS there
sudo rm -rf /var/lib/ollama
```

---

### Notes for co-running with Stable Diffusion (same GPU)

- To free VRAM for **SDXL** temporarily:
  ```bash
  sudo systemctl stop ollama
  # or lower GPU layers:
  sudo systemctl edit ollama  # set OLLAMA_NUM_GPU_LAYERS=16 (or 0 for CPU-only)
  sudo systemctl restart ollama
  ```
- For SD 1.5/2.1 day-to-day use, `OLLAMA_NUM_GPU_LAYERS=28` on a 24GB 3090 coexists nicely.

---
