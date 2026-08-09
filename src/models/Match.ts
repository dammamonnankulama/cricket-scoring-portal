import mongoose, { Schema, models, model } from "mongoose";

// A single ball bowled
const DeliverySchema = new Schema(
  {
    overNumber: { type: Number, required: true },
    ballInOver: { type: Number, required: true },
    runs: { type: Number, required: true, default: 0 },
    extraType: {
      type: String,
      enum: ["none", "wide", "noball", "bye", "legbye"],
      default: "none",
    },
    extraRuns: { type: Number, default: 0 },
    isWicket: { type: Boolean, default: false },
    wicketType: {
      type: String,
      enum: [
        "bowled", "caught", "caughtBehind", "caughtAndBowled",
        "runOut", "lbw", "stumped", "retiredHurt", null,
      ],
      default: null,
    },
    isLegalDelivery: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const FallOfWicketSchema = new Schema({
  wicketNumber: Number,
  teamScore: Number,
  overs: String,
  wicketType: String,
});

const InningsSchema = new Schema({
  inningsNumber: { type: Number, required: true },
  battingTeam: { type: String, required: true },
  bowlingTeam: { type: String, required: true },
  totalRuns: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  completedOvers: { type: Number, default: 0 },
  ballsInCurrentOver: { type: Number, default: 0 },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
  },
  fallOfWickets: [FallOfWicketSchema],
  deliveries: [DeliverySchema],
  isCompleted: { type: Boolean, default: false },
});

const MatchSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    team1Name: { type: String, required: true },
    team2Name: { type: String, required: true },
    squad1Id: { type: Schema.Types.ObjectId, ref: "Squad", default: null },
    squad2Id: { type: Schema.Types.ObjectId, ref: "Squad", default: null },
    matchType: { type: String, enum: ["limitedOvers"], default: "limitedOvers" },
    city: { type: String, default: null },
    ground: { type: String, default: null },
    matchDate: { type: Date, default: null },
    ballType: { type: String, enum: ["tennis", "leather", "other"], default: "leather" },
    totalOvers: { type: Number, required: true },
    ballsPerOver: { type: Number, required: true, default: 6 },
    tossWinner: { type: String },
    tossDecision: { type: String, enum: ["bat", "bowl"] },
    status: {
      type: String,
      enum: ["scheduled", "toss_pending", "in_progress", "innings_break", "completed"],
      default: "toss_pending",
    },
    currentInningsNumber: { type: Number, default: 1 },
    innings: [InningsSchema],
    result: { type: String },
  },
  { timestamps: true }
);

export default models.Match || model("Match", MatchSchema);