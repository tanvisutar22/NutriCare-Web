import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ authId: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
