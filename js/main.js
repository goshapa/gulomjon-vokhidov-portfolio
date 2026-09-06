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
    var demoUrl = "https://example.com";
    return (
      '<div class="project-card' + (index >= 2 ? " is-extra" : "") + '" data-index="' + index + '">' +
        '<div class="browser-mock">' +
          '<div class="browser-bar">' +
            '<span class="browser-dots"><span></span><span></span><span></span></span>' +
            '<span class="browser-url">' + demoUrl + "</span>" +
          "</div>" +
          '<iframe class="browser-frame" src="' + demoUrl + '" loading="lazy" title="' + item.title + '"></iframe>' +
          '<img class="browser-fallback-img" src="./gulomjon_photo.png" alt="' + item.title + '" loading="lazy">' +
        "</div>" +
        '<div class="project-body">' +
          '<span class="project-tag">' + item.category + "</span>" +
          '<h3 class="project-title">' + item.title + "</h3>" +
          '<p class="project-desc">' + item.description + "</p>" +
          '<a class="btn btn-ghost btn-sm" href="' + demoUrl + '" target="_blank" rel="noopener noreferrer">' + i18n.projects.visitSite + "</a>" +
        "</div>" +
      "</div>"
    );
  }

  function renderProjects(dict) {
    var grid = document.getElementById("projects-grid");
    grid.innerHTML = dict.projects.items.map(function (item, i) {
      return browserMockCard(item, i, dict);
    }).join("");

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

  function initStatCounters() {
    var stats = document.querySelectorAll(".stat-num");
    if (!("IntersectionObserver" in window)) {
      stats.forEach(function (el) { el.textContent = el.getAttribute("data-count") + "+"; });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var start = 0;
        var duration = 1200;
        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          el.textContent = Math.floor(progress * target) + "+";
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target + "+";
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
    initFooterYear();
    applyTranslations(currentLang());
    initRevealAnimations();
    initStatCounters();
  });
})();
