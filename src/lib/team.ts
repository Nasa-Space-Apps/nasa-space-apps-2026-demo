// The people behind the demo, shown in the "Created by" card of the globe and on the closing card of every story (components/Credits.tsx).
// Add a person here and put their portrait (4:5, ~720 px wide) in public/team/<id>.jpg.

export type Person = {
  id: string; // file name of the portrait: public/team/<id>.jpg
  name: string;
  role: string;
  linkedin: string;
};

export const TEAM: Person[] = [
  { id: "jackson", name: "Jackson Merma", role: "AI & Software Engineer", linkedin: "https://www.linkedin.com/in/jackson-merma/" },
  { id: "paul", name: "Paul Luque", role: "Full Stack Developer", linkedin: "https://www.linkedin.com/in/paul-alexander-luque/" },
];

export const portraitOf = (p: Person) => `/team/${p.id}.jpg`;
