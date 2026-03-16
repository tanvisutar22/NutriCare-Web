// import { Link } from "react-router-dom";

// export default function Home() {
//   return (
//     <div className="px-6 py-16 text-center">
//       <h2 className="text-4xl font-bold text-teal-600 mb-4">
//         AI-powered personalized nutrition, supervised by doctors.
//       </h2>
//       <p className="text-gray-600 mb-10">Your wellness journey starts here.</p>

//       {/* <div className="grid md:grid-cols-3 gap-6 mb-12">
//         {["Personalized Diets", "Doctor Review", "Adaptive Plans"].map((f) => (
//           <div key={f} className="bg-white p-6 rounded-xl shadow">
//             <h3 className="font-semibold text-lg">{f}</h3>
//           </div>
//         ))}
//       </div> */}

//       <div className="space-x-4">
//         <Link
//           to="/register"
//           className="bg-teal-600 text-white px-6 py-3 rounded"
//         >
//           Register
//         </Link>
//         <Link
//           to="/login"
//           className="border border-teal-600 text-teal-600 px-6 py-3 rounded"
//         >
//           Login
//         </Link>
//       </div>
//     </div>
//   );
// }

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-teal-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* HERO */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              AI-wellness and,
              <span className="text-teal-600"> NutriCare</span>.
            </h1>
            <p className="text-slate-600 mt-4 text-lg">
              AI wellness and diet management.
            </p>

            {/* TRUST BADGES */}
            <div className="flex flex-wrap gap-2 mt-6">
              {["Privacy-first", "Evidence-based", "Track & adapt"].map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-gray-200 text-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                to="/register"
                className="bg-teal-600 text-white px-6 py-3 rounded-xl shadow-sm hover:bg-teal-700 transition font-medium text-center"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="border border-teal-600 text-teal-700 px-6 py-3 rounded-xl hover:bg-teal-50 transition font-medium text-center"
              >
                Login
              </Link>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6">
            <h3 className="font-semibold text-slate-900">What you get</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
                Personalized calorie & macro targets
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
                Weight tracking with charts
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
                Goal-based planning (fat loss / gain / maintenance)
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
                Explainable suggestions (why this food)
              </li>
            </ul>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Personalized Diets",
              desc: "Calorie and macro targets tailored to your profile and goal.",
            },
            {
              title: "Tracking & Insights",
              desc: "Log metrics and visualize progress over time.",
            },
            {
              title: "Explainable Recommendations",
              desc: "Clear logic behind meals to build trust and understanding.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-slate-600 text-sm mt-2">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-14 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-900">How it works</h3>
          <div className="grid md:grid-cols-4 gap-4 mt-4 text-sm">
            {[
              "Create profile",
              "Add metrics",
              "Set a goal",
              "Track progress",
            ].map((step, i) => (
              <div
                key={step}
                className="rounded-xl border border-gray-100 p-4 bg-gray-50"
              >
                <p className="text-xs font-semibold text-teal-700">
                  Step {i + 1}
                </p>
                <p className="mt-1 font-medium text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-14 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} NutriCare AI • Wellness & Diet Management
        </div>
      </div>
    </div>
  );
}
