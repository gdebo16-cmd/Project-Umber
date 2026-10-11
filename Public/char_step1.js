const raceSelect = document.getElementById("race_id");
const box = document.getElementById("descContainer");
const img = document.getElementById("descImg");
const text = document.getElementById("descText");

raceSelect.addEventListener("change", () => {
  const opt = raceSelect.selectedOptions[0];   // the option they just picked
  img.src = opt.dataset.img;                   // reads data-img
  img.alt = opt.textContent;
  text.textContent = opt.dataset.desc;         // reads data-desc
  box.hidden = false;
});