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

  /* ---------- LANGUAGE (PT default, EN overlay) ----------
     HTML ships with PT text; the dictionary holds EN. applyLang swaps
     textContent for every [data-i18n]; PT just restores from the dict.  */
  const I18N = {
    "nav.vision": { en: "Vision" },
    "nav.program": { en: "Program" },
    "nav.journey": { en: "Journey" },
    "nav.rhythm": { en: "Rhythm" },
    "nav.movement": { en: "Movement" },
    "meta.title": { en: "Vida Bela — Shape the Lifestyle You Deserve" },
    "hero.badge": { en: "Vida Bela Club" },
    "hero.title": { en: "Shape the Lifestyle You Deserve" },
    "hero.sub": { en: "Empowering women to build a life of freedom, confidence, and fulfillment — through mental discipline, physical wellbeing, and emotional resilience." },
    "hero.cta1": { en: "Begin the journey" },
    "hero.cta2": { en: "See the weekly rhythm" },
    "hero.scroll": { en: "Begin the journey" },

    "vision.eyebrow": { en: "Our Vision" },
    "vision.title": { en: "A Journey Back to Yourself" },
    "vision.lead": { en: "Vida Bela was created to help women reconnect with themselves and step into the strongest version of who they were always meant to become. Every woman deserves to feel whole, purposeful, and free." },
    "vision.p1.t": { en: "Mental Clarity" },
    "vision.p1.d": { en: "Develop the discipline and focus to think clearly and act with intention every day." },
    "vision.p2.t": { en: "Physical Wellbeing" },
    "vision.p2.d": { en: "Strengthen your body and build energy-sustaining habits that support your whole life." },
    "vision.p3.t": { en: "Emotional Resilience" },
    "vision.p3.d": { en: "Heal from within, build confidence, and cultivate deep self-worth and purpose." },

    "problem.eyebrow": { en: "The Reality" },
    "problem.title": { en: "Today's Women Are Overwhelmed" },
    "problem.lead": { en: "Millions of women are silently carrying too much. Behind the busy schedules, the responsibilities, and the smiles — many are running on empty, searching for a way back to themselves." },
    "problem.c1.t": { en: "Emotional Burnout" },
    "problem.c1.d": { en: "Chronic anxiety, stress, and overwhelm that leave little room for joy or rest." },
    "problem.c2.t": { en: "Loss of Identity" },
    "problem.c2.d": { en: "Feeling disconnected from who you are, lacking direction, confidence, or purpose." },
    "problem.c3.t": { en: "Unhealthy Patterns" },
    "problem.c3.d": { en: "Inconsistent routines, emotional dependency, and cycles that are hard to break alone." },
    "problem.c4.t": { en: "Impossible Balancing Act" },
    "problem.c4.d": { en: "Struggling to harmonize career, family, health, and personal growth all at once." },

    "eco.eyebrow": { en: "More Than Wellness" },
    "eco.title": { en: "A Complete Ecosystem for Transformation" },
    "eco.lead": { en: "Vida Bela is not just another fitness or mindset program. It is a fully integrated ecosystem that addresses every dimension of a woman's life — mind, body, and soul — working in harmony to create lasting change." },
    "eco.c1.t": { en: "Mental Discipline" },
    "eco.c1.i1": { en: "Personalized coaching" },
    "eco.c1.i2": { en: "Mindset development" },
    "eco.c1.i3": { en: "Accountability systems" },
    "eco.c2.t": { en: "Physical Wellbeing" },
    "eco.c2.i1": { en: "Guided workout library" },
    "eco.c2.i2": { en: "Wellness recommendations" },
    "eco.c2.i3": { en: "Healthy routine building" },
    "eco.c3.t": { en: "Emotional Resilience" },
    "eco.c3.i1": { en: "Meditation practices" },
    "eco.c3.i2": { en: "Breathwork sessions" },
    "eco.c3.i3": { en: "Healing tools & community" },

    "mem.eyebrow": { en: "The Membership" },
    "mem.title": { en: "What Members Receive" },
    "mem.lead": { en: "Every element of the Vida Bela membership has been thoughtfully designed to support your full transformation — so you always know your next step and never feel alone on the journey." },
    "mem.c1.t": { en: "Workout Library" },
    "mem.c1.d": { en: "On-demand guided workouts for every fitness level and schedule." },
    "mem.c2.t": { en: "Meditation & Breathwork" },
    "mem.c2.d": { en: "Calming sessions designed to reduce stress and build inner stillness." },
    "mem.c3.t": { en: "Weekly Coaching" },
    "mem.c3.d": { en: "Live group coaching sessions to guide, challenge, and inspire your growth." },
    "mem.c4.t": { en: "Transformation Guides" },
    "mem.c4.d": { en: "Monthly themed guides with habits, tools, and action steps." },
    "mem.c5.t": { en: "Accountability & Community" },
    "mem.c5.d": { en: "A supportive sisterhood to hold you to your highest standards." },
    "mem.c6.t": { en: "Challenges & Tracking" },
    "mem.c6.d": { en: "Habit tracking tools and wellness challenges to keep momentum alive." },

    "phase.eyebrow": { en: "The Framework" },
    "phase.title": { en: "The 4 Phases of Transformation" },
    "phase.lead": { en: "Our proven framework takes women through a carefully designed progression — from awareness all the way to lasting freedom. Each phase builds on the last." },
    "phase.p1.t": { en: "Awareness" },
    "phase.p1.d": { en: "Wake up to the limiting beliefs, patterns, and stories that have been holding you back. Clarity begins here." },
    "phase.p2.t": { en: "Foundation" },
    "phase.p2.d": { en: "Build the healthy routines, daily habits, and mental discipline that become the bedrock of your new life." },
    "phase.p3.t": { en: "Expansion" },
    "phase.p3.d": { en: "Elevate your confidence, raise your standards, and step fully into a more empowered identity." },
    "phase.p4.t": { en: "Freedom" },
    "phase.p4.d": { en: "Create sustainable happiness, deep fulfillment, and a life that feels truly aligned with who you are." },

    "flow.eyebrow": { en: "The Rhythm" },
    "flow.title": { en: "Seven Days. One Elevation." },
    "flow.lead": { en: "Each day is a waypoint on the trail — a deliberate stop that builds rhythm, expectation, and emotional momentum as members climb through the week." },
    "day.obj": { en: "Objective." },

    "day.mon.name": { en: "Monday" },
    "day.mon.theme": { en: "Motivation & Mindset" },
    "day.mon.lead": { en: "Start the week aligned and strengthened." },
    "day.mon.obj": { en: "Help women begin the week with clarity, intention, discipline, and emotional strength." },
    "day.mon.i1": { en: "Mindset shifts" },
    "day.mon.i2": { en: "Self-confidence reminders" },
    "day.mon.i3": { en: "Self-esteem and identity" },
    "day.mon.i4": { en: "Discipline over motivation" },
    "day.mon.i5": { en: "Encouragement to take action" },
    "day.mon.i6": { en: "Weekly intention setting" },
    "day.mon.goal": { en: "Create emotional momentum and positive energy for the week." },

    "day.tue.name": { en: "Tuesday" },
    "day.tue.theme": { en: "Train Yourself" },
    "day.tue.lead": { en: "Physical wellbeing & self-discipline." },
    "day.tue.obj": { en: "Encourage movement, body awareness, consistency, and physical strengthening." },
    "day.tue.i1": { en: "Workout reminders" },
    "day.tue.i2": { en: "Fitness motivation" },
    "day.tue.i3": { en: "Movement challenges" },
    "day.tue.i4": { en: "Stretching and mobility" },
    "day.tue.i5": { en: "Importance of consistency" },
    "day.tue.i6": { en: "“Train your body, train your mind”" },
    "day.tue.goal": { en: "Reinforce healthy habits and the connection between physical and mental strength." },

    "day.wed.name": { en: "Wednesday" },
    "day.wed.theme": { en: "Wellness Tip" },
    "day.wed.lead": { en: "Nutrition, habits & lifestyle." },
    "day.wed.obj": { en: "Educate women on how to create a healthier and more sustainable lifestyle." },
    "day.wed.i1": { en: "Nutrition tips" },
    "day.wed.i2": { en: "Healthy habits" },
    "day.wed.i3": { en: "Nervous system regulation" },
    "day.wed.i4": { en: "Sleep quality" },
    "day.wed.i5": { en: "Hormonal health" },
    "day.wed.i6": { en: "Energy management" },
    "day.wed.i7": { en: "Hydration" },
    "day.wed.i8": { en: "Lifestyle improvements" },
    "day.wed.goal": { en: "Help women implement small consistent changes." },

    "day.thu.name": { en: "Thursday" },
    "day.thu.theme": { en: "Gratitude & Emotional Awareness" },
    "day.thu.lead": { en: "Inner peace & emotional balance." },
    "day.thu.obj": { en: "Create emotional grounding and strengthen mindfulness practices." },
    "day.thu.i1": { en: "Gratitude exercises" },
    "day.thu.i2": { en: "Reflection questions" },
    "day.thu.i3": { en: "Journaling" },
    "day.thu.i4": { en: "Emotional awareness" },
    "day.thu.i5": { en: "Presence and mindfulness" },
    "day.thu.i6": { en: "Positive affirmations" },
    "day.thu.goal": { en: "Help women emotionally reconnect with themselves." },

    "day.fri.name": { en: "Friday" },
    "day.fri.theme": { en: "Wellness Curiosity" },
    "day.fri.lead": { en: "Light, educational & fun content." },
    "day.fri.obj": { en: "Keep the community engaged in a light and inspiring way." },
    "day.fri.i1": { en: "Health curiosities" },
    "day.fri.i2": { en: "Brain and body facts" },
    "day.fri.i3": { en: "Mental health" },
    "day.fri.i4": { en: "Hormones and energy" },
    "day.fri.i5": { en: "Longevity" },
    "day.fri.i6": { en: "Self-care ideas" },
    "day.fri.i7": { en: "“Did you know?” style content" },
    "day.fri.goal": { en: "Educate while creating a positive and fun experience." },

    "day.sat.name": { en: "Saturday" },
    "day.sat.theme": { en: "Offline Presence Day" },
    "day.sat.lead": { en: "Rest, presence & real connection." },
    "day.sat.obj": { en: "Allow participants to disconnect from notifications and live in the present." },
    "day.sat.nomsg": { en: "No messages sent — a pause in the journey." },
    "day.sat.i1": { en: "Family" },
    "day.sat.i2": { en: "Nature" },
    "day.sat.i3": { en: "Movement" },
    "day.sat.i4": { en: "Joy" },
    "day.sat.i5": { en: "Presence" },
    "day.sat.i6": { en: "Real experiences" },
    "day.sat.goal": { en: "Promote balance and healthy boundaries with digital communication." },

    "day.sun.name": { en: "Sunday" },
    "day.sun.theme": { en: "Reset & Preparation" },
    "day.sun.lead": { en: "Reflection, planning & alignment." },
    "day.sun.obj": { en: "Help women prepare emotionally and mentally for the new week." },
    "day.sun.i1": { en: "Weekly reset checklist" },
    "day.sun.i2": { en: "Meal prep" },
    "day.sun.i3": { en: "Journaling" },
    "day.sun.i4": { en: "Weekly planning" },
    "day.sun.i5": { en: "Habit tracking" },
    "day.sun.i6": { en: "Intention setting" },
    "day.sun.i7": { en: "Reflection exercises" },
    "day.sun.i8": { en: "Sunday meditation" },
    "day.sun.goal": { en: "Create structure, clarity, and intentionality for the new week." },

    "feel.eyebrow": { en: "The Goal is Freedom" },
    "feel.title": { en: "How You'll Feel After" },
    "feel.lead": { en: "This is what we're building toward — not just a better routine, but a completely transformed experience of life." },
    "feel.c1.t": { en: "More Confident" },
    "feel.c1.d": { en: "You'll walk into every room knowing exactly who you are." },
    "feel.c2.t": { en: "More Energized" },
    "feel.c2.d": { en: "Fueled by healthy habits and a body that feels strong and alive." },
    "feel.c3.t": { en: "More Fulfilled" },
    "feel.c3.d": { en: "Living with meaning, direction, and genuine hope for the future." },
    "feel.c4.t": { en: "More Emotionally Stable" },
    "feel.c4.d": { en: "Grounded, regulated, and no longer ruled by anxiety or fear." },

    "rip.eyebrow": { en: "A Movement" },
    "rip.title": { en: "Empowered Women Change Generations" },
    "rip.lead": { en: "When one woman heals, an entire generation shifts. The ripple effects of a woman's transformation extend far beyond herself — flowing into every relationship, family, and community she touches." },
    "rip.s1.t": { en: "She Heals" },
    "rip.s1.d": { en: "A woman transforms from the inside out." },
    "rip.s2.t": { en: "Family Thrives" },
    "rip.s2.d": { en: "Healthier homes and stronger relationships emerge." },
    "rip.s3.t": { en: "Children Flourish" },
    "rip.s3.d": { en: "Kids grow in emotionally safe, nurturing environments." },
    "rip.s4.t": { en: "Communities Rise" },
    "rip.s4.d": { en: "Leaders emerge, circles strengthen, generations change." },

    "cta.eyebrow": { en: "Join Us" },
    "cta.title": { en: "Shape the Lifestyle You Deserve" },
    "cta.lead": { en: "More than a program. More than a platform. Vida Bela is a movement of women who choose themselves, their healing, and their freedom every single day." },
    "cta.btn": { en: "Join Vida Bela" },
    "foot.tag": { en: "A lifestyle, not a program" },
    "foot.col1": { en: "Navigation" },
    "foot.col2": { en: "The ecosystem" },
    "foot.col3": { en: "Start now" },
    "foot.copy": { en: "© 2026 Vida Bela. All rights reserved." },
    "foot.privacy": { en: "Privacy" },
    "foot.terms": { en: "Terms" }
  };

  // capture original PT text once so we can restore it
  const i18nEls = Array.from(document.querySelectorAll("[data-i18n]"));
  i18nEls.forEach((el) => { el.dataset.pt = el.textContent; });

  function applyLang(lang) {
    i18nEls.forEach((el) => {
      const key = el.dataset.i18n;
      if (lang === "en" && I18N[key] && I18N[key].en != null) {
        el.textContent = I18N[key].en;
      } else {
        el.textContent = el.dataset.pt;
      }
    });
    root.setAttribute("lang", lang);
    localStorage.setItem("vb-lang", lang);
    const lt = document.getElementById("langToggle");
    if (lt) lt.querySelectorAll("[data-lang-label]").forEach((s) => {
      s.classList.toggle("is-active", s.dataset.langLabel === lang);
    });
  }

  const storedLang = localStorage.getItem("vb-lang") === "en" ? "en" : "pt";
  applyLang(storedLang);
  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      applyLang(root.getAttribute("lang") === "en" ? "pt" : "en");
    });
  }

  /* ---------- NAVIGATION ---------- */
  const topbar = document.getElementById("topbar");
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = Array.from(document.querySelectorAll(".navlink"));

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest(".navlink")) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // solid backing once scrolled past the hero
  if (topbar) {
    const onScrollBar = () => topbar.classList.toggle("is-stuck", window.scrollY > 40);
    window.addEventListener("scroll", onScrollBar, { passive: true });
    onScrollBar();
  }

  // highlight the section currently in view
  if (navLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(navLinks.map((l) => [l.getAttribute("href").slice(1), l]));
    const sections = Array.from(byId.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove("is-active"));
          const link = byId.get(e.target.id);
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => navIO.observe(s));
  }

  /* ---------- STAGGER ---------- */
  // give cards within a group an incremental delay so they cascade in 3D
  document.querySelectorAll(".cards, .phase-track, .trail, .ripple-track").forEach((group) => {
    Array.from(group.querySelectorAll(":scope > [data-reveal]")).forEach((el, i) => {
      el.style.setProperty("--i", i);
      // alternate slide-in direction for a livelier, more intense entrance
      el.style.setProperty("--dx", (i % 2 === 0 ? -1 : 1).toString());
    });
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

  /* ---------- THE VINE — branch that draws as you scroll ----------
     A meandering path is generated in pixel space across the full document
     height. Scroll progress maps to stroke-dashoffset so the branch "grows",
     and leaves/buds along it bloom as the drawing tip passes them.          */
  const SVGNS = "http://www.w3.org/2000/svg";
  const vineSvg = document.getElementById("vine");
  const vineBranch = document.getElementById("vineBranch");
  const vineGlow = document.getElementById("vineBranchGlow");
  const vineClipRect = document.getElementById("vineClipRect");
  const leavesG = document.getElementById("vineLeaves");
  const leafEls = [];
  let vineReady = false;
  let docH = 1;
  let vh2 = window.innerHeight;

  // stem anchored to the LEFT side, entering from the top-left corner
  const vineX = (y, W) =>
    W * 0.085 + Math.sin(y * 0.0042) * (W * 0.055) + Math.sin(y * 0.0115) * (W * 0.022);

  function addLeaf(cx, cy, angleDeg, size, kind) {
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`);
    let shape;
    if (kind === "bud") {
      shape = document.createElementNS(SVGNS, "circle");
      shape.setAttribute("r", (size * 0.45).toFixed(1));
      shape.setAttribute("class", "vine__bud");
    } else {
      const s = size;
      shape = document.createElementNS(SVGNS, "path");
      shape.setAttribute("d",
        `M0 0 C ${(s*0.62).toFixed(1)} ${(-s*0.5).toFixed(1)}, ${(s*0.5).toFixed(1)} ${(-s*1.45).toFixed(1)}, 0 ${(-s*1.95).toFixed(1)} ` +
        `C ${(-s*0.5).toFixed(1)} ${(-s*1.45).toFixed(1)}, ${(-s*0.62).toFixed(1)} ${(-s*0.5).toFixed(1)}, 0 0 Z`);
      shape.setAttribute("class", "vine__leaf");
    }
    g.appendChild(shape);
    leavesG.appendChild(g);
    leafEls.push({ y: cy, el: shape });
  }

  function addTwig(x1, y1, x2, y2) {
    const p = document.createElementNS(SVGNS, "path");
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 18;
    p.setAttribute("d", `M${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    p.setAttribute("class", "vine__twig");
    leavesG.appendChild(p);
    leafEls.push({ y: Math.min(y1, y2), el: p });
  }

  function addFlower(cx, cy, size) {
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
    g.setAttribute("class", "vine__flower");
    for (let i = 0; i < 5; i++) {
      const e = document.createElementNS(SVGNS, "ellipse");
      e.setAttribute("cx", "0"); e.setAttribute("cy", (-size).toFixed(1));
      e.setAttribute("rx", (size * 0.42).toFixed(1)); e.setAttribute("ry", (size * 0.82).toFixed(1));
      e.setAttribute("class", "petal");
      e.setAttribute("transform", `rotate(${i * 72})`);
      g.appendChild(e);
    }
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("r", (size * 0.4).toFixed(1)); c.setAttribute("class", "core");
    g.appendChild(c);
    leavesG.appendChild(g);
    leafEls.push({ y: cy, el: g });
  }

  // build a filled, tapering branch outline from a centerline
  function branchPath(W, H) {
    const pts = [{ x: W * 0.02, y: -34 }];
    for (let y = 0; y <= H; y += 16) pts.push({ x: vineX(y, W), y });
    const wBase = 17, wTip = 3.2;
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const nx = -dy, ny = dx;
      const t = Math.max(0, Math.min(1, pts[i].y / H));
      const w = (wTip + (wBase - wTip) * Math.pow(1 - t, 0.7)) / 2;
      left.push([pts[i].x + nx * w, pts[i].y + ny * w]);
      right.push([pts[i].x - nx * w, pts[i].y - ny * w]);
    }
    let d = "M " + left[0][0].toFixed(1) + " " + left[0][1].toFixed(1) + " ";
    for (let i = 1; i < left.length; i++) d += "L " + left[i][0].toFixed(1) + " " + left[i][1].toFixed(1) + " ";
    for (let i = right.length - 1; i >= 0; i--) d += "L " + right[i][0].toFixed(1) + " " + right[i][1].toFixed(1) + " ";
    return d + "Z";
  }

  function buildVine() {
    if (!vineSvg || !vineBranch) return;
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.scrollHeight;
    docH = H;
    vineSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    vineSvg.setAttribute("width", W);
    vineSvg.setAttribute("height", H);
    if (vineClipRect) { vineClipRect.setAttribute("width", W); }

    const d = branchPath(W, H);
    vineBranch.setAttribute("d", d);
    vineGlow.setAttribute("d", d);

    leavesG.innerHTML = "";
    leafEls.length = 0;
    const slope = (y) => (vineX(y + 1, W) - vineX(y - 1, W)) / 2;
    const angAt = (y) => Math.atan(slope(y)) * 180 / Math.PI;
    const reach = Math.min(W * 0.11, 150);

    const sections = Array.from(document.querySelectorAll("main > section"));
    sections.forEach((sec, idx) => {
      const yc = sec.offsetTop + Math.min(sec.offsetHeight * 0.42, 200);
      const sx = vineX(yc, W);
      const tx = sx + reach, ty = yc - 26;
      addTwig(sx, yc, tx, ty);
      addLeaf(tx, ty, angAt(yc) + 42, 28, "leaf");
      if (idx % 2 === 0) addFlower(tx + 12, ty - 22, 16);
      else addLeaf(sx + 26, yc + 38, angAt(yc) - 58, 21, "leaf");
      addLeaf(sx, yc - 64, angAt(yc) - 120, 19, "leaf");
    });

    // hero flourish — a lush cluster near the top-left corner
    const hx = vineX(150, W);
    addTwig(hx, 180, hx + reach * 1.2, 96);
    addFlower(hx + reach * 1.2, 80, 22);
    addLeaf(hx + reach * 0.6, 150, 34, 34, "leaf");
    addLeaf(hx - 6, 96, -44, 27, "leaf");

    for (let y = 240; y < H - 160; y += 300) addLeaf(vineX(y, W), y, 0, 12, "bud");

    vineReady = true;
  }

  // reveal the branch top-down via the clip rect; `grow` eases the intro
  let grow = 0;
  function drawVine() {
    if (!vineReady) return;
    const p = Math.max(0, Math.min(1, (window.scrollY + vh2 * 0.92) / docH));
    const revealed = p * docH * grow;
    if (vineClipRect) vineClipRect.setAttribute("height", revealed.toFixed(1));
    for (let i = 0; i < leafEls.length; i++) {
      leafEls[i].el.classList.toggle("bloom", leafEls[i].y <= revealed);
    }
  }

  buildVine();

  if (prefersReduced) {
    grow = 1;
    if (vineClipRect) vineClipRect.setAttribute("height", docH);
    leafEls.forEach((l) => l.el.classList.add("bloom"));
    return; // skip motion-heavy work
  }

  // FALLING PETALS — drifting free of the branch
  const petalfall = document.getElementById("petalfall");
  if (petalfall) {
    const tones = ["#cf9a72", "#d98a86", "#9bb094", "#c4b07a"];
    const n = window.innerWidth < 600 ? 9 : 18;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "petal-fall";
      const size = 6 + Math.random() * 9;
      s.style.left = (Math.random() * 100).toFixed(1) + "%";
      s.style.width = size.toFixed(1) + "px";
      s.style.height = (size * 1.25).toFixed(1) + "px";
      s.style.background = tones[i % tones.length];
      s.style.animationDuration = (10 + Math.random() * 11).toFixed(1) + "s";
      s.style.animationDelay = (-Math.random() * 20).toFixed(1) + "s";
      petalfall.appendChild(s);
    }
  }

  // fluid grow-in flourish on load, then hand off to scroll
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  let introStart = 0;
  function introLoop(now) {
    if (!introStart) introStart = now;
    grow = easeOut(Math.min(1, (now - introStart) / 2000));
    drawVine();
    if (grow < 1) requestAnimationFrame(introLoop);
  }
  requestAnimationFrame(introLoop);

  let vineTick = false;
  const onVineScroll = () => {
    if (!vineTick) { vineTick = true; requestAnimationFrame(() => { drawVine(); vineTick = false; }); }
  };
  window.addEventListener("scroll", onVineScroll, { passive: true });
  window.addEventListener("resize", () => { vh2 = window.innerHeight; buildVine(); drawVine(); });
  window.addEventListener("load", () => { buildVine(); drawVine(); });
  setTimeout(() => { buildVine(); drawVine(); }, 700);

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
  const cur = { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: 0 };
  const tgt = { rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, tz: 0 };
  let pointerX = 0, pointerY = 0;
  let scrollY = window.scrollY;
  let vh = window.innerHeight;
  const t0 = performance.now();

  // sections that get scroll-linked depth ("coming out of the screen")
  const depthSecs = Array.from(document.querySelectorAll("main > section"));

  /* ---------- INTENSE MULTI-LAYER PARALLAX ----------
     Decorative, non-reveal/non-tilt elements drift vertically at different
     speeds relative to the viewport, so the whole page reads with depth.    */
  const pxItems = [];
  const regPx = (sel, speed) =>
    document.querySelectorAll(sel).forEach((el) => pxItems.push({ el, speed }));
  regPx(".section-head .eyebrow", 0.10);
  regPx(".section-head h2", 0.16);
  regPx(".section-head p", 0.08);
  regPx(".lottie-accent", 0.22);
  regPx(".day__index", 0.34);
  regPx(".card__n", 0.14);
  regPx(".phase__n", 0.20);
  regPx(".ripple-step__n", 0.18);
  regPx(".hero__title", 0.14);
  regPx(".hero__sub", 0.09);
  regPx(".badge", 0.18);

  function updateTargets() {
    const p = scrollY / vh; // pages scrolled
    // Intensified ~2x: pointer drives stronger rotation + lateral slide;
    // scroll glides the camera much further forward and downward, and adds
    // a slow roll so the whole atmosphere feels alive.
    tgt.ry = pointerX * 16;                  // deg
    tgt.rx = -pointerY * 11;                 // deg
    tgt.rz = Math.sin(p * 0.6) * 3;          // roll with scroll
    tgt.tx = pointerX * -92;                 // px
    tgt.ty = scrollY * 0.28 - pointerY * 54;
    tgt.tz = Math.min(p * 340, 780);         // ease forward, capped
  }

  function loop(now) {
    const k = 0.08; // easing factor
    cur.rx += (tgt.rx - cur.rx) * k;
    cur.ry += (tgt.ry - cur.ry) * k;
    cur.rz += (tgt.rz - cur.rz) * k;
    cur.tx += (tgt.tx - cur.tx) * k;
    cur.ty += (tgt.ty - cur.ty) * k;
    cur.tz += (tgt.tz - cur.tz) * k;

    camera.style.transform =
      `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, ${cur.tz.toFixed(2)}px) ` +
      `rotateX(${cur.rx.toFixed(3)}deg) rotateY(${cur.ry.toFixed(3)}deg) rotateZ(${cur.rz.toFixed(3)}deg)`;

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

    // section depth: rise from the back when below center, push toward the
    // viewer and fade as they scroll up past center — fluid "out of screen"
    for (let i = 0; i < depthSecs.length; i++) {
      const sec = depthSecs[i];
      const r = sec.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue; // skip off-screen
      let dd = (r.top + r.height / 2 - vh / 2) / vh;
      dd = Math.max(-1.5, Math.min(1.5, dd));
      const tz = -dd * 320;                 // intensified depth
      const op = dd < -0.5 ? Math.max(0.15, 1 - (-dd - 0.5) * 1.2) : 1;
      sec.style.transform = `translateZ(${tz.toFixed(1)}px)`;
      sec.style.opacity = op.toFixed(3);
    }

    // multi-layer element parallax
    for (let i = 0; i < pxItems.length; i++) {
      const it = pxItems[i];
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const off = (r.top + r.height / 2) - vh / 2;
      it.el.style.transform = `translate3d(0, ${(-off * it.speed).toFixed(1)}px, 0)`;
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
