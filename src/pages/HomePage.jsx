import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/HomePage.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-presspilot.png";
import {
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  Users,
  BarChart3,
  Mail,
  Zap,
  Target,
  FileText,
  Send,
  TrendingUp,
  Star,
  ChevronDown,
  Shield,
  Clock,
  Menu,
  X,
  AlertTriangle,
  Timer,
  Database,
  Brain,
  Globe,
  PieChart,
} from "lucide-react";

/* ============================================================
   DATA
   ============================================================ */
const STATS = [
  { value: "500+", label: "Campagnes g\u00e9r\u00e9es" },
  { value: "15k", accent: "+", label: "Contacts presse" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "3x", label: "Plus de retomb\u00e9es" },
];

const PAIN_POINTS = [
  {
    icon: AlertTriangle,
    iconClass: "red",
    title: "Contacts \u00e9parpill\u00e9s",
    problem:
      "Vos fichiers presse sont r\u00e9partis entre 5 tableurs Excel, 3 bo\u00eetes mail et une pile de cartes de visite.",
    solution:
      "CRM centralis\u00e9 avec import CSV, d\u00e9duplication automatique et tags intelligents.",
  },
  {
    icon: Timer,
    iconClass: "orange",
    title: "Suivi chronophage",
    problem:
      "Chaque relance vous co\u00fbte 20 minutes de copier-coller. Multipliez par 50 journalistes, et votre journ\u00e9e y passe.",
    solution:
      "Campagnes automatis\u00e9es avec suivi des ouvertures, relances programm\u00e9es et reporting en temps r\u00e9el.",
  },
  {
    icon: Database,
    iconClass: "yellow",
    title: "R\u00e9sultats invisibles",
    problem:
      "Impossible de prouver l\u2019impact de vos actions RP \u00e0 vos clients ou votre direction.",
    solution:
      "Tableaux de bord visuels avec KPIs, export PDF et historique complet par artiste.",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "CRM Presse",
    desc: "Base de contacts centralis\u00e9e avec segmentation avanc\u00e9e, historique de chaque interaction et import/export CSV.",
  },
  {
    icon: Send,
    title: "Campagnes Email",
    desc: "Envoi massif personnalis\u00e9 avec templates pro, suivi des ouvertures et clics en temps r\u00e9el.",
  },
  {
    icon: Brain,
    title: "IA Int\u00e9gr\u00e9e",
    desc: "Optimisation des objets d\u2019email, suggestion de contacts pertinents et scoring automatique.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Tableaux de bord en temps r\u00e9el, KPIs de performance, exports PDF pour vos clients.",
  },
  {
    icon: FileText,
    title: "Communiqu\u00e9s",
    desc: "\u00c9diteur de communiqu\u00e9s de presse avec templates, gestion des versions et diffusion cibl\u00e9e.",
  },
  {
    icon: Globe,
    title: "Multi-Projets",
    desc: "G\u00e9rez plusieurs artistes ou labels depuis un seul compte avec des espaces d\u00e9di\u00e9s.",
  },
];

const HOW_STEPS = [
  {
    num: 1,
    title: "Demandez votre acc\u00e8s",
    desc: "Soumettez votre demande d\u2019invitation en 30 secondes.",
  },
  {
    num: 2,
    title: "Importez vos contacts",
    desc: "CSV, copier-coller ou saisie manuelle. On s\u2019adapte \u00e0 vous.",
  },
  {
    num: 3,
    title: "Lancez vos campagnes",
    desc: "Templates pro, personnalisation par contact, envoi en 1 clic.",
  },
  {
    num: 4,
    title: "Mesurez vos r\u00e9sultats",
    desc: "Dashboard temps r\u00e9el, rapports PDF, preuves tangibles.",
  },
];

