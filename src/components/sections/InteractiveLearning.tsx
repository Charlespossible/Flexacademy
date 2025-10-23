import { Button } from "../ui/Button";

const InteractiveLearning = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 items-center gap-12">
        <img
          src="https://images.pexels.com/photos/5905866/pexels-photo-5905866.jpeg?auto=compress&cs=tinysrgb&w=800"
          alt="Interactive dashboard"
          className="rounded-2xl shadow-lg"
        />
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Learn by Doing — Interactive Lessons
          </h2>
          <p className="text-gray-600 mb-6">
            Practice with live exercises, code simulations, and step-by-step
            guidance. Every lesson includes visual aids, quizzes, and instant AI feedback.
          </p>
          <Button label="Try an Interactive Demo" onClick={() => {}} />
        </div>
      </div>
    </section>
  );
};

export default InteractiveLearning;

