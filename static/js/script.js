// Smooth reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal-up, .reveal-right').forEach(el => io.observe(el));

// Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger?.addEventListener('click', () => mobileMenu.classList.toggle('show'));

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// ---- DATA LOADING from Flask API ----
// Expected Flask routes:
// GET  /api/skills              -> { skills: ["Python","SQL",... ] }
// GET  /api/experience          -> [{role, company, location, start, end, bullets:[...]}, ...]
// GET  /api/projects            -> [{title, desc, tags:[...], links:{github, demo}}, ...]
// GET  /api/certifications      -> [{title, org, year, link?}, ...]
// POST /api/contact {name,email,message} -> {ok:true} or {ok:false, error:"..."}

async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Fetch failed for', url, err);
    return null;
  }
}

(async function loadSkills(){
  const data = await safeFetch('/api/skills');
  const wrap = document.getElementById('skillsWrap');
  if (!wrap) return;
  if (data?.skills?.length) {
    data.skills.forEach((s, i) => {
      const d = document.createElement('span');
      d.className = 'chip' + (i < 3 ? ' badge' : '');
      d.textContent = s;
      wrap.appendChild(d);
    });
  } else {
    wrap.innerHTML = '<span class="chip">Python</span><span class="chip">SQL</span><span class="chip">Power BI</span>';
  }
})();

(async function loadExperience(){
  const data = await safeFetch('/api/experience');
  const tl = document.getElementById('expTimeline');
  if (!tl) return;
  const items = data?.map?.(e => `
    <div class="item">
      <h3>${e.role} — ${e.company}</h3>
      <div class="meta">${e.location || 'Remote'} • ${e.start} → ${e.end || 'Present'}</div>
      ${Array.isArray(e.bullets) ? `<ul>${e.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `) ?? [
    `<div class="item"><h3>Data Science Intern — YBI Foundation</h3><div class="meta">Remote • Sep 2025 → Oct 2025</div></div>`
  ];
  tl.innerHTML = items.join('');
})();

(async function loadProjects(){
  const data = await safeFetch('/api/projects');
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const cards = data?.map?.(p => `
    <article class="card">
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
      ${Array.isArray(p.tags) ? `<div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>` : ''}
      <div class="links">
        ${p.links?.github ? `<a href="${p.links.github}" target="_blank">GitHub ↗</a>` : ''}
        ${p.links?.demo ? `<a href="${p.links.demo}" target="_blank">Live Demo ↗</a>` : ''}
      </div>
    </article>
  `) ?? [
    `<article class="card">
      <h3>Movie Recommendation System</h3>
      <p>Content-based & collaborative filtering with Python. Deployed demo.</p>
      <div class="tags"><span class="tag">Python</span><span class="tag">ML</span></div>
      <div class="links">
        <a href="https://github.com/karthik-vana/Movie_Recommendation" target="_blank">GitHub ↗</a>
      </div>
    </article>`
  ];
  grid.innerHTML = cards.join('');
})();

(async function loadCerts(){
  const data = await safeFetch('/api/certifications');
  const ul = document.getElementById('certList');
  if (!ul) return;
  const items = data?.map?.(c => `
    <li>${c.title} — ${c.org}${c.year ? ` (${c.year})` : ''} ${c.link ? `<a href="${c.link}" target="_blank">↗</a>` : ''}</li>
  `) ?? [
    `<li>Google Advanced Data Analytics — Google (2025)</li>`,
    `<li>Python for Data Science — IBM (2025)</li>`
  ];
  ul.innerHTML = items.join('');
})();

// Contact form submit
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const msg = document.getElementById('formMsg');
  msg.textContent = 'Sending...';

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim()
  };

  const res = await safeFetch('/api/contact', {
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body: JSON.stringify(payload)
  });

  if (res?.ok) {
    msg.textContent = 'Thanks! Your message was sent.';
    form.reset();
  } else {
    msg.textContent = 'Sorry, failed to send. Please try again later.';
  }
});
