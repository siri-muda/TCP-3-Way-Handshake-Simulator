/**
 * Failure and Edge Scenario Simulator
 * Simulates:
 * 1. Normal Handshake
 * 2. SYN Packet Loss & Timeout Retransmission
 * 3. Server Down / Port Closed (Timeout / RST)
 * 4. SYN-ACK Packet Loss & Half-Open Connection
 * 5. High Network Delay & Duplicate SYN Handling
 */

class ScenarioEngine {
  constructor() {
    this.currentScenarioId = 'normal';
    this.isPlaying = false;
    this.stepIndex = 0;
    this.animationTimer = null;

    // Default connection variables
    this.clientISN = 1000;
    this.serverISN = 5000;
    this.clientPort = 52140;
    this.serverPort = 80;

    this.clientState = 'CLOSED';
    this.serverState = 'LISTEN';

    this.stats = {
      sent: 0,
      received: 0,
      lost: 0,
      retransmissions: 0
    };

    this.scenarios = {
      'normal': {
        title: 'Scenario 1: Normal Successful Handshake',
        badge: 'Baseline Flow',
        description: 'Standard 3-way handshake under optimal network conditions. All packets are acknowledged without loss or delay.',
        theory: 'RFC 793 defines the standard sequence: SYN (Client to Server), SYN-ACK (Server to Client), and ACK (Client to Server). Sequence numbers are synchronized and socket buffers are allocated.',
        steps: [
          { action: 'send', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: 'Client sends SYN packet (Seq=1000). State moves to SYN-SENT.' },
          { action: 'receive', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server receives SYN, prepares socket TCB, updates state to SYN-RECEIVED.' },
          { action: 'send', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server replies with SYN-ACK (Seq=5000, Ack=1001).' },
          { action: 'receive', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'ESTABLISHED', serverState: 'SYN-RECEIVED', desc: 'Client verifies Ack=1001, transitions to ESTABLISHED.' },
          { action: 'send', from: 'client', to: 'server', type: 'ACK', seq: 1001, ack: 5001, clientState: 'ESTABLISHED', serverState: 'SYN-RECEIVED', desc: 'Client sends final ACK (Seq=1001, Ack=5001).' },
          { action: 'receive', from: 'client', to: 'server', type: 'ACK', seq: 1001, ack: 5001, clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', desc: 'Server receives ACK. Both ends are now in ESTABLISHED state!' }
        ]
      },

      'syn-loss': {
        title: 'Scenario 2: SYN Packet Loss & Retransmission',
        badge: 'Packet Drop & Timer',
        description: 'The initial SYN packet is dropped due to network congestion. The client Retransmission Timeout (RTO) expires, prompting an automatic SYN retransmission.',
        theory: 'When sending a SYN, the client starts a timer (typically 1 to 3 seconds for initial SYN). Because no SYN-ACK arrives before timeout, the client retransmits the SYN with the identical ISN.',
        steps: [
          { action: 'send', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: 'Client transmits initial SYN (Seq=1000) and starts Retransmission Timer (RTO).' },
          { action: 'drop', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: '[PACKET LOSS] Router queue overflow drops the SYN packet mid-transit! Server never receives it.' },
          { action: 'rto-wait', from: 'client', desc: 'Client waiting for SYN-ACK... RTO Timer counting down (3.0s... 2.0s... 1.0s... EXPIRED).' },
          { action: 'retransmit', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: '[RETRANSMISSION] RTO expired! Client re-sends SYN (Seq=1000). Backoff multiplier applied.' },
          { action: 'receive', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server receives retransmitted SYN. Enters SYN-RECEIVED.' },
          { action: 'send', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server sends SYN-ACK (Seq=5000, Ack=1001).' },
          { action: 'receive', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'ESTABLISHED', serverState: 'SYN-RECEIVED', desc: 'Client receives SYN-ACK. Client state becomes ESTABLISHED.' },
          { action: 'send', from: 'client', to: 'server', type: 'ACK', seq: 1001, ack: 5001, clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', desc: 'Client returns final ACK. Handshake completes after 1 retransmission.' }
        ]
      },

      'server-down': {
        title: 'Scenario 3: Server Unreachable / Port Closed',
        badge: 'Connection Refused',
        description: 'Client attempts to connect, but the target server port is closed or the host is offline. The client either receives a TCP RST or times out completely.',
        theory: 'If a host receives a SYN on an unopened port, RFC 793 dictates that it must immediately reply with a RST (Reset) packet with ACK=1. If the server is powered off or behind a silent firewall, the client retries until reaching max SYN retries (giving ETIMEDOUT).',
        steps: [
          { action: 'send', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'CLOSED', desc: 'Client sends SYN to port 80. Server application is NOT running (closed socket).' },
          { action: 'receive', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'CLOSED', desc: 'Host OS receives SYN for closed port. Kernel generates an immediate RST packet.' },
          { action: 'send', from: 'server', to: 'client', type: 'RST', seq: 0, ack: 1001, clientState: 'SYN-SENT', serverState: 'CLOSED', desc: 'Server kernel sends RST packet with ACK bit set (Seq=0, Ack=1001).' },
          { action: 'receive', from: 'server', to: 'client', type: 'RST', seq: 0, ack: 1001, clientState: 'CLOSED', serverState: 'CLOSED', desc: 'Client receives RST. Connection aborted with ECONNREFUSED ("Connection Refused").' }
        ]
      },

      'synack-loss': {
        title: 'Scenario 4: SYN-ACK Packet Loss & Half-Open State',
        badge: 'Half-Open Risk',
        description: 'Server receives SYN and responds with SYN-ACK, but the SYN-ACK is dropped. The server remains in SYN-RECEIVED awaiting ACK, creating a half-open state.',
        theory: 'If SYN-ACK is lost, the server has allocated a Transmission Control Block (TCB) in its SYN backlog. Since client never got SYN-ACK, client retransmits SYN. The server must handle this by re-sending SYN-ACK rather than discarding.',
        steps: [
          { action: 'send', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: 'Client sends SYN (Seq=1000).' },
          { action: 'receive', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server receives SYN, enters SYN-RECEIVED, allocates backlog entry.' },
          { action: 'send', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server transmits SYN-ACK (Seq=5000, Ack=1001).' },
          { action: 'drop', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: '[PACKET LOSS] SYN-ACK is lost in transit! Server is waiting for ACK, but Client never got SYN-ACK.' },
          { action: 'rto-wait', from: 'both', desc: 'Half-Open Hazard: Server is in SYN-RECEIVED. Client is still in SYN-SENT. Timers running on both sides.' },
          { action: 'retransmit', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server timer fires: Retransmits SYN-ACK (Seq=5000, Ack=1001).' },
          { action: 'receive', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'ESTABLISHED', serverState: 'SYN-RECEIVED', desc: 'Client finally receives SYN-ACK! Client enters ESTABLISHED.' },
          { action: 'send', from: 'client', to: 'server', type: 'ACK', seq: 1001, ack: 5001, clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', desc: 'Client replies with ACK. Server transitions from SYN-RECEIVED to ESTABLISHED.' }
        ]
      },

      'network-delay': {
        title: 'Scenario 5: High Network Delay & Duplicate SYN',
        badge: 'Duplicate Handling',
        description: 'SYN packet is delayed in heavily congested router buffers. Client retransmits before the original arrives, resulting in duplicate SYN packets at the server.',
        theory: 'TCP is robust against duplicates. When a server in SYN-RECEIVED receives a duplicate SYN with the same ISN, it simply resends its existing SYN-ACK without allocating duplicate socket resources.',
        steps: [
          { action: 'send', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: 'Client sends SYN (Seq=1000). High queuing latency delays delivery.' },
          { action: 'rto-wait', from: 'client', desc: 'Propagation delay > Client RTO. Client timer triggers premature retransmission.' },
          { action: 'retransmit', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'LISTEN', desc: 'Client retransmits duplicate SYN (Seq=1000).' },
          { action: 'receive', from: 'client', to: 'server', type: 'SYN', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Original delayed SYN arrives at server. Server enters SYN-RECEIVED.' },
          { action: 'send', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Server sends SYN-ACK (Seq=5000, Ack=1001).' },
          { action: 'receive-dup', from: 'client', to: 'server', type: 'SYN (Dup)', seq: 1000, ack: 0, clientState: 'SYN-SENT', serverState: 'SYN-RECEIVED', desc: 'Duplicate SYN arrives. Server identifies matching ISN and safely drops duplicate without resetting.' },
          { action: 'receive', from: 'server', to: 'client', type: 'SYN-ACK', seq: 5000, ack: 1001, clientState: 'ESTABLISHED', serverState: 'SYN-RECEIVED', desc: 'Client receives SYN-ACK, moves to ESTABLISHED.' },
          { action: 'send', from: 'client', to: 'server', type: 'ACK', seq: 1001, ack: 5001, clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', desc: 'Client sends ACK. Connection is intact.' }
        ]
      }
    };

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadScenario('normal');
  }

  attachEventListeners() {
    // Scenario Selection buttons/cards
    const selectorButtons = document.querySelectorAll('.scenario-nav-btn');
    selectorButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenarioId = btn.getAttribute('data-scenario');
        if (scenarioId && this.scenarios[scenarioId]) {
          selectorButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.loadScenario(scenarioId);
        }
      });
    });

    const btnStart = document.getElementById('scen-btn-start');
    const btnNext = document.getElementById('scen-btn-next');
    const btnReset = document.getElementById('scen-btn-reset');

    if (btnStart) btnStart.addEventListener('click', () => this.startScenarioPlay());
    if (btnNext) btnNext.addEventListener('click', () => this.stepScenario());
    if (btnReset) btnReset.addEventListener('click', () => this.resetScenario());
  }

  loadScenario(scenarioId) {
    this.resetScenario();
    this.currentScenarioId = scenarioId;
    const scen = this.scenarios[scenarioId];
    if (!scen) return;

    // Update Header Info
    const titleEl = document.getElementById('scen-title');
    const descEl = document.getElementById('scen-description');
    const theoryEl = document.getElementById('scen-theory');
    const badgeEl = document.getElementById('scen-badge');

    if (titleEl) titleEl.textContent = scen.title;
    if (descEl) descEl.textContent = scen.description;
    if (theoryEl) theoryEl.textContent = scen.theory;
    if (badgeEl) badgeEl.textContent = scen.badge;

    this.updateScenarioUI();
  }

  resetScenario() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
    this.isPlaying = false;
    this.stepIndex = 0;
    this.clientState = 'CLOSED';
    this.serverState = 'LISTEN';
    this.stats = { sent: 0, received: 0, lost: 0, retransmissions: 0 };

    const capsule = document.getElementById('scen-packet-capsule');
    if (capsule) capsule.classList.remove('visible');

    const dropMark = document.getElementById('scen-drop-badge');
    if (dropMark) dropMark.style.display = 'none';

    this.updateScenarioUI();
    this.renderLogTable();
  }

  startScenarioPlay() {
    const scen = this.scenarios[this.currentScenarioId];
    if (this.stepIndex >= scen.steps.length) {
      this.resetScenario();
    }
    this.isPlaying = true;
    this.runScenarioLoop();
  }

  runScenarioLoop() {
    const scen = this.scenarios[this.currentScenarioId];
    if (!this.isPlaying) return;

    if (this.stepIndex < scen.steps.length) {
      this.stepScenario(() => {
        if (this.isPlaying) {
          this.animationTimer = setTimeout(() => {
            this.runScenarioLoop();
          }, 1800);
        }
      });
    } else {
      this.isPlaying = false;
    }
  }

  stepScenario(onComplete) {
    const scen = this.scenarios[this.currentScenarioId];
    if (this.stepIndex >= scen.steps.length) {
      if (onComplete) onComplete();
      return;
    }

    const currentStepObj = scen.steps[this.stepIndex];
    this.stepIndex++;

    // Execute step logic
    if (currentStepObj.action === 'send') {
      this.stats.sent++;
      if (currentStepObj.clientState) this.clientState = currentStepObj.clientState;
      if (currentStepObj.serverState) this.serverState = currentStepObj.serverState;
      this.animateFlight(currentStepObj, false, onComplete);
    } else if (currentStepObj.action === 'receive' || currentStepObj.action === 'receive-dup') {
      this.stats.received++;
      if (currentStepObj.clientState) this.clientState = currentStepObj.clientState;
      if (currentStepObj.serverState) this.serverState = currentStepObj.serverState;
      if (onComplete) onComplete();
    } else if (currentStepObj.action === 'drop') {
      this.stats.lost++;
      this.animateFlight(currentStepObj, true, onComplete);
    } else if (currentStepObj.action === 'retransmit') {
      this.stats.sent++;
      this.stats.retransmissions++;
      this.animateFlight(currentStepObj, false, onComplete);
    } else if (currentStepObj.action === 'rto-wait') {
      // Timer wait step
      this.animateTimerCountdown(onComplete);
    }

    this.updateScenarioUI();
    this.renderLogTable();
  }

  animateFlight(stepObj, isDrop = false, callback) {
    const capsule = document.getElementById('scen-packet-capsule');
    const dropBadge = document.getElementById('scen-drop-badge');
    if (!capsule) {
      if (callback) callback();
      return;
    }

    const isClientToServer = (stepObj.from === 'client');
    capsule.className = `packet-capsule visible ${stepObj.type.includes('SYN-ACK') ? 'synack-type' : stepObj.type.includes('SYN') ? 'syn-type' : stepObj.type === 'RST' ? 'loss-type' : 'ack-type'}`;
    capsule.innerHTML = `
      <span class="packet-flag-tag">${stepObj.type}</span>
      <div class="packet-meta-quick">Seq:${stepObj.seq} ${stepObj.ack ? 'Ack:' + stepObj.ack : ''}</div>
    `;

    if (dropBadge) dropBadge.style.display = 'none';

    const startX = isClientToServer ? 5 : 95;
    const targetX = isDrop ? 50 : (isClientToServer ? 95 : 5);
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const currentX = startX + (targetX - startX) * progress;
      capsule.style.left = `${currentX}%`;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        if (isDrop) {
          capsule.classList.remove('visible');
          if (dropBadge) {
            dropBadge.style.display = 'flex';
            dropBadge.style.left = '50%';
            dropBadge.style.top = '45%';
            dropBadge.innerHTML = `&times; PACKET DROPPED (${stepObj.type})`;
          }
        } else {
          capsule.classList.remove('visible');
        }
        if (callback) callback();
      }
    };

    requestAnimationFrame(animate);
  }

  animateTimerCountdown(callback) {
    const banner = document.getElementById('scen-status-banner');
    if (banner) {
      banner.className = 'connection-status-banner';
      banner.innerHTML = `<strong>RTO Timer:</strong> Retransmission timer running (waiting for unacknowledged packet)...`;
    }
    setTimeout(() => {
      if (callback) callback();
    }, 1000);
  }

  updateScenarioUI() {
    const scen = this.scenarios[this.currentScenarioId];
    const clientStatePill = document.getElementById('scen-client-state');
    const serverStatePill = document.getElementById('scen-server-state');

    if (clientStatePill) {
      clientStatePill.className = `state-pill state-${this.clientState.toLowerCase()}`;
      clientStatePill.textContent = this.clientState;
    }

    if (serverStatePill) {
      serverStatePill.className = `state-pill state-${this.serverState.toLowerCase()}`;
      serverStatePill.textContent = this.serverState;
    }

    // Update Stats
    const sentEl = document.getElementById('scen-stat-sent');
    const recvEl = document.getElementById('scen-stat-recv');
    const lostEl = document.getElementById('scen-stat-lost');
    const retransEl = document.getElementById('scen-stat-retrans');

    if (sentEl) sentEl.textContent = this.stats.sent;
    if (recvEl) recvEl.textContent = this.stats.received;
    if (lostEl) lostEl.textContent = this.stats.lost;
    if (retransEl) retransEl.textContent = this.stats.retransmissions;

    // Narrative box
    const narrativeBox = document.getElementById('scen-narrative-box');
    if (narrativeBox) {
      if (this.stepIndex === 0) {
        narrativeBox.innerHTML = `<h4>Ready to Simulate</h4><p>Click "Start Simulation" to watch automated execution or "Next Step" to trace packet-by-packet.</p>`;
      } else {
        const lastStep = scen.steps[this.stepIndex - 1];
        narrativeBox.innerHTML = `
          <h4>Step ${this.stepIndex} of ${scen.steps.length}: ${lastStep.action.toUpperCase()}</h4>
          <p>${lastStep.desc}</p>
        `;
      }
    }

    // Connection Banner
    const banner = document.getElementById('scen-status-banner');
    if (banner) {
      if (this.clientState === 'ESTABLISHED' && this.serverState === 'ESTABLISHED') {
        banner.className = 'connection-status-banner connected';
        banner.innerHTML = `<span>&#10004; TCP Connection Successfully ESTABLISHED</span>`;
      } else if (this.clientState === 'CLOSED' && this.stepIndex > 1) {
        banner.className = 'connection-status-banner failed';
        banner.innerHTML = `<span>&#10008; Connection Terminated / Refused (Socket CLOSED)</span>`;
      } else {
        banner.className = 'connection-status-banner';
        banner.innerHTML = `<span>Connection State: In Progress (${this.stepIndex}/${scen.steps.length} Steps)</span>`;
      }
    }
  }

  renderLogTable() {
    const tableBody = document.getElementById('scen-event-log-tbody');
    if (!tableBody) return;

    const scen = this.scenarios[this.currentScenarioId];
    if (this.stepIndex === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.25rem;">No events recorded yet. Start simulation.</td></tr>`;
      return;
    }

    const completedSteps = scen.steps.slice(0, this.stepIndex);
    tableBody.innerHTML = completedSteps.map((s, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td><strong>${s.action.toUpperCase()}</strong></td>
        <td>${s.from ? s.from.toUpperCase() : '-'}</td>
        <td>${s.type || '-'}</td>
        <td>${s.seq !== undefined ? s.seq : '-'}</td>
        <td>${s.desc}</td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('scenarios-container')) {
    window.scenarioEngine = new ScenarioEngine();
  }
});
