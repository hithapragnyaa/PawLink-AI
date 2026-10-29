
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Heart,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trees,
  Menu,
  X,
  Instagram,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import "./styles.css";

const pets = [
  {
    name: "Mochi",
    detail: "2 years · Gentle soul",
    type: "Dog",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85",
    color: "peach",
  },
  {
    name: "Luna",
    detail: "1 year · Little explorer",
    type: "Cat",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85",
    color: "lilac",
  },
  {
    name: "Biscuit",
    detail: "8 months · Full of joy",
    type: "Dog",
    image:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=85",
    color: "mint",
  },
];

const features = [
  {
    icon: PawPrint,
    title: "Rescue with care",
    description:
      "Report animals in need and help rescue teams respond with care and urgency.",
    color: "lavender",
  },
  {
    icon: Stethoscope,
    title: "Every step of healing",
    description:
      "Bring medical records, shelter stays, and recovery updates together.",
    color: "mint",
  },
  {
    icon: Heart,
    title: "Love finds a way",
    description:
      "Help animals discover loving homes through a thoughtful adoption journey.",
    color: "peach",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
    setMenuOpen(false);
  };

  const joinUpdates = (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    window.location.href =
      `mailto:hello@pawlink.ai?subject=${encodeURIComponent(
        "PawLink AI updates"
      )}&body=${encodeURIComponent(
        `Please share PawLink AI updates with me at ${email.trim()}.`
      )}`;
  };

  return (
    <div className="pawlink-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header">
        <a
          href="#home"
          className="brand"
          aria-label="PawLink AI home"
        >
          <span className="brand-mark">
            <PawPrint size={25} strokeWidth={2.4} />
            <span className="brand-sparkle">✦</span>
          </span>
          <span className="brand-name">
            pawlink<span>ai</span>
            <small>Every paw matters</small>
          </span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <button onClick={() => goTo("mission")}>Our mission</button>
          <button onClick={() => goTo("how-it-works")}>
            How it works
          </button>
          <button onClick={() => goTo("adopt")}>Meet the pets</button>
          <a className="nav-login" href="/login">
            Sign in
          </a>
          <a className="button button-primary nav-cta" href="/register">
            Join the family <ArrowUpRight size={17} />
          </a>
        </nav>
      </header>

      <main>
        <section className="hero section-wrap" id="home">
          <div className="hero-copy">
            <motion.div
              className="eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles size={15} />
              A little more kindness, every day
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08 }}
            >
              Every paw
              <br />
              deserves a <span className="dream-word">home.</span>
            </motion.h1>

            <motion.p
              className="hero-description"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18 }}
            >
              A kinder world starts with one small act. We bring
              rescue teams, caregivers, and future families together
              to make every animal&apos;s next chapter a little brighter.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
            >
              <button
                className="button button-primary button-large"
                onClick={() => goTo("adopt")}
              >
                Find your forever friend <ArrowRight size={18} />
              </button>
              <a
                href="/reporter.html"
                className="button button-quiet button-large"
              >
                <Heart size={17} /> Help an animal
              </a>
            </motion.div>

            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=100&q=80"
                  alt=""
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
                  alt=""
                />
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  alt=""
                />
              </div>
              <div>
                <div className="trust-stars">★★★★★</div>
                <p>Made for the people who care.</p>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <span className="floating-symbol symbol-one">✦</span>
            <span className="floating-symbol symbol-two">✧</span>
            <span className="floating-symbol symbol-three">♡</span>

            <motion.div
              className="hero-image-frame"
              initial={{ opacity: 0, scale: 0.94, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              <img
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1000&q=90"
                alt="A happy dog looking for a loving home"
              />
              <div className="image-caption">
                <span className="caption-icon"><Heart size={18} fill="currentColor" /></span>
                <div>
                  <strong>Little lives, big love.</strong>
                  <span>Every new beginning matters.</span>
                </div>
                <Sparkles className="caption-sparkle" size={20} />
              </div>
            </motion.div>

            <motion.div
              className="floating-note note-top"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="note-emoji">🌷</span>
              <span><strong>Gentle care</strong><small>Every step of the way</small></span>
            </motion.div>

            <motion.div
              className="floating-note note-bottom"
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 4.5, repeat: Infinity }}
            >
              <span className="note-emoji">🐾</span>
              <span><strong>Hope lives here</strong><small>One paw at a time</small></span>
            </motion.div>
          </div>
        </section>

        <section className="promise-strip">
          <div className="promise-item">
            <ShieldCheck size={21} />
            <span>Care you can trust</span>
          </div>
          <span className="promise-dot">✦</span>
          <div className="promise-item">
            <Heart size={21} />
            <span>Compassion at every step</span>
          </div>
          <span className="promise-dot">✦</span>
          <div className="promise-item">
            <Trees size={21} />
            <span>A brighter future together</span>
          </div>
        </section>

        <section className="mission-section section-wrap" id="mission">
          <div className="section-heading">
            <span className="eyebrow"><Sparkles size={14} /> A little magic, a lot of heart</span>
            <h2>Care is better <span className="dream-word">together.</span></h2>
            <p>
              Behind every rescued animal is a whole community of
              people who refused to give up. We help that community
              work as one.
            </p>
          </div>

          <div className="feature-grid" id="how-it-works">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  className={`feature-card feature-${feature.color}`}
                  key={feature.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="feature-icon"><Icon size={24} /></div>
                  <span className="feature-number">0{index + 1}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <button
                    className="text-link"
                    onClick={() => goTo("get-involved")}
                  >
                    Be part of it <ArrowUpRight size={16} />
                  </button>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="adopt-section" id="adopt">
          <div className="section-wrap">
            <div className="adopt-heading">
              <div>
                <span className="eyebrow"><Heart size={14} /> Your next best friend</span>
                <h2>Meet the little <span className="dream-word">lovebugs.</span></h2>
                <p>Three very good reasons to believe in happy endings.</p>
              </div>
              <a href="/pages/adoption_listings.html" className="button button-outline">
                Explore adoption <ArrowRight size={17} />
              </a>
            </div>

            <div className="pet-grid">
              {pets.map((pet, index) => (
                <motion.article
                  className={`pet-card pet-${pet.color}`}
                  key={pet.name}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                >
                  <div className="pet-photo">
                    <img src={pet.image} alt={pet.name} loading="lazy" />
                    <span className="pet-type">{pet.type}</span>
                    <span className="pet-heart"><Heart size={17} /></span>
                  </div>
                  <div className="pet-info">
                    <div>
                      <h3>{pet.name}</h3>
                      <p>{pet.detail}</p>
                    </div>
                    <a
                      href="/pages/adoption_listings.html"
                      className="pet-arrow"
                      aria-label={`Explore adoption listings like ${pet.name}`}
                    >
                      <ArrowUpRight size={19} />
                    </a>
                  </div>
                </motion.article>
              ))}
            </div>

            <p className="pet-disclaimer">
              These are illustrative featured pets for the landing page.
              Browse adoption listings to see available animals.
            </p>
          </div>
        </section>

        <section className="kindness-section section-wrap" id="get-involved">
          <div className="kindness-card">
            <div className="kindness-decoration">✿</div>
            <div className="kindness-copy">
              <span className="eyebrow"><Sparkles size={14} /> Your kindness belongs here</span>
              <h2>Small paws.<br /><span className="dream-word">Big possibilities.</span></h2>
              <p>
                Whether you rescue, foster, heal, adopt, or simply care,
                there is a place for you in this story.
              </p>
              <div className="kindness-actions">
                <a href="/register" className="button button-primary">
                  Join PawLink AI <ArrowRight size={17} />
                </a>
                <a href="/reporter.html" className="text-link">
                  Report an animal in need <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
            <div className="kindness-illustration">
              <div className="kindness-glow" />
              <img
                src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=85"
                alt="A dog receiving loving care"
                loading="lazy"
              />
              <span className="kindness-sticker">you make<br />a difference ♡</span>
            </div>
          </div>
        </section>

        <section className="newsletter section-wrap">
          <div>
            <span className="eyebrow"><Mail size={14} /> Letters with love</span>
            <h2>A little kindness in your inbox.</h2>
            <p>Get occasional PawLink AI updates and happy-paw stories.</p>
          </div>
          <form className="newsletter-form" onSubmit={joinUpdates}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button className="button button-primary" type="submit">
              Count me in <ArrowRight size={17} />
            </button>
          </form>
          <p className="newsletter-note">
            This prototype opens your email app; it does not subscribe you to a mailing list yet.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <a href="#home" className="brand footer-brand">
            <span className="brand-mark"><PawPrint size={24} /></span>
            <span className="brand-name">pawlink<span>ai</span><small>Every paw matters</small></span>
          </a>
          <p>Making room for more happy endings. One paw at a time.</p>
          
<div className="footer-links">
  <a href="/login">Sign in</a>
  <a href="/register">Join us</a>
  <a href="mailto:hello@pawlink.ai">
    <Mail size={16} /> Contact
  </a>
</div>

        </div>
        <div className="footer-bottom section-wrap">
          <span>© {new Date().getFullYear()} PawLink AI</span>
          <span>Built with care for every kind of paw. ♡</span>
          <button onClick={() => goTo("home")} className="back-top">
            Back to top <ArrowDownRight size={15} />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
