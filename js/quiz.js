/**
 * Interactive TCP Knowledge Quiz Module
 * 12 Questions with detailed explanations, scoring breakdown, and review mode.
 */

class QuizEngine {
  constructor() {
    this.questions = [
      {
        id: 1,
        topic: 'Handshake Basics',
        question: 'What is the primary objective of the TCP 3-Way Handshake?',
        options: [
          'To encrypt payload data using public-key cryptography',
          'To negotiate port numbers and establish DNS domain mapping',
          'To synchronize Initial Sequence Numbers (ISNs) and allocate socket buffers',
          'To test physical ethernet cable continuity between hosts'
        ],
        correct: 2,
        explanation: 'The 3-way handshake synchronizes Initial Sequence Numbers (ISNs) on both sides and allocates transmission control blocks (TCBs) and socket buffers, establishing a reliable virtual circuit before data transfer.'
      },
      {
        id: 2,
        topic: 'TCP Flags',
        question: 'Which TCP control flags are set to 1 in Step 2 of the 3-Way Handshake?',
        options: [
          'Only SYN',
          'SYN and ACK',
          'ACK and FIN',
          'SYN and RST'
        ],
        correct: 1,
        explanation: 'In Step 2, the server replies to the client by setting both the SYN flag (to synchronize its own ISN) and the ACK flag (to acknowledge receipt of the client\'s SYN).'
      },
      {
        id: 3,
        topic: 'Sequence & Ack Math',
        question: 'If a client initiates a TCP connection with an Initial Sequence Number (ISN) of 2000, what will be the Acknowledgment Number in the server\'s SYN-ACK reply?',
        options: [
          '2000',
          '2001',
          '1999',
          '0'
        ],
        correct: 1,
        explanation: 'The SYN flag consumes exactly 1 phantom byte of sequence space. The ACK number indicates the next expected sequence number, so Ack = client ISN + 1 = 2000 + 1 = 2001.'
      },
      {
        id: 4,
        topic: 'Sequence & Ack Math',
        question: 'Why does a SYN packet consume one sequence number even when it carries 0 bytes of application payload?',
        options: [
          'It is an arbitrary bug in the original RFC 793 specification',
          'Because the TCP header itself is counted as payload data',
          'Because control flags that change connection state (SYN and FIN) must be acknowledged reliably',
          'To prevent port collisions with UDP datagrams'
        ],
        correct: 2,
        explanation: 'Any packet that requires reliable delivery must consume sequence space. If SYN did not consume a sequence number, the receiver could not uniquely acknowledge it with an incremented ACK number.'
      },
      {
        id: 5,
        topic: 'TCP States',
        question: 'What state does the client enter immediately after transmitting its initial SYN packet?',
        options: [
          'ESTABLISHED',
          'LISTEN',
          'SYN-SENT',
          'SYN-RECEIVED'
        ],
        correct: 2,
        explanation: 'After sending the initial SYN, the client enters the SYN-SENT state while waiting for the server\'s SYN-ACK reply.'
      },
      {
        id: 6,
        topic: 'TCP States',
        question: 'What state does the server enter immediately after receiving a client\'s SYN and transmitting its SYN-ACK?',
        options: [
          'SYN-RECEIVED',
          'ESTABLISHED',
          'TIME-WAIT',
          'CLOSE-WAIT'
        ],
        correct: 0,
        explanation: 'The server moves from the LISTEN state into the SYN-RECEIVED state once it processes the SYN and responds with SYN-ACK.'
      },
      {
        id: 7,
        topic: 'Sequence & Ack Math',
        question: 'A client sends SYN with Seq=1000. Server replies SYN-ACK with Seq=5000, Ack=1001. What are the Seq and Ack numbers of the client\'s final ACK in Step 3?',
        options: [
          'Seq=1000, Ack=5000',
          'Seq=1001, Ack=5001',
          'Seq=1002, Ack=5002',
          'Seq=1001, Ack=5000'
        ],
        correct: 1,
        explanation: 'The client\'s Seq is now 1001 (matching the Ack requested by the server). The client acknowledges the server\'s SYN (Seq=5000) by returning Ack = 5000 + 1 = 5001.'
      },
      {
        id: 8,
        topic: 'Handshake Mechanics',
        question: 'Why does TCP use a 3-Way Handshake instead of a simpler 2-Way Handshake?',
        options: [
          'To prevent stale duplicate SYN packets from causing half-open ghost connections',
          'Because 2 packets cannot travel over Ethernet cables',
          'To allow three different computers to communicate simultaneously',
          'To compute the IP checksum twice'
        ],
        correct: 0,
        explanation: 'With only 2 steps, if an old delayed duplicate SYN packet arrives at the server, the server would open a connection immediately without the client knowing, wasting server resources in a half-open ghost connection.'
      },
      {
        id: 9,
        topic: 'Failure & Recovery',
        question: 'What happens when a client sends a SYN packet to a server, but the SYN-ACK packet is dropped by an intermediate router?',
        options: [
          'The client enters ESTABLISHED anyway',
          'Both hosts immediately crash',
          'The client Retransmission Timeout (RTO) expires, and the client retransmits the SYN',
          'The router converts the packet into UDP'
        ],
        correct: 2,
        explanation: 'The client stays in SYN-SENT with an active RTO timer. When the timer expires without receiving SYN-ACK, it retransmits the identical SYN packet with exponential backoff.'
      },
      {
        id: 10,
        topic: 'TCP vs UDP',
        question: 'Which of the following is true regarding TCP compared to UDP?',
        options: [
          'UDP performs a 2-way handshake, while TCP performs a 3-way handshake',
          'TCP requires connection establishment prior to data transfer; UDP is connectionless',
          'UDP guarantees ordered delivery using sequence numbers',
          'TCP has less header overhead than UDP'
        ],
        correct: 1,
        explanation: 'TCP is connection-oriented and requires a 3-way handshake to establish state before streaming bytes. UDP is connectionless, with no handshake and no delivery guarantees.'
      },
      {
        id: 11,
        topic: 'Failure & Recovery',
        question: 'If a client sends a SYN packet to a destination port where no application is currently listening, what packet does the server host return?',
        options: [
          'SYN-ACK with Window Size 0',
          'RST (Reset) with ACK=1',
          'ICMP Echo Reply',
          'FIN packet'
        ],
        correct: 1,
        explanation: 'Per RFC 793, if a TCP segment arrives at a closed port, the host operating system immediately generates a RST (Reset) segment to terminate the connection attempt (Connection Refused).'
      },
      {
        id: 12,
        topic: 'TCP States',
        question: 'Can the client begin transmitting application data (e.g., HTTP GET request) inside Step 3 (the final ACK packet)?',
        options: [
          'No, application data can only be sent in packet 4 or later',
          'Yes, the final ACK packet is permitted to piggyback initial application data',
          'Only if the server specifically enabled UDP fallback mode',
          'Only if sequence numbers are set to zero'
        ],
        correct: 1,
        explanation: 'Yes! Once the client has processed the server\'s SYN-ACK, the client is in ESTABLISHED state. The client can piggyback user payload (such as an HTTP GET request) directly into the Step 3 ACK packet.'
      }
    ];

    this.currentIndex = 0;
    this.selectedOption = null;
    this.answers = []; // Records user's answer index for each question
    this.isSubmitted = false;

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.renderQuestion();
  }

