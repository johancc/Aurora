import { mongoose } from "@typegoose/typegoose";
import { ISession } from "../../models/Sessions";
import MentorshipModel, {
  IMentorship,
  Mentorship,
  MentorshipState,
} from "../../models/Mentorships";
import { IParent } from "../../models/Parents";
import { IStudent } from "../../models/Students";
import { IMentor } from "../../models/Mentors";
import CommunicationService, {
  CommunicationTemplates,
} from "../CommunicationService";
import UserService from "../UserService";
import { ensureIDsAreEqual } from "../../routes/utils";

export interface MentorshipRequest {
  parent: IParent;
  student: IStudent;
  mentor: IMentor;
  message: string;
}

/**
 * Responsible for creating, updating, and archiving mentorship information. Not responsible
 * for ensuring that the methods are called by the right type of user, or connecting to email / SMS services.
 *
 * A parent is the only type of user that can make mentorship requests in behalf of a student.
 * A student can only have one mentorship at any point in time. However, a student
 * can have multiple ongoing mentorship requests.
 *
 * A mentor can have multiple active mentorships at once. A mentor should be able to see / accept / reject any
 * mentorship request, but not make a mentorship request. Once a mentor accepts a student's request,
 * all the active requests made for the students will be automatically rejected.
 *
 * After a mentorship ends, it should be archived (not deleted!) so we can see mentorship patterns / engagement
 * metrics in the future.
 *
 */
class MentorshipService {
  /**
   * Sends a mentorship request to the chosen mentor, and a confirmation message to the parent. Takes into account the preferred communication method.
   * @param request contains information about members of the mentorship
   */
  public async sendRequest(request: MentorshipRequest): Promise<Mentorship> {
    return this.validateRequest(request).then(() => {
      // These checks are done in validateRequest, but TS complains if we don't validate the fields here.
      if (request.message.length === 0) {
        return Promise.reject("Received empty mentorship request message.");
      }
      if (request.mentor._id === undefined) {
        return Promise.reject("Invalid mentor");
      }
      if (request.student._id === undefined) {
        return Promise.reject("Invalid student");
      }
      if (request.parent._id === undefined) {
        return Promise.reject("Invalid parent");
      }
      return MentorshipModel.create({
        state: MentorshipState.PENDING,
        student: request.student,
        mentor: request.mentor._id,
        parent: request.parent._id,
        message: request.message,
        sessions: [],
      }).then(async (mentorship) => {
        if (request.mentor._id === undefined) {
          return Promise.reject("Invalid mentor");
        }
        if (request.parent._id === undefined) {
          return Promise.reject("Invalid parent");
        }
        const mentor = await UserService.findMentor(request.mentor._id);
        await CommunicationService.sendMessage(
          mentor,
          CommunicationTemplates.MENTORSHIP_REQUEST_MENTOR,
          request
        );
        const time = new Date().valueOf();
        // There seems to be an error destructuring documents in the mongoose version
        // compatible with typegoose.
        const update: IMentor = {
          _id: mentor._id,
          firebaseUID: mentor.firebaseUID,
          name: mentor.name,
          email: mentor.email,
          region: mentor.region,
          college: mentor.college,
          phone: mentor.phone,
          pronouns: mentor.pronouns,
          avatar: mentor.avatar,
          introduction: mentor.introduction,
          major: mentor.major,
          communicationPreference: mentor.communicationPreference,
          gradeLevels: mentor.gradeLevels,
          subjects: mentor.subjects,
          mentorships: mentor.mentorships,
          available: mentor.available,
        };
        await UserService.updateMentor(request.mentor._id, {
          ...update,
          lastRequestTime: time,
        });
        const parent = await UserService.findParent(request.parent._id);
        await CommunicationService.sendMessage(
          parent,
          CommunicationTemplates.MENTORSHIP_REQUEST_PARENT,
          request
        );
        return mentorship;
      });
    });
  }

