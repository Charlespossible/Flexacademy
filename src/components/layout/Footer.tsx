import React from "react";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Phone, MapPin, ArrowRight, BookOpen, Award, Users, TrendingUp } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Subjects", href: "/subjects" },
        { label: "Classboard", href: "/classboard" },
        { label: "Pricing", href: "/pricing" },
        { label: "Mobile App", href: "/app" },
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Help Center", href: "/help" },
        { label: "FAQs", href: "/faq" },
        { label: "Study Tips", href: "/study-tips" },
        { label: "Webinars", href: "/webinars" },
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "Partners", href: "/partners" },
        { label: "Press Kit", href: "/press" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "Refund Policy", href: "/refund" },
      ]
    }
  ];

  const socialLinks = [
    { icon: <Facebook className="w-4 h-4" />, href: "#", label: "Facebook", color: "hover:bg-blue-600" },
    { icon: <Twitter className="w-4 h-4" />, href: "#", label: "Twitter", color: "hover:bg-sky-500" },
    { icon: <Instagram className="w-4 h-4" />, href: "#", label: "Instagram", color: "hover:bg-pink-600" },
    { icon: <Youtube className="w-4 h-4" />, href: "#", label: "YouTube", color: "hover:bg-red-600" },
    { icon: <Linkedin className="w-4 h-4" />, href: "#", label: "LinkedIn", color: "hover:bg-blue-700" },
  ];

  const stats = [
    { icon: <Users className="w-5 h-5" />, value: "100K+", label: "Active Students" },
    { icon: <BookOpen className="w-5 h-5" />, value: "500+", label: "Lessons" },
    { icon: <Award className="w-5 h-5" />, value: "95%", label: "Success Rate" },
    { icon: <TrendingUp className="w-5 h-5" />, value: "50K+", label: "Daily Practice" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                Stay Updated with Learning Tips
              </h3>
              <p className="text-gray-400 text-sm lg:text-base">
                Get the latest study resources, exam tips, and exclusive offers delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 lg:py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 lg:px-8 py-3 lg:py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    {stat.icon}
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <a href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold">
                <span className="text-white">Flex</span>
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Academy</span>
              </span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Empowering Nigerian students with AI-driven personalized learning, interactive quizzes, and smart exam preparation tools.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a href="mailto:hello@flexacademy.ng" className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                <Mail className="w-4 h-4" />
                <span>hello@flexacademy.ng</span>
              </a>
              <a href="tel:+2348012345678" className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span>+234 801 234 5678</span>
              </a>
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  className={`p-2.5 bg-gray-800 rounded-lg ${social.color} text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110`}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-white font-semibold text-sm lg:text-base mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200 inline-flex items-center gap-1 group"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p className="text-center sm:text-left">
              © {currentYear} FlexAcademy. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
              <a href="/privacy" className="hover:text-indigo-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/terms" className="hover:text-indigo-400 transition-colors">
                Terms of Service
              </a>
              <span className="text-gray-700">•</span>
              <a href="/cookies" className="hover:text-indigo-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;