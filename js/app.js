/**
 * Main Application Orchestrator & UI Controller
 * Handles sidebar toggling, keyboard shortcuts, shared toast notifications,
 * and page lifecycle events.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // 2. Global Keyboard Shortcuts for Simulator and Scenarios
  document.addEventListener('keydown', (e) => {
    // Avoid triggering when user is typing in form inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      // Space toggles start or pause
      const btnStart = document.getElementById('btn-start');
      const btnPause = document.getElementById('btn-pause');
      if (btnPause && !btnPause.disabled && window.simulator && window.simulator.isPlaying) {
        btnPause.click();
      } else if (btnStart && !btnStart.disabled) {
        btnStart.click();
      }
    } else if (e.key === 'ArrowRight') {
      // Right arrow steps forward
      const btnNext = document.getElementById('btn-next');
      if (btnNext && !btnNext.disabled) {
        btnNext.click();
      }
    } else if (e.key === 'ArrowLeft') {
      // Left arrow steps backward
      const btnPrev = document.getElementById('btn-prev');
      if (btnPrev && !btnPrev.disabled) {
        btnPrev.click();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      // 'R' resets
      const btnReset = document.getElementById('btn-reset');
      if (btnReset) {
        btnReset.click();
      }
    }
  });

  // 3. Dynamic current year in footer
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
