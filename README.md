# Network Packet Sniffer

## Overview

The **Network Packet Sniffer** is a comprehensive tool designed to capture and analyze network packets in real-time. This project is divided into two main components:

- **Backend**: Handles packet capturing and analysis.
- **Frontend**: Provides a user-friendly interface to display the analyzed data.

## Features

- Real-time packet capturing.
- Supports multiple protocols, including TCP, UDP, and ICMP.
- Detailed analysis of packet information such as source/destination IPs, protocol types, and payload data.
- User-friendly web interface for monitoring and analysis.

## Installation

### Prerequisites

- **Python 3.x**: Ensure it's installed on your system.
- **Node.js and npm**: Required for the frontend application.

### Backend Setup

1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install the required Python packages:
   ```sh
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```
2. Install the necessary npm packages:
   ```sh
   npm install
   ```

## Usage

### Running the Backend
Start the backend server with administrator/root privileges to capture network packets:

```sh
sudo python3 app.py
```

### Running the Frontend
In a separate terminal, start the frontend application:

```sh
npm start
```

The frontend will typically be accessible at `http://localhost:3000`.

## Configuration

- **Network Interface**: By default, the backend captures packets from the primary network interface. You can specify a different interface in the backend configuration.
- **Filtering**: Implement protocol-specific filters in the backend to capture only desired traffic types.

## Contributing

We welcome contributions! Please fork the repository and submit pull requests for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.

## Contact

For any inquiries, feel free to reach out via [LinkedIn](https://www.linkedin.com/in/anilsinthu/) or email.
