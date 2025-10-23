
import React from "react";
import {  Brain, LineChart, FileText, Trophy, Sparkles } from "lucide-react";

const Features: React.FC = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Homework Helper",
      desc: "Instant, step-by-step solutions explained in simple terms to help you truly understand.",
      gradient: "from-blue-500/10 to-indigo-500/10",
      iconColor: "text-blue-600"
    },
    {
      icon: <LineChart className="w-8 h-8" />,
      title: "Personalized Learning Paths",
      desc: "Adaptive recommendations based on your strengths, weaknesses, and progress.",
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Smart Mock Exams",
      desc: "AI-generated practice tests that adjust difficulty as you improve.",
      gradient: "from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Performance Prediction",
      desc: "Predict exam readiness and receive focused revision topics.",
      gradient: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600"
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
      <div className="text-center mb-12 lg:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Advanced AI</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          AI That Understands How You Learn
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience personalized education that adapts to your unique learning style
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {features.map((f, i) => (
          <div
            key={i}
            className="group p-6 lg:p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-100 hover:-translate-y-1"
          >
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <div className={f.iconColor}>{f.icon}</div>
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm lg:text-base leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
export default Features;    