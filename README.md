# TCP 3-Way Handshake Simulator

**A Project-Based Learning (PBL) Web Application for Computer Networks**  
*Curriculum Level: Intermediate Engineering (B.Tech / B.E. Computer Science & Engineering)*  
*RFC Standard: RFC 793 (Transmission Control Protocol Specification)*

---

## 1. Project Overview & Objective

The **TCP 3-Way Handshake Simulator** is an interactive, browser-based educational platform engineered to help computer science students and networking instructors visualize and master the mechanics of TCP connection establishment.

While physical networks transmit raw bitstreams across physical media, students frequently struggle to visualize:
- How **Initial Sequence Numbers (ISNs)** are synchronized.
- Why sequence and acknowledgment numbers advance by `+1` even with 0 application payload bytes.
- How the client and server transition through internal TCP finite state machine (FSM) states.
- How TCP handles packet loss, timeouts, closed ports (RST), and delayed duplicates.

This simulator bridges theory and reality by rendering live, step-by-step packet flight animations, real-time 32-bit TCP header decodes, dynamic message sequence ladder charts (MSC), and an automated failure scenario lab—all without external dependencies or server requirements.

---

## 2. Key Features

- **Interactive Handshake Simulator**:
  - Live client (`192.168.1.100`) and server (`192.168.1.1`) host nodes with visual socket state pills.
  - Animated packet capsules traveling across an interactive virtual wire.
  - Step-by-step execution: `Start / Auto-play`, `Next Step`, `Previous Step`, `Pause / Resume`, and `Reset`.
  - Configurable animation speed (`0.5x`, `1.0x`, `1.5x`, `2.0x`).
  - Keyboard shortcuts for live demonstrations: Space (Play/Pause), Right Arrow (Next), Left Arrow (Prev), R (Reset).

- **Dynamic TCP Header Packet Inspector**:
  - Full 32-bit word layout representation of the transmitted TCP segment.
  - Live inspection of Source Port, Destination Port, 32-bit Sequence Number, 32-bit Acknowledgment Number, Header Length, Window Size, and 6 control flags (`URG`, `ACK`, `PSH`, `RST`, `SYN`, `FIN`).
  - Plain-English transmission narrative explaining RFC 793 rules.

- **Real-Time Sequence Ladder Chart (MSC)**:
  - Dynamically generated SVG time sequence chart reflecting chronological transmissions.
  - Labels show packet flags and exact sequence arithmetic (`Seq=1000`, `Ack=1001`, `Seq=5000`, `Ack=5001`).

- **Wireshark-Style Event Log**:
  - Chronological tabular event log recording Packet #, Timestamp, Source, Destination, Protocol/Flags, Seq, Ack, and Technical Info.
  - Interactive rows: Click any row in the log to inspect historical packet headers.

- **Custom Simulation Parameters**:
  - Modify Client ISN, Server ISN, Client Ephemeral Port, and Server Port.
  - Built-in validation (ports 1–65535, 32-bit integers 0 to 4,294,967,295) with instant recalculation of acknowledgment numbers.

- **Fault Injection & Failure Scenario Lab**:
  - Case 1: Normal successful handshake (baseline).
  - Case 2: SYN packet drop with Retransmission Timeout (RTO) countdown and retry.
  - Case 3: Server port closed / unreachable host returning TCP `RST` (Connection Refused).
  - Case 4: SYN-ACK loss and half-open socket vulnerability analysis.
  - Case 5: Network propagation delay causing duplicate SYN delivery.

- **Comprehensive Theory & Viva Reference Guide**:
  - In-depth explanation of the "Phantom Byte" rule (why SYN consumes 1 byte).
  - Why TCP requires exactly 3 steps (why 2-way fails, why 4-way is redundant).
  - Side-by-side TCP vs UDP comparison table.
  - Real-world browser navigation lifecycle (`https://example.com`).
  - High-yield Viva Voce Q&A with answers.

- **Self-Assessment Quiz**:
  - 12 comprehensive multiple-choice questions covering flags, arithmetic, states, and failure recovery.
  - Immediate feedback cards with RFC 793 explanations.
  - Final scorecard with percentage and review list.

---

## 3. Technology Stack

