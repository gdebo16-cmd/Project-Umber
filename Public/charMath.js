const tabs = document.querySelectorAll('[role="tab"]');
const panels = document.querySelectorAll('[role="tabpanel"]');


const wireTabs = (tabList) => {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const root = tabList.parentElement;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
        tab.setAttribute("aria-selected", "true");
  
        tabs.forEach((t) => {
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.setAttribute("hidden", "");
        });
  
        const panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.removeAttribute("hidden");
      });
    });
  }
  
  document.querySelectorAll('[role="tablist"]').forEach(wireTabs);


  const wireRollOrb = (orb) => {
    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0;
    let originLeft = 0, originTop = 0;

    const open =() => {
      orb.classList.add('is-open');
      orb.setAttribute('aria-expanded', 'true');
      orb.querySelector('.roll-orb__panel').hidden = false;
    };

    const close = () => {
      orb.classList.remove('is-open');
      orb.setAttribute('aria-expanded', 'false');
      orb.querySelector('.roll-orb__panel').hidden = true;
    };

    orb.addEventListener('pointerdown', (e) => {
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = orb.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;
      orb.setPointerCapture(e.pointerId);
      orb.classList.add('is-dragging');
    });

    orb.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      orb.style.left = `${originLeft + dx}px`;
      orb.style.top = `${originTop + dy}px`;
    });

    orb.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      orb.classList.remove('is-dragging');
      if (!moved) {
        if (orb.classList.contains('is-open')) close();
        else open();
      }
    });
  }

  const rollOrb = document.getElementById('rollOrb');
  if (rollOrb) wireRollOrb(rollOrb);

  const abilityMod = (score) => {
    return Math.floor(Number(score) / 2) - 5;
  }
  
  const formatMod = (m) => {
    return (m >= 0 ? '+' : '') + m;
  }

  const showRoll = (orb, {label, score }) => {
    const mod = abilityMod(score);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + mod;

    const name = (label || 'check').replace(/^\w/, (c) => c.toUpperCase());

    orb.querySelector('.roll-orb__label').textContent = `${name} Check Roll: ${total}`;
    orb.querySelector('.roll-orb__total').textContent = `(${d20}${formatMod(mod)})`;
    ;

    orb.classList.add('is-open');
    orb.setAttribute('aria-expanded', 'true');
    orb.querySelector('.roll-orb__panel').hidden = false;

  };

  document.querySelector('.base-stats')?.addEventListener('click', (e) => {
    const box = e.target.closest('.base-stats-box');
    if (!box || !rollOrb) return;

    const score = box.dataset.score;
    const label = box.querySelector('.stat-name')?.textContent?.trim();
    showRoll(rollOrb, { label, score });
  });