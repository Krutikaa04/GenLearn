import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <Navbar />
      <Hero />
    </main>
  );
}