- **HTML5**: Semantic document architecture across modular pages.
- **CSS3**: Custom design system with CSS custom properties (`--primary`, `--navy`, `--success`, etc.), grid layouts, flexbox, keyframe animations, and responsive media queries.
- **Vanilla JavaScript (ES6+)**: Object-oriented simulation engine, packet factory, event emitter, and state machine with zero external libraries or frameworks.
- **Vector Graphics (SVG)**: Crisp vector icons, animated packet markers, and dynamic sequence ladder charts.
- **Zero Runtime Dependencies**: No Node.js, npm, React, CDN links, or external APIs needed. Runs completely offline.

---

## 4. Folder Structure

```
TCP-3-Way-Handshake-Simulator/
│
├── index.html                   # Main Landing Page & Dashboard Overview
├── README.md                    # Project Documentation & Viva Guide
│
├── assets/
│   └── icons/
│       └── favicon.svg          # Custom SVG Handshake Icon
│
├── css/
│   ├── style.css                # Global Theme, Layouts, Cards, Badges, & Navigation
│   ├── simulator.css            # Simulator Board, Packets, Header Grid, & Event Log
│   └── responsive.css           # Breakpoints for Mobile, Tablet, & Desktop
│
├── js/
│   ├── app.js                   # Navigation toggle, Keyboard shortcuts, Toast alerts
│   ├── packets.js               # TCPPacket class, PacketFactory, & Header Inspector
│   ├── simulator.js             # Core 3-Way Handshake Simulation Engine & Charting
│   ├── scenarios.js             # 5 Failure Scenarios, Drop Animations, & RTO Timers
│   └── quiz.js                  # 12-Question MCQ Quiz with Immediate Feedback
│
└── pages/
    ├── simulator.html           # Full Interactive Handshake Simulator Page
    ├── learn.html               # Theory, RFC 793 Notes, & Viva Q&A
    ├── scenarios.html           # Failure & Edge Scenario Laboratory
    └── quiz.html                # Interactive Self-Assessment Quiz
```

---

## 5. How the TCP 3-Way Handshake Works

### Step 1: Client sends SYN
- **Direction**: Client &rarr; Server
- **Flags Set**: `SYN = 1`, `ACK = 0`
- **Sequence Number**: Client Initial Sequence Number (e.g., `ISN = 1000`)
- **Acknowledgment Number**: `0` (or invalid, since ACK flag is not set)
- **State Transition**: Client moves from `CLOSED` to `SYN-SENT`. Server remains in `LISTEN`.

### Step 2: Server sends SYN-ACK
- **Direction**: Server &rarr; Client
- **Flags Set**: `SYN = 1`, `ACK = 1`
- **Sequence Number**: Server Initial Sequence Number (e.g., `ISN = 5000`)
- **Acknowledgment Number**: `Client_ISN + 1` (e.g., `1001`)
- **Explanation**: The server acknowledges receipt of the client's SYN byte and advertises its own sequence number.
- **State Transition**: Server moves from `LISTEN` to `SYN-RECEIVED`. Client moves to `ESTABLISHED` upon receipt.

### Step 3: Client sends ACK
- **Direction**: Client &rarr; Server
- **Flags Set**: `SYN = 0`, `ACK = 1`
- **Sequence Number**: `Client_ISN + 1` (e.g., `1001`)
- **Acknowledgment Number**: `Server_ISN + 1` (e.g., `5001`)
- **Explanation**: The client acknowledges the server's SYN. Both endpoints now possess synchronized sequence numbers.
- **State Transition**: Server moves from `SYN-RECEIVED` to `ESTABLISHED`.

```
 Client (192.168.1.100)                             Server (192.168.1.1)
   [CLOSED]                                               [LISTEN]
      |                                                      |
      | ------------- 1. [SYN] Seq=1000 -------------------> |
   [SYN-SENT]                                                |
      |                                                [SYN-RECEIVED]
      | <---- 2. [SYN, ACK] Seq=5000, Ack=1001 ------------- |
 [ESTABLISHED]                                               |
      |                                                      |
      | ------------- 3. [ACK] Seq=1001, Ack=5001 ---------> |
      |                                                [ESTABLISHED]
      | <============ Full-Duplex Data Transfer ===========> |
```

---

## 6. How to Run the Project in VS Code

