import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-800 px-8 py-5">
      <h1 className="text-2xl font-bold text-blue-500">
        GenLearn
      </h1>

      <div className="flex gap-6">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/lesson">Lessons</Link>
        <Link href="/quiz">Quiz</Link>
      </div>
    </nav>
  );
}