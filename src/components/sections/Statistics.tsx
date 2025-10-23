import { AnimatedCounter } from "../shared/AnimatedCounter";
import { ScrollReveal } from "../shared/ScrollReveal";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";



const stats = [
  { label: "Active Learners", value: "50,000+" },
  { label: "AI Lessons Completed", value: "120,000+" },
  { label: "Courses Offered", value: "200+" },
  { label: "Pass Rate", value: "97%" },
];

const Statistics = () => {
  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 sm:grid-cols-2 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <h3 className="text-3xl font-bold mb-2">{s.value}</h3>
            <p className="text-sm">{s.label}</p>
          </div>
        ))}
      </div>
      <ScrollReveal>
  <Card>
    <h3 className="text-xl font-semibold mb-2">
      <Badge label="New" color="green" /> AI-Powered Learning
    </h3>
    <p className="text-gray-600">Get smarter with adaptive lessons.</p>
  </Card>
</ScrollReveal>

<AnimatedCounter target={50000} suffix="+" />

    </section>
  );
};

export default Statistics;

