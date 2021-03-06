import { Mentor } from "./Mentors";
import { Parent } from "./Parents";
import { Student } from "./Students";
import { ISession } from "./Sessions";
import { getModelForClass, modelOptions, mongoose, plugin, prop, Ref, Severity } from "@typegoose/typegoose";
import autopopulate from 'mongoose-autopopulate';
/**
 * PENDING - A request has been sent to the mentor, but the mentor has not yet accepted.
 * ACTIVE - Mentorship is still ongoing.
 * REJECTED - Mentor declined the mentorship request.
 * ARCHIVED - Mentoship has ended, must have been active at one point.
 */
export enum MentorshipState {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  REJECTED = "REJECTED",
}

/**
 * Allows us to keep track of ongoing mentorships in our network. It models a many to one relationship between students and a mentor.
 *
 * Mentorship objects should never be deleted from the database, only modified.
 */
export interface IMentorship {
  _id?: mongoose.Types.ObjectId;
  state: MentorshipState;
  message?: string; // Populated by the request.
  // Undefined iff Mentorship.state is PENDING or REJECTED.
  startDate?: Date;
  endDate?: Date;
  mentor: Ref<Mentor>;
  parent: Ref<Parent>;
  student: Ref<Student>;
  // Session should never be deleted, only modified.
  sessions: ISession[];
}

@plugin(autopopulate as any)
@modelOptions({options: {allowMixed: Severity.ALLOW}})
export class Mentorship implements IMentorship {
  public _id?: mongoose.Types.ObjectId;

  @prop({
    required: true,
    default: MentorshipState.PENDING,
    enum: MentorshipState,
  })
  public state: MentorshipState;

  @prop({ required: false })
  public message?: string;

  @prop({ required: false })
  public startDate?: Date;

  @prop({ required: false })
  public endDate?: Date;

  @prop({ ref: "Mentor", autopopulate: true, required: true })
  public mentor: Ref<Mentor>;

  @prop({ ref: "Parent", autopopulate: true, required: true })
  public parent: Ref<Parent>;

  @prop({ ref: "Student", autopopulate: true, required: true })
  public student: Ref<Student>;

  @prop({ default: [] })
  public sessions: ISession[];
}

const MentorshipModel = getModelForClass(Mentorship);

export default MentorshipModel;
