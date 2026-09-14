/* ==========================================================================
   ARNAV JAIN — PLAYFUL PORTFOLIO
   script.js — where the personality lives
   --------------------------------------------------------------------------
   2. Confetti engine    (canvas physics, fired from several places)
   3. Sparkle cursor     (emoji sparks trail the pointer)
   4. Hero letter springs(each letter jumps on hover)
   5. Bounce-in reveals  (GSAP back.out pops on scroll)
   6. Scroll worm        (caterpillar progress bar)
   7. Draggable stickers (pointer-event physics, springs back? no — stays!)
   8. Counters, modal, filters-free projects, nav, footer
   ========================================================================== */

"use strict";

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = typeof gsap !== "undefined";

/* ==========================================================================
   2. CONFETTI ENGINE — tiny canvas particle system
   ========================================================================== */
const confetti = { canvas: null, ctx: null, bits: [], running: false };

function initConfetti() {
  confetti.canvas = $("#confettiCanvas");
  if (!confetti.canvas) return;
  confetti.ctx = confetti.canvas.getContext("2d");
  const fit = () => {
    confetti.canvas.width = innerWidth;
    confetti.canvas.height = innerHeight;
  };
  fit();
  addEventListener("resize", fit);
}

function burstConfetti(x, y, count = 40) {
  if (!confetti.ctx || reduceMotion) return;
  const colors = ["#ff6b57", "#ffd23f", "#b8f2d8", "#a8d8ff", "#ffb8d1", "#d9c9ff", "#ffb454"];
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    confetti.bits.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 4,       // bias upward
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
      life: 1,
    });
  }
  if (!confetti.running) { confetti.running = true; confettiLoop(); }
}

function confettiLoop() {
  const { ctx, canvas, bits } = confetti;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i];
    b.vy += 0.25;                            // gravity
    b.vx *= 0.99; b.x += b.vx; b.y += b.vy;
    b.rot += b.vr; b.life -= 0.012;
    if (b.life <= 0 || b.y > canvas.height + 20) { bits.splice(i, 1); continue; }
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.globalAlpha = Math.max(b.life, 0);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  }
  if (bits.length) requestAnimationFrame(confettiLoop);
  else { confetti.running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

/* ==========================================================================
   3. SPARKLE CURSOR TRAIL — throttled emoji sparks
   ========================================================================== */
function initSparkles() {
  const layer = $("#sparkleLayer");
  if (!layer || reduceMotion || !matchMedia("(hover:hover)").matches) return;
  const sparks = ["✦", "✧", "⋆", "✩"];
  const colors = ["#ff6b57", "#e8b400", "#3cb878", "#4f8cff", "#a06bff"];
  let last = 0;

  addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (now - last < 90) return;             // throttle to ~11/sec
    last = now;
    const s = document.createElement("span");
    s.className = "spark";
    s.textContent = sparks[Math.floor(Math.random() * sparks.length)];
    s.style.left = e.clientX + (Math.random() * 16 - 8) + "px";
    s.style.top = e.clientY + (Math.random() * 16 - 8) + "px";
    s.style.color = colors[Math.floor(Math.random() * colors.length)];
    layer.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });
}

/* ==========================================================================
   4. HERO LETTER SPRINGS — wrap letters, jump on hover, intro cascade
   ========================================================================== */
function initHeroLetters() {
  $$("[data-jump]").forEach((row) => {
    const letters = [...row.textContent];
    row.textContent = "";
    letters.forEach((ch) => {
      const span = document.createElement("span");
      span.className = "ltr";
      span.textContent = ch;
      row.appendChild(span);
    });
  });

  const all = $$(".ltr");

  /* intro: letters rain in with a bouncy cascade */
  if (hasGSAP && !reduceMotion) {
    gsap.from(all, {
      y: -60, opacity: 0, rotation: () => gsap.utils.random(-20, 20),
      duration: 0.9, ease: "bounce.out", stagger: 0.025, delay: 0.15,
    });
  }

  /* hover: individual letter does a spring jump */
  all.forEach((ltr) => {
    ltr.addEventListener("mouseenter", () => {
      if (!hasGSAP || reduceMotion || gsap.isTweening(ltr)) return;
      gsap.timeline()
        .to(ltr, { y: -16, scaleY: 1.2, duration: 0.18, ease: "power2.out" })
        .to(ltr, { y: 0, scaleY: 1, duration: 0.55, ease: "elastic.out(1, 0.35)" });
    });
  });
}

/* ==========================================================================
   5. BOUNCE-IN REVEALS — everything [data-pop] springs up on scroll
   ========================================================================== */
function initPops() {
  if (!hasGSAP) { document.documentElement.classList.add("no-js"); return; }
  document.documentElement.classList.add("gsap-on");
  gsap.registerPlugin(ScrollTrigger);

  $$("[data-pop]").forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 46, scale: 0.9, rotation: i % 2 ? 2 : -2 },
      {
        opacity: 1, y: 0, scale: 1, rotation: 0,
        duration: 0.8, ease: "back.out(1.6)",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
  });
}