  private async validateRequest(request: MentorshipRequest): Promise<void> {
    if (request.mentor._id === undefined) {
      return Promise.reject(`Mentor: ${request.mentor.name} has no _id`);
    }
    if (request.parent._id === undefined) {
      return Promise.reject(`Parent: ${request.parent.name} has no _id`);
    }
    if (request.student._id === undefined) {
      return Promise.reject(`Student ${request.student.name} has no _id`);
    }
    if (request.message.length === 0) {
      return Promise.reject(`Please specify a message`);
    }

    if (await this.isStudentBeingMentored(request.student)) {
      return Promise.resolve();
    } else if (await this.isDuplicate(request)) {
      return Promise.resolve();
    } else if (
      await this.hasStudentBeenRejectedByMentor(request.student, request.mentor)
    ) {
      return Promise.resolve();
    }
  }

  private isStudentBeingMentored(student: IStudent) {
    return this.getStudentMentorships(student).then((mentorships) => {
      const activeReqs = mentorships.filter(
        (request) => request.state === MentorshipState.ACTIVE
      );
      return activeReqs.length > 0;
    });
  }

  private hasStudentBeenRejectedByMentor(student: IStudent, mentor: IMentor) {
    return this.getStudentMentorships(student).then((mentorships) => {
      const reqsToMentor = mentorships.filter((req) => {
        return (
          (req.mentor === mentor || req.mentor === mentor._id) &&
          req.state === MentorshipState.REJECTED
        );
      });
      return reqsToMentor.length > 0;
    });
  }

  private isDuplicate(request: MentorshipRequest) {
    return MentorshipModel.find({
      parent: request.parent._id,
      student: request.student._id,
      mentor: request.mentor._id,
      state: MentorshipState.PENDING,
    }).then((docs) => {
      return docs.length > 0;
    });
  }

  private getStudentMentorships(student: IStudent) {
    if (student._id === undefined) {
      throw new Error(
        `Cannot get mentorships for student not in database: ${student.name}`
      );
    }
    return this.getCurrentMentorships(student._id);
  }

  public async getCurrentMentorships(userId: mongoose.Types.ObjectId) {
    const docs = await MentorshipModel.find({
      $or: [{ student: userId }, { parent: userId }, { mentor: userId }],
    })
      .populate("mentor")
      .populate("parent")
      .populate("student");
    // Note: A user might have been deleted, making the mentorship invalid.
    const mentorships = docs.filter(async (doc) => {
      if (doc.parent === null || doc.mentor === null || doc.student === null) {
        await MentorshipModel.deleteOne({_id: doc._id});
        return false;
      }
      return true;
    });
    return mentorships;
  }
  /**
   * Assumes that the mentorship is being accepted by request of the mentor. A mentorship can only be accepted if it is in the PENDING state. A mentorship cannot be accepted more than once - a new mentorship request should be archived before being renewed.
   * @param mentorship to be accepted.
   */
  public acceptRequest(mentorship: IMentorship) {
    if (mentorship._id === undefined) {
      return Promise.reject("Missing mentorship._id");
    }
    return MentorshipModel.findOne({ _id: mentorship._id })
      .then((doc) => {
        if (doc === null) {
          throw new Error(`Mentorship does not exist: ${mentorship._id}`);
        }
        if (doc.state !== MentorshipState.PENDING) {
          throw new Error(
            `Cannot accept mentorship that is not pending: ${doc.state}`
          );
        }
        doc.startDate = new Date();
        doc.state = MentorshipState.ACTIVE;
        return doc.save();
      })
      .then(async () => {
        const {
          parent,
          student,
          mentor,
        } = await this.getUsersFromPopulatedMentorship(mentorship);

        await CommunicationService.sendMessage(
          mentor,
          CommunicationTemplates.MENTORSHIP_ACCEPTED_MENTOR,
          { mentor, parent, student }
        );

        await CommunicationService.sendMessage(
          parent,
          CommunicationTemplates.MENTORSHIP_ACCEPTED_PARENT,
          { mentor, parent, student }
        );
      });
  }

