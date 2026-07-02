import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import SurveyDispatchModal from "../../components/crm/SurveyDispatchModal";
import SchoolSearchSelect from "../../components/crm/SchoolSearchSelect";
import {
  callerStatuses,
  contactMedia,
  crmStatuses,
  customerTypes,
  formatCrmCategory,
  getOrganizationNameLabel,
  getOrganizationNamePlaceholder,
  inboundCategories,
  landlinePhoneNumber,
  nigerianStates,
  organizationTypes,
  outboundCategories,
  phoneLineLabels,
  getPhoneLineLabelsForMedium,
} from "../../constants/crm";
import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import {
  createSurveyDispatch,
  createCrmInteraction,
  getCrmInteraction,
  listSalesReps,
  lookupCrmCustomerByPhone,
  updateCrmInteraction,
} from "../../services/api";
import {
  handleSurveyDispatchShare,
  wasSurveySentByServer,
} from "../../utils/crmSurvey";
import { panelSegmentPath } from "../../utils/rolePaths";
import { capitalizeWords, CRM_CAPITALIZED_FIELDS } from "../../utils/textFormat";

const normalizePhoneNumber = (value) => value.replace(/\D/g, "");

const getDefaultDateTime = () => new Date().toISOString().slice(0, 16);

const emptyForm = {
  direction: "inbound",
  category: "enquiry",
  organizationType: "school",
  schoolName: "",
  address: "",
  state: "",
  phoneNumber: "",
  dateOfContact: getDefaultDateTime(),
  medium: "phone",
  customerType: "newCustomer",
  callerStatus: "firstCaller",
  complaintNature: "",
  requestQuantity: "",
  bookTitles: "",
  status: "resolved",
  remark: "",
  salesRep: "",
  phoneLineLabel: "",
  csrPhoneNumber: "",
};

const CrmInteractionFormPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isCsrAdmin = user?.role === "csrAdmin";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDirection = searchParams.get("direction");
  const [formData, setFormData] = useState({
    ...emptyForm,
    direction: initialDirection === "outbound" ? "outbound" : "inbound",
    category: initialDirection === "outbound" ? "enquiry" : "enquiry",
  });
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [surveySaving, setSurveySaving] = useState(false);
  const [autofillMessage, setAutofillMessage] = useState("");
  const [error, setError] = useState("");
  const [submitMode, setSubmitMode] = useState("save");
  const [createdTicket, setCreatedTicket] = useState(null);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);

  const ticketsPath = panelSegmentPath(user?.role, "interactions");
  const csrPhoneNumbers = useMemo(
    () => (Array.isArray(user?.csrPhoneNumbers) ? user.csrPhoneNumbers : []),
    [user?.csrPhoneNumbers]
  );
  const settingsPath = panelSegmentPath(user?.role, "settings");

  useEffect(() => {
    if (isCsrAdmin && isEdit && id) {
      navigate(`${ticketsPath}/${id}`, { replace: true });
    }
  }, [id, isCsrAdmin, isEdit, navigate, ticketsPath]);

  const resolveCsrPhoneForLineLabel = (lineLabel, currentPhoneNumber = "") => {
    if (lineLabel === "landline") {
      return landlinePhoneNumber;
    }

    if (lineLabel === "csrOfficialLine") {
      if (csrPhoneNumbers.length === 1) {
        return csrPhoneNumbers[0];
      }

      if (csrPhoneNumbers.length > 1) {
        return csrPhoneNumbers.includes(currentPhoneNumber)
          ? currentPhoneNumber
          : csrPhoneNumbers[0];
      }

      return "";
    }

    return "";
  };

  const categoryOptions = useMemo(
    () => (formData.direction === "outbound" ? outboundCategories : inboundCategories),
    [formData.direction]
  );

  const lineLabelOptions = useMemo(
    () => getPhoneLineLabelsForMedium(formData.medium),
    [formData.medium]
  );

  const showLineLabelFields = formData.medium === "phone" || formData.medium === "whatsapp";

  useEffect(() => {
    const loadSalesReps = async () => {
      try {
        const data = await listSalesReps({ limit: 100, isActive: true });
        setSalesReps(data.salesReps || []);
      } catch {
        setSalesReps([]);
      }
    };

    loadSalesReps();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      return undefined;
    }

    let mounted = true;

    const loadInteraction = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getCrmInteraction(id);
        const interaction = data.interaction;
        if (!mounted || !interaction) {
          return;
        }

        let phoneLineLabel = phoneLineLabels.some((item) => item.value === interaction.phoneLineLabel)
          ? interaction.phoneLineLabel
          : "";
        if (interaction.medium === "whatsapp") {
          phoneLineLabel = "message";
        }
        const savedCsrPhone = interaction.csrPhoneNumber || "";
        let csrPhoneNumber = savedCsrPhone;

        if (phoneLineLabel === "landline") {
          csrPhoneNumber = landlinePhoneNumber;
        } else if (phoneLineLabel === "csrOfficialLine") {
          if (csrPhoneNumbers.length === 1) {
            csrPhoneNumber = csrPhoneNumbers[0];
          } else if (csrPhoneNumbers.length > 1) {
            csrPhoneNumber = csrPhoneNumbers.includes(savedCsrPhone)
              ? savedCsrPhone
              : csrPhoneNumbers[0];
          }
        }

        setFormData({
          direction: interaction.direction,
          category: interaction.category,
          organizationType: interaction.customer.organizationType || "school",
          schoolName: capitalizeWords(interaction.customer.schoolName || ""),
          address: capitalizeWords(interaction.customer.address || ""),
          state: interaction.customer.state || "",
          phoneNumber: interaction.customer.phoneNumber || "",
          dateOfContact: new Date(interaction.dateOfContact).toISOString().slice(0, 16),
          medium: interaction.medium || "phone",
          customerType: interaction.customerType || "newCustomer",
          callerStatus: interaction.callerStatus || "firstCaller",
          complaintNature: capitalizeWords(interaction.complaintNature || ""),
          requestQuantity: interaction.requestQuantity || "",
          bookTitles: capitalizeWords(interaction.bookTitles || ""),
          status: interaction.status || "resolved",
          remark: interaction.remark || "",
          salesRep: interaction.salesRep?._id || "",
          phoneLineLabel,
          csrPhoneNumber,
        });
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load CRM ticket.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInteraction();

    return () => {
      mounted = false;
    };
  }, [csrPhoneNumbers, id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = CRM_CAPITALIZED_FIELDS.includes(name)
      ? capitalizeWords(value, { trim: false })
      : value;

    setFormData((current) => {
      const next = {
        ...current,
        [name]: nextValue,
      };

      if (name === "direction") {
        next.category = value === "outbound" ? "enquiry" : "enquiry";
      }

      if (name === "medium") {
        if (value === "whatsapp") {
          next.phoneLineLabel = "message";
          next.csrPhoneNumber = "";
        } else if (value === "phone") {
          if (current.phoneLineLabel === "message") {
            next.phoneLineLabel = "";
            next.csrPhoneNumber = "";
          }
        } else {
          next.phoneLineLabel = "";
          next.csrPhoneNumber = "";
        }
      }

      if (name === "phoneLineLabel") {
        next.csrPhoneNumber = resolveCsrPhoneForLineLabel(value, current.csrPhoneNumber);
      }

      return next;
    });
  };

  const handlePhoneBlur = async () => {
    const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);

    if (!normalizedPhone) {
      return;
    }

    try {
      const data = await lookupCrmCustomerByPhone(formData.phoneNumber);
      if (!data.customer) {
        setAutofillMessage("No previous history found for this phone number.");
        return;
      }

      setFormData((current) => ({
        ...current,
        organizationType: data.customer.organizationType || current.organizationType,
        schoolName: current.schoolName || capitalizeWords(data.customer.schoolName || ""),
        address: current.address || capitalizeWords(data.customer.address || ""),
        state: current.schoolName ? current.state : data.customer.state || "",
        customerType: data.interactionCount > 0 ? "existingCustomer" : current.customerType,
        callerStatus: data.interactionCount > 1 ? "repeatCaller" : current.callerStatus,
      }));
      setAutofillMessage(
        `Previous customer history found with ${data.interactionCount} ticket${
          data.interactionCount === 1 ? "" : "s"
        }.`
      );
    } catch {
      setAutofillMessage("");
    }
  };

  const handleSchoolSelect = (school) => {
    setFormData((current) => ({
      ...current,
      schoolName: school.schoolName || current.schoolName,
      address: school.address || current.address,
      state: school.state || current.state,
      phoneNumber: school.phoneNumber || current.phoneNumber,
    }));
    setAutofillMessage("School details loaded from the uploaded directory.");
  };

  const handleSchoolNameChange = (value) => {
    setFormData((current) => ({
      ...current,
      schoolName: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Ignore submit events bubbled from portaled modals (e.g. AddSchoolModal).
    if (event.target !== event.currentTarget && !event.currentTarget.contains(event.target)) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        requestQuantity:
          formData.category === "request" && formData.requestQuantity
            ? Number(formData.requestQuantity)
            : "",
        complaintNature: formData.category === "complaint" ? formData.complaintNature : "",
        salesRep: formData.salesRep || null,
      };

      const response = isEdit
        ? await updateCrmInteraction(id, payload)
        : await createCrmInteraction(payload);
      const savedTicket = response.interaction;

      if (submitMode === "saveAndTriggerSurvey" && savedTicket) {
        setCreatedTicket(savedTicket);
        setSurveyModalOpen(true);
      } else {
        navigate(ticketsPath);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to save CRM ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleSurveySubmit = async (formData) => {
    setSurveySaving(true);
    setError("");

    try {
      const data = await createSurveyDispatch(formData);
      if (data.dispatch && !wasSurveySentByServer(data.dispatch, data)) {
        await handleSurveyDispatchShare(data.dispatch);
      }
      setSurveyModalOpen(false);
      setCreatedTicket(null);
      window.alert(
        data.dispatch?.channel === "SMS" && data.sms?.sent
          ? "Ticket saved and survey SMS sent successfully."
          : "Ticket saved and survey triggered successfully."
      );
      navigate(ticketsPath);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to trigger customer survey.");
    } finally {
      setSurveySaving(false);
    }
  };

  const closeSurveyModal = () => {
    if (surveySaving) {
      return;
    }

    setSurveyModalOpen(false);
    setCreatedTicket(null);
    navigate(ticketsPath);
  };

  const title = isEdit ? "Edit CRM Ticket" : "New CRM Ticket";

  return (
    <PanelLayout title={title}>
      <div className="mx-auto max-w-5xl">
        {error && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Capture inbound and outbound customer-service ticket details.
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
          ) : (
            <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="direction" className="text-sm font-medium text-slate-700">
                  Direction
                </label>
                <select
                  id="direction"
                  name="direction"
                  value={formData.direction}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Selected: {formatCrmCategory(formData.category)}
                </p>
              </div>

              <div>
                <label htmlFor="organizationType" className="text-sm font-medium text-slate-700">
                  Customer type
                </label>
                <select
                  id="organizationType"
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {organizationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="schoolName" className="text-sm font-medium text-slate-700">
                  {getOrganizationNameLabel(formData.organizationType)}
                </label>
                {formData.organizationType === "school" ? (
                  <SchoolSearchSelect
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleSchoolNameChange}
                    onSchoolSelect={handleSchoolSelect}
                    placeholder="Search uploaded school name..."
                  />
                ) : (
                  <input
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder={getOrganizationNamePlaceholder(formData.organizationType)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                )}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">
                  Phone number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
                {autofillMessage && (
                  <p className="mt-1 text-xs text-emerald-700">{autofillMessage}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label htmlFor="state" className="text-sm font-medium text-slate-700">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">Select state (optional)</option>
                  {nigerianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="dateOfContact"
                  className="text-sm font-medium text-slate-700"
                >
                  Date of contact
                </label>
                <input
                  id="dateOfContact"
                  name="dateOfContact"
                  type="datetime-local"
                  value={formData.dateOfContact}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label htmlFor="medium" className="text-sm font-medium text-slate-700">
                  Medium
                </label>
                <select
                  id="medium"
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {contactMedia.map((medium) => (
                    <option key={medium.value} value={medium.value}>
                      {medium.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="customerType"
                  className="text-sm font-medium text-slate-700"
                >
                  New or existing customer
                </label>
                <select
                  id="customerType"
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {customerTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="callerStatus"
                  className="text-sm font-medium text-slate-700"
                >
                  Caller status
                </label>
                <select
                  id="callerStatus"
                  name="callerStatus"
                  value={formData.callerStatus}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {callerStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="text-sm font-medium text-slate-700">
                  Resolution status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {crmStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="salesRep" className="text-sm font-medium text-slate-700">
                  Sales rep
                </label>
                <select
                  id="salesRep"
                  name="salesRep"
                  value={formData.salesRep}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">Unassigned</option>
                  {salesReps.map((salesRep) => (
                    <option key={salesRep._id} value={salesRep._id}>
                      {capitalizeWords(salesRep.name)} - {salesRep.state}, {salesRep.location}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category === "complaint" && (
                <div className="md:col-span-2">
                  <label
                    htmlFor="complaintNature"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nature of complaint
                  </label>
                  <textarea
                    id="complaintNature"
                    name="complaintNature"
                    rows={3}
                    value={formData.complaintNature}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              )}

              {formData.category === "request" && (
                <div>
                  <label
                    htmlFor="requestQuantity"
                    className="text-sm font-medium text-slate-700"
                  >
                    Quantity of books requested
                  </label>
                  <input
                    id="requestQuantity"
                    name="requestQuantity"
                    type="number"
                    min="1"
                    value={formData.requestQuantity}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label htmlFor="bookTitles" className="text-sm font-medium text-slate-700">
                  Book titles
                </label>
                <input
                  id="bookTitles"
                  name="bookTitles"
                  value={formData.bookTitles}
                  onChange={handleChange}
                  placeholder="e.g. Mathematics For JSS 1, English Language For SS 2"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {showLineLabelFields && (
                <div>
                  <label
                    htmlFor="phoneLineLabel"
                    className="text-sm font-medium text-slate-700"
                  >
                    Line label
                  </label>
                  <select
                    id="phoneLineLabel"
                    name="phoneLineLabel"
                    value={formData.phoneLineLabel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Select line label</option>
                    {lineLabelOptions.map((lineLabel) => (
                      <option key={lineLabel.value} value={lineLabel.value}>
                        {lineLabel.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showLineLabelFields && formData.medium === "phone" && (
                <div>
                  <label
                    htmlFor="csrPhoneNumber"
                    className="text-sm font-medium text-slate-700"
                  >
                    CSR phone number
                  </label>
                  {!formData.phoneLineLabel ? (
                    <p className="mt-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                      Select a line label to set the CSR phone number.
                    </p>
                  ) : formData.phoneLineLabel === "landline" ? (
                    <input
                      id="csrPhoneNumber"
                      name="csrPhoneNumber"
                      readOnly
                      value={formData.csrPhoneNumber || landlinePhoneNumber}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-950 outline-none"
                    />
                  ) : formData.phoneLineLabel === "csrOfficialLine" &&
                    csrPhoneNumbers.length > 1 ? (
                    <>
                      <select
                        id="csrPhoneNumber"
                        name="csrPhoneNumber"
                        value={formData.csrPhoneNumber}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      >
                        {csrPhoneNumbers.map((phoneNumber) => (
                          <option key={phoneNumber} value={phoneNumber}>
                            {phoneNumber}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-slate-500">
                        Choose the official line used for this call.
                      </p>
                    </>
                  ) : formData.phoneLineLabel === "csrOfficialLine" &&
                    csrPhoneNumbers.length === 1 ? (
                    <>
                      <input
                        id="csrPhoneNumber"
                        name="csrPhoneNumber"
                        readOnly
                        value={formData.csrPhoneNumber || csrPhoneNumbers[0]}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-950 outline-none"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Your saved CSR official line.
                      </p>
                    </>
                  ) : (
                    <>
                      <input
                        id="csrPhoneNumber"
                        name="csrPhoneNumber"
                        type="tel"
                        value={formData.csrPhoneNumber}
                        onChange={handleChange}
                        placeholder="Enter your CSR line number"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        No CSR numbers saved yet.{" "}
                        <Link
                          to={settingsPath}
                          className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          Add them in Settings
                        </Link>{" "}
                        or enter a number above.
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label htmlFor="remark" className="text-sm font-medium text-slate-700">
                  Remark
                </label>
                <textarea
                  id="remark"
                  name="remark"
                  rows={4}
                  value={formData.remark}
                  onChange={handleChange}
                  autoCapitalize="off"
                  placeholder="Additional notes from the call"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 md:col-span-2">
                <Link
                  to={ticketsPath}
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  onClick={() => setSubmitMode("save")}
                  className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving && submitMode === "save"
                    ? "Saving..."
                    : isEdit
                      ? "Save ticket"
                      : "Submit ticket"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  onClick={() => setSubmitMode("saveAndTriggerSurvey")}
                  className="rounded-full border border-emerald-300 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                >
                  {saving && submitMode === "saveAndTriggerSurvey"
                    ? "Saving..."
                    : isEdit
                      ? "Save ticket + trigger survey"
                      : "Submit ticket + trigger survey"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <SurveyDispatchModal
        interaction={createdTicket}
        isOpen={surveyModalOpen}
        onClose={closeSurveyModal}
        onSubmit={handleSurveySubmit}
        saving={surveySaving}
      />
    </PanelLayout>
  );
};

export default CrmInteractionFormPage;
