import { Link } from "react-router-dom";

const marqueePrimary = [
  {
    title: "Fresh Nutrition",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Healthy Lifestyle",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Doctor Guidance",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Smart Meal Plans",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  },
];

const marqueeSecondary = [
  {
    title: "Balanced Diet",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Goal Tracking",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Wellness Support",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Healthy Choices",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
  },
];

const features = [
  "AI-powered diet planning",
  "Meal and recipe recommendations",
  "Weight, BMI, BMR, and TDEE tracking",
  "Doctor review and notes workflow",
  "Premium subscription support",
  "Personalized wellness dashboard",
];

const steps = [
  {
    title: "Create your account",
    desc: "Join NutriCare and begin your personalized wellness journey in a few minutes.",
  },
  {
    title: "Add health details",
    desc: "Enter your profile, goals, and body metrics so the system understands your needs.",
  },
  {
    title: "Get your plan",
    desc: "Receive meal ideas, diet suggestions, and a structured plan built around your goal.",
  },
  {
    title: "Track and improve",
    desc: "Follow progress daily, refine habits, and stay more consistent over time.",
  },
];

const personas = [
  "Weight loss users",
  "Weight gain users",
  "Busy professionals",
  "Students building better routines",
  "Fitness beginners",
  "Users who want doctor-backed guidance",
];

const faqs = [
  {
    q: "Is NutriCare only for fitness users?",
    a: "No. NutriCare is designed for anyone who wants structured diet planning, better meal choices, and progress visibility.",
  },
  {
    q: "Can users track health progress?",
    a: "Yes. Users can track body metrics, meal progress, and health-related trends in one place.",
  },
  {
    q: "Do doctors and admins have separate logins?",
    a: "Yes. User, doctor, and admin access are separated so each role gets its own workflow and tools.",
  },
  {
    q: "Does NutriCare support premium features?",
    a: "Yes. Premium subscriptions unlock more guided workflows and payment-enabled features.",
  },
];

function SectionHeading({ badge, title, desc, light = false }) {
  return (
    <div className="max-w-3xl">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
          light
            ? "border border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
            : "border border-blue-200 bg-blue-50 text-blue-700"
        }`}
      >
        {badge}
      </div>
      <h2
        className={`mt-4 text-3xl font-bold tracking-tight md:text-4xl ${
          light ? "text-white" : "text-[#0f172a]"
        }`}
      >
        {title}
      </h2>
      <p className={`mt-3 text-base leading-7 ${light ? "text-slate-300" : "text-[#475569]"}`}>
        {desc}
      </p>
    </div>
  );
}

function MarqueeRow({ items, reverse = false }) {
  const row = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <div className={`marquee-track ${reverse ? "marquee-reverse" : ""}`}>
        {row.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="group relative h-44 w-[280px] shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.65)]"
          >
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-lg font-semibold text-white">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[linear-gradient(180deg,#071229_0%,#0b1f4f_28%,#102a6d_55%,#f8fbff_55%,#ffffff_100%)] text-white">
      <style>{`
        .marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: nutriCareMarquee 32s linear infinite;
        }
        .marquee-reverse {
          animation-direction: reverse;
        }
        @keyframes nutriCareMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.42))]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.96fr_1.04fr]">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur">
                Personalized diet, wellness, and expert care
              </div>
              <h1 className="mt-7 text-6xl font-black tracking-[-0.06em] text-white md:text-8xl">
                NutriCare
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
                A powerful health platform that helps users track nutrition,
                discover healthier meals, monitor body progress, and connect
                diet planning with doctor-guided support.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_-18px_rgba(34,211,238,0.8)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_-16px_rgba(59,130,246,0.8)]"
                >
                  Get Started Free
                </Link>
                <a
                  href="#discover"
                  className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
                >
                  Explore NutriCare
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["1800", "Daily nutrition targets"],
                  ["24/7", "Progress visibility"],
                  ["3 roles", "User, doctor, admin flows"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur"
                  >
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="mt-2 text-sm text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <MarqueeRow items={marqueePrimary} />
              <MarqueeRow items={marqueeSecondary} reverse />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    Today’s focus
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    Eat smarter, track better
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    NutriCare turns scattered health habits into one clean,
                    goal-based routine.
                  </p>
                </div>
                <div className="rounded-[30px] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 p-6 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    Why users love it
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-slate-200">
                    {features.slice(0, 3).map((item) => (
                      <div key={item} className="flex gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="discover" className="relative z-10 mx-auto -mt-2 max-w-7xl px-6">
        <div className="grid gap-4 rounded-[34px] border border-white/10 bg-slate-950/35 p-5 shadow-[0_28px_90px_-45px_rgba(2,6,23,0.95)] backdrop-blur-xl md:grid-cols-4">
          {[
            "Personalized meal planning",
            "Food and recipe suggestions",
            "Healthy lifestyle progress tracking",
            "Doctor-backed care workflows",
          ].map((point) => (
            <div
              key={point}
              className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100"
            >
              {point}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 text-[#0f172a]">
        <SectionHeading
          badge="Features"
          title="A public homepage that instantly explains the product."
          desc="NutriCare combines diet planning, recipe ideas, metric tracking, and expert workflows into one attractive and practical platform."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item, index) => (
            <div
              key={item}
              className="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(37,99,235,0.25)] transition hover:-translate-y-1 hover:shadow-[0_34px_90px_-42px_rgba(37,99,235,0.35)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-blue-700">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#0f172a]">{item}</h3>
              <p className="mt-3 text-sm leading-7 text-[#475569]">
                Designed to make the product feel useful from the very first visit.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            badge="How It Works"
            title="A simple wellness flow users understand in seconds."
            desc="The page should clearly show how NutriCare moves someone from sign-up to structured health progress."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.18)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Step {index + 1}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-[#0f172a]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#475569]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 text-[#0f172a]">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            badge="Who It Is For"
            title="Built for people who want guidance, not guesswork."
            desc="This public homepage should help different types of visitors instantly see themselves inside the product."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {personas.map((item) => (
              <div
                key={item}
                className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm"
              >
                <p className="text-base font-semibold text-[#0f172a]">{item}</p>
                <p className="mt-2 text-sm text-[#475569]">
                  NutriCare helps turn goals into a clear, trackable routine.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="bg-[linear-gradient(180deg,#081329_0%,#0f2457_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            badge="Access Portals"
            title="Separate role-based access, one unified platform."
            desc="User, doctor, and admin logins stay separate, but the product experience still feels connected and professional."
            light
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-[30px] border border-white/10 bg-white/8 p-7 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                User portal
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white">Start your personal journey</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Register, log in, track progress, manage diet plans, and unlock premium wellness support.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-1"
                >
                  User Register
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  User Login
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/8 p-7 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Doctor portal
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white">Manage patients and notes</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Doctors get their own workspace for approvals, patient tracking, and professional recommendations.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/doctor/register"
                  className="rounded-full bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Doctor Signup
                </Link>
                <Link
                  to="/doctor/login"
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  Doctor Login
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/8 p-7 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Admin portal
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white">Control approvals and payouts</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Admin handles doctor approvals, wallet flows, payouts, and the overall system control panel.
              </p>
              <div className="mt-6">
                <Link
                  to="/admin/login"
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-6 py-20 text-[#0f172a]">
        <SectionHeading
          badge="FAQ"
          title="Questions visitors usually ask before trying NutriCare."
          desc="A strong landing page answers doubts early and guides people smoothly to the right login or registration path."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-[30px] border border-blue-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[#0f172a]">{item.q}</h3>
              <p className="mt-3 text-sm leading-7 text-[#475569]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Make healthy decisions feel beautiful, simple, and motivating.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                NutriCare brings together nutrition guidance, healthy lifestyle tracking, food inspiration, and doctor-connected care in one memorable experience.
              </p>
            </div>
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-[0_18px_45px_-18px_rgba(34,211,238,0.8)] transition hover:-translate-y-1"
            >
              Start With NutriCare
            </Link>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
            © {new Date().getFullYear()} NutriCare. Personalized wellness and diet management.
          </div>
        </div>
      </section>
    </div>
  );
}
