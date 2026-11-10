// src/hooks/useMyApplication.js
// Has the logged-in student already submitted an application?
// Asked once and shared by the navbar and the application form.
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

let cached = null; // { userId, hasApplication }
let pending = null;
const listeners = new Set();

const publish = (value) => {
  cached = value;
  listeners.forEach((listener) => listener(value));
};

/** Call after a successful submission so every page updates at once */
export const markApplicationSubmitted = () => {
  if (cached) publish({ ...cached, hasApplication: true });
};

export default function useMyApplication() {
  const { getToken, userId, isLoaded } = useAuth();
  const [state, setState] = useState(cached);

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (cached?.userId === userId) {
      setState(cached);
      return;
    }

    if (!pending) {
      pending = (async () => {
        try {
          const token = await getToken();
          const res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/students/myApplications`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          publish({ userId, hasApplication: (res.data.data || []).length > 0 });
        } catch {
          publish({ userId, hasApplication: false });
        } finally {
          pending = null;
        }
      })();
    }
  }, [isLoaded, userId, getToken]);

  // Signed-out visitors have no application to look up
  const signedOut = isLoaded && !userId;
  const ready = Boolean(state && state.userId === userId);
  return {
    loading: !signedOut && !ready,
    hasApplication: !signedOut && ready && state.hasApplication,
  };
}
