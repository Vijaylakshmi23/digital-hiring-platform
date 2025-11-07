/**
 * Maps Supabase error codes to user-friendly messages
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return "An unexpected error occurred";

  // Extract error code and message
  const code = error.code;
  const message = error.message?.toLowerCase() || "";

  // Authentication errors
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (code === "email_not_confirmed") {
    return "Please verify your email address before logging in.";
  }
  if (code === "user_already_registered" || message.includes("already registered")) {
    return "An account with this email already exists.";
  }
  if (code === "weak_password") {
    return "Password is too weak. Please use at least 6 characters.";
  }

  // Permission errors
  if (code === "PGRST301" || message.includes("row-level security")) {
    return "You don't have permission to perform this action.";
  }
  if (code === "42501" || message.includes("permission denied")) {
    return "Access denied. Please check your permissions.";
  }

  // Data validation errors
  if (code === "23505" || message.includes("duplicate") || message.includes("unique constraint")) {
    return "This record already exists. Please use different values.";
  }
  if (code === "23503" || message.includes("foreign key")) {
    return "Cannot complete this action due to related records.";
  }
  if (code === "23502" || message.includes("not null")) {
    return "Please fill in all required fields.";
  }
  if (code === "23514" || message.includes("check constraint")) {
    return "Invalid data. Please check your input values.";
  }

  // Network errors
  if (message.includes("fetch") || message.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  // Timeout errors
  if (message.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  // Rate limiting
  if (code === "429" || message.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Default fallback
  return "Something went wrong. Please try again.";
};

/**
 * Helper function to handle errors consistently across the app
 */
export const handleSupabaseError = (error: any, customMessage?: string): string => {
  console.error("Supabase error:", error); // Log for debugging
  return customMessage || getErrorMessage(error);
};
