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

  const skillMod = (score) => {
    return Math.floor(Number(score));
  }

  const initMod = (score) => {
    return Math.floor(Number(score));
  }

  const hitMod = (score) => {
    return Math.floor(Number(score));
  }
  
  const formatMod = (m) => {
    return (m >= 0 ? '+' : '') + m;
  }

  const showRoll = (orb, { label, score, kind }) => {
    let mod = abilityMod(score);
    if (kind === 'skill') mod = skillMod(score);
    if (kind === 'init') mod = initMod(score);
    if (kind === 'hit') mod = hitMod(score);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + mod;

    const name = (label || 'check').replace(/^\w/, (c) => c.toUpperCase());

    if (kind === 'check') orb.querySelector('.roll-orb__label').textContent = `${name} roll: ${total}`;
    if (kind === 'skill') orb.querySelector('.roll-orb__label').textContent = `${name} check: ${total}`;
    if (kind === 'init') orb.querySelector('.roll-orb__label').textContent = `Initiative: ${total}`;
    if (kind === 'hit') orb.querySelector('.roll-orb__label').textContent = `Chance to hit: ${total}`;
    if (kind === 'damage') orb.querySelector('.roll-orb__label').textContent = `Damage dealt: ${total}`;
  
    

    orb.classList.add('is-open');
    orb.setAttribute('aria-expanded', 'true');
    orb.querySelector('.roll-orb__panel').hidden = false;

  };

  document.querySelector('.base-stats')?.addEventListener('click', (e) => {
    const box = e.target.closest('.base-stats-box');
    if (!box || !rollOrb) return;

    const score = box.dataset.score;
    const label = box.querySelector('.stat-name')?.textContent?.trim();
    showRoll(rollOrb, { label, score, kind: 'check' });

    
  });

  document.querySelector('#skillsContainer').addEventListener('click', (e) => {
    const skill = e.target.closest('.skillContainer');
    if (!skill || !rollOrb) return;

    const score = skill.querySelector('.skillValue')?.textContent?.trim();
    const label = skill.querySelector('.skillTitle')?.textContent?.trim();
    showRoll(rollOrb, { label, score, kind: 'skill' });
  });

  document.querySelector('.initiative').addEventListener('click', (e) => {
    const init = e.target.closest('.initContainer');
    if (!init || !rollOrb) return;

    const score = init.querySelector('#initValue')?.textContent?.trim();
    const label = init.querySelector('#initTitle')?.textContent?.trim();
    showRoll(rollOrb, { label, score, kind: 'init' });
  });

  document.querySelector('.actionRow').addEventListener('click', (e) => {
    const toHit = e.target.closest('.toHitButton');
    if (!toHit || !rollOrb) return;

    const score = toHit.querySelector('#toHitValue')?.textContent?.trim();
    const label = toHit.querySelector('#toHitTitle')?.textContent?.trim();
    showRoll(rollOrb, { label, score, kind: 'hit' });
  });


  const addHealth = document.querySelector('#healButton');
  const removeHealth = document.querySelector('#damageButton');
  const modifyHp = document.querySelector('#hpInput').value;
  const currHpEl = document.querySelector('#currHpValue');
  const maxHpEl = document.querySelector('#maxHpValue');

  if (addHealth && removeHealth && modifyHp && currHpEl && maxHpEl) {
    const readInt = (text) => {
      const n = Number.parseInt(String(text).trim(), 10);
      return Number.isInteger(n) ? n : null;
    };
    
    addHealth.addEventListener('click', () => {
      const amount = readInt(modifyHp.value);
      const max = readInt(maxHpEl.textContent);
      const current = readInt(currHpEl.textContent);
      if (amount === null || amount < 0 || max === null || current === null) return;
    
      currHpEl.textContent = String(Math.min(max, current + amount));
    });
    
    removeHealth.addEventListener('click', () => {
      const amount = readInt(modifyHp.value);
      const max = readInt(maxHpEl.textContent);
      const current = readInt(currHpEl.textContent);
      if (amount === null || amount < 0 || max === null || current === null) return;
    
      const next = Math.max(0, current - amount);
      currHpEl.textContent = String(next);
      if (next === 0) {
        currHpEl.textContent = 'You Have Fallen!';
      }
    });
  }

  
  