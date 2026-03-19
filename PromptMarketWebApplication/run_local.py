#!/usr/bin/env python3
"""Run the Prompt Marketplace frontend locally with a simple HTTP server."""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8080
# Resolve paths relative to this script so it works from any folder
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(SCRIPT_DIR, "frontend")


def main():
    if not os.path.isdir(FRONTEND_DIR):
        print(f"Error: frontend folder not found at {FRONTEND_DIR}")
        sys.exit(1)
    os.chdir(FRONTEND_DIR)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"Serving at {url}")
        print(f"Directory: {os.path.abspath(FRONTEND_DIR)}")
        print("Press Ctrl+C to stop.\n")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