  attachEventListeners() {
    const btnSubmit = document.getElementById('quiz-btn-submit');
    const btnNext = document.getElementById('quiz-btn-next');
    const btnRetake = document.getElementById('quiz-btn-retake');

    if (btnSubmit) btnSubmit.addEventListener('click', () => this.submitAnswer());
    if (btnNext) btnNext.addEventListener('click', () => this.nextQuestion());
    if (btnRetake) btnRetake.addEventListener('click', () => this.retakeQuiz());
  }

  renderQuestion() {
    this.isSubmitted = false;
    this.selectedOption = null;

    const q = this.questions[this.currentIndex];
    const totalQ = this.questions.length;

    // Progress Bar
    const progressFill = document.getElementById('quiz-progress-fill');
    const progressText = document.getElementById('quiz-progress-text');
    if (progressFill) progressFill.style.width = `${((this.currentIndex) / totalQ) * 100}%`;
    if (progressText) progressText.textContent = `Question ${this.currentIndex + 1} of ${totalQ}`;

    // Question Details
    const topicEl = document.getElementById('quiz-topic-badge');
    const questionEl = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const btnSubmit = document.getElementById('quiz-btn-submit');
    const btnNext = document.getElementById('quiz-btn-next');

    if (topicEl) topicEl.textContent = q.topic;
    if (questionEl) questionEl.textContent = q.question;
    if (feedbackBox) {
      feedbackBox.style.display = 'none';
      feedbackBox.className = 'quiz-feedback-box';
    }

    if (btnSubmit) {
      btnSubmit.style.display = 'inline-flex';
      btnSubmit.disabled = true;
    }
    if (btnNext) {
      btnNext.style.display = 'none';
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = q.options.map((opt, idx) => `
        <label class="quiz-option-card" id="option-label-${idx}" onclick="window.quizEngine.selectOption(${idx})">
          <input type="radio" name="quiz-opt" value="${idx}" class="quiz-radio" />
          <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
          <span class="option-text">${opt}</span>
        </label>
      `).join('');
    }
  }

  selectOption(index) {
    if (this.isSubmitted) return;

    this.selectedOption = index;
    const cards = document.querySelectorAll('.quiz-option-card');
    cards.forEach((card, idx) => {
      card.classList.toggle('selected', idx === index);
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = (idx === index);
    });

    const btnSubmit = document.getElementById('quiz-btn-submit');
    if (btnSubmit) btnSubmit.disabled = false;
  }

