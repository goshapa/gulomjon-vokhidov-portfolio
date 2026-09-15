(function () {
  var LANG_KEY = "site-lang";
  var THEME_KEY = "site-theme";
  var SUPPORTED_LANGS = ["uz", "ru", "en"];

  var TECH_TAGS = [
    "Penetration Testing", "Network Security", "Full-Stack Development",
    "Python", "Java", "C++", "C#", "C", "HTML/CSS", "Linux", "OSINT",
    "SIEM", "Cloud Security", "Incident Response", "Cryptography",
    "CTF", "Bug Bounty", "Nmap", "Wireshark", "Burp Suite"
  ];

  var PARTNER_PLACEHOLDERS = ["TechCorp", "SecureNet", "CyberShield", "DataGuard", "NetVantage", "ShieldWorks"];

  var CERTIFICATES = [
    { file: "freecodecamp-responsive-web-design.png", title: "Responsive Web Design", issuer: "freeCodeCamp" },
    { file: "google-it-automation-python.png", title: "IT Automation with Python", issuer: "Google Career Certificates" },
    { file: "microsoft-azure-fundamentals.png", title: "Introduction to Azure Fundamentals", issuer: "Microsoft Learn" },
    { file: "ibm-python-data-science.png", title: "Python for Data Science", issuer: "IBM SkillsBuild" },
    { file: "cisco-intro-cybersecurity.png", title: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy" },
    { file: "oracle-java-essentials.png", title: "Java Programming Essentials", issuer: "Oracle University" },
    { file: "hackerrank-python-basic.png", title: "Python (Basic)", issuer: "HackerRank" },
    { file: "udemy-web-dev-bootcamp.png", title: "The Complete Web Development Bootcamp", issuer: "Udemy" },
    { file: "coursera-python-programming.png", title: "Python Programming", issuer: "Coursera (Google)" },
    { file: "freecodecamp-js-algorithms.png", title: "JavaScript Algorithms and Data Structures", issuer: "freeCodeCamp" },
    { file: "google-ml-crash-course.png", title: "Machine Learning Crash Course", issuer: "Google" },
    { file: "comptia-itf-plus.png", title: "IT Fundamentals+ (ITF+)", issuer: "CompTIA" },
    { file: "meta-fullstack-react-node.png", title: "Build and Deploy a Full-Stack App with React & Node.js", issuer: "Meta" },
    { file: "w3schools-html-css-js.png", title: "HTML, CSS & JavaScript (Beginner to Advanced)", issuer: "W3Schools" },
    { file: "tashkent-tech-academy-web-workshop.png", title: "Web Development Workshop", issuer: "Tashkent Tech Academy" }
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function initStudio3DLazy() {
    var target = document.getElementById("studio3d");
    if (!target || !("IntersectionObserver" in window)) return;
    var started = false;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !started) {
          started = true;
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
            .then(function () { return loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js"); })
            .then(function () { return loadScript("js/three-scene.js"); })
            .then(function () { if (window.initStudio3D) window.initStudio3D(); });
          observer.disconnect();
        }
      });
    }, { rootMargin: "400px" });
    observer.observe(target);
  }

  function initStudio3DSwitch() {
    var switcher = document.getElementById("studio3d-switch");
    if (!switcher) return;
    switcher.addEventListener("click", function (e) {
      var btn = e.target.closest(".studio3d-switch-btn");
      if (!btn) return;
      var name = btn.getAttribute("data-model");
      switcher.querySelectorAll(".studio3d-switch-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      window.pendingStudio3DModel = name;
      if (window.setStudio3DModel) window.setStudio3DModel(name);
    });
  }

  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    function update() {
      btn.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
    }
    window.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    update();
  }

  function getByPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function currentLang() {
    var saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.indexOf(saved) !== -1 ? saved : "uz";
  }

  function applyTranslations(lang) {
    var dict = window.SITE_I18N[lang];
    if (!dict) return;

    document.documentElement.setAttribute("lang", lang);
    document.title = dict.seo.title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", dict.seo.description);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = getByPath(dict, el.getAttribute("data-i18n"));
      if (typeof value === "string") el.textContent = value;
    });

    var langLabel = document.getElementById("lang-current-label");
    if (langLabel) langLabel.textContent = lang.toUpperCase();

    document.querySelectorAll(".lang-menu button").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });

    renderProjects(dict);
    renderVideos(dict);
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations(lang);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    setTheme(saved === "light" ? "light" : "dark");
    var btn = document.getElementById("theme-toggle");
    btn.addEventListener("click", function () {
      var isLight = document.documentElement.getAttribute("data-theme") === "light";
      setTheme(isLight ? "dark" : "light");
    });
  }

  function initLangSwitch() {
    var wrap = document.getElementById("lang-switch");
    var toggle = document.getElementById("lang-current");
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      wrap.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", wrap.classList.contains("is-open"));
    });
    document.querySelectorAll(".lang-menu button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
        wrap.classList.remove("is-open");
      });
    });
    document.addEventListener("click", function () {
      wrap.classList.remove("is-open");
    });
  }

  function initMobileMenu() {
    var menu = document.getElementById("mobile-menu");
    var toggle = document.getElementById("menu-toggle");
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu.classList.remove("is-open"); });
    });
  }

  function initHeaderScroll() {
    var header = document.getElementById("site-header");
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function initMarquee() {
    var track = document.getElementById("marquee-track");
    var html = TECH_TAGS.concat(TECH_TAGS).map(function (tag) {
      return '<span class="marquee-chip">' + tag + "</span>";
    }).join("");
    track.innerHTML = html;
  }

  function initPartners() {
    var track = document.getElementById("partners-track");
    var logos = PARTNER_PLACEHOLDERS.concat(PARTNER_PLACEHOLDERS);
    track.innerHTML = logos.map(function (name) {
      return '<div class="partner-logo">' + name + "</div>";
    }).join("");
  }

  function browserMockCard(item, index, i18n) {
    var displayUrl = item.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    var buttonLabel = item.isLive ? i18n.projects.visitSite : i18n.projects.viewRepo;
    var mediaHtml;
    if (item.isLive) {
      mediaHtml = '<iframe class="browser-frame" src="' + item.url + '" loading="lazy" title="' + item.title + '"></iframe>' +
        '<img class="browser-fallback-img" src="./gulomjon_photo.png" alt="' + item.title + '" loading="lazy">' +
        '<div class="browser-loader"><span class="loader-spin"></span></div>';
    } else if (item.image) {
      mediaHtml = '<img class="browser-fallback-img is-always-visible" src="' + item.image + '" alt="' + item.title + '" loading="lazy">';
    } else {
      mediaHtml = '<div class="browser-fallback-placeholder">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.6 2.8 5.5 3.1 5.5 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.1 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>' +
        '<span>' + item.category + '</span>' +
      "</div>";
    }
    return (
      '<div class="project-card' + (index >= 2 ? " is-extra" : "") + '" data-index="' + index + '">' +
        '<div class="browser-mock">' +
          '<div class="browser-bar">' +
            '<span class="browser-dots"><span></span><span></span><span></span></span>' +
            '<span class="browser-url">' + displayUrl + "</span>" +
          "</div>" +
          '<div class="browser-media">' + mediaHtml + "</div>" +
        "</div>" +
        '<div class="project-body">' +
          '<span class="project-tag">' + item.category + "</span>" +
          '<h3 class="project-title">' + item.title + "</h3>" +
          '<p class="project-desc">' + item.description + "</p>" +
          '<a class="btn btn-ghost btn-sm" href="' + item.url + '" target="_blank" rel="noopener noreferrer">' + buttonLabel + "</a>" +
        "</div>" +
      "</div>"
    );
  }

  function renderProjects(dict) {
    var grid = document.getElementById("projects-grid");
    grid.innerHTML = dict.projects.items.map(function (item, i) {
      return browserMockCard(item, i, dict);
    }).join("");

    grid.querySelectorAll(".browser-frame").forEach(function (frame) {
      frame.addEventListener("load", function () {
        var loader = frame.parentElement.querySelector(".browser-loader");
        if (loader) loader.classList.add("is-hidden");
      });
    });

    var toggleBtn = document.getElementById("projects-toggle");
    var expanded = toggleBtn.getAttribute("data-expanded") === "true";
    toggleBtn.textContent = expanded ? dict.projects.showLess : dict.projects.showAll;
    grid.querySelectorAll(".project-card.is-extra").forEach(function (card) {
      card.classList.toggle("is-shown", expanded);
    });
  }

  function initProjectsToggle() {
    var btn = document.getElementById("projects-toggle");
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("data-expanded") === "true";
      btn.setAttribute("data-expanded", String(!expanded));
      var dict = window.SITE_I18N[currentLang()];
      renderProjects(dict);
    });
  }

  function iconPlay() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }
  function iconPause() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  }
  function iconMute() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM19 12a7 7 0 0 1-3 5.7v-2.34A5 5 0 0 0 17 12a5 5 0 0 0-1-3.36V6.3A7 7 0 0 1 19 12zM3 9v6h4l5 5V4L7 9H3z"/></svg>';
  }
  function iconUnmute() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.59 3-2.3-2.29 1.41-1.42L18 10.59l2.3-2.3 1.41 1.42L19.41 12l2.3 2.29-1.41 1.42L18 13.41l-2.3 2.3-1.41-1.42z"/></svg>';
  }
  function iconExpand() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  }

  function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  var VIDEO_SOURCES = ["assets/videos/ai-video-1.mp4", "assets/videos/ai-video-2.mp4", "assets/videos/ai-video-3.mp4"];

  function iconBigPlay() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.35)"/><path d="M10 8.5v7l6-3.5z" fill="#fff"/></svg>';
  }

  function videoCard(index, dict) {
    var caption = dict.aivideo.captions[index] || "";
    var src = VIDEO_SOURCES[index];
    return (
      '<div class="video-card">' +
        '<div class="video-player" data-video-index="' + index + '">' +
          '<video playsinline preload="metadata" muted loop' + (src ? ' src="' + src + '"' : "") + "></video>" +
          '<div class="video-overlay video-overlay-play">' + iconBigPlay() + "</div>" +
          '<div class="video-controls">' +
            '<button class="v-play" aria-label="Play">' + iconPlay() + "</button>" +
            '<div class="video-progress"><div class="video-progress-fill"></div></div>' +
            '<span class="video-time">0:00</span>' +
            '<button class="v-mute" aria-label="Mute">' + iconMute() + "</button>" +
            '<button class="v-fullscreen" aria-label="Fullscreen">' + iconExpand() + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="video-caption">' + caption + "</div>" +
      "</div>"
    );
  }

  function renderVideos(dict) {
    var grid = document.getElementById("video-grid");
    var html = "";
    for (var i = 0; i < 3; i++) html += videoCard(i, dict);
    grid.innerHTML = html;

    grid.querySelectorAll(".video-player").forEach(function (player) {
      var video = player.querySelector("video");
      var overlay = player.querySelector(".video-overlay");
      var playBtn = player.querySelector(".v-play");
      var muteBtn = player.querySelector(".v-mute");
      var fsBtn = player.querySelector(".v-fullscreen");
      var progressFill = player.querySelector(".video-progress-fill");
      var timeEl = player.querySelector(".video-time");

      if (!video.getAttribute("src")) {
        playBtn.disabled = true;
        muteBtn.disabled = true;
        fsBtn.disabled = true;
        overlay.innerHTML = '<span class="badge-soon">' + dict.aivideo.comingSoon + "</span>";
        return;
      }

      function togglePlay() {
        if (video.paused) { video.play(); playBtn.innerHTML = iconPause(); overlay.style.opacity = "0"; }
        else { video.pause(); playBtn.innerHTML = iconPlay(); overlay.style.opacity = "1"; }
      }

      overlay.addEventListener("click", togglePlay);
      playBtn.addEventListener("click", togglePlay);
      video.addEventListener("ended", function () { overlay.style.opacity = "1"; playBtn.innerHTML = iconPlay(); });
      muteBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? iconUnmute() : iconMute();
      });
      fsBtn.addEventListener("click", function () {
        if (video.requestFullscreen) video.requestFullscreen();
      });
      video.addEventListener("timeupdate", function () {
        var pct = (video.currentTime / video.duration) * 100 || 0;
        progressFill.style.width = pct + "%";
        timeEl.textContent = formatTime(video.currentTime);
      });
    });
  }

  function iconZoom() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg>';
  }

  function renderCertificates() {
    var grid = document.getElementById("certificates-grid");
    if (!grid) return;
    var html = CERTIFICATES.map(function (c, i) {
      return (
        '<div class="cert-card" tabindex="0" data-cert-index="' + i + '">' +
          '<img src="assets/certificates/' + c.file + '" alt="' + c.title + '" loading="lazy">' +
          '<div class="cert-card-zoom">' + iconZoom() + "</div>" +
          '<div class="cert-card-overlay">' +
            '<div class="cert-card-title">' + c.title + "</div>" +
            '<div class="cert-card-issuer">' + c.issuer + "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");
    grid.innerHTML = html;

    var lightbox = document.getElementById("cert-lightbox");
    var lightboxImg = document.getElementById("cert-lightbox-img");
    var lightboxTitle = document.getElementById("cert-lightbox-title");
    var lightboxIssuer = document.getElementById("cert-lightbox-issuer");
    if (!lightbox) return;

    function openCert(index) {
      var c = CERTIFICATES[index];
      if (!c) return;
      lightboxImg.src = "assets/certificates/" + c.file;
      lightboxImg.alt = c.title;
      lightboxTitle.textContent = c.title;
      lightboxIssuer.textContent = c.issuer;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeCert() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    grid.querySelectorAll(".cert-card").forEach(function (card) {
      card.addEventListener("click", function () { openCert(Number(card.getAttribute("data-cert-index"))); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCert(Number(card.getAttribute("data-cert-index"))); }
      });
    });

    var closeBtn = document.getElementById("cert-lightbox-close");
    if (closeBtn) closeBtn.addEventListener("click", closeCert);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeCert(); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCert(); });
  }

  function initRevealAnimations() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { observer.observe(el); });
  }

  function formatStatValue(el, value) {
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.hasAttribute("data-suffix") ? el.getAttribute("data-suffix") : "+";
    var grouped = value.toLocaleString("en-US");
    return prefix + grouped + suffix;
  }

  function initStatCounters() {
    var stats = document.querySelectorAll(".stat-num");
    if (!("IntersectionObserver" in window)) {
      stats.forEach(function (el) { el.textContent = formatStatValue(el, parseInt(el.getAttribute("data-count"), 10)); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var duration = 1200;
        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          el.textContent = formatStatValue(el, Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = formatStatValue(el, target);
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { observer.observe(el); });
  }

  function initFooterYear() {
    document.getElementById("footer-year").textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initLangSwitch();
    initMobileMenu();
    initHeaderScroll();
    initMarquee();
    initPartners();
    initProjectsToggle();
    renderCertificates();
    initFooterYear();
    applyTranslations(currentLang());
    initRevealAnimations();
    initStatCounters();
    initStudio3DLazy();
    initStudio3DSwitch();
    initBackToTop();
  });
})();
