import { useEffect, useRef, useState } from 'react';
import './css/style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ===================== SETTINGS ===================== */
const IMG = {
  door: '/images/door.png',
  bg: '/images/bg-img.png',
  hand: '/images/hand.png',
  flower: '/images/flower.png',
  girl: '/images/girl.png',
};

// Gana (YouTube video id): door khulte hi start hoga
const SONG_ID = 'zns53qYaQIo';

// Mehndi ki tareekh (yahan se badal sakte ho)
const MEHNDI = { day: 'Saturday', date: 28, month: 'November', year: 2026 };
// Countdown ka target: 28 Nov 2026, 7:00 PM (Pakistan time). Waqt badalna ho to yahan badlo
const MEHNDI_START = new Date('2026-11-28T19:00:00+05:00').getTime();

const FAMILY = { father: 'Mr. Muhammad Islam', mother: 'Mrs. Rehana Kosar' };

const FALL_COUNT = 30; // upar se girne wale chhote flowers
const FALL_WAIT = 8; // hand aane ke baad itne second ka wait
const FADE_TIME = 2.5; // hand aur do flowers kitni slowly gayab hon

const GLASS =
  'rounded-3xl border border-white/40 bg-white/10 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.25)]';
const SHADOW = { textShadow: '0 2px 14px rgba(60,0,30,0.65)' };

/* ===================== DOOR GEOMETRY =====================
   door.png (3548 x 1772, ratio ~2:1) mein sirf hara darwaza khulta hai,
   deewar, bel aur floor apni jagah rehte hain.
   Neeche ke numbers 2576 x 1288 ke hisaab se naape gaye hain (sirf ratio matter karta hai).
   Image badlo to DOOR ke numbers (l, r, t, b, seam) dobara naapne honge. */
const GATE_W = 2576;
const GATE_H = 1288;
const DOOR = { l: 942, r: 1618, t: 48, b: 1163, seam: 1282 };

const GX = 0.004; // darwaze thora sa bara taake band hone par hairline na dikhe
const GY = 0.004;
const pc = (v) => `${(v * 100).toFixed(3)}%`;
const fx = (v) => v / GATE_W;
const fy = (v) => v / GATE_H;

// Fixed hissa: poori image, darwazon ki jagah se "hole" (yahan se peeche bg nazar aata hai)
const HOLE_CLIP_D = `M0,0H1V1H0Z M${fx(DOOR.l)},${fy(DOOR.t)}H${fx(DOOR.r)}V${fy(DOOR.b)}H${fx(DOOR.l)}Z`;
// Left / right darwaze ka clip: inset(top right bottom left)
const LEFT_INSET = `inset(${pc(fy(DOOR.t) - GY)} ${pc(1 - fx(DOOR.seam) - GX)} ${pc(1 - fy(DOOR.b) - GY)} ${pc(fx(DOOR.l) - GX)})`;
const RIGHT_INSET = `inset(${pc(fy(DOOR.t) - GY)} ${pc(1 - fx(DOOR.r) - GX)} ${pc(1 - fy(DOOR.b) - GY)} ${pc(fx(DOOR.seam) - GX)})`;
const LEFT_HINGE = pc(fx(DOOR.l)); // left darwaze ka bahar wala kinara
const RIGHT_HINGE = pc(fx(DOOR.r)); // right darwaze ka bahar wala kinara
const HOLE_CX = fx((DOOR.l + DOOR.r) / 2);
const HOLE_CY = fy((DOOR.t + DOOR.b) / 2);
const HOLE_WF = fx(DOOR.r - DOOR.l);
const HOLE_HF = fy(DOOR.b - DOOR.t);

const doorBg = {
  backgroundImage: `url(${IMG.door})`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
};

// Har girne wale flower ki random size / speed / jagah (sirf ek baar banti hai)
const makeFlakes = () =>
  Array.from({ length: FALL_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 96,
    size: 16 + Math.random() * 22,
    dur: 6 + Math.random() * 5,
    delay: Math.random() * 5,
    spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    sway: 15 + Math.random() * 30,
  }));