const TESTIMONIALS = [
  {
    text: "PressPilot a transform\u00e9 notre fa\u00e7on de g\u00e9rer les relations presse. On a tripl\u00e9 nos retomb\u00e9es en 3 mois.",
    name: "Sophie M.",
    role: "Attach\u00e9e de presse, Label indie",
    initials: "SM",
  },
  {
    text: "Enfin un outil con\u00e7u pour la musique. L\u2019interface est intuitive et le support est ultra-r\u00e9actif.",
    name: "Thomas R.",
    role: "Manager artiste",
    initials: "TR",
  },
  {
    text: "Le reporting automatique m\u2019a fait gagner 2 jours par mois. Mes clients adorent recevoir des rapports visuels.",
    name: "Julie D.",
    role: "Ind\u00e9pendante RP",
    initials: "JD",
  },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    desc: "Pour les ind\u00e9pendants et petits labels",
    monthly: 29,
    annual: 24,
    features: [
      "500 contacts",
      "3 campagnes/mois",
      "Templates email",
      "Support email",
      "1 utilisateur",
    ],
    popular: false,
    ctaClass: "outline",
  },
  {
    name: "Pro",
    desc: "Pour les attach\u00e9s de presse et labels actifs",
    monthly: 79,
    annual: 65,
    features: [
      "5 000 contacts",
      "Campagnes illimit\u00e9es",
      "IA optimisation",
      "Analytics avanc\u00e9s",
      "Support prioritaire",
      "3 utilisateurs",
    ],
    popular: true,
    ctaClass: "primary",
  },
  {
    name: "Agency",
    desc: "Pour les agences et labels majors",
    monthly: 199,
    annual: 165,
    features: [
      "Contacts illimit\u00e9s",
      "Multi-projets",
      "API access",
      "Account manager d\u00e9di\u00e9",
      "Onboarding personnalis\u00e9",
      "Utilisateurs illimit\u00e9s",
    ],
    popular: false,
    ctaClass: "outline",
  },
];

