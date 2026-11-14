// The people behind the demo, shown in the "Created by" card (components/Credits.tsx). Add a person here and draw their portrait in components/Portrait.tsx.

export type Person = {
  id: string; // key of the portrait in components/Portrait.tsx
  name: string;
  role: string;
  linkedin: string;
};

export const TEAM: Person[] = [
  { id: "jackson", name: "Jackson Merma", role: "AI & Software Engineer", linkedin: "https://www.linkedin.com/in/jackson-merma/" },
];
