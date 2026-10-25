import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

export default function VehicleImage({ imageUrl, alt, className, loading = "lazy", fetchPriority }) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [imageUrl]);

  if (!imageUrl || hasFailed) {
    return (
      <div className={`flex items-center justify-center bg-[var(--color-panel-soft)] text-[var(--color-text-subtle)] ${className}`} aria-hidden="true">
        <Icon name="vehicles" className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={() => setHasFailed(true)}
      className={`bg-[var(--color-panel-soft)] object-cover ${className}`}
    />
  );
}
