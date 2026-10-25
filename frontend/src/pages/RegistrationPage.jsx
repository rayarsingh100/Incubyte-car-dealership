import { useRef, useState } from "react";
import AuthPageLayout from "../components/AuthPageLayout.jsx";
import Icon from "../components/Icon.jsx";
import { registerRequest } from "../services/authApi.js";
import { validateRegistrationFields } from "../utils/authValidation.js";

const fields = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email address", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
  { name: "confirmation", label: "Confirm password", type: "password", autoComplete: "new-password" },
];

export default function RegistrationPage({ onRegistered, onLogin }) {
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmation: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmation: false });
  const submittingRef = useRef(false);

  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = validateRegistrationFields(values);
    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const user = await registerRequest({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      onRegistered(values.email.trim(), user.name);
    } catch (error) {
      submittingRef.current = false;
      setIsSubmitting(false);
      setApiError(error instanceof Error ? error.message : "Unable to create your account. Please try again.");
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Create your account"
      title="Join Motorline"
      description="Create a customer account to access the dealership workspace."
      footer={<>Already registered? <a href="#login" onClick={(event) => { event.preventDefault(); onLogin(); }} className="font-semibold text-teal-800 hover:text-teal-900 focus:outline-none focus:underline">Back to sign in</a></>}
    >
      {apiError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">{apiError}</p>}
      <form noValidate onSubmit={handleSubmit} className="space-y-3.5">
        {fields.map((field) => {
          const id = `register-${field.name}`;
          const error = errors[field.name];
          const isPassword = field.name === "password" || field.name === "confirmation";
          const showPassword = visiblePasswords[field.name];
          return (
            <div key={field.name}>
              <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">{field.label}</label>
              <div className="relative">
                <input
                  id={id}
                  name={field.name}
                  type={isPassword && showPassword ? "text" : field.type}
                  autoComplete={field.autoComplete}
                  value={values[field.name]}
                  onChange={(event) => update(field.name, event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:ring-4 ${isPassword ? "pr-11" : ""} ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"}`}
                />
                {isPassword && (
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords((current) => ({ ...current, [field.name]: !current[field.name] }))}
                    aria-label={`${showPassword ? "Hide" : "Show"} ${field.name === "confirmation" ? "confirm password" : "password"}`}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-1.5 inline-flex w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
                  </button>
                )}
              </div>
              {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
            </div>
          );
        })}
        <p className="pt-1 text-[11px] leading-5 text-slate-500">Public sign-up creates a customer account. Account permissions are enforced by the server.</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm shadow-teal-900/15 transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthPageLayout>
  );
}
