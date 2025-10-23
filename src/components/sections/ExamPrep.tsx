const ExamPrep = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 items-center gap-12">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Real Exam Simulations for WAEC, JAMB & NECO
          </h2>
          <p className="text-gray-600 mb-6">
            Prepare effectively with past questions, time-based tests, and AI-generated
            practice sessions. Your progress analytics ensure focused revision.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>✅ WAEC, NECO, JAMB simulations</li>
            <li>✅ Instant feedback and score breakdown</li>
            <li>✅ AI-suggested revision areas</li>
          </ul>
        </div>
        <img
          src="https://images.pexels.com/photos/5212337/pexels-photo-5212337.jpeg?auto=compress&cs=tinysrgb&w=800"
          alt="Exam practice student"
          className="rounded-2xl shadow-lg"
        />
      </div>
    </section>
  );
};

export default ExamPrep;

