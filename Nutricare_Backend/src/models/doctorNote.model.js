import mongoose from "mongoose";

const doctorNoteSchema = new mongoose.Schema(
  {
    doctorAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    patientAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    recommendation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

const DoctorNote = mongoose.model("DoctorNote", doctorNoteSchema);

export default DoctorNote;