/* ===================== COUNTDOWN ===================== */
// Alag component taake har second poora App re-render na ho
function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const pad = (n) => String(n).padStart(2, '0');
  const tiles = [
    { label: 'Days', value: pad(Math.floor(diff / 86400000)) },
    { label: 'Hours', value: pad(Math.floor(diff / 3600000) % 24) },
    { label: 'Mins', value: pad(Math.floor(diff / 60000) % 60) },
    { label: 'Secs', value: pad(Math.floor(diff / 1000) % 60) },
  ];

  return (
    <div className="grid w-full grid-cols-4 gap-2">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="flex flex-col items-center rounded-xl border border-white/30 bg-white/10 py-3 backdrop-blur-sm"
        >
          <span className="text-2xl font-bold tabular-nums text-[#FFE08A] sm:text-3xl" style={SHADOW}>
            {t.value}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/90 sm:text-[10px]">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ===================== NOVEMBER CALENDAR ===================== */
function MonthCalendar() {
  const year = MEHNDI.year;
  const month = 10; // November (0 se shuru hota hai)
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const t = new Date();
  const todayDate = t.getFullYear() === year && t.getMonth() === month ? t.getDate() : null;

  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const heads = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-full">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/90" style={SHADOW}>
        {MEHNDI.month} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {heads.map((h, i) => (
          <span key={i} className="pb-1 text-[10px] font-semibold text-[#FFE08A]/90">
            {h}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`}></span>;
          const isEvent = d === MEHNDI.date;
          const isToday = d === todayDate;
          return (
            <span
              key={d}
              className={`flex aspect-square items-center justify-center rounded-full text-xs sm:text-sm ${
                isEvent
                  ? 'bg-[#FFE08A] font-bold text-[#5C0A3A] shadow-[0_0_14px_rgba(255,224,138,0.75)]'
                  : isToday
                    ? 'border border-white/70 text-white'
                    : 'text-white/85'
              }`}
            >
              {d}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] italic text-white/85" style={SHADOW}>
        {MEHNDI.day}, {MEHNDI.date} {MEHNDI.month}
      </p>
    </div>
  );
}

/* ===================== APP ===================== */
function App() {
  const container = useRef(null);
  const doorRef = useRef(null);
  const bgRef = useRef(null);
  const openedRef = useRef(false);

  const [flakes] = useState(makeFlakes);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [playSong, setPlaySong] = useState(false);
  // Phone (lambi screen) par door image chhoti hoti hai, upar neeche khali hissa bharna padta hai
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 0.64
  );
  const stageRef = useRef(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth / window.innerHeight < 0.64);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Images preload: sab aa jayen tab hi loaded = true
  useEffect(() => {
    const srcs = Object.values(IMG);
    let count = 0;
    const done = () => {
      count += 1;
      setProgress(Math.round((count / srcs.length) * 100));
      if (count === srcs.length) setLoaded(true);
    };
    srcs.forEach((src) => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
  }, []);

  // Intro khatam hone tak scroll band
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const lock = !unlocked;
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
    if (unlocked) ScrollTrigger.refresh();
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [unlocked]);

  const { contextSafe } = useGSAP(
    () => {
      // Shuru ki hidden states
      gsap.set('.hand-wrap', { yPercent: 110 });
      gsap.set('.spin-flower', { scale: 0, opacity: 0 });
      gsap.set('.girl-wrap', { opacity: 0, y: 60 });
      gsap.set('.hero-item', { opacity: 0, y: 24 });
      gsap.set('.fall-flower', { y: -140 });
      gsap.set(bgRef.current, { scale: 1.2 }); // door ke andar jane ka feel

      // Footer (scroll par)
      gsap.from('.foot-item', {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.14,
        ease: 'power2.out',
        scrollTrigger: { trigger: '#footer-section', start: 'top 88%', toggleActions: 'play none none reverse' },
      });

      // Mark your date section (scroll par)
      gsap.from('.date-item', {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: { trigger: '#date-section', start: 'top 70%', toggleActions: 'play none none reverse' },
      });
    },
    { scope: container }
  );

  // Chhote flowers upar se girte rahte hain
  const startFalling = contextSafe(() => {
    const H = window.innerHeight;
    gsap.utils.toArray('.fall-flower').forEach((el, i) => {
      const f = flakes[i];
      gsap.to(el, { y: H + 140, duration: f.dur, delay: f.delay, ease: 'none', repeat: -1 });
      gsap.to(el, { rotation: f.spin, duration: f.dur, delay: f.delay, ease: 'none', repeat: -1 });
      gsap.to(el, {
        x: f.sway,
        duration: 1.6 + Math.random() * 1.4,
        delay: f.delay,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    });
  });

  // Girl halka halka jhoomti hai (dance feel)
  const startDance = contextSafe(() => {
    gsap.fromTo(
      '.girl-img',
      { rotation: -4 },
      { rotation: 4, duration: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true }
    );
    gsap.to('.girl-img', { y: -8, duration: 0.55, ease: 'sine.inOut', repeat: -1, yoyo: true });
  });

  const handleOpen = contextSafe(() => {
    if (openedRef.current || !loaded) return;
    openedRef.current = true;

    // Gana door khulte hi start (user ke tap par, taake browser block na kare)
    setPlaySong(true);

    // Zoom ka center = darwaze ke khulne wali jagah ka beech
    const scene = doorRef.current;
    const r = stageRef.current.getBoundingClientRect();
    const cx = r.left + r.width * HOLE_CX;
    const cy = r.top + r.height * HOLE_CY;
    const k = Math.max(window.innerWidth / (r.width * HOLE_WF), window.innerHeight / (r.height * HOLE_HF)) * 1.7;
    gsap.set(scene, { transformOrigin: `${cx}px ${cy}px` });

    const tl = gsap.timeline();

    // 1) Sirf dono darwaze andar ki taraf khulte hain (deewar apni jagah), phir andar zoom
    tl.to('.door-label', { opacity: 0, scale: 0.8, duration: 0.4 }, 0)
      .to('.door-left', { rotationY: 82, duration: 1.8, ease: 'power2.inOut' }, 0.2)
      .to('.door-right', { rotationY: -82, duration: 1.8, ease: 'power2.inOut' }, 0.2)
      .to('.door-leaf', { opacity: 0, duration: 0.6, ease: 'power1.in' }, 1.4)
      .to(bgRef.current, { scale: 1, duration: 3, ease: 'power2.out' }, 0.8)
      .to(scene, { scale: k, duration: 1.8, ease: 'power2.in' }, 1.0)
      .to(scene, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 2.2)
      .set(scene, { display: 'none' });

    // 2) Hand neeche se bottom-center mein aata hai
    tl.addLabel('hand', 2.2)
      .to('.hand-wrap', { yPercent: 0, duration: 1.6, ease: 'power3.out' }, 'hand')
      .addLabel('handIn', 'hand+=1.6');

    // 3) Do flowers hand ke paas aate hain aur gol gol ghoomte hain
    tl.to(
      '.spin-flower',
      { scale: 1, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'back.out(1.7)' },
      'handIn'
    ).to('.spin-flower', { rotation: 360 * 3, duration: FALL_WAIT + FADE_TIME, ease: 'none' }, 'handIn');

    // 4) Chhote flowers girna shuru -> hand aur do flowers ki opacity slowly kam hoti hai
    tl.addLabel('fall', `handIn+=${FALL_WAIT}`)
      .to('.hand-wrap, .spin-flower', { opacity: 0, duration: FADE_TIME, ease: 'power1.inOut' }, 'fall')
      .call(startFalling, null, 'fall');

    // 5) Girl aati hai aur dance karti hai
    tl.to('.girl-wrap', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 'fall+=0.8').call(
      startDance,
      null,
      'fall+=0.8'
    );

    // 6) "You are invited" + family ka naam, phir scroll chalu
    tl.to('.hero-item', { opacity: 1, y: 0, duration: 0.9, stagger: 0.25, ease: 'power2.out' }, 'fall+=2').call(
      () => setUnlocked(true)
    );
  });

  return (
    <div ref={container} className="min-h-screen w-full overflow-x-hidden font-serif">
      {/* Loading */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-[#2a0a1a] text-[#FFE08A] transition-opacity duration-700 ${
          loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <p className="italic">Loading invitation… {progress}%</p>
        <div className="h-[3px] w-40 overflow-hidden rounded-full bg-[#FFE08A]/25">
          <div className="h-full bg-[#FFE08A] transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Gana: door par tap karte hi start (chhupa hua) */}
      {playSong && (
        <iframe
          src={`https://www.youtube.com/embed/${SONG_ID}?autoplay=1&loop=1&playlist=${SONG_ID}`}
          allow="autoplay"
          title="Background Audio"
          style={{ position: 'fixed', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', border: 0 }}
        ></iframe>
      )}

      {/* Background: poori screen cover (mobile, tab, laptop sab par) */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#4a0b33]">
        <img ref={bgRef} src={IMG.bg} alt="" className="h-full w-full object-cover object-center" />
      </div>

      {/* Chhote flowers jo upar se girte hain */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
        {flakes.map((f) => (
          <img
            key={f.id}
            src={IMG.flower}
            alt=""
            className="fall-flower absolute top-0"
            style={{ left: `${f.left}%`, width: f.size }}
          />
        ))}
      </div>

      {/* Door (sab se upar): images load hone ke baad hi nazar aata hai, tap -> darwaze khulte hain */}
      <div
        ref={doorRef}
        onClick={handleOpen}
        className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-[#f3e3d3]"
        style={{
          visibility: loaded ? 'visible' : 'hidden',
          // --sw: door image ki width (landscape par screen bhar, phone par darwaza screen mein fit)
          '--sw': 'max(100vw, min(200svh, 320vw))',
          '--sh': 'calc(var(--sw) / 2)',
        }}
      >
        {/* SVG clip shape: darwazon ki jagah ka hole */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="door-hole" clipPathUnits="objectBoundingBox">
              <path clipRule="evenodd" d={HOLE_CLIP_D} />
            </clipPath>
          </defs>
        </svg>

        {/* Phone par upar/neeche ka khali hissa: wahi image blur karke bhar do */}
        {narrow && (
          <div
            className="pointer-events-none absolute -inset-5"
            style={{
              backgroundImage: `url(${IMG.door})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(14px)',
            }}
          ></div>
        )}

        {/* Stage: door image apni asal ratio mein */}
        <div
          ref={stageRef}
          className="absolute"
          style={{
            left: 'calc(50% - var(--sw) / 2)',
            top: 'calc(50% - var(--sh) / 2)',
            width: 'var(--sw)',
            height: 'var(--sh)',
            perspective: '1500px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          {/* Fixed hissa: deewar, bel, floor (darwaze nikal kar) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              ...doorBg,
              clipPath: 'url(#door-hole)',
              ...(narrow
                ? {
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%)',
                  }
                : null),
            }}
          ></div>

          {/* Left darwaza (left kinare se khulta hai) */}
          <div
            className="door-leaf door-left pointer-events-none absolute inset-0"
            style={{
              ...doorBg,
              clipPath: LEFT_INSET,
              transformOrigin: `${LEFT_HINGE} 50%`,
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          ></div>

          {/* Right darwaza (right kinare se khulta hai) */}
          <div
            className="door-leaf door-right pointer-events-none absolute inset-0"
            style={{
              ...doorBg,
              clipPath: RIGHT_INSET,
              transformOrigin: `${RIGHT_HINGE} 50%`,
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          ></div>
        </div>

        <div className="door-label pointer-events-none absolute inset-x-0 bottom-[6svh] flex justify-center">
          <span className="animate-pulse rounded-full bg-white/70 px-5 py-2 text-sm text-[#5C0A3A] backdrop-blur-md">
            Tap to open
          </span>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="relative z-10 h-[100svh] w-full overflow-hidden">
        {/* Text */}
        <div className="absolute inset-x-0 top-[5svh] z-20 flex justify-center px-4">
          <div className={`hero-item ${GLASS} w-full max-w-md px-5 py-5 text-center sm:px-6 sm:py-6`}>
            <h1 className="text-xl md:text-2xl font-serif text-white tracking-wide" style={{ direction: 'rtl' }}>
            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </h1>
          <span className="text-sm md:text-base font-serif text-white italic leading-relaxed block px-4 pb-4" style={{ direction: 'rtl' }}>
            بَارَكَ ٱللَّهُ لَكِ وَبَارَكَ عَلَيْكِ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
          </span>
            <p className="hero-item text-sm italic text-white" style={SHADOW}>
              You are invited to
            </p>
            <h1 className="hero-item my-1 text-3xl font-bold text-[#FFE08A] sm:text-5xl" style={SHADOW}>
              Mohsin Mehndi
            </h1>
            <p className="hero-item mt-3 text-xs text-white/90" style={SHADOW}>
              Son of
            </p>
            <p className="hero-item text-sm text-white" style={SHADOW}>
              {FAMILY.father} &amp; {FAMILY.mother}
            </p>
          </div>
        </div>

        {/* Girl (hand ke peeche) */}
        <div className="girl-wrap absolute inset-x-0 bottom-0 z-10 flex justify-center">
          <img
            src={IMG.girl}
            alt=""
            className="girl-img h-[46svh] w-auto max-w-full select-none object-contain sm:h-[56svh]"
            style={{ transformOrigin: '50% 100%' }}
          />
        </div>

        {/* Hand + do ghoomte flowers */}
        <div className="hand-wrap absolute inset-x-0 bottom-0 z-20 flex justify-center">
          <div className="relative w-fit">
            <img src={IMG.hand} alt="" className="h-[26svh] w-auto select-none sm:h-[30svh]" />
            <img src={IMG.flower} alt="" className="spin-flower absolute -left-[12%] bottom-[30%] w-[34%]" />
            <img src={IMG.flower} alt="" className="spin-flower absolute -right-[12%] bottom-[30%] w-[34%]" />
          </div>
        </div>
      </section>

      {/* ============ MARK YOUR DATE ============ */}
      <section
        id="date-section"
        className="relative z-20 flex min-h-[100svh] w-full items-center justify-center px-4 py-16 sm:py-20"
      >
        <div className={`${GLASS} flex w-full max-w-sm flex-col items-center gap-6 px-6 py-8 text-center sm:px-8 sm:py-10`}>
          <div>
            <h2 className="date-item text-2xl font-bold text-white sm:text-3xl" style={SHADOW}>
              Mark Your Date
            </h2>
            <p className="date-item mt-4 text-base italic text-white" style={SHADOW}>
              {MEHNDI.day}
            </p>
            <p className="date-item text-7xl font-bold leading-none text-[#FFE08A] sm:text-8xl" style={SHADOW}>
              {MEHNDI.date}
            </p>
            <p className="date-item mt-2 text-lg text-white" style={SHADOW}>
              {MEHNDI.month} {MEHNDI.year}
            </p>
          </div>

          <div className="date-item w-full">
            <MonthCalendar />
          </div>

          <div className="date-item w-full">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/90" style={SHADOW}>
              Counting down to the Mehndi
            </p>
            <Countdown target={MEHNDI_START} />
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        id="footer-section"
        className="relative z-20 flex w-full flex-col items-center px-4 pb-14 pt-6 text-center"
      >
        <div className={`${GLASS} flex flex-col items-center gap-3 px-10 py-8`}>
          <span className="foot-item text-base leading-none text-[#FFE08A]" style={SHADOW}>
            ✦
          </span>

          <p className="foot-item text-[10px] font-semibold uppercase tracking-[0.3em] text-white/90" style={SHADOW}>
            Designed by
          </p>
          <p className="foot-item -mt-2 text-lg font-medium tracking-wide text-white" style={SHADOW}>
            Muhammad Bilal
          </p>

          <p className="foot-item mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/90" style={SHADOW}>
            Developed by
          </p>
          <p className="foot-item -mt-2 text-lg font-medium tracking-wide text-white" style={SHADOW}>
            Muhammad Bilal
          </p>

          <div className="foot-item my-2 h-[1px] w-12 bg-white/50"></div>

          <a
            href="https://www.instagram.com/bilal.env0/"
            target="_blank"
            rel="noopener noreferrer"
            className="foot-item flex items-center gap-2 text-xs font-medium tracking-wide text-[#FFE08A] transition-colors hover:text-white"
            style={SHADOW}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
            </svg>
            @bilal.env0
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;