### Method 1: Using VS Code Live Server (Recommended)
1. Open Visual Studio Code.
2. Select **File &rarr; Open Folder...** and choose the folder:
   `TCP-3-Way-Handshake-Simulator`
3. Install the extension **Live Server** (by *Ritwick Dey*) from the VS Code Extensions tab (`Ctrl+Shift+X`).
4. Right-click on `index.html` in the file explorer and select **"Open with Live Server"**.
5. Your default browser will automatically open `http://127.0.0.1:5500/index.html`.

### Method 2: Direct Browser Launch
1. Open the project folder in File Explorer.
2. Double-click `index.html` (or right-click &rarr; *Open with Google Chrome / Microsoft Edge / Firefox*).
3. All CSS, JavaScript, and relative page links work out of the box without any server setup.

---

## 7. How to Use the Simulator During a Viva / Demo

1. **Dashboard Overview (`index.html`)**:
   - Begin by presenting the project objectives, the 3 phases, and why TCP uses 3 steps rather than 2 or 4.

2. **Handshake Demonstration (`pages/simulator.html`)**:
   - Click **"Start Simulation"** to showcase automated transmission.
   - Show how the state pills update from `CLOSED` &rarr; `SYN-SENT` &rarr; `ESTABLISHED` (Client) and `LISTEN` &rarr; `SYN-RECEIVED` &rarr; `ESTABLISHED` (Server).
   - Point out the **Packet Inspector**: Highlight the 32-bit fields and explain how `Ack = Seq + 1`.
   - Click **"Custom Parameters"** to input custom ISNs (e.g., `Client ISN = 2500`, `Server ISN = 8000`) and demonstrate that the arithmetic dynamically adjusts.
   - Click rows in the **Wireshark-style event log** to inspect past packets.

3. **Failure Scenarios (`pages/scenarios.html`)**:
   - Select **Case 2 (SYN Packet Loss)** to demonstrate the dropped packet animation and the RTO retransmission timer.
   - Select **Case 3 (Server Closed)** to demonstrate TCP `RST` generation.
   - Select **Case 4 (SYN-ACK Loss)** to explain the half-open state risk and SYN cookies.

4. **Quiz & Evaluation (`pages/quiz.html`)**:
   - Complete the 12-question quiz to test networking concepts and showcase the scorecard.

---

## 8. Viva Voce Cheat Sheet (Examiner FAQs)

| Viva Question | Concise Engineering Answer |
| :--- | :--- |
| **Why does SYN consume 1 sequence number?** | Control flags that change state (`SYN` and `FIN`) must be reliably acknowledged. Consuming 1 sequence number ensures the receiver's incremented ACK uniquely confirms receipt. |
| **Why can't we use a 2-way handshake?** | In an unreliable network, a delayed duplicate SYN could arrive at the server. With 2-way, the server would open a connection immediately, causing a half-open ghost connection. |
| **What state is a server in while waiting for the 3rd packet?** | `SYN-RECEIVED`. It maintains an entry in its SYN backlog queue until the ACK arrives or times out. |
| **What is a SYN flood attack?** | An attacker transmits thousands of spoofed SYN packets without sending the final ACK, exhausting the server's connection backlog. Mitigated using *SYN Cookies*. |
| **Can data be sent in the 3rd handshake packet?** | Yes. Once the client receives the server's SYN-ACK, it is in `ESTABLISHED` state and may piggyback HTTP GET data inside the 3rd ACK segment. |

---

## 9. Educational Model Scope & Limitations

This project is built for educational demonstration and visual clarity. In production operating systems (e.g., Linux, Windows, macOS), additional complex mechanisms operate beneath the surface:
- Dynamic RTT calculation using Jacobson's algorithm and Karn's algorithm.
- TCP Window Scaling options (RFC 7323) and Selective Acknowledgment (SACK, RFC 2018).
- Kernel-level SYN backlog queuing (`somaxconn` and `tcp_max_syn_backlog`).
- Cryptographic ISN generation using PRF hash algorithms (RFC 6528) to prevent blind sequence attacks.

---

## 10. Authors & Academic Credit

- **Project Title**: TCP 3-Way Handshake Simulator
- **Course**: Computer Networks (Theory & Laboratory)
- **Department**: Computer Science & Engineering / Information Technology
- **Level**: Intermediate Undergraduate Project-Based Learning (PBL)