  /**
   * Assumes that the mentorship is being rejected by request of the mentor. A mentorship can only be rejected once, double-rejection will throw an error. A mentorship cannot be accepted afterwards - a new mentorship request should be sent if the mentorship should be reactivated.
   * @param mentorship to be rejected.
   * @param notify whether to send an email / sms
   */
  public rejectRequest(mentorship: IMentorship, notify: boolean = true) {
    if (mentorship._id === undefined) {
      throw new Error(`Cannot reject non-existent mentorship`);
    }
    return MentorshipModel.findById(mentorship._id).then((doc) => {
      if (doc === null) {
        throw new Error(`Failed to find mentorship: ${mentorship._id}`);
      }
      if (doc.state !== MentorshipState.PENDING) {
        throw new Error(
          `Cannot reject mentorship that is not pending: ${doc._id}`
        );
      }
      doc.state = MentorshipState.REJECTED;

      return doc.save().then(async (doc) => {
        const {
          parent,
          student,
          mentor,
        } = await this.getUsersFromPopulatedMentorship(mentorship);
        if (notify) {
          await CommunicationService.sendMessage(
            mentor,
            CommunicationTemplates.MENTORSHIP_REJECTED_MENTOR,
            { mentor, parent, student }
          );
          await CommunicationService.sendMessage(
            parent,
            CommunicationTemplates.MENTORSHIP_REJECTED_PARENT,
            { mentor, parent, student }
          );
        }

        return doc;
      });
    });
  }

  public archiveMentorship(mentorship: IMentorship) {
    if (mentorship._id === undefined) {
      return Promise.reject("Cannot archive non-existent mentorship");
    }
    return MentorshipModel.findById(mentorship._id).then((doc) => {
      if (doc === null) {
        throw new Error(`Failed to find mentorship: ${mentorship._id}`);
      }
      if (doc.state !== MentorshipState.ACTIVE) {
        throw new Error(`Cannot archive inactive mentorship`);
      }
      doc.endDate = new Date();
      doc.state = MentorshipState.ARCHIVED;
      return doc.save();
    });
  }

  /**
   * A session can only be added to an ACTIVE mentorship.
   */
  public addSessionToMentorship(session: ISession, mentorship: Mentorship) {
    if (mentorship._id === undefined) {
      return Promise.reject("Missing mentorship._id");
    }
    if (session.rating > 1 || session.rating < 0) {
      return Promise.reject(`Session rating out of range: ${session.rating}`);
    }
    return MentorshipModel.findById(mentorship._id).then((doc) => {
      if (doc === null) {
        throw new Error(`Failed to find mentorship ${mentorship._id}`);
      }
      if (doc.state !== MentorshipState.ACTIVE) {
        throw new Error(
          `Attempting to add a session to an inactive mentorship: ${doc._id}`
        );
      }
      doc.sessions.push(session);
      return doc.save();
    });
  }

  private async getUsersFromPopulatedMentorship(
    mentorship: IMentorship
  ): Promise<{ parent: IParent; mentor: IMentor; student: IStudent }> {
    let { mentor, parent, student } = mentorship;

    try {
      let touch = (mentor as IMentor).name;
      if (touch === undefined) {
        throw new Error("Unable to retrieve object id");
      }
      touch = (parent as IParent).name;
      if (touch === undefined) {
        throw new Error("Unable to retrieve object id");
      }
      touch = (student as IStudent).name;
      if (touch === undefined) {
        throw new Error("Unable to retrieve object id");
      }
      const resp = {
        mentor: mentor as IMentor,
        parent: parent as IParent,
        student: student as IStudent,
      };
      return resp;
    } catch {
      const mentorID = String((mentor as IMentor)._id || mentor);
      const parentID = String((parent as IParent)._id || parent);
      const studentID = String((student as IStudent)._id || student);
      let populatedMentor = await UserService.findMentor(
        mongoose.Types.ObjectId(mentorID)
      ).then((m) => {
        if (m._id === undefined) {
          m._id = mongoose.Types.ObjectId(mentorID);
        }
        return m;
      });

      let populatedParent = await UserService.findParent(
        mongoose.Types.ObjectId(parentID)
      ).then((p) => {
        if (p._id === undefined) {
          p._id = mongoose.Types.ObjectId(parentID);
        }
        return p;
      });

      let students = populatedParent.students.filter(
        (stud) =>
          (stud._id !== undefined && ensureIDsAreEqual(stud._id, studentID)) ||
          stud._id?.toHexString() === studentID
      );
      if (students.length === 0) {
        throw new Error("Unable to find student.");
      }
      let populatedStudent = students[0];
      return {
        mentor: populatedMentor,
        parent: populatedParent,
        student: populatedStudent,
      };
    }
  }
}

export default MentorshipService;
