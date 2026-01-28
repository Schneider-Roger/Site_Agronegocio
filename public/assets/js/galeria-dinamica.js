document.addEventListener('DOMContentLoaded', function () {
  // INFINITE LOGO CAROUSEL LOOP (requestAnimationFrame version)
  function setupInfiniteLogoLoop() {
    const selectors = ['.setor-hover-panel .logos-container', '.carrossel-logos'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(container => {
        if (container.dataset.infiniteLoop === '1') return;
        container.dataset.infiniteLoop = '1';

        const children = Array.from(container.children).filter(n => n.nodeType === 1);
        if (children.length < 2) return;

        // Create wrapper and move children
        const wrapper = document.createElement('div');
        wrapper.className = 'logos-infinite-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.flexWrap = 'nowrap';
        const computedGap = window.getComputedStyle(container).gap || '0px';
        wrapper.style.gap = computedGap;
        while (container.firstChild) {
          wrapper.appendChild(container.firstChild);
        }
        // Clone only the original children (not the wrapper itself)
        const originalChildren = Array.from(wrapper.children);
        const cloneFragment = document.createDocumentFragment();
        originalChildren.forEach(child => {
          cloneFragment.appendChild(child.cloneNode(true));
        });
        wrapper.appendChild(cloneFragment);
        container.appendChild(wrapper);

        // Wait for all images to load
        const imgs = wrapper.querySelectorAll('img');
        let loaded = 0;
        if (imgs.length === 0) {
          startLoop();
        } else {
          imgs.forEach(img => {
            if (img.complete) {
              loaded++;
              if (loaded === imgs.length) startLoop();
            } else {
              img.onload = img.onerror = () => {
                loaded++;
                if (loaded === imgs.length) startLoop();
              };
            }
          });
        }

        function startLoop() {
          // Calculate width of all original children including gap
          let logosWidth = 0;
          const gapPx = parseFloat(computedGap) || 0;
          for (let i = 0; i < originalChildren.length; i++) {
            const el = originalChildren[i];
            const style = window.getComputedStyle(el);
            const marginL = parseFloat(style.marginLeft) || 0;
            const marginR = parseFloat(style.marginRight) || 0;
            logosWidth += el.getBoundingClientRect().width + marginL + marginR;
            if (i < originalChildren.length - 1) logosWidth += gapPx;
          }
          if (logosWidth === 0) return;

          let pos = 0;
          const speed = 0.5; // px per frame

          function animate() {
            pos -= speed;
            if (Math.abs(pos) >= logosWidth) {
              pos = 0;
            }
            wrapper.style.transform = `translateX(${pos}px)`;
            requestAnimationFrame(animate);
          }
          animate();
        }
      });
    });
  }

  // Run after DOM is ready
  setTimeout(setupInfiniteLogoLoop, 300);
  window.addEventListener('resize', () => {
    // Remove previous setup and re-init
    document.querySelectorAll('.logos-infinite-wrapper').forEach(w => {
      const parent = w.parentNode;
      while (w.firstChild) parent.insertBefore(w.firstChild, w);
      parent.removeChild(w);
      if (parent.dataset) parent.dataset.infiniteLoop = '';
    });
    setTimeout(setupInfiniteLogoLoop, 200);
  });
});