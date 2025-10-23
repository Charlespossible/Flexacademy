import React, { useState, useEffect } from "react";
import { Menu, X, BookOpen, GraduationCap, BarChart3, CreditCard } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { 
    to: "/features", 
    label: "Features",
    icon: <BookOpen className="w-4 h-4" />,
    hasDropdown: false
  },
  { 
    to: "/subjects", 
    label: "Subjects",
    icon: <GraduationCap className="w-4 h-4" />,
    hasDropdown: false
  },
  { 
    to: "/classboard", 
    label: "Classboard",
    icon: <BarChart3 className="w-4 h-4" />,
    hasDropdown: false
  },
  { 
    to: "/pricing", 
    label: "Pricing",
    icon: <CreditCard className="w-4 h-4" />,
    hasDropdown: false
  },
];

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("/");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const handleLinkClick = (to: string) => {
    setActiveLink(to);
    setMenuOpen(false);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100" 
            : "bg-white/80 backdrop-blur-md shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-20">
          {/* Logo */}
          <a 
            href="/" 
            className="flex items-center gap-2 group"
            onClick={() => handleLinkClick("/")}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-bold">
              <span className="text-gray-900">Flex</span>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Academy</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                onClick={() => handleLinkClick(link.to)}
                className={`relative px-3 lg:px-4 py-2 font-medium text-sm lg:text-base rounded-lg transition-all duration-200 ${
                  activeLink === link.to
                    ? "text-indigo-600"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {link.label}
                </span>
                {activeLink === link.to && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-full"></span>
                )}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <a
              href="/login"
              className="text-gray-700 font-semibold text-sm lg:text-base hover:text-indigo-600 transition-colors duration-200"
            >
              Login
            </a>
            <a
              href="/signup"
              className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-5 lg:px-6 py-2 lg:py-2.5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 text-sm lg:text-base">Get Started Free</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Spacer to prevent content jump */}
      <div className="h-16 lg:h-20"></div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-full sm:w-80 bg-white z-40 md:hidden transform transition-transform duration-300 ease-out shadow-2xl ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col h-full overflow-y-auto">
          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                onClick={() => handleLinkClick(link.to)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeLink === link.to
                    ? "text-indigo-600 bg-indigo-50 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
          </div>

          {/* Mobile CTA Section */}
          <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block w-full text-center border-2 border-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
            >
              Login
            </a>
            <a
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Get Started Free
            </a>
            <p className="text-xs text-gray-500 text-center pt-2">
              No credit card required • 7-day free trial
            </p>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;