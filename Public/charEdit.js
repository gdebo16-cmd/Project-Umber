document.querySelectorAll(".rollBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.stat;
    const dice = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
    dice.sort((a, b) => a - b);
    const total = dice[1] + dice[2] + dice[3];
    btn.textContent = total;
    const hidden = document.getElementById(`stat-${key}`);
    if (hidden) hidden.value = total;
  });
});

const classSelect = document.getElementById("class_id");
const subclassSelect = document.getElementById("subclass_id");
const allSubsEl = document.getElementById("all-subclasses");

if (classSelect && subclassSelect && allSubsEl) {
  const allSubs = JSON.parse(allSubsEl.textContent);

  function fillSubs(selectedId) {
    const classId = Number(classSelect.value);
    const keep = selectedId != null ? Number(selectedId) : Number(subclassSelect.value);
    subclassSelect.innerHTML = "";
    allSubs
      .filter((s) => Number(s.class_id) === classId)
      .forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        opt.dataset.classId = s.class_id;
        if (Number(s.id) === keep) opt.selected = true;
        subclassSelect.appendChild(opt);
      });
  }

  classSelect.addEventListener("change", () => fillSubs(null));
}
