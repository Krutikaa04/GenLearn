"use client";

import { motion } from "framer-motion";
import Button from "../ui/Button";

export default function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-4xl text-6xl font-bold leading-tight"
      >
        AI-Powered Adaptive Learning Platform
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-2xl text-lg text-gray-400"
      >
        Personalized AI-generated lessons, quizzes,
        and real-time adaptive learning experiences.
      </motion.p>

      <div className="mt-10">
        <Button text="Get Started" />
      </div>
    </section>
  );
}