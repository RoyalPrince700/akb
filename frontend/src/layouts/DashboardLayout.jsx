import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="relative mb-12 overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] sm:p-9">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-br from-blue-100/60 via-white to-white" />
          <div className="relative">
            <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
              Knowledge Hub
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
              {title}
            </h1>
          </div>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
