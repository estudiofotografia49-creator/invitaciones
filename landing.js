// ============================================================
// FESTALI — landing.js
// Lógica de la landing page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initCardAnimations();
});

// ==================== ANIMACIONES DE CARDS AL SCROLL ====================

function initCardAnimations() {
  const cards = document.querySelectorAll('.card');

  // Inyectar estilos de animación
  const style = document.createElement('style');
  style.textContent = `
    .card {
      opacity: 0;
      transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease !important;
    }
    .card.card-visible {
      opacity: 1;
    }
    .card:not(.destacado) {
      transform: translateY(36px);
    }
    .card.destacado {
      transform: scale(1.04) translateY(36px);
    }
    .card:not(.destacado).card-visible {
      transform: translateY(0);
    }
    .card.destacado.card-visible {
      transform: scale(1.04) translateY(0);
    }
    @media (max-width: 680px) {
      .card.destacado,
      .card.destacado.card-visible {
        transform: translateY(0) !important;
      }
      .card.destacado:not(.card-visible) {
        transform: translateY(36px) !important;
      }
    }
  `;
  document.head.appendChild(style);

  if (!('IntersectionObserver' in window)) {
    // Fallback: mostrar todas
    cards.forEach(card => {
      card.style.opacity = '1';
      card.style.transform = card.classList.contains('destacado')
        ? 'scale(1.04) translateY(0)'
        : 'translateY(0)';
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.aosDelay || '0');
        setTimeout(() => {
          entry.target.classList.add('card-visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  cards.forEach(card => observer.observe(card));
}
