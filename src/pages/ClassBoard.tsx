import React from "react";
import { MonitorSmartphone, Users, Check } from "lucide-react";



const Classboard: React.FC = () => {
  const modes = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Teacher Mode",
      desc: "Create classes, assign lessons, monitor progress in real time.",
      features: ["Class Management", "Performance Analytics", "Assignment Tracking"],
      gradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      icon: <MonitorSmartphone className="w-8 h-8" />,
      title: "Student Mode",
      desc: "Learn interactively and compete with classmates for badges.",
      features: ["Interactive Learning", "Gamified Experience", "Progress Tracking"],
      gradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <MonitorSmartphone className="w-10 h-10 lg:w-12 lg:h-12 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            FlexAcademy Classboard
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our innovative digital Classboard helps schools manage learning sessions, track performance, and connect with FlexAcademy's AI-powered analytics.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          {modes.map((mode, idx) => (
            <div
              key={idx}
              className={`p-8 lg:p-10 rounded-2xl bg-gradient-to-br ${mode.gradient} border border-gray-200 hover:shadow-xl transition-all duration-300`}
            >
              <div className={`inline-flex p-4 ${mode.iconBg} rounded-xl mb-6`}>
                <div className={mode.iconColor}>{mode.icon}</div>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">{mode.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{mode.desc}</p>
              <ul className="space-y-2">
                {mode.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 text-sm lg:text-base">
                    <Check className="text-green-500 flex-shrink-0" size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Classboard;
