import { v4 as uuid } from "uuid";
import CommunicationPreference from "../../src/models/CommunicationPreference";
import { IMentor } from "../../src/models/Mentors";
import { IStudent } from "../../src/models/Students";
import { IParent } from "../../src/models/Parents";

export const testMentor: IMentor = {
  firebaseUID: uuid(),
  name: "Ben Bitdiddle",
  email: "jack@mit.edu",
  phone: "3392015945",
  pronouns: "He/Him",
  avatar: "www.imgur.com/testImage.jpg",
  introduction: "Hello I'm a test user",
  major: "Testing",
  communicationPreference: CommunicationPreference.EMAIL,
  gradeLevels: ["8"],
  subjects: [
    "AP Computer Science",
    "English",
    "19th Century Literature",
    "Differential Equations",
  ],
  college: "MIT",
  region: "Midwest",
  available: true,
};

export const testStudent: IStudent = {
  name: "Pork Bun",
  gradeLevel: "5",
  subjects: ["Algebra", "English"],
};

export const testParent: IParent = {
  firebaseUID: uuid(),
  name: "Alyssa P Hacker",
  email: "alyssa@hacker.com",
  phone: "15005550006",
  pronouns: "She/Her",
  avatar: "www.imgur.com/testImage.jpg",
  communicationPreference: CommunicationPreference.EMAIL,
  students: [testStudent],
  region: "Midwest",
};
