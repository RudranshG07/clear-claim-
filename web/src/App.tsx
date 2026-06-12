import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  KeyRound,
  Eye,
  Cpu,
  Radio,
} from "lucide-react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";
const REPO = "https://github.com/RudranshG07/clear-claim-";
const CONTRACT =
  "https://amoy.polygonscan.com/address/0x699B46c34cDd4480E6160FaDcC982D3Bf8E6E6f5";
const TX =
  "https://amoy.polygonscan.com/tx/0x6957a89a67c9938cbc77cd5e563f9d6a0f986afe18ef58140a1960872aa3cdfc";

/* ----------------------------- typewriter hook ---------------------------- */
function useTypewriter(text: string, speed = 42, startDelay = 500) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);
  return { displayed, done };
}

/* ------------------------------- scroll reveal ---------------------------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Label({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 mb-4 font-mono">
      <span className="text-xs tracking-[0.1em] text-acc">{n}</span>
      <span className="text-xs uppercase tracking-[0.22em] text-[#7a7b82]">
        {children}
      </span>
    </div>
  );
}

/* --------------------------------- navbar --------------------------------- */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  const links = [
    ["Problem", "#problem"],
    ["How it works", "#how"],
    ["Proof", "#proof"],
    ["Try it", "#try"],
  ];
  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-20 px-5 sm:px-8 py-4 flex justify-between items-center transition-all duration-300 ${
          scrolled
            ? "bg-[#08080a]/75 backdrop-blur-xl border-b border-white/[.06]"
            : "border-b border-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5 select-none">
          <span className="w-2 h-2 rounded-full bg-acc shadow-[0_0_14px_#c8fa3c]" />
          <span className="font-display font-extrabold tracking-[-0.03em] text-[17px] sm:text-[19px] text-ink">
            CLEAR-CLAIM
          </span>
        </a>
        <nav className="hidden md:flex gap-7 text-[14px] text-[#9a9aa2]">
          {links.map(([l, href]) => (
            <a key={l} href={href} className="hover:text-ink transition-colors">
              {l}
            </a>
          ))}
        </nav>
        <a
          href={REPO}
          target="_blank"
          rel="noopener"
          className="hidden md:inline-flex items-center gap-2 font-mono text-[13px] rounded-full bg-acc text-[#0a0a0a] px-4 py-2 font-medium hover:shadow-[0_0_0_4px_rgba(200,250,60,.14)] transition"
        >
          GitHub →
        </a>
        <button
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex flex-col gap-[5px] p-1"
        >
          <span className={`w-6 h-[2px] bg-ink transition-all duration-300 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`w-6 h-[2px] bg-ink transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`w-6 h-[2px] bg-ink transition-all duration-300 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>
      </header>
      <div
        className={`md:hidden fixed inset-0 z-[15] bg-[#08080a]/96 backdrop-blur-lg transition-opacity duration-300 flex flex-col items-center justify-center gap-8 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {links.map(([l, href]) => (
          <a key={l} href={href} onClick={() => setOpen(false)} className="font-display text-3xl text-ink font-semibold tracking-tight">
            {l}
          </a>
        ))}
        <a href={REPO} target="_blank" rel="noopener" onClick={() => setOpen(false)} className="font-mono text-acc text-lg mt-2">
          GitHub →
        </a>
      </div>
    </>
  );
}

/* ----------------------------- background video --------------------------- */
function BackgroundVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.innerWidth < 1024) {
      v.autoplay = true;
      v.muted = true;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let prevX: number | null = null;
    let target = 0;
    const onMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      const dur = v.duration;
      if (!dur || isNaN(dur)) return;
      if (prevX === null) {
        prevX = e.clientX;
        return;
      }
      const delta = e.clientX - prevX;
      prevX = e.clientX;
      target += (delta / window.innerWidth) * 0.8 * dur;
      target = Math.max(0, Math.min(dur, target));
      try {
        v.currentTime = target;
      } catch {
        /* not ready */
      }
    };
    v.addEventListener("seeked", () => {});
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="order-last lg:order-none relative lg:absolute lg:inset-0 lg:z-0 overflow-hidden pointer-events-none w-full aspect-square md:aspect-video lg:aspect-auto lg:h-full bg-[#08080a]">
      <video
        ref={ref}
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-right lg:object-right-bottom opacity-90 lg:opacity-100"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      {/* dark veils so the left-side text stays legible and it blends into the page */}
      <div className="absolute inset-0 lg:bg-[linear-gradient(100deg,#08080a_0%,rgba(8,8,10,.7)_42%,transparent_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 lg:h-48 bg-gradient-to-t from-[#08080a] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#08080a] to-transparent lg:from-[#08080a]/60" />
    </div>
  );
}

