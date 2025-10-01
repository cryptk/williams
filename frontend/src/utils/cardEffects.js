// Dynamic shadow effect for cards based on mouse position

// Configuration - adjust these values to control the shadow effect intensity
const SHADOW_CONFIG = {
  maxOffset: 5,        // Maximum shadow offset in pixels (default: 20)
  minBlur: 5,          // Minimum blur in pixels (default: 15)
  maxBlur: 10,          // Maximum blur in pixels (default: 30)
  minSpread: 2,         // Minimum spread in pixels (default: 2)
  maxSpread: 5,         // Maximum spread in pixels (default: 5)
  opacity: 0.2,         // Shadow opacity 0-1 (default: 0.2)
  defaultShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'  // Shadow when mouse leaves
};

export function initCardShadows() {
  // Function to calculate shadow based on mouse position
  console.log('Initializing card shadow effects');
  const updateShadow = (card, e) => {
    console.log('Mouse move detected on card');
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    // Calculate mouse position relative to card center (normalized -1 to 1)
    const mouseX = (e.clientX - cardCenterX) / (rect.width / 2);
    const mouseY = (e.clientY - cardCenterY) / (rect.height / 2);
    
    // Shadow should be opposite to mouse position
    const shadowX = -mouseX * SHADOW_CONFIG.maxOffset;
    const shadowY = -mouseY * SHADOW_CONFIG.maxOffset;
    
    // Calculate shadow blur and spread based on distance from center
    const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    const blurRange = SHADOW_CONFIG.maxBlur - SHADOW_CONFIG.minBlur;
    const spreadRange = SHADOW_CONFIG.maxSpread - SHADOW_CONFIG.minSpread;
    const blur = SHADOW_CONFIG.minBlur + distance * blurRange;
    const spread = SHADOW_CONFIG.minSpread + distance * spreadRange;
    
    // Apply the shadow
    card.style.boxShadow = `${shadowX}px ${shadowY}px ${blur}px ${spread}px rgba(0, 0, 0, ${SHADOW_CONFIG.opacity})`;
  };
  
  // Function to reset shadow
  const resetShadow = (card) => {
    console.log('Resetting shadow for card');
    card.style.boxShadow = SHADOW_CONFIG.defaultShadow;
  };
  
  // Apply to all cards
  const applyToCards = () => {
    // Bill cards
    const billCards = document.querySelectorAll('.bill-card');
    billCards.forEach(card => {
      console.log('Attaching event listeners to bill card: ', card);
      card.addEventListener('mousemove', (e) => updateShadow(card, e));
      card.addEventListener('mouseleave', () => resetShadow(card));
    });
    
    // Stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      console.log('Attaching event listeners to stat card: ', card);
      card.addEventListener('mousemove', (e) => updateShadow(card, e));
      card.addEventListener('mouseleave', () => resetShadow(card));
    });
    
    // Category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      console.log('Attaching event listeners to category card: ', card);
      card.addEventListener('mousemove', (e) => updateShadow(card, e));
      card.addEventListener('mouseleave', () => resetShadow(card));
    });
  };
  
  // Initial application with a small delay to ensure DOM is ready
  const initialTimeout = setTimeout(() => {
    applyToCards();
  }, 100);
  
  // Re-apply when content changes (for dynamic content)
  const observer = new MutationObserver(() => {
    applyToCards();
  });
  
  // Observe the main content area for any changes
  const mainContent = document.querySelector('.main-content') || document.body;
  observer.observe(mainContent, { childList: true, subtree: true });
  
  return () => {
    clearTimeout(initialTimeout);
    observer.disconnect();
  };
}
