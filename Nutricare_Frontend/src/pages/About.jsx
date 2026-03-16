export default function About() {
  return (
    <div className="px-6 py-12 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-teal-600 mb-6">Our Mission</h2>
      <p className="mb-8">
        To combine AI intelligence with medical expertise for better nutrition.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          "Register",
          "AI Plan",
          "Doctor Review",
          "Execution",
          "Tracking",
          "Adjustment",
        ].map((step) => (
          <div key={step} className="bg-white p-4 rounded shadow">
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
