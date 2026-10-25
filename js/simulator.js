/**
 * Core TCP 3-Way Handshake Simulation Engine
 * Manages states, step-by-step navigation, animated packet transmission,
 * dynamic sequence ladder chart, and Wireshark-style event logging.
 */

class TCPSimulator {
  constructor() {
    // Connection parameters
    this.clientISN = 1000;
    this.serverISN = 5000;
    this.clientPort = 50000;
    this.serverPort = 80;

    // Simulation states
    // Client: CLOSED -> SYN-SENT -> ESTABLISHED
    // Server: LISTEN -> SYN-RECEIVED -> ESTABLISHED
    this.clientState = 'CLOSED';
    this.serverState = 'LISTEN';

    this.currentStep = 0; // 0: Idle, 1: SYN, 2: SYN-ACK, 3: ACK (Established)
    this.isPlaying = false;
    this.isPaused = false;
    this.animationSpeed = 1.0; // Multiplier: 0.5x, 1x, 1.5x, 2x

    this.packets = [];
    this.eventLog = [];
    this.animTimeoutId = null;

    // Live Stats
    this.stats = {
      packetsSent: 0,
      packetsReceived: 0,
      packetsLost: 0,
      retransmissions: 0
    };

    this.initDOM();
  }

  initDOM() {
    this.preparePackets();
    this.attachEventListeners();
    this.updateUI();
  }

  preparePackets() {
    this.packets = window.PacketFactory.createHandshakePackets(
      this.clientISN,
      this.serverISN,
      this.clientPort,
      this.serverPort
    );
  }