const FAQ_ITEMS = [
  {
    q: "Est-ce que PressPilot est adapt\u00e9 \u00e0 l\u2019industrie musicale ?",
    a: "Absolument. PressPilot a \u00e9t\u00e9 con\u00e7u sp\u00e9cifiquement pour les professionnels de la musique : attach\u00e9s de presse, labels, managers, distributeurs. Chaque fonctionnalit\u00e9 est pens\u00e9e pour les workflows RP musicaux.",
  },
  {
    q: "Puis-je importer mes contacts existants ?",
    a: "Oui, vous pouvez importer vos contacts via CSV ou les saisir manuellement. Notre syst\u00e8me d\u00e9tecte automatiquement les doublons et enrichit les fiches contacts.",
  },
  {
    q: "Combien de temps faut-il pour \u00eatre op\u00e9rationnel ?",
    a: "La plupart de nos utilisateurs sont op\u00e9rationnels en moins de 30 minutes. Importez vos contacts, choisissez un template et lancez votre premi\u00e8re campagne.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "Aucun engagement. Vous pouvez souscrire au mois et r\u00e9silier \u00e0 tout moment. L\u2019offre annuelle offre simplement 2 mois offerts.",
  },
  {
    q: "Comment fonctionne le suivi des campagnes ?",
    a: "Chaque email envoy\u00e9 via PressPilot est track\u00e9 : ouvertures, clics, r\u00e9ponses. Vous visualisez tout en temps r\u00e9el sur votre dashboard avec des graphiques clairs.",
  },
  {
    q: "Mes donn\u00e9es sont-elles s\u00e9curis\u00e9es ?",
    a: "Oui. Vos donn\u00e9es sont h\u00e9berg\u00e9es en Europe (RGPD compliant), chiffr\u00e9es en transit et au repos. Nous ne partageons jamais vos contacts avec des tiers.",
  },
  {
    q: "Comment obtenir un acc\u00e8s \u00e0 PressPilot ?",
    a: "PressPilot est accessible sur invitation uniquement. Soumettez votre demande via notre formulaire et notre \u00e9quipe \u00e9tudiera votre profil. Les professionnels de la musique (attach\u00e9s de presse, labels, managers) sont prioritaires.",
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */
const HomePage = () => {
  const navigate = useNavigate();

  /* --- state --- */
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  /* --- scroll-aware nav --- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* --- scroll-reveal observer --- */
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* --- helpers --- */
  const scrollTo = useCallback((id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  const goRegister = useCallback(() => navigate("/register"), [navigate]);
  const goLogin = useCallback(() => navigate("/login"), [navigate]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="landing-page">
      {/* ===================== NAV ===================== */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div
            className="lp-nav-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
            <img
              src={logo}
              alt="PressPilot by BandStream"
              className="lp-nav-logo"
            />
            <span className="lp-nav-brand-text">
              PressPilot <span className="lp-nav-brand-sub">by BandStream</span>
            </span>
          </div>

          <ul
            className={`lp-nav-links${mobileMenuOpen ? " mobile-open" : ""}`}
          >
            <li>
              <a onClick={() => scrollTo("features")} style={{ cursor: "pointer" }}>
                Fonctionnalit\u00e9s
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("pricing")} style={{ cursor: "pointer" }}>
                Tarifs
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("testimonials")} style={{ cursor: "pointer" }}>
                T\u00e9moignages
              </a>
            </li>
            <li>
              <a onClick={() => scrollTo("faq")} style={{ cursor: "pointer" }}>
                FAQ
              </a>
            </li>
            <li>
              <a onClick={goLogin} style={{ cursor: "pointer" }}>
                Connexion
              </a>
            </li>
            <li>
              <button className="lp-nav-cta" onClick={goRegister}>
                Demander un acc\u00e8s
              </button>
            </li>
          </ul>

          <button
            className="lp-nav-mobile-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <Sparkles size={16} />
              Propuls\u00e9 par l'IA
            </div>

            <h1>
              Vos relations presse, <span className="accent">simplifi\u00e9es.</span>
            </h1>

            <p className="lp-hero-subtitle">
              Le CRM tout-en-un con\u00e7u pour les professionnels de la musique.
              G\u00e9rez vos contacts, lancez vos campagnes et mesurez vos retomb\u00e9es
              depuis une seule plateforme.
            </p>

            <div className="lp-hero-ctas">
              <button className="lp-btn-primary" onClick={goRegister}>
                Demander une invitation <ArrowRight size={18} />
              </button>
              <button
                className="lp-btn-secondary"
                onClick={() => scrollTo("how")}
              >
                <Play size={18} /> Voir comment \u00e7a marche
              </button>
            </div>

            <div className="lp-hero-trust">
              <span className="lp-hero-trust-check">
                <CheckCircle size={14} /> Acc\u00e8s sur invitation
              </span>
              <span className="lp-hero-trust-check">
                <CheckCircle size={14} /> Places limit\u00e9es
              </span>
              <span className="lp-hero-trust-check">
                <CheckCircle size={14} /> RGPD compliant
              </span>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-hero-mockup">
              <div
                className="lp-hero-mockup-img"
                style={{
                  height: 340,
                  background:
                    "linear-gradient(135deg, #f0fdf8 0%, #ecfdf5 50%, #d1fae5 100%)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <PieChart size={48} color="#0ED894" strokeWidth={1.5} />
                <span
                  style={{
                    color: "#374151",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Dashboard PressPilot
                </span>
              </div>
            </div>

            <div className="lp-hero-float-card top-right">
              <div className="lp-hero-float-icon green">
                <TrendingUp size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0ED894" }}>+47%</div>
                <div
                  style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}
                >
                  Taux d'ouverture
                </div>
              </div>
            </div>

            <div className="lp-hero-float-card bottom-left">
              <div className="lp-hero-float-icon blue">
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1f2937" }}>
                  1 247 emails
                </div>
                <div
                  style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}
                >
                  Envoy\u00e9s ce mois
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-item lp-reveal">
                <div className="lp-stat-number">
                  {s.value}
                  {s.accent && <span className="accent">{s.accent}</span>}
                </div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PAIN POINTS ===================== */}
      <section className="lp-pain">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-section-tag">Le probl\u00e8me</span>
            <h2>On conna\u00eet vos gal\u00e8res</h2>
            <p>
              La promotion musicale n'a pas \u00e0 \u00eatre un parcours du combattant.
              Voici ce qu'on r\u00e9sout.
            </p>
          </div>

          <div className="lp-pain-grid">
            {PAIN_POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className={`lp-pain-card lp-reveal lp-reveal-delay-${i + 1}`}
                >
                  <div className={`lp-pain-icon ${p.iconClass}`}>
                    <Icon size={24} />
                  </div>
                  <h3>{p.title}</h3>
                  <p className="lp-pain-problem">{p.problem}</p>
                  <div className="lp-pain-solution">
                    <CheckCircle size={18} />
                    <span>{p.solution}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="lp-features" id="features">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-section-tag">Fonctionnalit\u00e9s</span>
            <h2>Tout ce qu'il vous faut, rien de superflu</h2>
            <p>
              Chaque outil a \u00e9t\u00e9 con\u00e7u pour r\u00e9pondre aux besoins r\u00e9els des
              professionnels RP musicaux.
            </p>
          </div>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className={`lp-feature-card lp-reveal lp-reveal-delay-${
                    (i % 3) + 1
                  }`}
                >
                  <div className="lp-feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="lp-how" id="how">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-section-tag">Comment \u00e7a marche</span>
            <h2>Op\u00e9rationnel en 4 \u00e9tapes</h2>
            <p>
              De l'inscription \u00e0 votre premi\u00e8re campagne, tout est fait pour que
              vous alliez vite.
            </p>
          </div>

          <div className="lp-how-steps">
            {HOW_STEPS.map((s, i) => (
              <div
                key={i}
                className={`lp-how-step lp-reveal lp-reveal-delay-${i + 1}`}
              >
                <div className="lp-how-number">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="lp-testimonials" id="testimonials">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-section-tag">T\u00e9moignages</span>
            <h2>Ils utilisent PressPilot au quotidien</h2>
          </div>

          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`lp-testimonial-card lp-reveal lp-reveal-delay-${
                  i + 1
                }`}
              >
                <div className="lp-testimonial-stars">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} />
                  ))}
                </div>
                <p className="lp-testimonial-text">\u00ab {t.text} \u00bb</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.initials}</div>
                  <div className="lp-testimonial-info">
                    <h4>{t.name}</h4>
                    <p>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-section-tag">Tarifs</span>
            <h2>Simple, transparent, sans surprise</h2>
            <p>
              Choisissez le plan qui correspond \u00e0 votre activit\u00e9. Changez ou
              annulez \u00e0 tout moment.
            </p>
          </div>

          <div className="lp-pricing-toggle lp-reveal">
            <span className={!annualBilling ? "active" : ""}>Mensuel</span>
            <button
              className={`lp-toggle-switch${annualBilling ? " active" : ""}`}
              onClick={() => setAnnualBilling((v) => !v)}
              aria-label="Toggle annuel"
            />
            <span className={annualBilling ? "active" : ""}>Annuel</span>
            {annualBilling && (
              <span className="lp-pricing-save">-17% \u2014 2 mois offerts</span>
            )}
          </div>

          <div className="lp-pricing-grid">
            {PRICING_PLANS.map((plan, i) => (
              <div
                key={i}
                className={`lp-pricing-card lp-reveal lp-reveal-delay-${
                  i + 1
                }${plan.popular ? " popular" : ""}`}
              >
                {plan.popular && (
                  <span className="lp-pricing-popular-badge">
                    Le plus populaire
                  </span>
                )}
                <h3>{plan.name}</h3>
                <p className="lp-pricing-desc">{plan.desc}</p>
                <div className="lp-pricing-price">
                  <span className="lp-pricing-amount">
                    <span className="lp-pricing-currency">&euro;</span>
                    {annualBilling ? plan.annual : plan.monthly}
                  </span>
                  <span className="lp-pricing-period"> /mois</span>
                </div>
                <ul className="lp-pricing-features">
                  {plan.features.map((f, j) => (
                    <li key={j}>
                      <CheckCircle size={18} /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`lp-pricing-cta ${plan.ctaClass}`}
                  onClick={goRegister}
                >
                  Demander un acc\u00e8s
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="lp-faq" id="faq">
        <div className="lp-container">
          <div className="lp-section-header lp-reveal">
            <span className="lp-section-tag">FAQ</span>
            <h2>Questions fr\u00e9quentes</h2>
          </div>

          <div className="lp-faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`lp-faq-item${openFaq === i ? " open" : ""}`}
              >
                <button
                  className="lp-faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <ChevronDown size={20} />
                </button>
                <div className="lp-faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="lp-final-cta">
        <div className="lp-container">
          <div className="lp-final-cta-content lp-reveal">
            <h2>
              Pr\u00eat \u00e0 transformer vos relations presse ?
            </h2>
            <p>
              Rejoignez les professionnels qui ont choisi PressPilot by BandStream pour
              simplifier leur quotidien et maximiser leurs retomb\u00e9es.
            </p>
            <button className="lp-btn-primary" onClick={goRegister}>
              Demander une invitation <ArrowRight size={18} />
            </button>

            <div className="lp-final-trust">
              <span>
                <Shield size={14} /> RGPD compliant
              </span>
              <span>
                <Clock size={14} /> Setup en 5 min
              </span>
              <span>
                <Zap size={14} /> Acc\u00e8s sur invitation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <img
                src={logo}
                alt="PressPilot by BandStream"
                className="lp-footer-logo"
              />
              <span className="lp-footer-brand-name">
                PressPilot <span className="lp-footer-brand-sub">by BandStream</span>
              </span>
              <p>
                Le CRM relations presse con\u00e7u pour les professionnels de la
                musique. Simplifiez, automatisez, mesurez.
              </p>
            </div>

            <div>
              <h4>Produit</h4>
              <ul className="lp-footer-links">
                <li>
                  <a onClick={() => scrollTo("features")} style={{ cursor: "pointer" }}>
                    Fonctionnalit\u00e9s
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollTo("pricing")} style={{ cursor: "pointer" }}>
                    Tarifs
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollTo("testimonials")} style={{ cursor: "pointer" }}>
                    T\u00e9moignages
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollTo("faq")} style={{ cursor: "pointer" }}>
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4>Ressources</h4>
              <ul className="lp-footer-links">
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Guide de d\u00e9marrage
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    API Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4>L\u00e9gal</h4>
              <ul className="lp-footer-links">
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Politique de confidentialit\u00e9
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Mentions l\u00e9gales
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>&copy; {new Date().getFullYear()} PressPilot by BandStream. Tous droits r\u00e9serv\u00e9s.</span>
            <span>Fait avec passion pour l'industrie musicale</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
