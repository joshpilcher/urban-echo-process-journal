document.title = 'Urban Echo - DES222 Process Journal';

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a')];

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = `#${entry.target.id}`;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === id));
  });
}, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

sections.forEach(section => observer.observe(section));

// Reliable scroll-to-top behaviour for the brand and footer button.
document.querySelectorAll('a[href="#top"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });
});
