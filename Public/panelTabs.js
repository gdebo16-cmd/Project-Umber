const wireTabs = (tabList) => {
  const tabs = tabList.querySelectorAll('[role="tab"]');

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
};

document.querySelectorAll('[role="tablist"]').forEach(wireTabs);
