import React from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import Features from "./Features";
import About from "./About";
import Classboard from "./ClassBoard";
import Pricing from "./Pricing";
import { BookOpen, Check } from "lucide-react";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6 border border-white/20">
              <BookOpen className="w-4 h-4" />
              <span>Trusted by over 100,000+ Nigerian Students</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 leading-tight">
              Love Learning with
              <span className="block mt-2 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                AI-Powered Tools?
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of Nigerian students mastering subjects from Primary 1 to SS3 — personalized learning, instant homework help, and exam preparation all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <button className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Start Learning Free
                <ArrowRight size={20} />
              </button>
              <button className="inline-flex items-center justify-center gap-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl hover:bg-white hover:text-slate-800 transition-all duration-300">
                <PlayCircle size={20} />
                Watch Demo
              </button>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="text-green-300" size={18} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-300" size={18} />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-300" size={18} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <About />
      <Features />
      <Classboard />
      <Pricing />
    </div>
  );
};

export default Home;