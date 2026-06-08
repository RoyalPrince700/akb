import Footer from "../components/Footer";
import LandingPage from "../components/landing/LandingPage";
import Navbar from "../components/Navbar";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <LandingPage />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
