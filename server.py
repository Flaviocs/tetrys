#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import sys

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable caching-free development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    server_address = ('', port)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(server_address, Handler) as httpd:
        url = f"http://localhost:{port}"
        print(f"==================================================")
        print(f"🕹️  Tetris Arcade rodando em: {url}")
        print(f"Pressione Ctrl+C para encerrar o servidor.")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor encerrado.")

if __name__ == '__main__':
    main()
