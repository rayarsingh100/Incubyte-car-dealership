const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginFields({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateRegistrationFields({ name, email, password, confirmation }) {
  const errors = {};
  if (!name.trim()) errors.name = "Enter your name.";
  else if (name.trim().length > 100) errors.name = "Use 100 characters or fewer.";
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Create a password.";
  else if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (new TextEncoder().encode(password).length > 72) errors.password = "Use no more than 72 UTF-8 bytes.";
  if (!confirmation) errors.confirmation = "Confirm your password.";
  else if (password !== confirmation) errors.confirmation = "Passwords do not match.";
  return errors;
}
