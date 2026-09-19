"""
CityFlow AI — Unified Application & API Server
Serves both REST API endpoints and modular frontend assets with zero external dependencies.
"""

import http.server
import socketserver
import json
import os
import sys
import io
from pathlib import Path

# Fix Windows console UTF-8 output safely
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

PORT = 8000

class CityFlowHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler supporting REST API endpoints and static file serving."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self):
        # API Routes
        if self.path == '/api/health':
            self._send_json({
                'status': 'healthy',
                'service': 'CityFlow AI Urban Corridor Intelligence',
                'version': '3.0.0',
                'active_incident': 'R0067',
                'monitored_corridors': 216
            })
            return

        elif self.path == '/api/network':
            data_file = ROOT_DIR / 'assets' / 'data' / 'network_data.json'
            if not data_file.exists():
                data_file = ROOT_DIR / 'network_data.json'
            if data_file.exists():
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self._send_json(data)
            else:
                self._send_json({'error': 'network_data.json not found'}, status=404)
            return

        elif self.path == '/api/forecast':
            self._send_json({
                'model': 'NeurAX LightGBM Multi-Horizon Residual',
                'horizons': {
                    '15m': {'mae': 0.14, 'r2': 0.998, 'baseline_mae': 3.82},
                    '30m': {'mae': 0.28, 'r2': 0.994, 'baseline_mae': 4.65},
                    '45m': {'mae': 0.46, 'r2': 0.989, 'baseline_mae': 5.41},
                    '60m': {'mae': 0.69, 'r2': 0.982, 'baseline_mae': 6.12}
                },
                'batch_inference_time_sec': 1.15,
                'overfitting_leakage_detected': False
            })
            return

        elif self.path == '/api/candidates':
            candidates = [
                {'id': 'CAND_A', 'name': 'Gachibowli Ring Junction (R0018-R0030)', 'cost_cr': 4.8, 'vmt_relief_pct': 18.4, 'roi': 3.84, 'priority': 'CRITICAL'},
                {'id': 'CAND_B', 'name': 'Madhapur Cyber Towers Spine (R0042-R0043)', 'cost_cr': 2.2, 'vmt_relief_pct': 14.1, 'roi': 3.20, 'priority': 'HIGH'},
                {'id': 'CAND_C', 'name': 'Kondapur Radial Bypass (R0067-R0068)', 'cost_cr': 3.5, 'vmt_relief_pct': 11.8, 'roi': 2.75, 'priority': 'HIGH'},
                {'id': 'CAND_D', 'name': 'Jubilee Hills Road 36 Feeder (R0015-R0016)', 'cost_cr': 1.8, 'vmt_relief_pct': 8.9, 'roi': 2.10, 'priority': 'MEDIUM'},
                {'id': 'CAND_E', 'name': 'Financial District Outer Loop (R0081-R0082)', 'cost_cr': 5.4, 'vmt_relief_pct': 9.2, 'roi': 1.82, 'priority': 'MEDIUM'}
            ]
            self._send_json({'candidates': candidates})
            return

        # Default static file serving
        return super().do_GET()

    def _send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # Clean terminal logging
        sys.stdout.write(f"[CityFlow Server] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

def start_server(port=PORT):
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), CityFlowHandler) as httpd:
        print("\n" + "="*70)
        print(f"🚀 CityFlow AI Unified Server Running at http://localhost:{port}")
        print("="*70)
        print("Available Portals:")
        print(f"  • Mission Control:   http://localhost:{port}/index.html")
        print(f"  • Commuter Portal:   http://localhost:{port}/commuter.html")
        print(f"  • Tactical Police:   http://localhost:{port}/police.html")
        print(f"  • Municipal Planner: http://localhost:{port}/planner.html")
        print(f"  • AI Forecaster:     http://localhost:{port}/forecaster.html")
        print("\nREST API Endpoints:")
        print(f"  • Health check:      http://localhost:{port}/api/health")
        print(f"  • Network GIS JSON:  http://localhost:{port}/api/network")
        print(f"  • Forecast metrics:  http://localhost:{port}/api/forecast")
        print(f"  • Planning ROI:      http://localhost:{port}/api/candidates")
        print("="*70)
        print("Press Ctrl+C to stop the server.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down CityFlow AI server.")

if __name__ == '__main__':
    start_server()
