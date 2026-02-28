/* ============================================
   HLE.io Clone - JavaScript
   Scroll-driven animations, clock, FAQ toggle,
   Day/Night mode, cursor glow, and more.
   ============================================ */

// ============================================
// Clock
// ============================================
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const timeStr = `${hours.toString().padStart(2, '0')} : ${minutes} ${ampm}`;
  
  const clockEl = document.getElementById('clock');
  const heroTimeEl = document.getElementById('hero-time');
  
  if (clockEl) clockEl.textContent = timeStr;
  if (heroTimeEl) heroTimeEl.textContent = timeStr;
}

updateClock();
setInterval(updateClock, 1000);

// ============================================
// FAQ Toggle
// ============================================
function toggleFaq(questionEl) {
  const faqItem = questionEl.closest('.faq-item');
  const isActive = faqItem.classList.contains('active');
  
  // Close all others
  document.querySelectorAll('.faq-item.active').forEach(item => {
    item.classList.remove('active');
  });
  
  // Toggle current
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ============================================
// Day/Night Toggle
// ============================================
const dayNightToggle = document.getElementById('day-night-toggle');
let isDayMode = true;

if (dayNightToggle) {
  dayNightToggle.addEventListener('click', () => {
    isDayMode = !isDayMode;
    document.body.classList.toggle('day-mode', isDayMode);
  });
}

// Start in day mode
document.body.classList.add('day-mode');

// ============================================
// Sound Toggle
// ============================================
const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    const switchEl = soundToggle.querySelector('.toggle-switch');
    switchEl.classList.toggle('active');
  });
}

// ============================================
// Scroll-Driven Animations (Intersection Observer)
// ============================================
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Observe all animatable sections
const animatableSections = [
  '.grid-section',
  '.helping-section',
  '.about-hero',
  '.faq-section',
  '.footer-section'
];

animatableSections.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) sectionObserver.observe(el);
});

// Observe project cards individually
document.querySelectorAll('.project-card').forEach(card => {
  sectionObserver.observe(card);
});

// ============================================
// Smart Scroll - Zoom into CRT Monitor
// ============================================
let heroSection = document.getElementById('hero');
let gridWorld = document.getElementById('grid-world');
let crtMonitor = document.getElementById('crt-monitor');
let hasZoomed = false;

function handleHeroScroll() {
  if (!heroSection || hasZoomed) return;
  
  const scrollTop = window.scrollY;
  const heroHeight = heroSection.offsetHeight;
  const scrollProgress = Math.min(scrollTop / (heroHeight * 0.5), 1);
  
  if (scrollProgress > 0) {
    // Scale the hero section to zoom into the monitor
    const scale = 1 + scrollProgress * 8;
    const opacity = 1 - scrollProgress;
    
    heroSection.style.transform = `scale(${scale})`;
    heroSection.style.opacity = opacity;
    heroSection.style.transformOrigin = '50% 45%'; // Aimed at monitor screen
    
    // Switch to night mode as we zoom in
    if (scrollProgress > 0.3) {
      document.body.classList.remove('day-mode');
    }
  } else {
    heroSection.style.transform = '';
    heroSection.style.opacity = '';
    document.body.classList.add('day-mode');
  }
}

window.addEventListener('scroll', handleHeroScroll, { passive: true });

// ============================================
// Heading Typewriter Effect
// ============================================
const headingWords = ['film', 'television', 'music', 'digital media'];
let currentWordIndex = 0;

function typewriteHeading() {
  const heading = document.getElementById('main-heading');
  if (!heading) return;
  
  const lines = heading.querySelectorAll('.heading-line');
  if (lines.length < 3) return;
  
  const lastLine = lines[2];
  const word = headingWords[currentWordIndex];
  
  // Clear and retype
  let charIndex = 0;
  const baseText = 'across ';
  
  function typeChar() {
    if (charIndex <= word.length) {
      lastLine.innerHTML = baseText + word.substring(0, charIndex) + '<span class="cursor-blink">|</span>';
      charIndex++;
      setTimeout(typeChar, 80 + Math.random() * 40);
    } else {
      // Wait, then delete
      setTimeout(() => deleteChars(word.length), 2000);
    }
  }
  
  function deleteChars(count) {
    if (count > 0) {
      lastLine.innerHTML = baseText + word.substring(0, count - 1) + '<span class="cursor-blink">|</span>';
      count--;
      setTimeout(() => deleteChars(count), 40);
    } else {
      currentWordIndex = (currentWordIndex + 1) % headingWords.length;
      setTimeout(typewriteHeading, 500);
    }
  }
  
  typeChar();
}

// Start typewriter after a delay
setTimeout(typewriteHeading, 2000);

// Also do the same for the CRT screen
const screenWords = ['music', 'film', 'television', 'digital media'];
let screenWordIndex = 0;

