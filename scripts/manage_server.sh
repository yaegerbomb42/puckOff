#!/bin/bash

# Configuration
SERVER_IP="147.224.158.118"
USER="ubuntu"
# Use absolute path so script works from anywhere (e.g. Desktop)
KEY_PATH="/Users/yaeger/Desktop/Projects/puckOff/ssh-key-2026-02-07private.key"
REMOTE_BASE="~/infra/landing-pages"
# Default to relative if running from project, otherwise warn/ask (simplified to hardcoded for now based on user request)
LOCAL_BASE="/Users/yaeger/Desktop/Projects/puckOff/infra/landing-pages"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for key
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}Error: SSH Key not found at $KEY_PATH${NC}"
    exit 1
fi

# Function: Show Server Stats
show_stats() {
    clear
    echo -e "${BLUE}=== Server Status ($SERVER_IP) ===${NC}"
    ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" $USER@$SERVER_IP "
        echo 'CPU/Memory:';
        docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' | head -n 5;
        echo '';
        echo 'Disk Usage:';
        df -h / | tail -n 1 | awk '{print \"Used: \" \$3 \" / \" \$2 \" (\" \$5 \")\"}';
    "
    echo -e "${BLUE}===============================${NC}"
    echo ""
}

# Function: Download
do_download() {
    echo -e "${GREEN}Fetching remote folder list...${NC}"
    ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" $USER@$SERVER_IP "ls -F $REMOTE_BASE"
    
    echo ""
    echo -e "Enter the name of the folder/file to download (e.g., 'raidball/' or 'raidball/index.html'):"
    read -r TARGET
    
    if [ -z "$TARGET" ]; then echo "Cancelled."; return; fi

    DEST="$HOME/Desktop/puckOff_Downloads"
    mkdir -p "$DEST"
    
    echo -e "${BLUE}Downloading $TARGET to $DEST...${NC}"
    scp -r -o StrictHostKeyChecking=no -i "$KEY_PATH" "$USER@$SERVER_IP:$REMOTE_BASE/$TARGET" "$DEST/"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Success! Saved to Desktop/puckOff_Downloads${NC}"
        open "$DEST"
    else
        echo -e "${RED}Download failed.${NC}"
    fi
    read -n 1 -s -r -p "Press any key to continue..."
}

# Function: Upload
do_upload() {
    echo -e "${GREEN}Select a file or folder from your computer.${NC}"
    echo "Tip: You can drag and drop a file/folder into this window."
    echo -n "Path to upload: "
    read -r LOCAL_PATH
    
    # Remove quotes if dragged/dropped
    LOCAL_PATH="${LOCAL_PATH//\"/}"
    LOCAL_PATH="${LOCAL_PATH//\'/}"
    
    if [ ! -e "$LOCAL_PATH" ]; then
        echo -e "${RED}File not found: $LOCAL_PATH${NC}"
        read -n 1 -s -r -p "Press any key to continue..."
        return
    fi

    echo ""
    echo -e "${GREEN}Remote folders:${NC}"
    ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" $USER@$SERVER_IP "ls -F $REMOTE_BASE"
    
    echo ""
    echo "Enter destination folder name (e.g., 'raidball')."
    echo "Leave empty to upload to root of landing-pages."
    read -r REMOTE_DIR
    
    FULL_DEST="$REMOTE_BASE/$REMOTE_DIR"
    
    echo -e "${BLUE}Uploading $(basename "$LOCAL_PATH") to $FULL_DEST...${NC}"
    scp -r -o StrictHostKeyChecking=no -i "$KEY_PATH" "$LOCAL_PATH" "$USER@$SERVER_IP:$FULL_DEST"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Upload Complete!${NC}"
    else
        echo -e "${RED}Upload failed.${NC}"
    fi
    read -n 1 -s -r -p "Press any key to continue..."
}

# Main Loop
while true; do
    show_stats
    echo "1) 📂 Download from Server"
    echo "2) 📤 Upload to Server"
    echo "3) 🔄 Refresh Stats"
    echo "q) Quit"
    echo ""
    read -n 1 -p "Select an option: " OPTION
    echo ""
    
    case $OPTION in
        1) do_download ;;
        2) do_upload ;;
        3) ;; # Just loops to refresh
        q) exit 0 ;;
        *) echo "Invalid option"; sleep 1 ;;
    esac
done
