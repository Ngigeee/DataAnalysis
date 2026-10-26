document.addEventListener('DOMContentLoaded', () => {

  /* ---- Reveal on scroll ---- */
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));

  /* ---- Close hamburger on link tap ---- */
  const toggle = document.getElementById('navtoggle');
  document.querySelectorAll('.mobile-sheet a').forEach(a => {
    a.addEventListener('click', () => { if (toggle) toggle.checked = false; });
  });

  /* ---- Generic modal helpers ---- */
  let lastFocus = null;
  function openModal(backdrop, focusEl){
    lastFocus = document.activeElement;
    backdrop.classList.add('open');
    document.body.classList.add('modal-open');
    if (focusEl) focusEl.focus();
  }
  function closeModal(backdrop){
    backdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  }

  /* ---- Course data ---- */
  const COURSES = {
    cleaning: {
      icon: 'fa-broom',
      title: 'Data Cleaning Essentials',
      meta: ['<i class="fas fa-clock"></i>2–3 hours', '<i class="fas fa-signal"></i>Beginner friendly', '<i class="fas fa-database"></i>Learn in browser'],
      desc: 'Master the foundation of all data work. Learn to identify and fix dirty data — remove duplicates, handle missing values, standardize formats, and prepare datasets for analysis.',
      learn: [
        'Understanding data quality issues',
        'Handling missing and duplicate values',
        'Data type conversion and standardization',
        'Outlier detection and treatment',
        'Exporting clean data for analysis'
      ]
    },
    viz: {
      icon: 'fa-chart-bar',
      title: 'Data Visualization Mastery',
      meta: ['<i class="fas fa-clock"></i>3–4 hours', '<i class="fas fa-signal"></i>Beginner friendly', '<i class="fas fa-palette"></i>Drag & drop tools'],
      desc: 'Transform numbers into stunning visuals. Learn to create effective charts, dashboards and interactive reports that tell compelling stories from data.',
      learn: [
        'Choosing the right chart type for your data',
        'Creating interactive visualizations',
        'Dashboard design principles',
        'Color theory and visual hierarchy',
        'Exporting publication-ready graphics'
      ]
    },
    ai: {
      icon: 'fa-brain',
      title: 'AI Models & Predictions',
      meta: ['<i class="fas fa-clock"></i>4–5 hours', '<i class="fas fa-signal"></i>Intermediate', '<i class="fas fa-database"></i>Real datasets'],
      desc: 'Build powerful predictive models without coding. Learn classification, regression and clustering to unlock patterns in your data and make predictions with confidence.',
      learn: [
        'Regression — predicting continuous values',
        'Classification — predicting categories',
        'Clustering — finding groups in data',
        'Model evaluation and accuracy metrics',
        'Deploying models on your own data'
      ]
    },
    stats: {
      icon: 'fa-chart-line',
      title: 'Statistical Analysis',
      meta: ['<i class="fas fa-clock"></i>3–4 hours', '<i class="fas fa-signal"></i>Beginner friendly', '<i class="fas fa-calculator"></i>Intuitive tools'],
      desc: 'Understand what your data is telling you. Learn hypothesis testing, correlation analysis and trend detection using easy-to-understand visual methods.',
      learn: [
        'Descriptive statistics and distributions',
        'Hypothesis testing fundamentals',
        'Correlation and causation analysis',
        'Trend detection and time-series patterns',
        'Statistical significance and confidence'
      ]
    },
    export: {
      icon: 'fa-file-export',
      title: 'Reports & Dashboards',
      meta: ['<i class="fas fa-clock"></i>2 hours', '<i class="fas fa-signal"></i>Beginner friendly', '<i class="fas fa-file-pdf"></i>Professional output'],
      desc: 'Create professional reports that impress stakeholders. Learn to generate polished PDFs, interactive dashboards and shareable visualizations from your analysis.',
      learn: [
        'PDF report generation and formatting',
        'Interactive dashboard publishing',
        'Data presentation best practices',
        'Export to multiple formats',
        'Sharing and collaboration features'
      ]
    },
    realtime: {
      icon: 'fa-bolt',
      title: 'Real-time Monitoring',
      meta: ['<i class="fas fa-clock"></i>2–3 hours', '<i class="fas fa-signal"></i>Beginner friendly', '<i class="fas fa-bell"></i>Live alerts'],
      desc: 'Monitor your data 24/7 and get instant alerts. Set up automated dashboards that track metrics in real-time and notify you of anomalies and opportunities.',
      learn: [
        'Setting up real-time data feeds',
        'Creating live dashboards',
        'Anomaly detection and alerts',
        'Automated reporting schedules',
        'Integration with your tools'
      ]
    }
  };

  const courseBackdrop = document.getElementById('course-modal');
  const mIcon   = document.getElementById('m-icon');
  const mTitle  = document.getElementById('m-title');
  const mMeta   = document.getElementById('m-meta');
  const mDesc   = document.getElementById('m-desc');
  const mLearn  = document.getElementById('m-learn');
  const mBook   = document.getElementById('m-book');

  function openCourse(key){
    const c = COURSES[key];
    if (!c) return;
    mIcon.innerHTML  = '<i class="fas ' + c.icon + '"></i>';
    mTitle.textContent = c.title;
    mMeta.innerHTML  = c.meta.map(m => '<span>' + m + '</span>').join('');
    mDesc.textContent  = c.desc;
    mLearn.innerHTML = c.learn.map(l => '<li><i class="fas fa-circle-check"></i>' + l + '</li>').join('');
    mBook.href = 'https://wa.me/254798171482?text=' + encodeURIComponent('Hello Kijarney! I want to learn ' + c.title + '.');
    openModal(courseBackdrop, document.getElementById('m-close'));
  }

  document.querySelectorAll('.more[data-course]').forEach(btn => {
    btn.addEventListener('click', () => openCourse(btn.dataset.course));
  });
  document.getElementById('m-close').addEventListener('click', () => closeModal(courseBackdrop));
  courseBackdrop.addEventListener('click', (e) => { if (e.target === courseBackdrop) closeModal(courseBackdrop); });

  /* ---- Works data ----
     Set `demo` to the URL of your project page.
     Leave as '' to hide the View Demo button for that project.
  ---- */
  const WORKS = [
  {
    tag: 'Analytics · Business Intelligence',
    title: 'Customer Behavior Analytics',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    desc:
      'Analyzed 500K customer transactions to identify buying patterns, resulting in 25% increase in targeted marketing ROI through data cleaning, advanced visualization and predictive modeling.',
    demo: ''
  },

  {
    tag: 'Predictive Analytics · Forecasting',
    title: 'Q4 Sales Forecasting',
    img: 'https://images.unsplash.com/photo-1460925895917-adf4e565c479?auto=format&fit=crop&w=1400&q=80',
    desc:
      'Built time-series machine learning models on 3 years of historical sales data, achieving 92% accuracy in quarterly forecasts. Used data cleaning, visualization and advanced AI models.',
    demo: ''
  },

  {
    tag: 'Healthcare · Data Analytics',
    title: 'Patient Health Metrics Dashboard',
    img: 'https://images.unsplash.com/photo-1576091160550-112173fba483?auto=format&fit=crop&w=1400&q=80',
    desc:
      'Cleaned and visualized patient data across 50 clinics, enabling real-time monitoring of health metrics and trend analysis. Improved clinic decision-making by 40%.',
    demo: ''
  },

  {
    tag: 'Retail · Optimization',
    title: 'Inventory Optimization Model',
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
    desc:
      'ML clustering model analyzed 200K SKUs to predict demand, reducing inventory costs by 18% across 40 stores. Used advanced data science techniques for optimization.',
    demo: ''
  }
];

  /* ---- Carousel ---- */
  const carousel = document.getElementById('works-carousel');
  if (carousel) {
    const slides  = carousel.querySelectorAll('.w-slide');
    const dotsBox = carousel.querySelector('.w-dots');
    let idx = 0, timer;

    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.setAttribute('aria-label', 'Go to project ' + (i + 1));
      if (i === 0) d.classList.add('active');
      d.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(d);
    });
    const dots = dotsBox.querySelectorAll('button');

    function go(i){
      slides[idx].classList.remove('active');
      dots[idx].classList.remove('active');
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
    }
    function next(){ go(idx + 1); }
    function prev(){ go(idx - 1); }
    function restart(){ clearInterval(timer); timer = setInterval(next, 5000); }

    carousel.querySelector('.w-btn.next').addEventListener('click', () => { next(); restart(); });
    carousel.querySelector('.w-btn.prev').addEventListener('click', () => { prev(); restart(); });

    /* touch swipe */
    let startX = null;
    const stage = carousel.querySelector('.w-stage');
    stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
    stage.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { dx < 0 ? next() : prev(); restart(); }
      startX = null;
    }, {passive:true});

    /* autoplay only while visible */
    const cio = new IntersectionObserver((ents) => {
      ents.forEach(en => en.isIntersecting ? restart() : clearInterval(timer));
    }, { threshold: 0.3 });
    cio.observe(carousel);
  }

  /* ---- Work popup ---- */
  const workBackdrop = document.getElementById('work-modal');
  const wImg   = document.getElementById('w-img');
  const wTag   = document.getElementById('w-tag');
  const wTitle = document.getElementById('w-title');
  const wDesc  = document.getElementById('w-desc');
  const wCta   = document.getElementById('w-cta');
  const wDemo  = document.getElementById('w-demo');

  function openWork(i){
    const w = WORKS[i];
    if (!w) return;

    wImg.src           = w.img;
    wImg.alt           = w.title;
    wTag.textContent   = w.tag;
    wTitle.textContent = w.title;
    wDesc.textContent  = w.desc;

    /* WhatsApp enquiry link */
    wCta.href = 'https://wa.me/254798171482?text=' +
      encodeURIComponent('Hello Kijarney! I saw "' + w.title + '" on your site and I want something like it.');

    /* View Demo — show only if a demo URL exists */
    if (w.demo) {
      wDemo.href = w.demo;
      wDemo.style.display = 'inline-flex';
    } else {
      wDemo.style.display = 'none';
    }

    openModal(workBackdrop, document.getElementById('w-close'));
  }

  document.querySelectorAll('.w-copy button[data-work]').forEach(btn => {
    btn.addEventListener('click', () => openWork(parseInt(btn.dataset.work, 10)));
  });
  document.getElementById('w-close').addEventListener('click', () => closeModal(workBackdrop));
  workBackdrop.addEventListener('click', (e) => { if (e.target === workBackdrop) closeModal(workBackdrop); });

  /* ESC closes whichever modal is open */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (courseBackdrop.classList.contains('open')) closeModal(courseBackdrop);
    if (workBackdrop.classList.contains('open'))   closeModal(workBackdrop);
  });

});