  attachEventListeners() {
    // Control Buttons
    const btnStart = document.getElementById('btn-start');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const speedSelect = document.getElementById('speed-select');
    const btnToggleSettings = document.getElementById('btn-toggle-settings');
    const btnApplySettings = document.getElementById('btn-apply-settings');
    const btnResetSettings = document.getElementById('btn-reset-settings');

    if (btnStart) btnStart.addEventListener('click', () => this.startAutoSimulation());
    if (btnNext) btnNext.addEventListener('click', () => this.stepForward());
    if (btnPrev) btnPrev.addEventListener('click', () => this.stepBackward());
    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
    if (btnReset) btnReset.addEventListener('click', () => this.resetSimulation());

    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.animationSpeed = parseFloat(e.target.value) || 1.0;
        this.showToast(`Simulation speed set to ${this.animationSpeed}x`);
      });
    }

    if (btnToggleSettings) {
      btnToggleSettings.addEventListener('click', () => {
        const drawer = document.getElementById('settings-drawer');
        if (drawer) drawer.classList.toggle('open');
      });
    }

    if (btnApplySettings) {
      btnApplySettings.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyCustomSettings();
      });
    }

    if (btnResetSettings) {
      btnResetSettings.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetCustomSettings();
      });
    }
  }

  applyCustomSettings() {
    const cIsnInput = document.getElementById('input-client-isn');
    const sIsnInput = document.getElementById('input-server-isn');
    const cPortInput = document.getElementById('input-client-port');
    const sPortInput = document.getElementById('input-server-port');

    const cIsn = parseInt(cIsnInput?.value, 10);
    const sIsn = parseInt(sIsnInput?.value, 10);
    const cPort = parseInt(cPortInput?.value, 10);
    const sPort = parseInt(sPortInput?.value, 10);

    // Validation
    if (isNaN(cIsn) || cIsn < 0 || cIsn > 4294967295) {
      this.showToast('Client ISN must be a valid 32-bit integer (0 to 4294967295).', 'error');
      return;
    }
    if (isNaN(sIsn) || sIsn < 0 || sIsn > 4294967295) {
      this.showToast('Server ISN must be a valid 32-bit integer (0 to 4294967295).', 'error');
      return;
    }
    if (isNaN(cPort) || cPort < 1024 || cPort > 65535) {
      this.showToast('Client Port should be an ephemeral port (1024 to 65535).', 'error');
      return;
    }
    if (isNaN(sPort) || sPort < 1 || sPort > 65535) {
      this.showToast('Server Port must be between 1 and 65535.', 'error');
      return;
    }

    this.clientISN = cIsn;
    this.serverISN = sIsn;
    this.clientPort = cPort;
    this.serverPort = sPort;

    this.resetSimulation();
    this.showToast('Custom settings applied successfully!');
  }

  resetCustomSettings() {
    document.getElementById('input-client-isn').value = '1000';
    document.getElementById('input-server-isn').value = '5000';
    document.getElementById('input-client-port').value = '50000';
    document.getElementById('input-server-port').value = '80';
    this.clientISN = 1000;
    this.serverISN = 5000;
    this.clientPort = 50000;
    this.serverPort = 80;
    this.resetSimulation();
    this.showToast('Settings restored to standard defaults.');
  }

  startAutoSimulation() {
    if (this.currentStep >= 3) {
      this.resetSimulation();
    }
    this.isPlaying = true;
    this.isPaused = false;
    this.updateControlsState();
    this.runNextAutoStep();
  }

  runNextAutoStep() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentStep < 3) {
      this.stepForward(() => {
        if (this.isPlaying && !this.isPaused) {
          const delay = (1600 / this.animationSpeed);
          this.animTimeoutId = setTimeout(() => {
            this.runNextAutoStep();
          }, delay);
        }
      });
    } else {
      this.isPlaying = false;
      this.updateControlsState();
    }
  }

  togglePause() {
    if (!this.isPlaying) return;
    this.isPaused = !this.isPaused;
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.innerHTML = this.isPaused
        ? '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Resume'
        : '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
    }
    if (!this.isPaused) {
      this.runNextAutoStep();
    }
  }

  stepForward(onCompleteCallback) {
    if (this.currentStep >= 3) return;

    this.currentStep++;
    const stepIdx = this.currentStep; // 1, 2, or 3
    const packet = this.packets[stepIdx - 1];

    // Disable step buttons during animation to prevent race conditions
    this.setNavButtonsDisabled(true);

    // 1. Initial State Transition upon sending
    if (stepIdx === 1) {
      this.clientState = 'SYN-SENT';
      this.serverState = 'LISTEN';
      this.stats.packetsSent++;
    } else if (stepIdx === 2) {
      this.serverState = 'SYN-RECEIVED';
      this.stats.packetsSent++;
    } else if (stepIdx === 3) {
      this.clientState = 'ESTABLISHED';
      this.stats.packetsSent++;
    }

    this.updateUI();

    // 2. Animate Packet Across Channel
    const isClientToServer = (stepIdx === 1 || stepIdx === 3);
    this.animatePacket(packet, isClientToServer, () => {
      // Packet received at destination
      this.stats.packetsReceived++;

      if (stepIdx === 1) {
        // Server receives SYN and acknowledges it
        this.serverState = 'SYN-RECEIVED';
      } else if (stepIdx === 2) {
        // Client receives SYN-ACK and moves to ESTABLISHED
        this.clientState = 'ESTABLISHED';
      } else if (stepIdx === 3) {
        // Server receives ACK and moves to ESTABLISHED
        this.serverState = 'ESTABLISHED';
      }

      this.logEvent(packet);
      this.updateUI();
      this.drawSequenceChart();
      this.setNavButtonsDisabled(false);

      if (typeof onCompleteCallback === 'function') {
        onCompleteCallback();
      }
    });
  }

  stepBackward() {
    if (this.currentStep <= 0) return;
    this.clearAnimation();
    this.currentStep--;

    if (this.currentStep === 0) {
      this.clientState = 'CLOSED';
      this.serverState = 'LISTEN';
      this.eventLog = [];
      this.stats.packetsSent = 0;
      this.stats.packetsReceived = 0;
    } else if (this.currentStep === 1) {
      this.clientState = 'SYN-SENT';
      this.serverState = 'SYN-RECEIVED';
      this.eventLog = [this.packets[0]];
      this.stats.packetsSent = 1;
      this.stats.packetsReceived = 1;
    } else if (this.currentStep === 2) {
      this.clientState = 'ESTABLISHED';
      this.serverState = 'SYN-RECEIVED';
      this.eventLog = [this.packets[0], this.packets[1]];
      this.stats.packetsSent = 2;
      this.stats.packetsReceived = 2;
    }

    this.updateUI();
    this.drawSequenceChart();
  }

  animatePacket(packet, clientToServer, callback) {
    const capsule = document.getElementById('active-packet-capsule');
    const channel = document.getElementById('network-channel');
    if (!capsule || !channel) {
      if (callback) callback();
      return;
    }

    // Set classes and text
    capsule.className = `packet-capsule visible ${packet.type === 'SYN' ? 'syn-type' : packet.type === 'SYN-ACK' ? 'synack-type' : 'ack-type'}`;
    capsule.innerHTML = `
      <span class="packet-flag-tag">${packet.type}</span>
      <div class="packet-meta-quick">
        <span>Seq: ${packet.seq}</span>
        ${packet.flags.ACK ? `<span>Ack: ${packet.ack}</span>` : ''}
      </div>
    `;

    // Highlight sending node
    const clientNode = document.getElementById('client-node');
    const serverNode = document.getElementById('server-node');
    if (clientToServer) {
      if (clientNode) clientNode.classList.add('active-sender');
      if (serverNode) serverNode.classList.add('active-receiver');
    } else {
      if (serverNode) serverNode.classList.add('active-sender');
      if (clientNode) clientNode.classList.add('active-receiver');
    }

    const duration = 1200 / this.animationSpeed;
    const startLeft = clientToServer ? 5 : 95;
    const endLeft = clientToServer ? 95 : 5;
    const startTime = performance.now();

    const animateFrame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // easeInOutQuad
      const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const currentPos = startLeft + (endLeft - startLeft) * easedProgress;

      capsule.style.left = `${currentPos}%`;

      if (progress < 1.0) {
        requestAnimationFrame(animateFrame);
      } else {
        capsule.classList.remove('visible');
        if (clientNode) clientNode.classList.remove('active-sender', 'active-receiver');
        if (serverNode) serverNode.classList.remove('active-sender', 'active-receiver');
        if (callback) callback();
      }
    };

    requestAnimationFrame(animateFrame);
  }

  clearAnimation() {
    if (this.animTimeoutId) {
      clearTimeout(this.animTimeoutId);
      this.animTimeoutId = null;
    }
    const capsule = document.getElementById('active-packet-capsule');
    if (capsule) {
      capsule.classList.remove('visible');
    }
  }

  resetSimulation() {
    this.clearAnimation();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    this.clientState = 'CLOSED';
    this.serverState = 'LISTEN';
    this.eventLog = [];
    this.stats = {
      packetsSent: 0,
      packetsReceived: 0,
      packetsLost: 0,
      retransmissions: 0
    };
    this.preparePackets();
    this.updateControlsState();
    this.updateUI();
    this.drawSequenceChart();

    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
    }

    this.showToast('Simulation reset to initial state.');
  }

  logEvent(packet) {
    this.eventLog.push(packet);
    this.renderEventLogTable();
  }

  renderEventLogTable() {
    const tableBody = document.getElementById('event-log-tbody');
    if (!tableBody) return;

    if (this.eventLog.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No packets transmitted yet. Click "Start Simulation" or "Next Step".</td></tr>`;
      return;
    }

    tableBody.innerHTML = this.eventLog.map((pkt, idx) => `
      <tr class="${idx === this.eventLog.length - 1 ? 'selected-row' : ''}" onclick="window.simulator.inspectPacketByIndex(${idx})">
        <td>#${pkt.id}</td>
        <td>${pkt.timestamp}</td>
        <td>${pkt.srcPort === this.clientPort ? 'Client' : 'Server'}:${pkt.srcPort}</td>
        <td>${pkt.dstPort === this.serverPort ? 'Server' : 'Client'}:${pkt.dstPort}</td>
        <td><span class="badge ${pkt.type === 'SYN' ? 'badge-syn' : pkt.type === 'SYN-ACK' ? 'badge-synack' : 'badge-ack'}">${pkt.type}</span></td>
        <td>${pkt.seq}</td>
        <td>${pkt.flags.ACK ? pkt.ack : '-'}</td>
        <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pkt.description}</td>
      </tr>
    `).join('');
  }

  inspectPacketByIndex(index) {
    if (this.eventLog[index]) {
      window.PacketInspector.render(this.eventLog[index]);
    }
  }

  drawSequenceChart() {
    const chartSvg = document.getElementById('sequence-chart-svg');
    if (!chartSvg) return;

    const width = 640;
    const height = 240;

    let svgHtml = `
      <!-- Life lines -->
      <line x1="120" y1="35" x2="120" y2="220" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4" />
      <line x1="520" y1="35" x2="520" y2="220" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4" />

      <!-- Host Headers -->
      <rect x="50" y="10" width="140" height="28" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
      <text x="120" y="28" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e40af">Client (Port ${this.clientPort})</text>

      <rect x="450" y="10" width="140" height="28" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="520" y="28" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#065f46">Server (Port ${this.serverPort})</text>
    `;

    // Step 1: SYN Arrow
    if (this.currentStep >= 1) {
      svgHtml += `
        <g class="arrow-group">
          <line x1="120" y1="65" x2="512" y2="95" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)" />
          <polygon points="512,95 500,89 504,97" fill="#2563eb" />
          <text x="310" y="72" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#1d4ed8">1. [SYN] Seq=${this.clientISN}</text>
        </g>
      `;
    }

    // Step 2: SYN-ACK Arrow
    if (this.currentStep >= 2) {
      svgHtml += `
        <g class="arrow-group">
          <line x1="520" y1="115" x2="128" y2="145" stroke="#7c3aed" stroke-width="2.5" />
          <polygon points="128,145 140,139 136,147" fill="#7c3aed" />
          <text x="310" y="122" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#6d28d9">2. [SYN, ACK] Seq=${this.serverISN}, Ack=${this.clientISN + 1}</text>
        </g>
      `;
    }

    // Step 3: ACK Arrow
    if (this.currentStep >= 3) {
      svgHtml += `
        <g class="arrow-group">
          <line x1="120" y1="165" x2="512" y2="195" stroke="#10b981" stroke-width="2.5" />
          <polygon points="512,195 500,189 504,197" fill="#10b981" />
          <text x="310" y="172" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#047857">3. [ACK] Seq=${this.clientISN + 1}, Ack=${this.serverISN + 1}</text>
          <!-- Connection Established Box -->
          <rect x="230" y="200" width="160" height="22" rx="4" fill="#dcfce7" stroke="#86efac" />
          <text x="310" y="215" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="#15803d">ESTABLISHED</text>
        </g>
      `;
    }

    chartSvg.innerHTML = svgHtml;
  }

  updateUI() {
    // 1. Update State Badges
    const clientStateEl = document.getElementById('client-state-pill');
    const serverStateEl = document.getElementById('server-state-pill');

    if (clientStateEl) {
      clientStateEl.className = `state-pill state-${this.clientState.toLowerCase()}`;
      clientStateEl.textContent = this.clientState;
    }

    if (serverStateEl) {
      serverStateEl.className = `state-pill state-${this.serverState.toLowerCase()}`;
      serverStateEl.textContent = this.serverState;
    }

    // 2. Update Node Details
    const clientPortVal = document.getElementById('client-port-val');
    const serverPortVal = document.getElementById('server-port-val');
    const clientSeqVal = document.getElementById('client-seq-val');
    const serverSeqVal = document.getElementById('server-seq-val');

    if (clientPortVal) clientPortVal.textContent = this.clientPort;
    if (serverPortVal) serverPortVal.textContent = this.serverPort;

    if (clientSeqVal) {
      clientSeqVal.textContent = (this.currentStep >= 3) ? (this.clientISN + 1) : this.clientISN;
    }
    if (serverSeqVal) {
      serverSeqVal.textContent = (this.currentStep >= 2) ? this.serverISN : 'Unassigned';
    }

    // 3. Update Step Progress Indicator
    ['step-ind-1', 'step-ind-2', 'step-ind-3'].forEach((id, idx) => {
      const stepElem = document.getElementById(id);
      if (!stepElem) return;
      stepElem.classList.remove('active', 'completed');
      if (this.currentStep === idx + 1) {
        stepElem.classList.add('active');
      } else if (this.currentStep > idx + 1) {
        stepElem.classList.add('completed');
      }
    });

    // 4. Update Step Narrative Text
    const narrativeEl = document.getElementById('step-narrative-box');
    if (narrativeEl) {
      let narrativeTitle = 'Handshake Not Started';
      let narrativeDesc = 'Click "Start Simulation" to initiate automatic playback or use "Next Step" to progress manually through each packet exchange.';

      if (this.currentStep === 1) {
        narrativeTitle = `Step 1: Client sends SYN (Seq = ${this.clientISN})`;
        narrativeDesc = `The client initiates connection establishment by sending a SYN packet with Initial Sequence Number ${this.clientISN}. Client enters SYN-SENT state. Notice that ACK flag is 0 because the server has not sent anything yet. SYN consumes 1 phantom sequence byte.`;
      } else if (this.currentStep === 2) {
        narrativeTitle = `Step 2: Server replies SYN-ACK (Seq = ${this.serverISN}, Ack = ${this.clientISN + 1})`;
        narrativeDesc = `The server acknowledges the client's SYN by calculating Ack Number = ${this.clientISN} + 1 = ${this.clientISN + 1}. At the same time, the server generates its own ISN (${this.serverISN}) and sets both SYN and ACK flags. Server enters SYN-RECEIVED state.`;
      } else if (this.currentStep === 3) {
        narrativeTitle = `Step 3: Client sends final ACK (Seq = ${this.clientISN + 1}, Ack = ${this.serverISN + 1})`;
        narrativeDesc = `The client acknowledges the server's SYN by returning Ack Number = ${this.serverISN} + 1 = ${this.serverISN + 1}. Both endpoints transition into the ESTABLISHED state. The full-duplex TCP virtual circuit is ready for bidirectional application payload!`;
      }

      narrativeEl.innerHTML = `
        <h4>${narrativeTitle}</h4>
        <p>${narrativeDesc}</p>
      `;
    }

    // 5. Connection Established Banner
    const banner = document.getElementById('connection-status-banner');
    if (banner) {
      if (this.currentStep === 3) {
        banner.className = 'connection-status-banner connected';
        banner.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <span>TCP 3-Way Handshake Succeeded &mdash; Connection ESTABLISHED</span>
          </div>
          <span style="font-size:0.8rem; font-family:var(--font-mono); font-weight:700;">Socket State: ESTABLISHED</span>
        `;
      } else {
        banner.className = 'connection-status-banner';
        banner.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style="color:var(--text-muted);"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
            <span>Handshake Progress: Step ${this.currentStep} of 3</span>
          </div>
          <span style="font-size:0.8rem; color:var(--text-muted);">${this.currentStep === 0 ? 'Connection Closed' : 'Handshake In Progress...'}</span>
        `;
      }
    }

    // 6. Update Live Stats in DOM
    const statSent = document.getElementById('stat-packets-sent');
    const statRecv = document.getElementById('stat-packets-recv');
    const statLost = document.getElementById('stat-packets-lost');
    const statStep = document.getElementById('stat-current-step');

    if (statSent) statSent.textContent = this.stats.packetsSent;
    if (statRecv) statRecv.textContent = this.stats.packetsReceived;
    if (statLost) statLost.textContent = this.stats.packetsLost;
    if (statStep) statStep.textContent = `${this.currentStep} / 3`;

    // 7. Render Active Packet in Inspector
    if (this.currentStep > 0 && this.packets[this.currentStep - 1]) {
      window.PacketInspector.render(this.packets[this.currentStep - 1]);
    } else {
      window.PacketInspector.render(null);
    }
  }

  setNavButtonsDisabled(disabled) {
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnStart = document.getElementById('btn-start');
    if (btnNext) btnNext.disabled = disabled || (this.currentStep >= 3);
    if (btnPrev) btnPrev.disabled = disabled || (this.currentStep <= 0);
    if (btnStart) btnStart.disabled = disabled || this.isPlaying;
  }

  updateControlsState() {
    const btnStart = document.getElementById('btn-start');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnPause = document.getElementById('btn-pause');

    if (btnStart) btnStart.disabled = this.isPlaying;
    if (btnNext) btnNext.disabled = this.isPlaying || (this.currentStep >= 3);
    if (btnPrev) btnPrev.disabled = this.isPlaying || (this.currentStep <= 0);
    if (btnPause) btnPause.disabled = !this.isPlaying;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color: ${type === 'error' ? '#f87171' : '#38bdf8'}; font-weight: bold;">&bull;</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// Instantiate and expose globally when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('simulation-stage-board')) {
    window.simulator = new TCPSimulator();
    window.simulator.drawSequenceChart();
  }
});
