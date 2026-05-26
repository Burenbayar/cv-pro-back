export enum Language {
  MN = 'mn',
  EN = 'en'
}

export type Education = {
  id: string;
  university: string;
  degree: string;
  startYear: string;
  endYear: string;
};

export type Experience = {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
};

export type CVData = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  location: string;
  interestedJobs: string[];
  drivingLicense: string;
  languages: string[];
  computerSkills: string[];
  artSkills: string[];
  sportSkills: string[];
  exams: string[]; // File names or IDs
  educations: Education[];
  experiences: Experience[];
  certifications: string[]; // File names
  about: string;
};

export const INITIAL_CV_DATA: CVData = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  location: '',
  interestedJobs: [],
  drivingLicense: 'B',
  languages: [],
  computerSkills: [],
  artSkills: [],
  sportSkills: [],
  exams: [],
  educations: [],
  experiences: [],
  certifications: [],
  about: ''
};

export const COMPUTER_SKILLS_OPTIONS = [
  "Microsoft Office", "Excel (Advanced)", "PowerPoint", "Photoshop", "Illustrator", 
  "AutoCAD", "SketchUp", "Programming (JS/TS)", "Python", "SQL", "Cyber Security", 
  "UI/UX Design", "Video Editing", "Social Media Marketing"
];

export const ART_SKILLS_OPTIONS = [
  "Drawing", "Painting", "Photography", "Sculpting", "Graphic Design", "Calligraphy", "Interior Design"
];

export const SPORT_SKILLS_OPTIONS = [
  "Basketball", "Football", "Volleyball", "Chess", "Swimming", "Judo", "Wrestling", "Tennis"
];

export const DRIVING_LICENSE_OPTIONS = ["A", "B", "C", "D", "E"];
