// Minimal animations for SRJahir Markets

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.style.transition = "0.3s ease";
    logo.addEventListener("mouseenter", () => logo.style.transform = "scale(1.08)");
    logo.addEventListener("mouseleave", () => logo.style.transform = "scale(1)");
  }
});
