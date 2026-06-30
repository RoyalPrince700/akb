import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import { getPublicSurvey, submitPublicSurvey } from "../../services/api";

const ratingOptions = [1, 2, 3, 4, 5];

const emptyForm = {
  serviceRating: 5,
  marketerRating: 5,
  csrRating: 5,
  resolutionRating: 5,
  recommendRating: 5,
  feedback: "",
};

const surveyFields = [
  { id: "serviceRating", questionIndex: 0 },
  { id: "marketerRating", questionIndex: 1 },
  { id: "csrRating", questionIndex: 2 },
  { id: "resolutionRating", questionIndex: 3 },
  { id: "recommendRating", questionIndex: 4 },
];

const RatingField = ({ id, label, value, onChange }) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-slate-700">
      {label}
    </label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
    >
      {ratingOptions.map((rating) => (
        <option key={rating} value={rating}>
          {rating} / 5
        </option>
      ))}
    </select>
  </div>
);

const PublicSurveyPage = () => {
  const { token } = useParams();
  const [survey, setSurvey] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSurvey = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicSurvey(token);
        setSurvey(data.survey || null);
        setSubmitted(Boolean(data.survey?.responded));
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Unable to load survey.");
      } finally {
        setLoading(false);
      }
    };

    loadSurvey();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "feedback" ? value : Number(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await submitPublicSurvey(token, formData);
      setSubmitted(true);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to submit survey.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading survey...</p>
          ) : error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : submitted ? (
            <>
              <h1 className="text-3xl font-bold text-slate-950">Thank you</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your feedback has been received. We appreciate you taking the time to
                rate your experience with Accessible Publishers Ltd.
              </p>
            </>
          ) : (
            <>
              <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Customer survey
              </p>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">
                Tell us about your experience
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Thank you for engaging with <strong>{survey?.schoolName}</strong>. Please
                rate your experience with Accessible Publishers Ltd. Marketer and CSR
                ratings are separate so we can review each role accurately.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {surveyFields.map(({ id, questionIndex }) => (
                  <RatingField
                    key={id}
                    id={id}
                    label={`${questionIndex + 1}. ${survey?.questions?.[questionIndex] || ""}`}
                    value={formData[id]}
                    onChange={handleChange}
                  />
                ))}

                <div>
                  <label htmlFor="feedback" className="text-sm font-medium text-slate-700">
                    Additional feedback (optional)
                  </label>
                  <textarea
                    id="feedback"
                    name="feedback"
                    rows={4}
                    value={formData.feedback}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Share anything else about your experience"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit feedback"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default PublicSurveyPage;
