const classSelect = document.getElementById('class_id');
const box = document.getElementById("descContainer");
const img = document.getElementById("descImg");
const text = document.getElementById("descText");
const subBox = document.getElementById('subClassContainer');
const subSelect= document.getElementById('subclass_id');


classSelect.addEventListener("change", async () => {

    const opt = classSelect.selectedOptions[0];   // the option they just picked
        img.src = opt.dataset.img;                   // reads data-img
        img.alt = opt.textContent;
        text.textContent = opt.dataset.desc;         // reads data-desc
        box.hidden = false;

    const res = await fetch(`/create_char/subclasses/${classSelect.value}`);
        if (!res.ok) {
            alert("could not load subclasses");
            return;
        }
    
    const subclasses = await res.json();

    subSelect.innerHTML = `<option value="" disabled selected>Select a Subclass</option>`;
    subclasses.forEach(s => {
        const o = new Option(s.name, s.id);
        o.dataset.img = s.img_url ?? "";
        o.dataset.desc = s.description ?? "";
        subSelect.add(o);
    });
    subSelect.disabled = false;
    subBox.hidden = false;
});


subSelect.addEventListener("change", async() => {
    const opt = subSelect.selectedOptions[0];
    img.src = opt.dataset.img;
    img.alt = opt.textContent;
    text.textContent = opt.dataset.desc;
    box.hidden = false;
});