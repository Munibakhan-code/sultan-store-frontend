import { useAuthContext } from "@/context/AuthContext";

/** Convenience hook so components never import the context directly. */
export const useAuth = useAuthContext;
