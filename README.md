# TRESOR-GUI — One-Click Deploy

## Schritte
1) ZIP entpacken nach `/opt/tresor-gui`
2) Deine Datei `dormant_wallets.json` (Array aus Public Keys) nach `/opt/tresor-gui/data/` kopieren
3) Ausführen:
   ```bash
   cd /opt/tresor-gui
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```
Frontend: http://127.0.0.1:5173 · Backend: http://127.0.0.1:8080
