import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { normalizeVehicleFields, validateVehicleFields } from "../utils/vehicleFormValidation.js";
import { getApiErrorMessage } from "../utils/apiErrorMessages.js";

const blankFields = { make: "", model: "", category: "", price: "", quantity: "", imageUrl: "" };

function getInitialFields(vehicle) {
  if (!vehicle) return blankFields;

  return {
    make: vehicle.make,
    model: vehicle.model,
    category: vehicle.category,
    imageUrl: vehicle.imageUrl || "",
    price: String(vehicle.price),
    quantity: String(vehicle.quantity),
  };
}

const fields = [
  { name: "make", label: "Brand", placeholder: "e.g. Toyota", type: "text", autoComplete: "off" },
  { name: "model", label: "Model / name", placeholder: "e.g. Camry", type: "text", autoComplete: "off" },
  { name: "category", label: "Category", placeholder: "e.g. Sedan", type: "text", autoComplete: "off" },
  { name: "imageUrl", label: "Image URL (optional)", placeholder: "https://example.com/vehicle.jpg", type: "url", inputMode: "url", autoComplete: "url" },
  { name: "price", label: "Price (USD)", placeholder: "e.g. 28995.00", type: "text", inputMode: "decimal", autoComplete: "off" },
  { name: "quantity", label: "Stock quantity", placeholder: "e.g. 12", type: "text", inputMode: "numeric", autoComplete: "off" },
];

export default function VehicleFormModal({ vehicle, onSave, onClose, onSaved }) {
  const isEditing = Boolean(vehicle);
  const [values, setValues] = useState(() => getInitialFields(vehicle));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const dialogRef = useRef(null);

  onCloseRef.current = () => {
    if (!submittingRef.current) onClose();
  };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const firstField = document.getElementById("vehicle-make");
    firstField?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const updateField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = validateVehicleFields(values);
    setErrors(nextErrors);
    setSubmitError("");
    const firstInvalidField = fields.find((field) => nextErrors[field.name]);
    if (firstInvalidField) {
      document.getElementById(`vehicle-${firstInvalidField.name}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSave(normalizeVehicleFields(values), vehicle?.id);
      onSaved(isEditing ? "Vehicle updated in the dealership inventory." : "Vehicle added to the dealership inventory.");
      onClose();
    } catch (error) {
      submittingRef.current = false;
      setIsSubmitting(false);
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-form-title"
        className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl shadow-slate-950/20 sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-teal-800 uppercase">
              Connected inventory
            </span>
            <h2 id="vehicle-form-title" className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
              {isEditing ? "Edit vehicle" : "Add vehicle"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Changes are sent to the dealership inventory API.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close vehicle form"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            <Icon name="close" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const error = errors[field.name];
              const id = `vehicle-${field.name}`;
              const isWide = field.name === "category" || field.name === "imageUrl";
              return (
                <div key={field.name} className={isWide ? "sm:col-span-2" : ""}>
                  <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                    {field.label}<span className="ml-1 text-rose-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={id}
                    name={field.name}
                    type={field.type}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    maxLength={field.name === "imageUrl" ? 2048 : field.name === "price" || field.name === "quantity" ? undefined : 100}
                    value={values[field.name]}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      error
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
                        : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
                    }`}
                  />
                  {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-[11px] font-medium text-rose-700">{error}</p>}
                </div>
              );
            })}
          </div>

          {submitError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">{submitError}</p>}

          <div className="mt-6 rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] leading-5 text-slate-500">
            Price must be greater than $0 with up to two decimal places. Stock must be a whole number of 0 or more.
            <span className="mt-1 block">Image links must use HTTP or HTTPS and point directly to a public image. The site shows a fallback if the image cannot load.</span>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:cursor-wait disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-xs font-semibold text-white shadow-sm shadow-teal-900/15 transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Save vehicle"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
