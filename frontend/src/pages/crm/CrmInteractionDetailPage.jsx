import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  callerStatuses,
  contactMedia,
  crmStatuses,
  customerTypes,
  formatCrmCategory,
  formatOrganizationType,
  getCsrDisplayName,
  getOrganizationNameLabel,
  phoneLineLabels,
} from "../../constants/crm";
import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import { getCrmInteraction } from "../../services/api";
import { panelSegmentPath } from "../../utils/rolePaths";
import { capitalizeWords } from "../../utils/textFormat";

const getOptionLabel = (options, value, fallback = "—") =>
  options.find((option) => option.value === value)?.label || fallback;

const DetailField = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-sm font-semibold text-slate-950">{value || "—"}</p>
  </div>
);

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const CrmInteractionDetailPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [interaction, setInteraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ticketsPath = panelSegmentPath(user?.role, "interactions");
  const isCsrAdmin = user?.role === "csrAdmin";

  useEffect(() => {
    const loadInteraction = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getCrmInteraction(id);
        setInteraction(data.interaction || null);
      } catch (apiError) {
        setInteraction(null);
        setError(apiError.response?.data?.message || "Failed to load ticket details.");
      } finally {
        setLoading(false);
      }
    };

    loadInteraction();
  }, [id]);

  const customer = interaction?.customer || {};

  return (
    <PanelLayout title="Ticket details">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Ticket overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              {isCsrAdmin
                ? "Read-only view of a ticket logged by the CSR team."
                : "Review the details of this ticket."}
            </p>
          </div>
          <Link
            to={ticketsPath}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Back to ticket log
          </Link>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-600">Loading ticket...</p>
        ) : !interaction ? (
          <p className="py-10 text-center text-sm text-slate-600">Ticket not found.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <DetailField label="Direction" value={capitalizeWords(interaction.direction)} />
            <DetailField label="Category" value={formatCrmCategory(interaction.category)} />
            <DetailField
              label="Customer type"
              value={formatOrganizationType(customer.organizationType || "school")}
            />
            <DetailField
              label={getOrganizationNameLabel(customer.organizationType || "school")}
              value={capitalizeWords(customer.schoolName)}
            />
            <DetailField label="Phone number" value={customer.phoneNumber} />
            <DetailField label="State" value={customer.state} />
            <DetailField label="Date of contact" value={formatDateTime(interaction.dateOfContact)} />
            <DetailField
              label="Medium"
              value={getOptionLabel(contactMedia, interaction.medium)}
            />
            <DetailField
              label="New or existing customer"
              value={getOptionLabel(customerTypes, interaction.customerType)}
            />
            <DetailField
              label="Caller status"
              value={getOptionLabel(callerStatuses, interaction.callerStatus)}
            />
            <DetailField
              label="Status"
              value={getOptionLabel(crmStatuses, interaction.status, interaction.status)}
            />
            <DetailField
              label="CSR"
              value={getCsrDisplayName(interaction.owner, "Unknown CSR")}
            />
            <DetailField
              label="Sales rep"
              value={capitalizeWords(interaction.salesRep?.name) || "Unassigned"}
            />
            <DetailField
              label="Phone line label"
              value={getOptionLabel(phoneLineLabels, interaction.phoneLineLabel, "—")}
            />
            <DetailField label="CSR phone number" value={interaction.csrPhoneNumber} />
            <DetailField label="Call reference" value={interaction.callReference} />
            {interaction.category === "complaint" && (
              <DetailField
                label="Complaint nature"
                value={capitalizeWords(interaction.complaintNature)}
                className="md:col-span-2"
              />
            )}
            {interaction.category === "request" && (
              <DetailField label="Request quantity" value={interaction.requestQuantity} />
            )}
            <DetailField
              label="Book titles"
              value={capitalizeWords(interaction.bookTitles)}
              className="md:col-span-2"
            />
            <DetailField label="Address" value={customer.address} className="md:col-span-2" />
            <DetailField label="Remark" value={interaction.remark} className="md:col-span-2" />
          </div>
        )}
      </div>
    </PanelLayout>
  );
};

export default CrmInteractionDetailPage;