function typewriteScreen() {
  const screenTitle = document.querySelector('.screen-title');
  if (!screenTitle) return;
  
  const word = screenWords[screenWordIndex];
  let charIndex = 0;
  const baseText = 'Positioned at the axis<br>of talent and content<br>across ';
  
  function typeChar() {
    if (charIndex <= word.length) {
      screenTitle.innerHTML = baseText + word.substring(0, charIndex) + '<span class="cursor-blink">|</span>';
      charIndex++;
      setTimeout(typeChar, 100 + Math.random() * 50);
    } else {
      setTimeout(() => deleteChars(word.length), 2500);
    }
  }
  
  function deleteChars(count) {
    if (count > 0) {
      screenTitle.innerHTML = baseText + word.substring(0, count - 1) + '<span class="cursor-blink">|</span>';
      count--;
      setTimeout(() => deleteChars(count), 50);
    } else {
      screenWordIndex = (screenWordIndex + 1) % screenWords.length;
      setTimeout(typewriteScreen, 500);
    }
  }
  
  typeChar();
}

setTimeout(typewriteScreen, 1000);

// ============================================
// Cursor Glow Effect
// ============================================
const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
document.body.appendChild(cursorGlow);

let mouseX = 0, mouseY = 0;
let glowX = 0, glowY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateGlow() {
  glowX += (mouseX - glowX) * 0.1;
  glowY += (mouseY - glowY) * 0.1;
  cursorGlow.style.left = `${glowX}px`;
  cursorGlow.style.top = `${glowY}px`;
  requestAnimationFrame(animateGlow);
}

animateGlow();

// Hide glow on hero (day mode)
document.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const heroHeight = heroSection ? heroSection.offsetHeight : 0;
  
  if (scrollTop < heroHeight * 0.8) {
    cursorGlow.style.opacity = '0';
  } else {
    cursorGlow.style.opacity = '1';
  }
}, { passive: true });

// ============================================
// Sidebar visibility on projects section
// ============================================
const sidebarInfo = document.querySelector('.sidebar-info');
const projectsSection = document.getElementById('projects');

if (sidebarInfo && projectsSection) {
  const sidebarObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      sidebarInfo.classList.toggle('visible', entry.isIntersecting);
    });
  }, { threshold: 0.3 });
  
  sidebarObserver.observe(projectsSection);
}

// ============================================
// Smooth scroll for nav links
// ============================================
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').replace('#', '');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================
// Contact Form Handler
// ============================================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.submit-btn');
    btn.textContent = 'Sent ✓';
    btn.style.borderColor = '#4fc3f7';
    btn.style.color = '#4fc3f7';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.borderColor = '';
      btn.style.color = '';
      contactForm.reset();
    }, 3000);
  });
}

// ============================================
// Parallax Scroll Effect for Grid Lines
// ============================================
window.addEventListener('scroll', () => {
  const gridLines = document.querySelector('.grid-lines');
  if (gridLines) {
    const scrollTop = window.scrollY;
    const offset = scrollTop * 0.05;
    gridLines.style.transform = `translateY(${offset}px)`;
  }
}, { passive: true });

// ============================================
// Project Carousel Drag Scroll
// ============================================
const carousel = document.getElementById('projects-carousel');
if (carousel) {
  let isDown = false;
  let startX;
  let scrollLeft;
  
  carousel.addEventListener('mousedown', (e) => {
    isDown = true;
    carousel.style.cursor = 'grabbing';
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });
  
  carousel.addEventListener('mouseleave', () => {
    isDown = false;
    carousel.style.cursor = 'grab';
  });
  
  carousel.addEventListener('mouseup', () => {
    isDown = false;
    carousel.style.cursor = 'grab';
  });
  
  carousel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 2;
    carousel.scrollLeft = scrollLeft - walk;
  });
  
  carousel.style.cursor = 'grab';
}

// ============================================
// Entry Animations on Page Load
// ============================================
window.addEventListener('load', () => {
  // Animate the CRT monitor appearing
  if (crtMonitor) {
    crtMonitor.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease';
    crtMonitor.style.opacity = '0';
    crtMonitor.style.transform = 'translateY(40px) scale(0.95)';
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        crtMonitor.style.opacity = '1';
        crtMonitor.style.transform = 'translateY(0) scale(1)';
      }, 300);
    });
  }
  
  // Animate nav items
  document.querySelectorAll('.nav-links li').forEach((li, i) => {
    li.style.opacity = '0';
    li.style.transform = 'translateX(-20px)';
    li.style.transition = `opacity 0.6s ease ${0.2 + i * 0.1}s, transform 0.6s ease ${0.2 + i * 0.1}s`;
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        li.style.opacity = '1';
        li.style.transform = 'translateX(0)';
      }, 100);
    });
  });
  
  // Animate hero bottom
  const heroBottom = document.querySelector('.hero-bottom');
  if (heroBottom) {
    heroBottom.style.opacity = '0';
    heroBottom.style.transform = 'translateY(20px)';
    heroBottom.style.transition = 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s';
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        heroBottom.style.opacity = '1';
        heroBottom.style.transform = 'translateY(0)';
      }, 100);
    });
  }
});
