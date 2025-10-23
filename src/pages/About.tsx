import React from "react";
import {  Target , Award} from "lucide-react";


const About: React.FC = () => {
  const stats = [
    { value: "100,000+", label: "Active Students" },
    { value: "500+", label: "Schools" },
    { value: "95%", label: "Success Rate" },
    { value: "50,000+", label: "Lessons Completed" }
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            About FlexAcademy
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Nigeria's next-generation AI-powered education platform designed to personalize learning for every student. Our mission is to make quality education accessible, affordable, and engaging for learners across all levels.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 lg:mb-16">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-2">{stat.value}</div>
              <div className="text-sm lg:text-base text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          <div className="p-8 lg:p-10 bg-white shadow-md rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To be Africa's most trusted platform for adaptive, AI-driven learning and academic excellence.
            </p>
          </div>
          <div className="p-8 lg:p-10 bg-white shadow-md rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To empower students and teachers with smart tools that make learning simple, interactive, and measurable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;