#!/usr/bin/env python3
"""
Simple HTTP server to serve the Bayesian Disease Prediction web application.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 65)
        print("🩺 DR. BAYES DISEASE PREDICTION SYSTEM & GAME SERVER")
        print("=" * 65)
        print(f" Serving directory : {DIRECTORY}")
        print(f" Local Web Address : {url}")
        print(" Press Ctrl+C in terminal to stop server.")
        print("=" * 65)
        
        # Open in default browser
        try:
            webbrowser.open(url)
        except Exception:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    run()
