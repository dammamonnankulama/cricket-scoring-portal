import { Schema, models, model } from "mongoose";

export type PlayerRole = "batsman" | "bowler" | "wicketkeeper" | "allrounder";

const PlayerSchema = new Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["batsman", "bowler", "wicketkeeper", "allrounder"],
    required: true,
  },
});

const SquadSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    logoUrl: { type: String, default: null },
    players: {
      type: [PlayerSchema],
      validate: [(arr: any[]) => arr.length > 0 && arr.length <= 15, "Squad must have 1–15 players"],
    },
    defaultCaptainName: { type: String, default: null },
    defaultWicketkeeperName: { type: String, default: null },
  },
  { timestamps: true }
);

export default models.Squad || model("Squad", SquadSchema);
