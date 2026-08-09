export type ExtraType = "none" | "wide" | "noball" | "bye" | "legbye";
export type WicketType =
  | "bowled" | "caught" | "caughtBehind" | "caughtAndBowled"
  | "runOut" | "lbw" | "stumped" | "retiredHurt";

export interface DeliveryInput {
  runs: number;
  extraType: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  strikerName?: string | null;
  nonStrikerName?: string | null;
  bowlerName?: string | null;
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
  batterName?: string | null;
}

export interface BattingEntry {
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: string | null;
}

export interface BowlingEntry {
  name: string;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
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
  isSquadBased?: boolean;
  openingStriker?: string | null;
  openingNonStriker?: string | null;
  openingBowler?: string | null;
  battingCard?: Record<string, BattingEntry>;
  bowlingCard?: Record<string, BowlingEntry>;
}

export const MAX_WICKETS = 10;

function ensureBatter(card: Record<string, BattingEntry>, name: string) {
  if (!card[name]) {
    card[name] = { name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null };
  }
}

function ensureBowler(card: Record<string, BowlingEntry>, name: string) {
  if (!card[name]) {
    card[name] = { name, legalBalls: 0, runsConceded: 0, wickets: 0 };
  }
}

export function applyDelivery(
  innings: InningsState,
  ballsPerOver: number,
  input: DeliveryInput
): InningsState {
  if (innings.isCompleted) {
    throw new Error("Cannot add a delivery to a completed innings");
  }
  if (innings.isSquadBased && (!input.strikerName || !input.nonStrikerName || !input.bowlerName)) {
    throw new Error("Striker, non-striker, and bowler are required for a squad-based innings");
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

  const battingCard = { ...(innings.battingCard || {}) };
  const bowlingCard = { ...(innings.bowlingCard || {}) };

  if (innings.isSquadBased) {
    const striker = input.strikerName as string;
    const bowler = input.bowlerName as string;
    ensureBatter(battingCard, striker);
    ensureBowler(bowlingCard, bowler);

    // Balls faced: everything except wides
    if (input.extraType !== "wide") {
      battingCard[striker] = { ...battingCard[striker], ballsFaced: battingCard[striker].ballsFaced + 1 };
    }

    // Runs credited to the batter: normal deliveries + runs actually struck off a no-ball
    const batterRuns =
      input.extraType === "none" ? input.runs : input.extraType === "noball" ? input.extraRuns : 0;
    if (batterRuns > 0) {
      battingCard[striker] = {
        ...battingCard[striker],
        runs: battingCard[striker].runs + batterRuns,
        fours: battingCard[striker].fours + (batterRuns === 4 ? 1 : 0),
        sixes: battingCard[striker].sixes + (batterRuns === 6 ? 1 : 0),
      };
    }

    // Bowler figures: legal balls, runs conceded (excludes byes/leg-byes), wickets (excludes run out)
    if (isLegalDelivery) {
      bowlingCard[bowler] = { ...bowlingCard[bowler], legalBalls: bowlingCard[bowler].legalBalls + 1 };
    }
    const runsOffBowler =
      input.extraType === "bye" || input.extraType === "legbye" ? 0 : teamRuns;
    bowlingCard[bowler] = { ...bowlingCard[bowler], runsConceded: bowlingCard[bowler].runsConceded + runsOffBowler };

    if (input.isWicket && input.wicketType !== "runOut") {
      bowlingCard[bowler] = { ...bowlingCard[bowler], wickets: bowlingCard[bowler].wickets + 1 };
    }

    if (input.isWicket) {
      battingCard[striker] = { ...battingCard[striker], isOut: true, dismissalType: input.wicketType || null };
    }
  }

  if (input.isWicket) {
    wickets += 1;
    fallOfWickets = [
      ...fallOfWickets,
      {
        wicketNumber: wickets,
        teamScore: totalRuns,
        overs: `${innings.completedOvers}.${ballInOver}`,
        wicketType: input.wicketType || "unknown",
        batterName: input.strikerName || null,
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
    battingCard,
    bowlingCard,
  };
}

/** Determines who should face the next ball, purely from the last delivery + rotation rules. */
export function deriveNextFacing(innings: InningsState): {
  striker: string | null;
  nonStriker: string | null;
  bowler: string | null;
  needsNewBatter: boolean;
  needsNewBowler: boolean;
  previousBowlerName: string | null;
} {
  const deliveries = innings.deliveries;

  if (deliveries.length === 0) {
    return { striker: null, nonStriker: null, bowler: null, needsNewBatter: false, needsNewBowler: false, previousBowlerName: null };
  }

  const last = deliveries[deliveries.length - 1];
  const overJustCompleted = last.isLegalDelivery && innings.ballsInCurrentOver === 0;

  let striker: string | null;
  let nonStriker: string | null;
  let needsNewBatter = false;

  if (last.isWicket) {
    needsNewBatter = true;
    if (overJustCompleted) {
      // Ends swap: the not-out survivor takes strike for the new over; new batter fills the vacated end
      striker = last.nonStrikerName ?? null;
      nonStriker = null;
    } else {
      // Replacement takes the dismissed batter's (striker's) end
      striker = null;
      nonStriker = last.nonStrikerName ?? null;
    }
  } else {
    const runsRun =
      last.extraType === "wide" || last.extraType === "noball" || last.extraType === "bye" || last.extraType === "legbye"
        ? last.extraRuns
        : last.runs;
    let s = last.strikerName ?? null;
    let ns = last.nonStrikerName ?? null;
    if (runsRun % 2 === 1) [s, ns] = [ns, s];
    if (overJustCompleted) [s, ns] = [ns, s];
    striker = s;
    nonStriker = ns;
  }

  const needsNewBowler = overJustCompleted;
  const bowler = needsNewBowler ? null : last.bowlerName ?? null;

  return {
    striker,
    nonStriker,
    bowler,
    needsNewBatter,
    needsNewBowler,
    previousBowlerName: overJustCompleted ? last.bowlerName ?? null : null,
  };
}

export function recomputeInnings(
  deliveries: Delivery[],
  ballsPerOver: number,
  battingTeam: string,
  bowlingTeam: string,
  inningsNumber: number,
  isSquadBased: boolean = false
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
    isSquadBased,
    battingCard: {},
    bowlingCard: {},
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
