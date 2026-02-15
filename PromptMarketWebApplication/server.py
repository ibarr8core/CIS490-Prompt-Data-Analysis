#!/usr/bin/env python3
"""
Simple local HTTP server for UI preview.
Serves the frontend directory on port 8000. Cross-platform.
Uses only Python built-in http.server (no Flask).
"""

import http.server
import os
import socketserver
import webbrowser

PORT = 8000

def main():
    # Serve the frontend directory (script may be in project root or inside frontend/)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    if os.path.isdir(frontend_dir):
        os.chdir(frontend_dir)
    else:
        os.chdir(base_dir)

    handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        pages_url = f"http://localhost:{PORT}/pages/"
        print(f"Serving at http://localhost:{PORT}")
        print(f"  Pages: {pages_url}")
        print("Press Ctrl+C to stop.")
        webbrowser.open(pages_url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.")

if __name__ == "__main__":
    main()
