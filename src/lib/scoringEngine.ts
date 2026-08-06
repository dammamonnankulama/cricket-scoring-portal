export type ExtraType = "none" | "wide" | "noball" | "bye" | "legbye";
export type WicketType =
  | "bowled" | "caught" | "caughtBehind" | "caughtAndBowled"
  | "runOut" | "lbw" | "stumped" | "retiredHurt";

export interface DeliveryInput {
  runs: number;          // runs off the bat (normal deliveries only)
  extraType: ExtraType;
  extraRuns: number;     // additional runs beyond the mandatory wide/no-ball penalty, or the byes/leg-byes count
  isWicket: boolean;
  wicketType?: WicketType;
}

export interface Delivery extends DeliveryInput {
  overNumber: number;
  ballInOver: number;
  isLegalDelivery: boolean;
}

export interface FallOfWicket {
  wicketNumber: number;
  teamScore: number;
  overs: string;
  wicketType: string;
}

export interface InningsState {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  wickets: number;
  completedOvers: number;
  ballsInCurrentOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  fallOfWickets: FallOfWicket[];
  deliveries: Delivery[];
  isCompleted: boolean;
}

export const MAX_WICKETS = 10;
export function applyDelivery(
  innings: InningsState,
  ballsPerOver: number,
  input: DeliveryInput
): InningsState {
  if (innings.isCompleted) {
    throw new Error("Cannot add a delivery to a completed innings");
  }

  const isLegalDelivery = input.extraType !== "wide" && input.extraType !== "noball";

  let teamRuns: number;
  if (input.extraType === "wide" || input.extraType === "noball") {
    teamRuns = 1 + input.extraRuns;
  } else if (input.extraType === "bye" || input.extraType === "legbye") {
    teamRuns = input.extraRuns;
  } else {
    teamRuns = input.runs;
  }

  const ballInOver = isLegalDelivery ? innings.ballsInCurrentOver + 1 : innings.ballsInCurrentOver;

  const delivery: Delivery = {
    ...input,
    overNumber: innings.completedOvers,
    ballInOver,
    isLegalDelivery,
  };

  const extras = { ...innings.extras };
  if (input.extraType === "wide") extras.wides += 1 + input.extraRuns;
  if (input.extraType === "noball") extras.noBalls += 1 + input.extraRuns;
  if (input.extraType === "bye") extras.byes += input.extraRuns;
  if (input.extraType === "legbye") extras.legByes += input.extraRuns;

  const totalRuns = innings.totalRuns + teamRuns;
  let wickets = innings.wickets;
  let fallOfWickets = innings.fallOfWickets;

  if (input.isWicket) {
    wickets += 1;
    fallOfWickets = [
      ...fallOfWickets,
      {
        wicketNumber: wickets,
        teamScore: totalRuns,
        overs: `${innings.completedOvers}.${ballInOver}`,
        wicketType: input.wicketType || "unknown",
      },
    ];
  }

  let completedOvers = innings.completedOvers;
  let ballsInCurrentOver = innings.ballsInCurrentOver;

  if (isLegalDelivery) {
    ballsInCurrentOver += 1;
    if (ballsInCurrentOver === ballsPerOver) {
      completedOvers += 1;
      ballsInCurrentOver = 0;
    }
  }

  return {
    ...innings,
    totalRuns,
    wickets,
    completedOvers,
    ballsInCurrentOver,
    extras,
    fallOfWickets,
    deliveries: [...innings.deliveries, delivery],
    isCompleted: wickets >= MAX_WICKETS,
  };
}

/** Rebuilds innings state from scratch by replaying every delivery. Used for UNDO. */
export function recomputeInnings(
  deliveries: Delivery[],
  ballsPerOver: number,
  battingTeam: string,
  bowlingTeam: string,
  inningsNumber: number
): InningsState {
  let innings: InningsState = {
    inningsNumber,
    battingTeam,
    bowlingTeam,
    totalRuns: 0,
    wickets: 0,
    completedOvers: 0,
    ballsInCurrentOver: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    fallOfWickets: [],
    deliveries: [],
    isCompleted: false,
  };

  for (const d of deliveries) {
    innings = applyDelivery(innings, ballsPerOver, d);
  }

  return innings;
}

export function checkInningsComplete(
  innings: InningsState,
  totalOvers: number,
  target: number | null
): boolean {
  if (innings.wickets >= MAX_WICKETS) return true;
  if (innings.completedOvers >= totalOvers && innings.ballsInCurrentOver === 0) return true;
  if (target !== null && innings.totalRuns >= target) return true;
  return false;
}
