import React from "react";

const categories = {
  Primary: ["Mathematics", "English", "Basic Science", "Social Studies", "Verbal Reasoning"],
  JSS: ["Mathematics", "English", "Basic Technology", "Business Studies", "Computer Science"],
  SSS: ["Physics", "Chemistry", "Biology", "Economics", "Literature-in-English"],
};

const Subjects: React.FC = () => (
  <section className="max-w-6xl mx-auto px-6 py-24">
    <h2 className="text-4xl font-bold text-center mb-10 text-gray-900">
      Comprehensive Coverage for Every Student
    </h2>
    <p className="text-center text-gray-600 mb-12">
      Aligned with Nigerian curricula — from Primary 1 to Senior Secondary 3.
    </p>

    {Object.entries(categories).map(([level, subjects]) => (
      <div key={level} className="mb-10">
        <h3 className="text-2xl font-semibold mb-4 text-indigo-600">{level} School</h3>
        <div className="flex flex-wrap gap-3">
          {subjects.map((s, i) => (
            <span
              key={i}
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-200 transition"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    ))}
  </section>
);

export default Subjects;
