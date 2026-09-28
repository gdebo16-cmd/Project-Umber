document.querySelectorAll(".rollBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const res = await fetch(`/create_char/roll/${btn.dataset.stat}`, { method: "POST" });
      if (!res.ok) { alert("Could not roll"); return; }
      const data = await res.json();
      btn.textContent = data.value;   // show the number on the button
      btn.disabled = true;            // stop more clicks
    });
  });