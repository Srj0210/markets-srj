/* Simple animations: logo shimmer, headline typewriter, reveal */
(function(){
  // Logo shimmer (CSS class toggle)
  const logo = document.getElementById('logo');
  if(logo){
    logo.style.transition = 'transform 0.6s ease';
    logo.addEventListener('mouseenter', ()=> logo.style.transform = 'scale(1.06)');
    logo.addEventListener('mouseleave', ()=> logo.style.transform = 'scale(1)');
  }

  // Headline typewriter effect (subtle)
  const hh = document.getElementById('hero-headline');
  if(hh){
    const full = hh.textContent;
    hh.textContent = '';
    let i=0;
    const id = setInterval(()=>{
      hh.textContent += full[i++]||'';
      if(i>full.length) clearInterval(id);
    },18);
  }

  // Reveal on scroll: add .reveal to elements when they appear
  const toReveal = document.querySelectorAll('.paper-panel, .market-card, .news-item');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting) en.target.classList.add('reveal');
    });
  }, {threshold:0.12});
  toReveal.forEach(e=>obs.observe(e));
})();
