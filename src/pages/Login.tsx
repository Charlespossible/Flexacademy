import React from "react";

const Login: React.FC = () => (
  <section className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-6 py-16">
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md">
      <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">Login to FlexAcademy</h2>
      <form className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Sign In
        </button>
      </form>
      <p className="text-center text-gray-600 text-sm mt-4">
        Don't have an account?{" "}
        <a href="#" className="text-indigo-600 hover:underline font-medium">
          Sign up
        </a>
      </p>
    </div>
  </section>
);

export default Login;
