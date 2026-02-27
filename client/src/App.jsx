import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import Scheduler from "./components/Scheduler";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Dashboard />
        <Scheduler />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
