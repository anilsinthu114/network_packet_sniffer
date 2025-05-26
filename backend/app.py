from flask import Flask, jsonify, request, abort, render_template
from flask_cors import CORS
import pyshark
import psutil
import threading
import socket
import logging
import subprocess

app = Flask(__name__)
CORS(app)

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Global data for real-time updates
packet_data = {}  # Store packets per interface
cpu_usage = []
lock = threading.Lock()

# Get list of interfaces using tshark -D
def get_available_interfaces():
    try:
        output = subprocess.check_output(['tshark', '-D']).decode()
        interfaces = []
        for line in output.strip().split('\n'):
            parts = line.split('. ', 1)
            if len(parts) == 2:
                interfaces.append(parts[1].strip())
        return interfaces
    except subprocess.CalledProcessError as e:
        logging.error(f"Error fetching interfaces: {e}")
        return []

# Packet sniffing for a specific interface
def sniff_packets_for_interface(interface):
    try:
        capture = pyshark.LiveCapture(interface=interface)
        logging.info(f"Started sniffing on interface: {interface}")

        for packet in capture.sniff_continuously(packet_count=100):
            try:
                packet_info = {
                    "Interface": interface,
                    "Source MAC": getattr(packet.eth, 'src', "N/A"),
                    "Destination MAC": getattr(packet.eth, 'dst', "N/A"),
                    "Source": getattr(packet.ip, 'src', "N/A") if hasattr(packet, 'ip') else "N/A",
                    "Destination": getattr(packet.ip, 'dst', "N/A") if hasattr(packet, 'ip') else "N/A",
                    "Protocol": packet.highest_layer,
                    "Length": packet.length,
                }
                with lock:
                    if interface not in packet_data:
                        packet_data[interface] = []
                    packet_data[interface].append(packet_info)
                    if len(packet_data[interface]) > 100:
                        packet_data[interface].pop(0)
            except AttributeError as e:
                logging.warning(f"[{interface}] Skipped packet: {e}")
    except Exception as e:
        logging.error(f"Error sniffing on {interface}: {e}")

# Monitor system performance
def monitor_system():
    while True:
        with lock:
            cpu_usage.append(psutil.cpu_percent(interval=1))
            if len(cpu_usage) > 60:
                cpu_usage.pop(0)

# Start sniffing on all interfaces
def start_sniffing_on_all_interfaces():
    interfaces = get_available_interfaces()
    if not interfaces:
        logging.error("No interfaces found.")
        return
    for interface in interfaces:
        threading.Thread(target=sniff_packets_for_interface, args=(interface,), daemon=True).start()

# Port scanning
def port_scanner(target, ports):
    results = []
    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex((target, port))
            if result == 0:
                results.append({"Port": port, "Status": "Open"})
            sock.close()
        except Exception as e:
            logging.error(f"Error scanning port {port}: {e}")
    return results

@app.route('/api/packets', methods=['GET'])
def get_packets():
    with lock:
        if not packet_data:
            return jsonify({"message": "No packets captured yet."})
        return jsonify(packet_data)

@app.route('/api/system', methods=['GET'])
def get_system_data():
    with lock:
        return jsonify({
            "CPU Usage": cpu_usage[-1] if cpu_usage else 0,
            "CPU History": cpu_usage
        })

@app.route('/api/scan', methods=['GET', 'POST'])
def scan_ports():
    if request.method == 'POST':
        data = request.get_json()
        target = data.get("target")
        ports = data.get("ports", range(1, 1025))
    elif request.method == 'GET':
        target = request.args.get('ip')
        ports = range(1, 1025)

    if not target:
        abort(400, description="Target IP is required.")

    try:
        result = port_scanner(target, ports)
        return jsonify(result) if result else jsonify({"message": "No open ports found"})
    except Exception as e:
        logging.error(f"Error in scanning ports: {e}")
        abort(500, description="Port scan failed.")

@app.route('/api/interfaces', methods=['GET'])
def list_interfaces():
    return jsonify({"interfaces": get_available_interfaces()})

@app.route('/')
def index():
    return render_template('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": str(e)}), 400

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": str(e)}), 500

# Start background threads
threading.Thread(target=start_sniffing_on_all_interfaces, daemon=True).start()
threading.Thread(target=monitor_system, daemon=True).start()

if __name__ == "__main__":
    app.run(debug=True)
