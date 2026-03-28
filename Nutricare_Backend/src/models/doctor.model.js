import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      default: "",
    },
    experience: {
      type: Number,
      default: 0,
    },
    qualification: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    hospital: {
      type: String,
      default: "",
    },
    licenseNumber: {
      type: String,
      default: "",
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    patientCapacity: {
      type: Number,
      default: 3,
      min: 1,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    profileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

doctorSchema.index({ authId: 1 }, { unique: true });

export default mongoose.model("Doctor", doctorSchema);