/* ==========================================================================
   6. SCROLL WORM — inches across the top as you read
   ========================================================================== */
function initWorm() {
  const worm = $("#wormBody");
  if (!worm) return;
  const faces = ["◠‿◠", "◔‿◔", "◠ᴗ◠", "˘‿˘"];
  let faceIdx = 0;
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? (scrollY / max) * 100 : 0;
    worm.style.width = p + "%";
    // change expression every ~20%
    const idx = Math.min(Math.floor(p / 25), faces.length - 1);
    if (idx !== faceIdx) {
      faceIdx = idx;
      $(".worm__face").textContent = faces[idx];
    }
  }, { passive: true });
}

/* ==========================================================================
   7. DRAGGABLE STICKERS — pick them up, fling them, they stay put
   ========================================================================== */
function initDraggables() {
  $$("[data-drag]").forEach((el) => {
    let startX, startY, baseX = 0, baseY = 0, dragging = false;

    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX - baseX;
      startY = e.clientY - baseY;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = 60;
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      baseX = e.clientX - startX;
      baseY = e.clientY - startY;
      el.style.translate = `${baseX}px ${baseY}px`;
    });
    el.addEventListener("pointerup", () => {
      dragging = false;
      // tiny settle wobble
      if (hasGSAP && !reduceMotion) {
        gsap.fromTo(el, { rotation: -4 }, { rotation: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
      }
    });
  });
}

/* ==========================================================================
   8. THE REST — counters, modal, skill flips, contact, nav, footer, CTA confetti
   ========================================================================== */
function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.count || 0;
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      io.unobserve(el);
    });
  }, { threshold: 0.7 });
  $$("[data-count]").forEach((el) => io.observe(el));
}

function initProjectModal() {
  const modal = $("#projModal");
  if (!modal) return;

  let lastCard = null;

  // only show a link button when the card actually provides a URL
  const setLink = (el, url) => {
    el.hidden = !url;
    if (url) el.href = url; else el.removeAttribute("href");
  };

  const open = (card) => {
    lastCard = card;
    $("#modalTitle").textContent = card.dataset.title;
    $("#modalBlurb").textContent = card.dataset.blurb;
    $("#modalTech").textContent = card.dataset.tech;
    setLink($("#modalGit"), card.dataset.github);
    setLink($("#modalDemo"), card.dataset.demo);
    $("#modalLinks").hidden = !card.dataset.github && !card.dataset.demo;
    const img = $("#modalImg");
    img.src = $("img", card).src;
    img.alt = "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal__x", modal).focus();
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    lastCard?.focus();
  };

  $$(".proj").forEach((c) => {
    c.addEventListener("click", () => open(c));
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(c); }
    });
  });
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", close));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
}

/* skill cards flip on hover (CSS); touch screens flip on tap instead */
function initSkillFlips() {
  if (matchMedia("(hover:hover)").matches) return;
  $$(".power").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-flipped"));
  });
}

/* clipboard with an old-school fallback (works where the Clipboard API is blocked) */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* not supported */ }
    ta.remove();
    return ok;
  }
}

/* any [data-email] button copies the address and says so in its status element */
function wireCopyEmail(btn, status) {
  if (!btn || !status) return;
  let timer;
  btn.addEventListener("click", async () => {
    const email = btn.dataset.email;
    const ok = await copyText(email);
    status.textContent = ok ? "Email copied! ✨" : email;   // if copying failed, show it to copy by hand
    if (ok) {
      const r = btn.getBoundingClientRect();
      burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 24);
    }
    clearTimeout(timer);
    timer = setTimeout(() => { status.textContent = ""; }, ok ? 2200 : 6000);
  });
}

/* postcard + footer email buttons */
function initContact() {
  wireCopyEmail($("#copyEmail"), $("#copyStatus"));
  wireCopyEmail($("#footerEmail"), $("#footerEmailStatus"));

  // arriving via "Say hi" / "Get in touch": give the postcard a little wave once it's in view
  const postcard = $(".postcard");
  if (!postcard) return;
  $$('a[href="#contact"]').forEach((a) => a.addEventListener("click", () => {
    postcard.classList.remove("postcard--hello");
    setTimeout(() => postcard.classList.add("postcard--hello"), 700);
  }));
  postcard.addEventListener("animationend", () => postcard.classList.remove("postcard--hello"));
}

function initNavAndFooter() {
  // mobile menu
  const burger = $("#navBurger"), links = $(".nav__links");
  burger?.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  links?.addEventListener("click", (e) => {
    if (e.target.closest("a")) links.classList.remove("is-open");
  });

  // back to top
  $("#toTop")?.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  // CTA confetti
  $("#confettiBtn")?.addEventListener("click", (e) => {
    burstConfetti(e.clientX, e.clientY, 50);
  });
}

/* ==========================================================================
   BOOT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initConfetti();
  initSparkles();
  initHeroLetters();
  initPops();
  initWorm();
  initDraggables();
  initCounters();
  initProjectModal();
  initSkillFlips();
  initContact();
  initNavAndFooter();
});
