import React from "react";

import { Container, Grid, ListItem, List, Divider } from "@material-ui/core";

import {
  PronounsVM,
  TimezonesVM,
  SubjectsVM,
  GradeLevelsVM,
  CommunicationPreferencesVM,
} from "../../components/SignUp2/constants";

const SPACING = 1;

const ProfileRow = ({ label, value }) => {
  return (
    <>
      <Grid item sm={6}>
        {label}
        {": "}
      </Grid>
      <Grid item sm={6}>
        {value}{" "}
      </Grid>
    </>
  );
};

export const UserDetails = ({ values }) => {
  const {
    name,
    pronouns,
    email,
    phone,
    communicationPreference,
    region,
  } = values;

  return (
    <Grid container spacing={SPACING}>
      <Grid item sm={12}>
        <h2>User Details</h2>
      </Grid>
      <ProfileRow label={"Name"} value={name} />
      <ProfileRow label={"Pronouns"} value={pronouns} />
      <ProfileRow label={"Email"} value={email} />
      <ProfileRow label={"Phone"} value={phone} />
      <ProfileRow
        label={"Communication Preference"}
        value={CommunicationPreferencesVM[communicationPreference]}
      />
      <ProfileRow label={"Regions"} value={TimezonesVM[region]} />
    </Grid>
  );
};

export const MentorDetails = ({ values }) => {
  const { college, major, bio, subjects, gradeLevels } = values;

  const subjectsJoined = subjects.map((sub) => SubjectsVM[sub]).join(", ");
  const gradeLevelsJoined = gradeLevels
    .map((gl) => GradeLevelsVM[gl])
    .join(", ");

  return (
    <Grid container spacing={SPACING}>
      <Grid item sm={12}>
        <h2>Mentor Details</h2>
      </Grid>
      <ProfileRow label={"College"} value={college} />
      <ProfileRow label={"Major"} value={major} />
      <ProfileRow label={"Bio"} value={bio} />
      <ProfileRow label={"Subjects"} value={subjectsJoined} />
      <ProfileRow label={"Grade Levels"} value={gradeLevelsJoined} />
    </Grid>
  );
};

const StudentDetail = ({ student }) => {
  const subjects = student.subjects.map((sub) => SubjectsVM[sub]).join(", ");
  return (
    <ListItem key={student.name}>
      <Grid container spacing={SPACING}>
        <ProfileRow label="Name" value={student.name} />
        <ProfileRow label="Grade level" value={student.gradeLevel} />
        <ProfileRow label="Subjects" value={subjects} />
      </Grid>
      <Divider />
    </ListItem >
  );
};

export const ParentStudentDetails = ({ values }) => {
  return (
    <Grid container spacing={SPACING}>
      <Grid item sm={12}>
        <h2>Student Details</h2>
      </Grid>
      <Grid item md={12}>
        <List>
          {values.students.map((student) => (
            <StudentDetail student={student} />
          ))}
        </List>
      </Grid>
    </Grid>
  );
};