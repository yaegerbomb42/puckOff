#!/bin/bash
# setup_vps.sh - Run this ON the Server (Oracle VM)

# 1. Update & Install Essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip ufw

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker ubuntu

# 3. Install Docker Compose
sudo apt install -y docker-compose-plugin

# 4. Firewall (UFW) - Allow SSH, HTTP, HTTPS, App Ports
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000:3005/tcp
echo "y" | sudo ufw enable

# 5. Message
echo "----------------------------------------"
echo "✅ VPS Setup Complete!"
echo "👉 Please logout and log back in for docker permissions to take effect."
echo "----------------------------------------"
