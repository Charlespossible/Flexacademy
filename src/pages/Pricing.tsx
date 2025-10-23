import React from "react";
import { Check } from "lucide-react";

const Pricing: React.FC = () => {
  const plans = [
    {
      title: "Free Plan",
      subtitle: "Perfect for getting started",
      price: "₦0",
      period: "forever",
      features: [
        "Access to limited lessons",
        "Basic quizzes and assessments",
        "7-day trial for premium features",
        "Community forum access"
      ],
      cta: "Get Started",
      popular: false,
      gradient: "from-gray-50 to-gray-100"
    },
    {
      title: "Premium Plan",
      subtitle: "Everything you need to excel",
      price: "₦2,000",
      period: "per month",
      features: [
        "Full lesson library access",
        "AI homework assistant 24/7",
        "Mock exams & detailed analytics",
        "Offline downloads",
        "Priority support",
        "Personalized learning path"
      ],
      cta: "Upgrade Now",
      popular: true,
      gradient: "from-indigo-50 to-purple-50"
    },
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Quality Education for Every Budget
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works best for you and start your learning journey today
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 lg:p-10 rounded-2xl border ${
                plan.popular 
                  ? 'border-indigo-200 shadow-xl bg-gradient-to-br ' + plan.gradient 
                  : 'border-gray-200 shadow-md hover:shadow-lg bg-white'
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                <p className="text-gray-600 text-sm">{plan.subtitle}</p>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl lg:text-5xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600 ml-2">/ {plan.period}</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-sm lg:text-base">{f}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className={`w-full font-semibold px-6 py-4 rounded-xl transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            All plans include secure payments and can be cancelled anytime. No hidden fees.
          </p>
        </div>
      </div>
    </section>
  );
};


export default Pricing;
