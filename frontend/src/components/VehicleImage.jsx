import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

export default function VehicleImage({ imageUrl, alt, className }) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [imageUrl]);

  if (!imageUrl || hasFailed) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`} aria-hidden="true">
        <Icon name="vehicles" className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasFailed(true)}
      className={`bg-slate-100 object-cover ${className}`}
    />
  );
}
