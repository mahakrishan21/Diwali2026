"""Tiny threaded static server for local development: python3 e2m-diwali-server.py  ->  http://localhost:5173"""
import http.server, socketserver, functools, os
class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    request_queue_size = 128
    daemon_threads = True
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
root = os.path.dirname(os.path.abspath(__file__))
print("http://localhost:5173")
S(("127.0.0.1", 5173), functools.partial(H, directory=root)).serve_forever()
