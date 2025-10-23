const testimonials = [
  {
    name: "Sarah O.",
    comment:
      "FlexAcademy made me love Physics again! The AI tutor explains like a real teacher.",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
  {
    name: "James A.",
    comment:
      "I passed JAMB with high scores because of FlexAcademy’s smart mock exams!",
    image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-12">What Learners Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="p-6 bg-gray-50 rounded-2xl shadow">
              <img
                src={t.image}
                alt={t.name}
                className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
              />
              <p className="text-gray-600 italic mb-3">"{t.comment}"</p>
              <h4 className="text-gray-800 font-semibold">{t.name}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

