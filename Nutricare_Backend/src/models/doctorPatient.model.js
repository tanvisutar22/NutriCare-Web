import mongoose from "mongoose";

const doctorPatientSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },
  },
  { timestamps: true },
);

doctorPatientSchema.index(
  { patientAuthId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

const DoctorPatient = mongoose.model("DoctorPatient", doctorPatientSchema);

export default DoctorPatient;