  submitAnswer() {
    if (this.selectedOption === null || this.isSubmitted) return;

    this.isSubmitted = true;
    const q = this.questions[this.currentIndex];
    const isCorrect = (this.selectedOption === q.correct);
    this.answers.push({
      questionId: q.id,
      selected: this.selectedOption,
      correct: q.correct,
      isCorrect
    });

    // Mark Option Cards with Green / Red styles
    const cards = document.querySelectorAll('.quiz-option-card');
    cards.forEach((card, idx) => {
      if (idx === q.correct) {
        card.classList.add('correct-answer');
      } else if (idx === this.selectedOption) {
        card.classList.add('wrong-answer');
      }
    });

    // Display Feedback Box
    const feedbackBox = document.getElementById('quiz-feedback-box');
    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
      feedbackBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; font-weight:700; margin-bottom:0.35rem; color: ${isCorrect ? '#065f46' : '#991b1b'};">
          <span>${isCorrect ? '&#10004; Correct!' : '&#10008; Incorrect'}</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--navy); line-height: 1.5;">${q.explanation}</p>
      `;
    }

    const btnSubmit = document.getElementById('quiz-btn-submit');
    const btnNext = document.getElementById('quiz-btn-next');
    if (btnSubmit) btnSubmit.style.display = 'none';
    if (btnNext) {
      btnNext.style.display = 'inline-flex';
      btnNext.textContent = (this.currentIndex === this.questions.length - 1) ? 'View Results' : 'Next Question';
    }
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    } else {
      this.showResults();
    }
  }

  showResults() {
    const quizCard = document.getElementById('quiz-card-main');
    const resultsCard = document.getElementById('quiz-results-card');
    const progressFill = document.getElementById('quiz-progress-fill');
    if (progressFill) progressFill.style.width = '100%';

    if (quizCard) quizCard.style.display = 'none';
    if (resultsCard) resultsCard.style.display = 'block';

    const correctCount = this.answers.filter(a => a.isCorrect).length;
    const totalCount = this.questions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    const scoreNum = document.getElementById('results-score-num');
    const scorePct = document.getElementById('results-score-pct');
    const badge = document.getElementById('results-badge');
    const message = document.getElementById('results-message');

    if (scoreNum) scoreNum.textContent = `${correctCount} / ${totalCount}`;
    if (scorePct) scorePct.textContent = `${percentage}%`;

    let badgeClass = 'badge-syn';
    let badgeText = 'Good Effort';
    let msgText = 'Review the explanations below to strengthen your understanding before viva!';

    if (percentage >= 85) {
      badgeClass = 'badge-ack';
      badgeText = 'Outstanding! Ready for Viva';
      msgText = 'Superb mastery of TCP connection mechanics, sequence numbers, and state transitions!';
    } else if (percentage >= 60) {
      badgeClass = 'badge-synack';
      badgeText = 'Competent Understanding';
      msgText = 'Good score! A quick brush up on sequence numbers and failure recovery will make it perfect.';
    }

    if (badge) {
      badge.className = `badge ${badgeClass}`;
      badge.textContent = badgeText;
    }
    if (message) message.textContent = msgText;

    // Render Answer Review List
    const reviewList = document.getElementById('results-review-list');
    if (reviewList) {
      reviewList.innerHTML = this.questions.map((q, idx) => {
        const ans = this.answers[idx];
        return `
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; background: ${ans.isCorrect ? '#f0fdf4' : '#fef2f2'};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.35rem;">
              <span style="font-weight: 700; font-size: 0.85rem; color: var(--navy);">Q${idx + 1}. ${q.question}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: ${ans.isCorrect ? '#15803d' : '#b91c1c'};">${ans.isCorrect ? '&#10004; Correct' : '&#10008; Missed'}</span>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.35rem;">
              <strong>Your answer:</strong> ${q.options[ans.selected]}
            </div>
            ${!ans.isCorrect ? `<div style="font-size: 0.82rem; color: #15803d; margin-bottom: 0.35rem;"><strong>Correct answer:</strong> ${q.options[q.correct]}</div>` : ''}
            <div style="font-size: 0.8rem; color: #475569; background: white; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color);">${q.explanation}</div>
          </div>
        `;
      }).join('');
    }
  }

  retakeQuiz() {
    this.currentIndex = 0;
    this.selectedOption = null;
    this.answers = [];
    this.isSubmitted = false;

    const quizCard = document.getElementById('quiz-card-main');
    const resultsCard = document.getElementById('quiz-results-card');

    if (resultsCard) resultsCard.style.display = 'none';
    if (quizCard) quizCard.style.display = 'block';

    this.renderQuestion();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('quiz-container')) {
    window.quizEngine = new QuizEngine();
  }
});
