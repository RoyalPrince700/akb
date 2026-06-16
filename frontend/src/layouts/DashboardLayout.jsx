import Navbar from "../components/Navbar";

const DashboardLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
