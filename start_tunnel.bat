@echo off
cd /d "C:\Users\HCI\OneDrive\Desktop\first projerct\shawarma_nights"
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000 --logfile "C:\Users\HCI\OneDrive\Desktop\first projerct\shawarma_nights\tunnel.log"
