/* ============================================================
   script.js — Portfolio animations & Three.js particle system
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     0.  Detect touch device (for cursor logic)
     ---------------------------------------------------------- */
  var isTouchDevice = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );

  /* ----------------------------------------------------------
     1.  Custom Cursor
     ---------------------------------------------------------- */
  var cursorDot  = document.getElementById('cursorDot');
  var cursorRing = document.getElementById('cursorRing');

  if (!isTouchDevice && cursorDot && cursorRing) {
    var dotX   = 0, dotY   = 0;
    var ringX  = 0, ringY  = 0;
    var mouseX = 0, mouseY = 0;

    /* Track real mouse position */
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      /* Dot snaps instantly */
      dotX = mouseX;
      dotY = mouseY;
      cursorDot.style.transform = 'translate(' + (dotX - 4) + 'px, ' + (dotY - 4) + 'px)';
    });

    /* Ring lerps toward mouse each frame */
    function animateCursor() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.transform = 'translate(' + (ringX - 20) + 'px, ' + (ringY - 20) + 'px)';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    /* Grow ring on interactive elements */
    var interactives = document.querySelectorAll('a, button, .project-card');
    interactives.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorRing.classList.add('hover');
      });
      el.addEventListener('mouseleave', function () {
        cursorRing.classList.remove('hover');
      });
    });
  }

  /* ----------------------------------------------------------
     2.  Three.js Particle System
     ---------------------------------------------------------- */
  var canvas = document.getElementById('hero-canvas');

  if (canvas && typeof THREE !== 'undefined') {
    var scene    = new THREE.Scene();
    var camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* Build particle geometry */
    var particleCount  = 1500;
    var positions      = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount; i++) {
      var i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 20;   /* x: -10 to 10 */
      positions[i3 + 1] = (Math.random() - 0.5) * 20;   /* y: -10 to 10 */
      positions[i3 + 2] = (Math.random() - 0.5) * 10;   /* z: -5  to  5 */
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);

    /* Mouse parallax */
    var targetCamX = 0, targetCamY = 0;

    document.addEventListener('mousemove', function (e) {
      targetCamX =  (e.clientX / window.innerWidth  - 0.5) * 0.5;
      targetCamY = -(e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    /* Animation loop */
    function animateParticles() {
      requestAnimationFrame(animateParticles);

      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;

      /* Lerp camera position */
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;

      renderer.render(scene, camera);
    }
    animateParticles();

    /* Resize handler */
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  /* ----------------------------------------------------------
     3.  GSAP Animations
     ---------------------------------------------------------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

    /* Register plugin FIRST */
    gsap.registerPlugin(ScrollTrigger);

    /* ---- 3a. Hero text reveal on load ---- */
    var heroLines = document.querySelectorAll('.hero-line');

    if (heroLines.length) {
      /* Start from translateY 100%, opacity 0  (set in CSS too) */
      gsap.set(heroLines, { y: '100%', opacity: 0 });

      gsap.to(heroLines, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.5
      });
    }

    /* ---- 3b. About section ---- */
    var aboutContent = document.querySelector('#about .about-content');

    if (aboutContent) {
      gsap.fromTo(
        aboutContent,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#about',
            start: 'top 75%'
          }
        }
      );
    }

    /* Animate the big number as well */
    var aboutNumber = document.querySelector('.about-number');
    if (aboutNumber) {
      gsap.fromTo(
        aboutNumber,
        { opacity: 0, x: -40 },
        {
          opacity: 0.15,
          x: 0,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#about',
            start: 'top 75%'
          }
        }
      );
    }

    /* ---- 3c. Work cards stagger ---- */
    var projectCards = document.querySelectorAll('.project-card');

    if (projectCards.length) {
      gsap.fromTo(
        projectCards,
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: '#work',
            start: 'top 70%'
          }
        }
      );
    }

    /* ---- 3d. Skills stagger ---- */
    var skillCategories = document.querySelectorAll('.skill-category');

    if (skillCategories.length) {
      gsap.fromTo(
        skillCategories,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: '#skills',
            start: 'top 75%'
          }
        }
      );
    }

    /* ---- 3e. Contact headline ---- */
    var contactH2 = document.querySelector('#contact h2');

    if (contactH2) {
      gsap.fromTo(
        contactH2,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#contact',
            start: 'top 75%'
          }
        }
      );
    }

    /* Contact email + social fade in after headline */
    var emailBtn    = document.querySelector('.email-btn');
    var socialLinks = document.querySelector('.social-links');

    if (emailBtn) {
      gsap.fromTo(
        emailBtn,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: '#contact',
            start: 'top 70%'
          }
        }
      );
    }

    if (socialLinks) {
      gsap.fromTo(
        socialLinks,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.4,
          scrollTrigger: {
            trigger: '#contact',
            start: 'top 65%'
          }
        }
      );
    }

    /* ---- 3f. Section titles fade ---- */
    var sectionTitles = document.querySelectorAll('.section-title');

    if (sectionTitles.length) {
      sectionTitles.forEach(function (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: title,
              start: 'top 85%'
            }
          }
        );
      });
    }

  } /* end if gsap */

  /* ----------------------------------------------------------
     4.  Nav scroll shadow
     ---------------------------------------------------------- */
  var nav = document.getElementById('nav');

  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.style.borderBottomColor = 'rgba(255,255,255,0.08)';
      } else {
        nav.style.borderBottomColor = 'rgba(255,255,255,0.04)';
      }
    }, { passive: true });
  }

})();
