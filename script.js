/* ============================================================
   VIDA BELA — interaction layer
   parallax · reveal · tilt · theme · particles
   ============================================================ */
(function () {
  "use strict";

  const root = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- THEME ---------- */
  const toggle = document.getElementById("themeToggle");
  const stored = localStorage.getItem("vb-theme");
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  }
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vb-theme", next);
  });

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  if (prefersReduced) return; // skip motion-heavy work

  const fine = window.matchMedia("(pointer: fine)").matches;
  const PERSPECTIVE = 1200; // must match .scene { perspective }

  /* ---------- DEPTH LAYERS — derive cover-scale from translateZ ----------
     An element at translateZ(z) under perspective P appears scaled by
     P/(P-z); we counter it with scale = (P - z)/P so each layer keeps
     covering the viewport regardless of its depth.                        */
  const layers = Array.from(document.querySelectorAll("[data-layer]"));
  layers.forEach((layer) => {
    const z = parseFloat(layer.style.getPropertyValue("--z")) || 0;
    layer.style.setProperty("--s", ((PERSPECTIVE - z) / PERSPECTIVE).toFixed(4));
  });

  /* ---------- VOLUMETRIC PARTICLE FIELD ----------
     Particles live at real depths inside the camera, so they inherit the
     same 3D parallax as the orbs and drift slowly upward.                  */
  const field = document.getElementById("field");
  if (field) {
    const count = window.innerWidth < 600 ? 26 : 70;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      const z = -Math.random() * 900;                 // spread through depth
      const depthScale = (PERSPECTIVE - z) / PERSPECTIVE;
      const size = (Math.random() * 2 + 0.8);
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.width = s.style.height = size + "px";
      s.style.opacity = (0.25 + Math.random() * 0.55).toFixed(2);
      s.style.transform = `translateZ(${z}px) scale(${depthScale.toFixed(3)})`;
      s.dataset.z = z;
      s.dataset.drift = (Math.random() * 18 + 14).toFixed(1); // seconds
      s.dataset.phase = (Math.random() * Math.PI * 2).toFixed(3);
      frag.appendChild(s);
    }
    field.appendChild(frag);
  }
  const motes = field ? Array.from(field.children) : [];

  /* ---------- 3D CAMERA ENGINE ----------
     One transform on .scene__camera drives the whole world. Targets are
     set by scroll + pointer; a render loop eases current → target (lerp)
     for a fluid, weighty, immersive feel.                                  */
  const camera = document.getElementById("camera");
  const cur = { rx: 0, ry: 0, tx: 0, ty: 0, tz: 0 };
  const tgt = { rx: 0, ry: 0, tx: 0, ty: 0, tz: 0 };
  let pointerX = 0, pointerY = 0;
  let scrollY = window.scrollY;
  let vh = window.innerHeight;
  const t0 = performance.now();

  function updateTargets() {
    const p = scrollY / vh; // pages scrolled
    // pointer drives rotation + lateral slide; scroll glides the camera
    // forward (into the field) and downward through the atmosphere.
    tgt.ry = pointerX * 7;          // deg
    tgt.rx = -pointerY * 5;         // deg
    tgt.tx = pointerX * -40;        // px
    tgt.ty = scrollY * 0.12 - pointerY * 26;
    tgt.tz = Math.min(p * 140, 360); // ease forward, capped
  }

  function loop(now) {
    const k = 0.08; // easing factor
    cur.rx += (tgt.rx - cur.rx) * k;
    cur.ry += (tgt.ry - cur.ry) * k;
    cur.tx += (tgt.tx - cur.tx) * k;
    cur.ty += (tgt.ty - cur.ty) * k;
    cur.tz += (tgt.tz - cur.tz) * k;

    camera.style.transform =
      `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, ${cur.tz.toFixed(2)}px) ` +
      `rotateX(${cur.rx.toFixed(3)}deg) rotateY(${cur.ry.toFixed(3)}deg)`;

    // drift the motes upward on their own phase (cheap, additive to depth)
    const t = (now - t0) / 1000;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const z = +m.dataset.z;
      const ds = (PERSPECTIVE - z) / PERSPECTIVE;
      const dur = +m.dataset.drift;
      const ph = +m.dataset.phase;
      const y = -((t / dur) % 1) * 140;             // slow rise
      const x = Math.sin(t * 0.4 + ph) * 12;        // gentle sway
      m.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z}px) scale(${ds.toFixed(3)})`;
    }

    requestAnimationFrame(loop); // motes drift continuously, so always loop
  }

  window.addEventListener("scroll", () => { scrollY = window.scrollY; updateTargets(); }, { passive: true });
  window.addEventListener("resize", () => { vh = window.innerHeight; updateTargets(); });
  if (fine) {
    window.addEventListener("mousemove", (e) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
      updateTargets();
    }, { passive: true });
  }
  updateTargets();
  requestAnimationFrame(loop);

  /* ---------- CARD TILT (3D) ---------- */
  if (fine) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const card = el.querySelector(".day__card") || el;
      let raf = null;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg) translateZ(18px)`;
        });
      });
      el.addEventListener("mouseleave", () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateZ(0)";
      });
    });
  }
})();
