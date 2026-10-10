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
     1. CUSTOM CURSOR — clean minimal dot + ring
  ---------------------------------------------------------- */
  var cursorDot  = document.getElementById('cursorDot');
  var cursorRing = document.getElementById('cursorRing');

  if (!isTouchDevice && cursorDot && cursorRing) {
    var mouseX = -200;
    var mouseY = -200;
    var ringX  = -200;
    var ringY  = -200;
    var LERP   = 0.10;
    var entered = false;

    /* Hide both until mouse enters window */
    cursorDot.style.opacity  = '0';
    cursorRing.style.opacity = '0';

    document.addEventListener('mouseenter', function () {
      entered = true;
      cursorDot.style.opacity  = '1';
      cursorRing.style.opacity = '1';
    });

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!entered) {
        ringX = mouseX;
        ringY = mouseY;
        entered = true;
        cursorDot.style.opacity  = '1';
        cursorRing.style.opacity = '1';
      }
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top  = mouseY + 'px';
    });

    (function animateCursor() {
      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top  = ringY + 'px';
      requestAnimationFrame(animateCursor);
    }());

    document.querySelectorAll('a, button, .project-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorRing.classList.add('hover');
        cursorDot.classList.add('hover');
      });
      el.addEventListener('mouseleave', function () {
        cursorRing.classList.remove('hover');
        cursorDot.classList.remove('hover');
      });
    });
  }

  /* ----------------------------------------------------------
     2. CANVAS STAR WARP — stars fly toward viewer
  ---------------------------------------------------------- */
  var svg = document.getElementById('star-svg');

  /* Create canvas fixed to viewport, append to body */
  var cvs = document.createElement('canvas');
  cvs.id = 'hero-canvas';
  cvs.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;display:block;pointer-events:none;';
  document.body.insertBefore(cvs, document.body.firstChild);

  /* Remove the svg placeholder */
  if (svg) svg.parentNode.removeChild(svg);

  if (cvs) {

    var ctx2 = cvs.getContext('2d');
    var CW = cvs.width  = window.innerWidth;
    var CH = cvs.height = window.innerHeight;
    var CX = CW / 2, CY = CH / 2;

    var NUM = 500;
    var starArr = [];

    function makestar(i) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = Math.random() * Math.max(CW, CH) * 0.6 + 10;
      return {
        x:     Math.cos(angle) * dist,
        y:     Math.sin(angle) * dist,
        z:     i / NUM,            /* 0 = close, 1 = far */
        speed: Math.random() * 0.006 + 0.003,
        size:  Math.random() * 1.4 + 0.3,
        color: ['#ffffff','#cce0ff','#fff5e0','#e8f0ff'][Math.floor(Math.random()*4)]
      };
    }

    for (var si = 0; si < NUM; si++) starArr.push(makestar(si));

    /* Mouse for subtle parallax tilt */
    var mx = 0, my = 0;
    document.addEventListener('mousemove', function(e) {
      mx = (e.clientX - CW * 0.5) / CW;
      my = (e.clientY - CH * 0.5) / CH;
    });

    /* Warp speed (driven by scroll) */
    var warpLevel = 0;
    window._setWarpSpeed = function(v) { warpLevel = v; };

    function drawStars() {
      requestAnimationFrame(drawStars);

      /* Fading trail — deeper black = longer trails */
      ctx2.fillStyle = 'rgba(5,5,16,0.55)';
      ctx2.fillRect(0, 0, CW, CH);

      var speed = 0.0015 + warpLevel * 0.006;

      for (var k = 0; k < NUM; k++) {
        var s = starArr[k];
        s.z -= speed;

        if (s.z <= 0) {
          /* Reset to far distance */
          var ang = Math.random() * Math.PI * 2;
          var d   = Math.random() * Math.max(CW, CH) * 0.6 + 10;
          s.x = Math.cos(ang) * d;
          s.y = Math.sin(ang) * d;
          s.z = 1;
          continue;
        }

        /* Project 3D to 2D */
        var px = CX + s.x / s.z + mx * 18;
        var py = CY + s.y / s.z + my * 18;

        /* Previous position for streak */
        var pz_prev = s.z + speed;
        var ppx = CX + s.x / pz_prev + mx * 18;
        var ppy = CY + s.y / pz_prev + my * 18;

        /* Size grows as star gets closer */
        var r = s.size * (1 - s.z) * 2.5;
        var op = Math.min(1, (1 - s.z) * 1.8);

        /* Draw streak line */
        if (warpLevel > 0.1 || s.z < 0.5) {
          ctx2.beginPath();
          ctx2.moveTo(ppx, ppy);
          ctx2.lineTo(px, py);
          ctx2.strokeStyle = s.color.replace(')', ',' + (op * 0.7) + ')').replace('rgb', 'rgba').replace('#ffffff', 'rgba(255,255,255,' + (op*0.7) + ')').replace('#cce0ff', 'rgba(204,224,255,' + (op*0.7) + ')').replace('#fff5e0', 'rgba(255,245,224,' + (op*0.7) + ')').replace('#e8f0ff', 'rgba(232,240,255,' + (op*0.7) + ')');
          ctx2.lineWidth = r * 0.6;
          ctx2.stroke();
        }

        /* Draw star dot */
        ctx2.beginPath();
        ctx2.arc(px, py, Math.max(0.3, r), 0, Math.PI * 2);
        ctx2.fillStyle = s.color;
        ctx2.globalAlpha = op;
        ctx2.fill();
        ctx2.globalAlpha = 1;
      }
    }

    drawStars();

    window.addEventListener('resize', function() {
      CW = cvs.width  = window.innerWidth;
      CH = cvs.height = window.innerHeight;
      CX = CW / 2; CY = CH / 2;
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

    /* ---- 3a2. Hero zoom-out on scroll (Lusion style) ---- */
    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.to(heroContent, {
        scale: 1.18,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }
    /* Hero section itself scales up slightly as you leave */
    var heroSection = document.getElementById('hero');
    if (heroSection) {
      gsap.to(heroSection, {
        scale: 1.05,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
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
        var warpP = Math.sin(p * Math.PI) * 0.3;  /* max 0.3 — subtle acceleration only */
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


}());
