import { useRef, useState } from "react";
import AuthPageLayout from "../components/AuthPageLayout.jsx";
import Icon from "../components/Icon.jsx";
import { validateLoginFields } from "../utils/authValidation.js";

function Field({ id, label, value, onChange, type = "text", autoComplete, error, inputMode, showPassword, onTogglePassword }) {
  const inputType = onTogglePassword ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${onTogglePassword ? "pr-11" : ""} ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"}`}
        />
        {onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-1.5 inline-flex w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-rose-700">{error}</p>}
    </div>
  );
}

export default function LoginPage({ onLogin, onRegister, notice, initialEmail = "" }) {
  const [values, setValues] = useState({ email: initialEmail, password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submittingRef = useRef(false);

  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = validateLoginFields(values);
    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onLogin({ email: values.email.trim(), password: values.password });
    } catch (error) {
      submittingRef.current = false;
      setIsSubmitting(false);
      setApiError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Welcome back"
      title="Sign in to Motorline"
      description="Use your dealership account to continue to the workspace."
      footer={<>New to Motorline? <a href="#register" onClick={(event) => { event.preventDefault(); onRegister(); }} className="font-semibold text-teal-800 hover:text-teal-900 focus:outline-none focus:underline">Create an account</a></>}
    >
      {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-900">{notice}</p>}
      {apiError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">{apiError}</p>}
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => update("email", event.target.value)}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={(event) => update("password", event.target.value)}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((visible) => !visible)}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm shadow-teal-900/15 transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthPageLayout>
  );
}
