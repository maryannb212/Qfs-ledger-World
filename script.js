/* =============================================
   QFS WORLD — JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile menu toggle ---------- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      menuToggle.classList.toggle('active');
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('.header__nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.classList.remove('active');
      });
    });
  }

  /* ---------- Scroll to top button ---------- */
  const scrollTopBtn = document.getElementById('scroll-top');

  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Header background on scroll ---------- */
  const header = document.getElementById('header');

  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  /* ---------- Scroll reveal animation ---------- */
  const revealElements = document.querySelectorAll(
    '.features__card, .trading__card, .safety__item, .cta-section__step, ' +
    '.features__title, .buy-crypto__title, .buy-crypto__text, ' +
    '.safety__title, .trading__title, .cta-section__title, .cta-section__text, ' +
    '.prefooter__title, .prefooter__text, .hero__content, .hero__image-wrapper'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger children animation
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        let delay = 0;
        siblings.forEach(sib => {
          if (sib === entry.target || entry.target.contains(sib)) return;
        });

        entry.target.style.transitionDelay = '0s';
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((el, index) => {
    // Add staggered delay for cards in grids
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal'));
      const sibIndex = siblings.indexOf(el);
      if (sibIndex > 0) {
        el.style.transitionDelay = `${sibIndex * 0.1}s`;
      }
    }
    revealObserver.observe(el);
  });

  /* ---------- Smooth anchor scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        const headerHeight = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Typing effect for hero (subtle) ---------- */
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    heroTitle.style.opacity = '0';
    heroTitle.style.transform = 'translateY(20px)';
    setTimeout(() => {
      heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heroTitle.style.opacity = '1';
      heroTitle.style.transform = 'translateY(0)';
    }, 200);
  }

  /* ---------- Chat widget ---------- */
  // Chat widget logic has been moved to chat.js

  /* ---------- Counter animation for dashboard prices ---------- */
  function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const prefix = end < 0 ? '-' : '';
    const isPrice = element.classList.contains('coin-price');

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = start + (end - start) * eased;

      if (isPrice) {
        element.textContent = '$' + current.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // Animate dashboard prices on load
  const prices = document.querySelectorAll('.coin-price');
  const priceValues = [28834.09, 1724.04, 1.00, 304.87, 1.00];
  prices.forEach((el, i) => {
    if (priceValues[i]) {
      setTimeout(() => {
        animateValue(el, 0, priceValues[i], 1500);
      }, 800 + i * 200);
    }
  });

});
