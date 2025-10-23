import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// Lazy loading pages for performance
const Home = lazy(() => import("../pages/Home"));
const Features = lazy(() => import("../pages/Features"));
const Subjects = lazy(() => import("../pages/Subjects"));
const Pricing = lazy(() => import("../pages/Pricing"));
const About = lazy(() => import("../pages/About"));
const Classboard = lazy(() => import("../pages/ClassBoard"));
const Login = lazy(() => import("../pages/Login"));

const AppRouter: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">
          <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/classboard" element={<Classboard />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default AppRouter;
