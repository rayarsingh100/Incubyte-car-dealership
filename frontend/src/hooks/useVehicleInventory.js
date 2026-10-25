import { useCallback, useEffect, useRef, useState } from "react";
import {
  createVehicle as createVehicleRequest,
  deleteVehicle as deleteVehicleRequest,
  listVehicles,
  restockVehicle as restockVehicleRequest,
  updateVehicle as updateVehicleRequest,
} from "../services/vehiclesApi.js";

export function useVehicleInventory(token, enabled) {
  const [vehicles, setVehicles] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !token) return;
    const version = ++requestVersion.current;
    setIsFetching(true);
    setError(null);
    try {
      const nextVehicles = await listVehicles(token);
      if (requestVersion.current === version) setVehicles(nextVehicles);
    } catch (requestError) {
      if (requestVersion.current === version) setError(requestError);
      throw requestError;
    } finally {
      if (requestVersion.current === version) setIsFetching(false);
    }
  }, [enabled, token]);

  useEffect(() => {
    if (!enabled || !token) {
      requestVersion.current += 1;
      setVehicles(null);
      setError(null);
      setIsFetching(false);
      return;
    }

    refresh().catch(() => {});
    return () => { requestVersion.current += 1; };
  }, [enabled, token, refresh]);

  const refreshAfterMutation = async (request) => {
    const result = await request();
    try {
      await refresh();
    } catch {
      // The write succeeded; keep that result distinct from a subsequent refresh failure.
    }
    return result;
  };

  return {
    vehicles,
    isLoading: vehicles === null && isFetching,
    isRefreshing: vehicles !== null && isFetching,
    error,
    refresh,
    createVehicle: (vehicle) => refreshAfterMutation(() => createVehicleRequest(token, vehicle)),
    updateVehicle: (id, vehicle) => refreshAfterMutation(() => updateVehicleRequest(token, id, vehicle)),
    deleteVehicle: (id) => refreshAfterMutation(() => deleteVehicleRequest(token, id)),
    restockVehicle: (id, quantity) => refreshAfterMutation(() => restockVehicleRequest(token, id, quantity)),
  };
}
