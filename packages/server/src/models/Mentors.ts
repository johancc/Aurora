import { plugin, getModelForClass, prop, Ref, modelOptions, Severity } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Mentorship } from "./Mentorships";
import CommunicationPreference from "./CommunicationPreference";
import algoliaPlugin from "mongoose-algolia";
import findUp from "find-up";
import dotenv from "dotenv";

dotenv.config({ path: findUp.sync(".env") });
const { ALGOLIA_APP_ID, ALGOLIA_API_KEY } = process.env;
if (ALGOLIA_API_KEY === undefined || ALGOLIA_APP_ID === undefined) {
  throw new Error(
    `Error initializing Mentor model, missing Algolia credentials.`
  );
}
export interface IMentor {
  _id?: mongoose.Types.ObjectId;
  firebaseUID: string; // Should be autogenerated by client-side firebase.
  name: string;
  email: string;
  region?: string;
  college: string;
  phone?: string;
  pronouns?: string;
  avatar?: string; // Assumed to be a URL
  introduction?: string;
  major: string;
  communicationPreference: CommunicationPreference;
  gradeLevels: string[];
  subjects: string[];
  mentorships?: Ref<Mentorship>;
  lastRequestTime?: number;
  available: boolean;
}

@plugin(algoliaPlugin, {
  appId: ALGOLIA_APP_ID,
  apiKey: ALGOLIA_API_KEY,
  indexName: "mentors",
  debug: true,
})
@modelOptions({options: {allowMixed: Severity.ALLOW}})
export class Mentor implements IMentor {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  public firebaseUID: string;

  @prop({ required: true })
  public name: string;

  @prop({ required: true, unique: true })
  public email: string;

  @prop({ required: false })
  public region?: string;

  // TODO: Validate that the phone number has not been used before.
  @prop({ required: false })
  public phone?: string;

  @prop({ required: false })
  public pronouns?: string;

  @prop({ required: true })
  public college: string;

  @prop({ required: true })
  public subjects: string[];

  @prop({ required: true })
  public major: string;

  @prop({ required: true })
  public communicationPreference: CommunicationPreference;

  @prop({ required: false})
  public lastRequestTime?: number;
  @prop({
    required: true,
    validate: {
      validator: (v) => v.length >= 1,
      message: "Mentor must select at least one grade level.",
    },
    type: String,
  })
  public gradeLevels: string[];

  @prop({ required: false })
  public introduction?: string;

  @prop({ required: false })
  public avatar?: string;

  @prop({ required: false, default: false })
  public available: boolean;
}

const MentorModel = getModelForClass(Mentor);

export default MentorModel;
