/**
 * TCP Packet Definition and Header Inspector Engine
 * Handles packet generation, sequence/acknowledgment math, and inspector UI.
 */

class TCPPacket {
  constructor({
    id = 1,
    step = 1,
    type = 'SYN',
    source = 'Client',
    destination = 'Server',
    srcIp = '192.168.1.100',
    dstIp = '192.168.1.1',
    srcPort = 50000,
    dstPort = 80,
    seq = 1000,
    ack = 0,
    flags = { SYN: 1, ACK: 0, FIN: 0, RST: 0, PSH: 0, URG: 0 },
    windowSize = 64240,
    dataOffset = 5, // 5 x 32 bits = 20 bytes standard header
    payloadSize = 0,
    status = 'success', // 'success', 'lost', 'delayed', 'retransmit'
    description = ''
  }) {
    this.id = id;
    this.step = step;
    this.type = type;
    this.source = source;
    this.destination = destination;
    this.srcIp = srcIp;
    this.dstIp = dstIp;
    this.srcPort = Number(srcPort);
    this.dstPort = Number(dstPort);
    this.seq = Number(seq);
    this.ack = Number(ack);
    this.flags = flags;
    this.windowSize = Number(windowSize);
    this.dataOffset = dataOffset;
    this.headerLength = dataOffset * 4; // in bytes
    this.payloadSize = payloadSize;
    this.status = status;
    this.description = description;
    this.timestamp = new Date().toLocaleTimeString();
  }

  getFlagString() {
    const active = [];
    if (this.flags.SYN) active.push('SYN');
    if (this.flags.ACK) active.push('ACK');
    if (this.flags.FIN) active.push('FIN');
    if (this.flags.RST) active.push('RST');
    if (this.flags.PSH) active.push('PSH');
    if (this.flags.URG) active.push('URG');
    return active.join(', ') || 'NONE';
  }
}

/**
 * Packet Factory for generating standard 3-way handshake packets
 */
const PacketFactory = {
  createHandshakePackets(clientISN = 1000, serverISN = 5000, clientPort = 50000, serverPort = 80) {
    const cISN = parseInt(clientISN, 10) || 1000;
    const sISN = parseInt(serverISN, 10) || 5000;
    const cPort = parseInt(clientPort, 10) || 50000;
    const sPort = parseInt(serverPort, 10) || 80;

    // Step 1: SYN (Client -> Server)
    // Client sends its initial sequence number (ISN). Ack is 0 because no connection exists yet.
    const synPacket = new TCPPacket({
      id: 1,
      step: 1,
      type: 'SYN',
      source: 'Client (192.168.1.100)',
      destination: 'Server (192.168.1.1)',
      srcPort: cPort,
      dstPort: sPort,
      seq: cISN,
      ack: 0,
      flags: { SYN: 1, ACK: 0, FIN: 0, RST: 0, PSH: 0, URG: 0 },
      windowSize: 64240,
      description: `Client initiates connection. Flags: [SYN]. Seq=${cISN}. Client advertises its Initial Sequence Number (ISN) and requests a synchronized session.`
    });

    // Step 2: SYN-ACK (Server -> Client)
    // Server acknowledges client's SYN (ack = cISN + 1) and advertises its own ISN (sISN).
    // Note: SYN consumes 1 phantom sequence number byte so it can be reliably acknowledged!
    const synAckPacket = new TCPPacket({
      id: 2,
      step: 2,
      type: 'SYN-ACK',
      source: 'Server (192.168.1.1)',
      destination: 'Client (192.168.1.100)',
      srcPort: sPort,
      dstPort: cPort,
      seq: sISN,
      ack: cISN + 1,
      flags: { SYN: 1, ACK: 1, FIN: 0, RST: 0, PSH: 0, URG: 0 },
      windowSize: 65535,
      description: `Server acknowledges client's SYN and sends its own. Flags: [SYN, ACK]. Seq=${sISN}, Ack=${cISN + 1}. Ack number = client Seq + 1.`
    });

    // Step 3: ACK (Client -> Server)
    // Client acknowledges server's SYN (ack = sISN + 1). Seq is now cISN + 1.
    const ackPacket = new TCPPacket({
      id: 3,
      step: 3,
      type: 'ACK',
      source: 'Client (192.168.1.100)',
      destination: 'Server (192.168.1.1)',
      srcPort: cPort,
      dstPort: sPort,
      seq: cISN + 1,
      ack: sISN + 1,
      flags: { SYN: 0, ACK: 1, FIN: 0, RST: 0, PSH: 0, URG: 0 },
      windowSize: 64240,
      description: `Client acknowledges server's SYN. Flags: [ACK]. Seq=${cISN + 1}, Ack=${sISN + 1}. Connection is now full duplex ESTABLISHED.`
    });

    return [synPacket, synAckPacket, ackPacket];
  }
};

