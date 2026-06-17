export const passwordRequirements = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "At least 1 uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "At least 1 lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "At least 1 number",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "At least 1 special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export function isPasswordValid(password: string) {
  return passwordRequirements.every((requirement) =>
    requirement.test(password),
  );
}
