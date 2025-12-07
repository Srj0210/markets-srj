// SRJahir Markets — Premium Animations

document.addEventListener("DOMContentLoaded", () => {
  
  /* Logo hover */
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.style.transition = "0.35s ease";
    logo.addEventListener("mouseenter", () => logo.style.transform = "scale(1.10)");
    logo.addEventListener("mouseleave", () => logo.style.transform = "scale(1)");
  }

  /* Reveal animations for tiles */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll(".tile, .news-card").forEach(el => {
    el.style.opacity = 0;
    el.style.transform = "translateY(12px)";
    el.style.transition = "0.6s ease";
    observer.observe(el);
  });

});