/**
 * Shared mobile navigation: hamburger, outside click, Escape, link close, resize.
 * Works with .nav-toggle, .nav-menu, .nav-container, and optional #primary-navigation.
 */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  const container = document.querySelector(".nav-container");

  if (!toggle || !menu) return;

  const mqMobile = window.matchMedia("(max-width: 768px)");

  function isMobileMenuActive() {
    return mqMobile.matches;
  }

  function setOpen(open) {
    menu.classList.toggle("show", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (menu.id) {
      toggle.setAttribute("aria-controls", menu.id);
    }
  }

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!menu.classList.contains("show"));
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (isMobileMenuActive()) setOpen(false);
    });
  });

  document.addEventListener("click", function (e) {
    if (!isMobileMenuActive()) return;
    if (!menu.classList.contains("show")) return;
    if (container && container.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", function () {
    if (!mqMobile.matches) setOpen(false);
  });
})();
