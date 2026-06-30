import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Headphones,
  MessageSquareShare,
  PhoneCall,
  Radio,
  ScrollText,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import PanelLayout from "../layouts/PanelLayout";
import { getCrmDashboardSummary } from "../services/api";
import { panelSegmentPath } from "../utils/rolePaths";

const OverviewCard = ({ label, value, description, to, icon: Icon, tone = "emerald" }) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200/80"
  >
    <div
      className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${
        tone === "blue" ? "bg-sky-300/30" : tone === "amber" ? "bg-amber-300/35" : "bg-emerald-300/35"
      }`}
    />
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <h2 className="mt-5 text-5xl font-black tracking-[-0.08em] text-slate-950">
          {value}
        </h2>
      </div>
      <span
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          tone === "blue"
            ? "bg-sky-100 text-sky-700"
            : tone === "amber"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
    </div>
    <p className="relative mt-4 text-sm leading-6 text-slate-500">{description}</p>
    <span className="relative mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 opacity-0 transition group-hover:opacity-100">
      Open view <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </span>
  </Link>
);

const CsrDashboard = () => {
  const { user } = useAuth();
  const isCsrAdmin = user?.role === "csrAdmin";
  const [summary, setSummary] = useState({
    totalContacts: 0,
    inboundCount: 0,
    outboundCount: 0,
    unresolvedCount: 0,
    pendingRequests: 0,
    surveysSent: 0,
    totalSalesRecords: 0,
    totalBooksSold: 0,
  });

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getCrmDashboardSummary();
        setSummary(data.summary || {});
      } catch {
        setSummary({
          totalContacts: 0,
          inboundCount: 0,
          outboundCount: 0,
          unresolvedCount: 0,
          pendingRequests: 0,
          surveysSent: 0,
          totalSalesRecords: 0,
          totalBooksSold: 0,
        });
      }
    };

    loadSummary();
  }, []);

  const ticketsPath = panelSegmentPath(user?.role, "interactions");
  const surveysPath = panelSegmentPath(user?.role, "surveys");
  const salesRecordsPath = panelSegmentPath(user?.role, "sales-records");
  const reportsPath = panelSegmentPath(user?.role, "reports");
  const salesRepsPath = panelSegmentPath(user?.role, "sales-reps");
  const staffPath = panelSegmentPath(user?.role, "staff");

  return (
    <PanelLayout title={isCsrAdmin ? "CSR Admin Dashboard" : "CSR Dashboard"}>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <OverviewCard
          label="Total contacts"
          value={summary.totalContacts ?? 0}
          description="All logged inbound and outbound tickets"
          to={ticketsPath}
          icon={Headphones}
          tone="blue"
        />
        <OverviewCard
          label="Unresolved cases"
          value={summary.unresolvedCount ?? 0}
          description="Tickets that still need follow-up"
          to={ticketsPath}
          icon={Radio}
          tone="amber"
        />
        <OverviewCard
          label="Requests pending"
          value={summary.pendingRequests ?? 0}
          description="Unresolved request tickets"
          to={ticketsPath}
          icon={CheckCircle2}
        />
        <OverviewCard
          label="Inbound calls"
          value={summary.inboundCount ?? 0}
          description="Tickets initiated by customers"
          to={ticketsPath}
          icon={PhoneCall}
          tone="blue"
        />
        <OverviewCard
          label="Outbound calls"
          value={summary.outboundCount ?? 0}
          description="Tickets created from outbound calls"
          to={ticketsPath}
          icon={ArrowUpRight}
        />
        <OverviewCard
          label="Surveys sent"
          value={summary.surveysSent ?? 0}
          description="Manual survey links created after calls"
          to={surveysPath}
          icon={MessageSquareShare}
        />
        <OverviewCard
          label="Sales records"
          value={summary.totalSalesRecords ?? 0}
          description={`Books sold logged so far: ${summary.totalBooksSold ?? 0}`}
          to={salesRecordsPath}
          icon={BookOpen}
          tone="blue"
        />
        {isCsrAdmin && (
          <>
            <OverviewCard
              label="CSR team"
              value="Manage"
              description="Create, update, activate, and deactivate CSR accounts"
              to={staffPath}
              icon={Users}
              tone="blue"
            />
            <OverviewCard
              label="Sales reps"
              value="Manage"
              description="Maintain sales representatives used across CRM tickets"
              to={salesRepsPath}
              icon={Users}
            />
            <OverviewCard
              label="Reports"
              value="View"
              description="Read CRM-wide activity, survey, and ticket performance reports"
              to={reportsPath}
              icon={ScrollText}
              tone="amber"
            />
          </>
        )}
      </div>
    </PanelLayout>
  );
};

export default CsrDashboard;
