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
      footer={<>Already registered? <a href="#login" onClick={(event) => { event.preventDefault(); onLogin(); }} className="font-semibold text-[var(--color-champagne-soft)] hover:text-teal-900 focus:outline-none focus:underline">Back to sign in</a></>}
    >
      {apiError && <p role="alert" className="mb-5 rounded-xl border border-[#e6c4bf] bg-[var(--color-danger-wash)] px-3.5 py-3 text-sm leading-5 text-[#9f3e36]">{apiError}</p>}
      <form noValidate onSubmit={handleSubmit} className="space-y-3.5">
        {fields.map((field) => {
          const id = `register-${field.name}`;
          const error = errors[field.name];
          const isPassword = field.name === "password" || field.name === "confirmation";
          const showPassword = visiblePasswords[field.name];
          return (
            <div key={field.name}>
              <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#202520]">{field.label}</label>
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
                  className={`h-11 w-full rounded-xl border bg-[var(--color-panel)] px-3.5 text-sm text-[#202520] outline-none transition focus:ring-4 ${isPassword ? "pr-11" : ""} ${error ? "border-[#c8847b] focus:border-rose-400 focus:ring-rose-500/10" : "border-[var(--color-border)] focus:border-[#d0b477] focus:ring-[#d0b477]/15"}`}
                />
                {isPassword && (
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords((current) => ({ ...current, [field.name]: !current[field.name] }))}
                    aria-label={`${showPassword ? "Hide" : "Show"} ${field.name === "confirmation" ? "confirm password" : "password"}`}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-1.5 inline-flex w-10 items-center justify-center rounded-lg text-[#737a73] transition hover:bg-[var(--color-panel-raised)] hover:text-[#202520] focus:outline-none focus:ring-2 focus:ring-[#d0b477]/30"
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
                  </button>
                )}
              </div>
              {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-[#9f3e36]">{error}</p>}
            </div>
          );
        })}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-bronze)] px-4 text-sm font-semibold text-white shadow-sm shadow-black/20 transition hover:bg-[var(--color-bronze-hover)] focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthPageLayout>
  );
}
