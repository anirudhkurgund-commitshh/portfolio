/* ============================================================
   script.js — Dreamy Star-Warp Portfolio
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILS
  ---------------------------------------------------------- */
  var isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  /* ----------------------------------------------------------
     1. CUSTOM CURSOR — magical glowing dot with aurora ring
  ---------------------------------------------------------- */
  var cursorDot  = document.getElementById('cursorDot');
  var cursorRing = document.getElementById('cursorRing');

  if (!isTouchDevice && cursorDot && cursorRing) {
    var dotX = 0, dotY = 0, ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dotX = mouseX;
      dotY = mouseY;
      cursorDot.style.transform = 'translate(' + (dotX - 5) + 'px, ' + (dotY - 5) + 'px)';
    });

    (function animateCursor() {
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;
      cursorRing.style.transform = 'translate(' + (ringX - 22) + 'px, ' + (ringY - 22) + 'px)';
      requestAnimationFrame(animateCursor);
    }());

    document.querySelectorAll('a, button, .project-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorRing.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursorRing.classList.remove('hover'); });
    });
  }

  /* ----------------------------------------------------------
     2. THREE.JS — STAR WARP SYSTEM
  ---------------------------------------------------------- */
  var canvas = document.getElementById('hero-canvas');

  if (canvas && typeof THREE !== 'undefined') {
    var W = window.innerWidth;
    var H = window.innerHeight;

    var scene    = new THREE.Scene();
    var camera   = new THREE.PerspectiveCamera(70, W / H, 0.01, 2000);
    camera.position.z = 600;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ---- Star field geometry ---- */
    var STAR_COUNT = 3500;
    var positions  = new Float32Array(STAR_COUNT * 3);
    var colors     = new Float32Array(STAR_COUNT * 3);
    var sizes      = new Float32Array(STAR_COUNT);
    var speeds     = new Float32Array(STAR_COUNT); /* z-speed per star */
    var opacities  = new Float32Array(STAR_COUNT);
    var twinklePhases = new Float32Array(STAR_COUNT);

    var starPalette = [
      [1.0, 1.0, 1.0],          /* pure white */
      [0.8, 0.878, 1.0],        /* blue-white */
      [1.0, 0.957, 0.878],      /* warm white */
      [0.9, 0.9, 1.0]           /* cool white */
    ];

    for (var i = 0; i < STAR_COUNT; i++) {
      var i3 = i * 3;
      /* Random position in a deep tunnel volume */
      positions[i3]     = (Math.random() - 0.5) * 1800; /* x spread */
      positions[i3 + 1] = (Math.random() - 0.5) * 1800; /* y spread */
      positions[i3 + 2] = (Math.random() * 1200) - 600; /* z: -600 to +600 */

      /* Star color from palette */
      var pIdx = Math.floor(Math.random() * starPalette.length);
      colors[i3]     = starPalette[pIdx][0];
      colors[i3 + 1] = starPalette[pIdx][1];
      colors[i3 + 2] = starPalette[pIdx][2];

      /* Varied sizes: most tiny, few large foreground stars */
      var r = Math.random();
      sizes[i] = r < 0.7 ? (Math.random() * 1.5 + 0.5)     /* small: 0.5-2 */
               : r < 0.92 ? (Math.random() * 2.5 + 2)       /* medium: 2-4.5 */
               :             (Math.random() * 3 + 4);         /* large: 4-7 */

      /* Z-axis warp speed per star (slower by default) */
      speeds[i] = Math.random() * 0.3 + 0.05;
      opacities[i] = Math.random() * 0.4 + 0.6;
      twinklePhases[i] = Math.random() * Math.PI * 2;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    /* Sprite texture — soft glowing circle */
    var starCanvas = document.createElement('canvas');
    starCanvas.width = 64;
    starCanvas.height = 64;
    var ctx = starCanvas.getContext('2d');
    var gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0,   'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(200,220,255,0.3)');
    gradient.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    var starTex = new THREE.CanvasTexture(starCanvas);

    var mat = new THREE.PointsMaterial({
      size: 3,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var stars = new THREE.Points(geo, mat);
    scene.add(stars);

    /* ---- Mouse parallax ---- */
    var targetCamX = 0, targetCamY = 0;
    var curCamX = 0, curCamY = 0;

    document.addEventListener('mousemove', function (e) {
      targetCamX =  (e.clientX / W - 0.5) * 60;
      targetCamY = -(e.clientY / H - 0.5) * 60;
    });

    /* ---- Warp speed state ---- */
    var warpSpeed = 0;     /* 0 = calm drift, 1 = full warp */
    var baseSpeed = 0.4;   /* calm Z drift speed multiplier */
    var clock     = 0;

    /* ---- Animation loop ---- */
    function animateStars() {
      requestAnimationFrame(animateStars);
      clock += 0.016;

      /* Lerp camera for parallax */
      curCamX += (targetCamX - curCamX) * 0.04;
      curCamY += (targetCamY - curCamY) * 0.04;
      camera.position.x = curCamX;
      camera.position.y = curCamY;

      /* Current effective speed */
      var effectiveSpeed = baseSpeed + warpSpeed * 8;

      /* Move each star along Z toward camera */
      var posArr = geo.attributes.position.array;
      for (var j = 0; j < STAR_COUNT; j++) {
        var j3 = j * 3;
        posArr[j3 + 2] += speeds[j] * effectiveSpeed;

        /* Twinkle: modulate size attribute for some stars */
        if (j % 4 === 0) {
          var twinkle = 0.7 + 0.3 * Math.sin(clock * 2.5 + twinklePhases[j]);
          geo.attributes.size.array[j] = sizes[j] * twinkle;
        }

        /* Wrap star back to far end when it passes camera */
        if (posArr[j3 + 2] > camera.position.z + 100) {
          posArr[j3]     = (Math.random() - 0.5) * 1800;
          posArr[j3 + 1] = (Math.random() - 0.5) * 1800;
          posArr[j3 + 2] = camera.position.z - 600;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.size.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animateStars();

    /* Expose warpSpeed setter for scroll triggers */
    window._setWarpSpeed = function (v) { warpSpeed = v; };

    /* Resize */
    window.addEventListener('resize', function () {
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });
  }

  /* ----------------------------------------------------------
     3. GSAP SCROLL ANIMATIONS
  ---------------------------------------------------------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    /* ---- 3a. Hero text entrance ---- */
    var heroLines = document.querySelectorAll('.hero-line');
    if (heroLines.length) {
      gsap.set(heroLines, { y: '100%', opacity: 0 });
      gsap.to(heroLines, {
        y: 0, opacity: 1,
        duration: 1.2, ease: 'power3.out',
        stagger: 0.18, delay: 0.4
      });
    }

    /* ---- 3b. Hero → About: warp burst on scroll ---- */
    var warpOverlay = document.getElementById('warpOverlay');
    ScrollTrigger.create({
      trigger: '#about',
      start: 'top 80%',
      end: 'top 20%',
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        /* Stars accelerate into warp then slow back down */
        var warpP = Math.sin(p * Math.PI);  /* 0→1→0 bell curve */
        if (window._setWarpSpeed) window._setWarpSpeed(warpP);
        /* Overlay flares at peak warp */
        if (warpOverlay) {
          warpOverlay.style.opacity = (warpP * 0.6).toFixed(3);
        }
      }
    });

    /* ---- 3c. Section background color shift ---- */
    var sections = ['#about', '#work', '#skills', '#contact'];
    var sectionClasses = ['section-about', 'section-work', 'section-skills', 'section-contact'];
    sections.forEach(function (sel, idx) {
      ScrollTrigger.create({
        trigger: sel,
        start: 'top 60%',
        end: 'bottom 60%',
        onEnter: function () {
          document.body.className = sectionClasses[idx];
        },
        onEnterBack: function () {
          document.body.className = idx > 0 ? sectionClasses[idx - 1] : '';
        },
        onLeave: function () {
          if (idx < sectionClasses.length - 1)
            document.body.className = sectionClasses[idx + 1];
        }
      });
    });

    /* ---- 3d. About — word-by-word text reveal ---- */
    var aboutParagraphs = document.querySelectorAll('#about .about-content p');
    aboutParagraphs.forEach(function (p) {
      var words = p.innerText.split(' ');
      p.innerHTML = words.map(function (w) {
        return '<span class="about-word">' + w + '</span>';
      }).join(' ');
    });

    var aboutWords = document.querySelectorAll('.about-word');
    if (aboutWords.length) {
      gsap.to(aboutWords, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.03,
        scrollTrigger: {
          trigger: '#about',
          start: 'top 65%',
          end: 'bottom 80%',
          scrub: 0.5
        }
      });
    }

    /* About number and heading */
    var aboutContent = document.querySelector('#about .about-content h2');
    if (aboutContent) {
      gsap.fromTo(aboutContent,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: '#about', start: 'top 70%' }
        }
      );
    }
    var aboutNumber = document.querySelector('.about-number');
    if (aboutNumber) {
      gsap.fromTo(aboutNumber,
        { opacity: 0, x: -50 },
        { opacity: 0.15, x: 0, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: '#about', start: 'top 72%' }
        }
      );
    }

    /* ---- 3e. Work cards — fly in from alternating directions ---- */
    var projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(function (card, idx) {
      var fromX = idx === 0 ? -120 : idx === 1 ? 0 : 120;
      var fromY = idx === 1 ? 120 : 0;
      gsap.fromTo(card,
        { opacity: 0, x: fromX, y: fromY + 60, rotateY: idx % 2 === 0 ? -15 : 15 },
        {
          opacity: 1, x: 0, y: 0, rotateY: 0,
          duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: '#work',
            start: 'top 70%',
            scrub: false
          },
          delay: idx * 0.15
        }
      );
    });

    /* Work section title */
    var workTitle = document.querySelector('#work .section-title');
    if (workTitle) {
      gsap.fromTo(workTitle,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: '#work', start: 'top 80%' }
        }
      );
    }

    /* ---- 3f. Skills — staggered reveal with perspective ---- */
    var skillCategories = document.querySelectorAll('.skill-category');
    if (skillCategories.length) {
      gsap.fromTo(skillCategories,
        { opacity: 0, y: 60, scale: 0.92 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8, ease: 'back.out(1.4)',
          stagger: 0.15,
          scrollTrigger: { trigger: '#skills', start: 'top 72%' }
        }
      );
    }
    var skillTitle = document.querySelector('#skills .section-title');
    if (skillTitle) {
      gsap.fromTo(skillTitle,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: '#skills', start: 'top 80%' }
        }
      );
    }

    /* ---- 3g. Contact — big text zoom from far away ---- */
    var contactH2 = document.querySelector('#contact h2');
    if (contactH2) {
      gsap.fromTo(contactH2,
        { opacity: 0, scale: 0.45, y: 60 },
        {
          opacity: 1, scale: 1, y: 0,
          duration: 1.4, ease: 'expo.out',
          scrollTrigger: {
            trigger: '#contact',
            start: 'top 75%',
            scrub: false
          }
        }
      );
    }
    var emailBtn = document.querySelector('.email-btn');
    if (emailBtn) {
      gsap.fromTo(emailBtn,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.3,
          scrollTrigger: { trigger: '#contact', start: 'top 70%' }
        }
      );
    }
    var socialLinks = document.querySelector('.social-links');
    if (socialLinks) {
      gsap.fromTo(socialLinks,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.5,
          scrollTrigger: { trigger: '#contact', start: 'top 68%' }
        }
      );
    }

    /* ---- 3h. Section titles generic fallback ---- */
    document.querySelectorAll('.section-title').forEach(function (title) {
      if (!title.dataset.gsap) {
        title.dataset.gsap = '1';
        gsap.fromTo(title,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: title, start: 'top 85%' }
          }
        );
      }
    });

  } /* end gsap block */

  /* ----------------------------------------------------------
     4. NAV SCROLL SHADOW
  ---------------------------------------------------------- */
  var nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.style.borderBottomColor = window.scrollY > 60
        ? 'rgba(167,139,250,0.15)'
        : 'rgba(255,255,255,0.04)';
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     5. SOUND TOGGLE (UI only)
  ---------------------------------------------------------- */
  var soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    var muted = true;
    soundBtn.addEventListener('click', function () {
      muted = !muted;
      soundBtn.classList.toggle('muted', muted);
      soundBtn.setAttribute('aria-label', muted ? 'Enable ambient sound' : 'Disable ambient sound');
      soundBtn.textContent = muted ? '♪' : '♫';
    });
    soundBtn.classList.add('muted'); /* start muted */
  }

}());