/* -------------------------------- service pills --------------------------- */
const OPTIONS = ["Keyless", "Readable", "Hardware-gated", "Autonomous"];
function Services() {
  const [services, setServices] = useState<string[]>([]);
  const toggle = (s: string) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight mb-1.5 text-ink">
        What should the agent guarantee?
      </h2>
      <p className="text-[#7a7b82] mb-6 text-sm">Select all that matter.</p>
      <div className="flex flex-wrap gap-2.5 mb-5">
        {OPTIONS.map((opt) => {
          const active = services.includes(opt);
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-[14px] font-medium transition-colors ${
                active
                  ? "bg-acc text-[#0a0a0a] shadow-[0_0_24px_rgba(200,250,60,.18)]"
                  : "bg-white/[.03] text-ink border border-white/12 hover:bg-white/[.07]"
              }`}
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex"
                  >
                    <Check size={15} strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
              {opt}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {services.length === 0 ? (
          <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="italic text-xs text-[#7a7b82] font-mono">
            // select what matters to you above
          </motion.p>
        ) : (
          <motion.div key="active" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[.03] border border-white/10 rounded-2xl px-5 py-4">
              <span className="text-[14px] text-[#cdccd4]">
                The agent stays <span className="font-medium text-acc">{services.join(", ")}</span> — you approve every claim on your Ledger.
              </span>
              <a href="#try" className="group flex items-center gap-1.5 text-acc font-mono uppercase text-xs tracking-wide whitespace-nowrap">
                Run the demo
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- hero ----------------------------------- */
function Hero() {
  const { displayed, done } = useTypewriter("approve what you\ncan actually read.");
  return (
    <section className="relative flex flex-col lg:block overflow-hidden lg:min-h-screen border-b border-white/[.06]">
      <BackgroundVideo />
      <div className="relative z-10 flex flex-col order-first lg:order-none w-full lg:min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-12 flex-1 flex flex-col justify-center">
          <div className="max-w-2xl pt-24 lg:pt-0">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-[#7a7b82]">
              Ledger Agent Stack · DePIN · Keyless
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-display font-semibold tracking-[-0.02em] text-ink text-[44px] leading-[1.02] sm:text-6xl lg:text-[80px] mb-7 whitespace-pre-wrap select-none">
              {displayed}
              {!done && <span className="inline-block w-[3px] h-[0.92em] bg-acc align-middle ml-1 animate-blink" />}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-[#bdbdc6] text-lg sm:text-xl leading-relaxed max-w-xl mb-12">
              A keyless agent that manages a DePIN operator's reward claims. It watches your rewards, decides when to claim, and assembles the transaction — then you approve a <span className="text-acc">human-readable</span> claim on your Ledger.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Services />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- sections ------------------------------- */
function Problem() {
  const cards = [
    {
      tag: "Option A · Hot key",
      h: "A private key in a config file",
      p: "Copyable by malware, exposed to phishing, a standing target. The pattern behind multiple real 2025–26 drains of agent and operator wallets.",
      code: "PRIVATE_KEY=0x8f3a9c…  # in .env, forever",
    },
    {
      tag: "Option B · Blind sign",
      h: "Tap “approve” on an unreadable hash",
      p: "You authorize a string with no way to verify the amount or destination. A hardware gate is meaningless if the screen shows a blank check.",
      code: "Sign 0x23b872dd0000a41f… ?  ✋",
    },
  ];
  return (
    <section id="problem" className="bg-[#08080a] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <Label n="01">The problem</Label>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-5xl text-ink max-w-2xl leading-[1.04]">
            Two bad ways to claim.
          </h2>
          <p className="mt-5 text-[#9a9aa2] max-w-2xl text-lg">
            DePIN operators run always-on nodes that earn continuously. To claim, today they pick between two ways to lose funds — the gap behind a large share of the <span className="text-ink font-medium">$3B drained in 2025</span>.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-5 mt-14">
          {cards.map((c, i) => (
            <Reveal key={c.tag} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-white/10 bg-bg2 p-7 sm:p-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#ff5c57]">{c.tag}</div>
                <h3 className="font-display text-2xl font-medium tracking-tight text-ink mt-4 mb-3">{c.h}</h3>
                <p className="text-[#9a9aa2]">{c.p}</p>
                <div className="mt-6 font-mono text-[13px] text-[#7a7b82] bg-[#0a0a0c] border border-white/[.06] rounded-xl px-4 py-3 break-all">{c.code}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeviceFrame({ children, glow = false }: { children: React.ReactNode; glow?: boolean }) {
  return (
    <div className={`relative mx-auto w-[268px] max-w-full aspect-[268/348] rounded-[28px] p-6 flex flex-col font-mono shadow-2xl ${glow ? "bg-[#101012] text-ink shadow-black/40" : "bg-[#f5f5f4] text-[#111] shadow-black/40"}`}>
      {children}
    </div>
  );
}

function Devices() {
  return (
    <section className="bg-bg2 border-y border-white/[.06] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <Label n="02">The fix</Label>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-5xl text-ink max-w-2xl leading-[1.04]">
            The same claim, on the same device.
          </h2>
          <p className="mt-5 text-[#9a9aa2] max-w-2xl text-lg">
            A hardware gate only protects you if the transaction is readable. Clear-Claim ships an ERC-7730 descriptor so the Ledger renders the claim in plain language instead of a hash.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-10 sm:gap-8 mt-16 max-w-3xl">
          <Reveal>
            <div className="flex items-center gap-2 mb-5 font-mono text-xs uppercase tracking-[0.16em] text-[#ff5c57]">
              <span className="w-2 h-2 rounded-full bg-[#ff5c57]" /> Without a descriptor
            </div>
            <DeviceFrame>
              <div className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">Ethereum · Review</div>
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <AlertTriangle className="text-[#cf3b2f]" size={38} />
                <b className="text-[#cf3b2f] text-[15px] font-sans">This transaction cannot be clear-signed</b>
                <small className="text-[#9a9a9a] text-[11px] leading-relaxed">Enable blind signing in the settings to sign this transaction.</small>
              </div>
              <div className="rounded-full bg-[#e3e3e1] text-[#6a6a6a] text-center py-2.5 text-[12px]">Blind signing required</div>
            </DeviceFrame>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-2 mb-5 font-mono text-xs uppercase tracking-[0.16em] text-acc">
              <span className="w-2 h-2 rounded-full bg-acc" /> With Clear-Claim
            </div>
            <DeviceFrame glow>
              <span className="absolute -top-2.5 right-6 bg-acc text-[#0a0a0a] text-[10px] tracking-[0.12em] px-2.5 py-1 rounded-full font-sans font-medium">✓ VERIFIED</span>
              <div className="text-[11px] uppercase tracking-wide text-[#8a8a8a]">Review · Claim DePIN rewards</div>
              <div className="mt-3.5"><div className="text-[11px] uppercase text-[#8a8a8a]">Interaction with</div><div className="text-[17px] font-sans font-semibold">Clear-Claim</div></div>
              <div className="mt-3.5"><div className="text-[11px] uppercase text-[#8a8a8a]">Claim</div><div className="text-[19px] font-sans font-semibold text-acc">36.75 RWRD</div></div>
              <div className="mt-3.5"><div className="text-[11px] uppercase text-[#8a8a8a]">To</div><div className="text-[12px] break-all text-[#cfcfcf]">0xf35ec83BDcd18BFF…F19f13Db</div></div>
              <div className="mt-auto pt-4 rounded-full bg-acc text-[#0a0a0a] text-center py-2.5 text-[12px] font-sans font-medium">⊙ Hold to sign</div>
            </DeviceFrame>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    { i: Eye, n: "01", h: "Watch", p: "Reads your claimable balance and gas — modeled on live WeatherXM reward data.", k: "keyless · viem" },
    { i: Cpu, n: "02", h: "Decide", p: "Proposes a claim only when the reward clears your floor and gas is below your ceiling.", k: "policy" },
    { i: KeyRound, n: "03", h: "Clear-sign", p: "Hands the tx to your Ledger via the DMK. You approve “Claim 36.75 RWRD”.", k: "erc-7730 · dmk" },
    { i: Radio, n: "04", h: "Broadcast", p: "The signed tx is broadcast. The key never left the device; the agent never saw it.", k: "on-chain" },
  ];
  return (
    <section id="how" className="bg-[#08080a] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <Label n="03">How it works</Label>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-5xl text-ink max-w-2xl leading-[1.04]">
            The agent does the work — and holds no key.
          </h2>
          <p className="mt-5 text-[#9a9aa2] max-w-2xl text-lg">
            Signing happens in-process through Ledger's Device Management Kit — demoable on Speculos, no hardware required.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px mt-16 rounded-2xl overflow-hidden border border-white/10 bg-white/[.06]">
          {steps.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.06}>
              <div className="h-full bg-[#08080a] p-7 flex flex-col min-h-[220px]">
                <s.i size={22} className="text-acc" />
                <div className="font-mono text-xs text-[#7a7b82] mt-5">{s.n}</div>
                <h3 className="font-display text-xl font-medium tracking-tight mt-2 mb-3 text-ink">{s.h}</h3>
                <p className="text-[#9a9aa2] text-sm">{s.p}</p>
                <div className="mt-auto pt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5c63]">{s.k}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Data() {
  const rows: [string, string, boolean][] = [
    ["active stations", "6,162", false],
    ["rewards / 30d", "226,429 WXM", false],
    ["per station / mo", "≈ 36.75 WXM", true],
    ["→ agent claims", "36.75 RWRD", true],
  ];
  return (
    <section className="bg-bg2 border-y border-white/[.06] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <Label n="04">Real data</Label>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-5xl text-ink max-w-2xl leading-[1.04]">
            Grounded in a live DePIN.
          </h2>
          <p className="mt-5 text-[#9a9aa2] max-w-2xl text-lg">
            The reward isn't invented. The agent reads WeatherXM's live network rate — a real DePIN, 6,000+ stations on Arbitrum — and claims a genuine per-station amount.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-14 grid lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,rgba(200,250,60,.07),transparent_55%)] p-8 flex flex-col justify-center">
              <h3 className="font-display text-2xl font-medium tracking-tight text-ink max-w-md leading-snug">
                The claim amount tracks a live DePIN's actual reward economics.
              </h3>
              <p className="mt-4 text-[#9a9aa2]">
                Settlement runs on a testnet contract — no DePIN mints claimable test rewards — but the number is real, pulled each cycle from <span className="font-mono text-acc">api.weatherxm.com</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] p-6 font-mono text-sm">
              {rows.map(([k, v, hl]) => (
                <div key={k} className="flex justify-between gap-6 py-3 border-b border-white/[.06] last:border-0">
                  <span className="text-[#7a7b82]">{k}</span>
                  <b className={hl ? "text-acc font-medium" : "text-ink font-medium"}>{v}</b>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Proof() {
  const stats = [
    ["0", "private keys in the agent"],
    ["100%", "on-device approval"],
    ["36.75", "RWRD clear-signed, live"],
    ["~60s", "faucet — anyone can run it"],
  ];
  return (
    <section id="proof" className="bg-[#08080a] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <Label n="05">Proof</Label>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-5xl text-ink max-w-2xl leading-[1.04]">
            Proven on-chain.
          </h2>
          <p className="mt-5 text-[#9a9aa2] max-w-2xl text-lg">
            Signed on a real Ledger emulator (Speculos, Ethereum app v1.22.1), broadcast to Polygon Amoy — the testnet of the chain DIMO runs on.
          </p>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 mt-14">
          {stats.map(([big, lab], i) => (
            <Reveal key={lab} delay={i * 0.06}>
              <div className="font-display font-semibold tracking-[-0.03em] text-5xl sm:text-6xl text-ink">{big}</div>
              <div className="mt-3 font-mono text-sm text-[#9a9aa2]">{lab}</div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap gap-5 font-mono text-sm">
            <a href={TX} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-acc hover:opacity-70">clear-signed tx <ArrowUpRight size={14} /></a>
            <a href={CONTRACT} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-acc hover:opacity-70">live contract <ArrowUpRight size={14} /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Try() {
  const notes: [string, string, string][] = [
    ["The device renders ", "“Claim 36.75 RWRD to 0x…”", " — readable, not a hash."],
    ["The agent holds ", "no key", "; only your device signs."],
    ["A permissionless ", "faucet", " arms any operator — repeatable every 60s."],
    ["Got real hardware? Set ", "TRANSPORT=usb", " and approve on your Ledger."],
  ];
  return (
    <section id="try" className="bg-bg2 border-t border-white/[.06] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <Reveal>
          <Label n="06">Try it</Label>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-5xl text-ink max-w-2xl leading-[1.04]">
            Run it yourself.
          </h2>
          <p className="mt-5 text-[#9a9aa2] max-w-2xl text-lg">
            No key, no faucet, no deploy. The contract self-credits a reward to any operator, so the Speculos default seed just works — approve on your own emulated Ledger.
          </p>
        </Reveal>
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mt-14 items-start">
          <Reveal>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0c] font-mono text-[13px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[.06] text-[#5b5c63] text-xs">
                <i className="w-3 h-3 rounded-full bg-[#ff5f57] inline-block" />
                <i className="w-3 h-3 rounded-full bg-[#febc2e] inline-block" />
                <i className="w-3 h-3 rounded-full bg-[#28c840] inline-block" />
                <span className="ml-2">clear-claim — zsh</span>
              </div>
              <div className="p-5 sm:p-6 leading-[1.9] overflow-x-auto text-[#cdccd4]">
                <div className="text-[#5b5c63]"># 1 · your own Ledger emulator</div>
                <div><span className="text-acc">$</span> API_PORT=5005 scripts/run-speculos.sh</div>
                <div className="text-[#5b5c63] mt-3"># 2 · the keyless agent, live contract</div>
                <div><span className="text-acc">$</span> cd agent && npm install</div>
                <div><span className="text-acc">$</span> cp .env.amoy-demo.example .env && npm start</div>
                <div className="text-[#6fd08c] mt-3">live DePIN data: 6162 stations → ~36.75 WXM</div>
                <div className="text-[#6fd08c]">claimable=36.75 RWRD · clear signing armed</div>
                <div>→ open localhost:5005 · swipe · hold to sign</div>
                <div className="text-[#6fd08c]">✓ tx success — broadcast on Polygon Amoy</div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] p-6 sm:p-7">
              <h3 className="font-display text-xl font-medium tracking-tight text-ink mb-5">What you'll see</h3>
              <ul>
                {notes.map((p, i) => (
                  <li key={i} className="flex gap-3 py-3 border-b border-white/[.06] last:border-0 text-[#9a9aa2] text-[15px]">
                    <ArrowRight size={15} className="text-acc mt-1 shrink-0" />
                    <span>{p[0]}<b className="text-ink font-medium">{p[1]}</b>{p[2]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-[#08080a] py-28 sm:py-40 text-center">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <Reveal>
          <h2 className="font-display font-semibold tracking-[-0.02em] text-4xl sm:text-6xl text-ink leading-[1.05]">
            An agent that acts freely — but never moves funds you haven't <span className="text-acc">read</span> and approved.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap gap-3.5 justify-center">
            <a href={REPO} target="_blank" rel="noopener" className="rounded-full bg-acc text-[#0a0a0a] px-7 py-3.5 font-medium hover:shadow-[0_0_0_4px_rgba(200,250,60,.14)] transition">View the code</a>
            <a href="#try" className="rounded-full border border-white/15 text-ink px-7 py-3.5 hover:border-white/45 transition">Run the demo</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#08080a] border-t border-white/[.06] text-[#7a7b82] py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-wrap items-center justify-between gap-5 text-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-display font-extrabold tracking-[-0.03em] text-ink text-base">
            <span className="w-2 h-2 rounded-full bg-acc" /> CLEAR-CLAIM
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] border border-white/12 rounded-full px-3 py-1">Built for Ledger N3XT</span>
        </div>
        <div className="flex gap-6 font-mono">
          <a href={REPO} target="_blank" rel="noopener" className="hover:text-ink">GitHub</a>
          <a href={CONTRACT} target="_blank" rel="noopener" className="hover:text-ink">Contract</a>
          <a href="https://eips.ethereum.org/EIPS/eip-7730" target="_blank" rel="noopener" className="hover:text-ink">ERC-7730</a>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------- app ---------------------------------- */
export default function App() {
  return (
    <div id="top" className="grain relative bg-[#08080a] text-ink font-sans selection:bg-acc selection:text-[#0a0a0a] antialiased overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Devices />
      <How />
      <Data />
      <Proof />
      <Try />
      <CTA />
      <Footer />
    </div>
  );
}
