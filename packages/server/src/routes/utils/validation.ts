import { query, body } from "express-validator";
import CommunicationPreference from "../../models/CommunicationPreference";

export const idRequirementQuery = query("_id")
  .exists({ checkFalsy: true, checkNull: true })
  .isString()
  .isMongoId();

export const idRequirementBody = body("_id")
  .exists({
    checkFalsy: true,
    checkNull: true,
  })
  .isString()
  .isMongoId();

// https://stackoverflow.com/questions/54329336/nodejs-express-nested-input-body-object-validation
export const mentorRequirementsBody = [
  body("mentor._id").optional().isMongoId(),
  body("mentor.email").optional().exists().isEmail(),
  body("mentor.name").exists().isString(),
  body("mentor.major").exists().isString(),
  body("mentor.region").optional().isString(),
  body("mentor.gradeLevels").exists().isArray({ min: 1 }),
  body("mentor.subjects").exists().isArray({ min: 1 }),
  body("mentor.mentorships.*._id").optional().isMongoId(),
  body("mentor.phone").optional({ checkFalsy: true }).isMobilePhone("en-US"),
  body("mentor.avatar").optional().isURL(),
  body("mentor.communicationPreference")
    .exists()
    .isIn([CommunicationPreference.EMAIL, CommunicationPreference.SMS]),
];

export const parentRequirementsBody = [
  body("parent._id").optional().isMongoId(),
  body("parent.email").optional().isEmail(),
  body("parent.name").exists().isString(),
  body("parent.region").optional().isString(),
  body("parent.phone").optional({ checkFalsy: true }).isMobilePhone("en-US"),
  body("parent.avatar").optional().isURL(),
  body("parent.communicationPreference")
    .exists()
    .isIn([CommunicationPreference.EMAIL, CommunicationPreference.SMS]),
  body("parent.students").isArray({ min: 1 }),
  body("parent.students.*._id").optional().isMongoId(),
  body("parent.students.*.name").exists().isString(),
  body("parent.students.*.subjects").isArray({ min: 1 }),
  body("parent.students.*.gradeLevel").isString(),
];

export const studentRequirementsBody = [
  body("student._id").optional().isMongoId(),
  body("student.name").exists().isString(),
  body("student.subjects").isArray({ min: 1 }),
  body("student.gradeLevel").isString(),
];