/**
 * Packet Inspector UI Component
 */
const PacketInspector = {
  render(packet, containerId = 'packet-inspector-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!packet) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.5rem; opacity: 0.5;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p style="font-size: 0.9rem;">Start or step through the simulation to inspect transmitted TCP packets.</p>
        </div>
      `;
      return;
    }

    const flagKeys = ['URG', 'ACK', 'PSH', 'RST', 'SYN', 'FIN'];
    const flagsHtml = flagKeys.map(flag => {
      const isSet = packet.flags[flag] === 1;
      return `<span class="flag-box ${isSet ? 'active' : ''}">${flag}: ${isSet ? '1' : '0'}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="inspector-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
          <div style="display:flex; align-items:center; gap: 0.5rem;">
            <span class="badge ${packet.type === 'SYN' ? 'badge-syn' : packet.type === 'SYN-ACK' ? 'badge-synack' : 'badge-ack'}">${packet.type} Packet</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Step ${packet.step} of 3</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted);">${packet.timestamp}</span>
        </div>

        <!-- 32-bit TCP Header Layout representation -->
        <div class="tcp-header-grid">
          <div class="header-field col-span-2 highlighted">
            <span class="field-name">Source Port (16 bits)</span>
            <span class="field-value">${packet.srcPort}</span>
          </div>
          <div class="header-field col-span-2 highlighted">
            <span class="field-name">Destination Port (16 bits)</span>
            <span class="field-value">${packet.dstPort}</span>
          </div>

          <div class="header-field col-span-4 highlighted">
            <span class="field-name">Sequence Number (32 bits)</span>
            <span class="field-value">${packet.seq}</span>
          </div>

          <div class="header-field col-span-4 ${packet.flags.ACK ? 'highlighted' : ''}">
            <span class="field-name">Acknowledgment Number (32 bits)</span>
            <span class="field-value">${packet.flags.ACK ? packet.ack : '0 (Not Valid - ACK bit not set)'}</span>
          </div>

          <div class="header-field">
            <span class="field-name">Data Offset</span>
            <span class="field-value">${packet.dataOffset} (${packet.headerLength} bytes)</span>
          </div>
          <div class="header-field">
            <span class="field-name">Reserved</span>
            <span class="field-value">000000</span>
          </div>
          <div class="header-field col-span-2">
            <span class="field-name">Control Flags (6 bits)</span>
            <div class="flags-row">
              ${flagsHtml}
            </div>
          </div>

          <div class="header-field col-span-2">
            <span class="field-name">Window Size (16 bits)</span>
            <span class="field-value">${packet.windowSize} bytes</span>
          </div>
          <div class="header-field col-span-2">
            <span class="field-name">Checksum & Urgent Ptr</span>
            <span class="field-value">0x4F12 (Valid) / 0</span>
          </div>
        </div>

        <div class="step-explainer" style="margin-top: 1rem;">
          <h4>Transmission Summary</h4>
          <p>${packet.description}</p>
          <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--primary); font-family: var(--font-mono);">
            Direction: ${packet.source} &rarr; ${packet.destination}
          </div>
        </div>
      </div>
    `;
  }
};

window.TCPPacket = TCPPacket;
window.PacketFactory = PacketFactory;
window.PacketInspector = PacketInspector;
