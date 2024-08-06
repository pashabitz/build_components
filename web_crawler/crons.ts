import { cronJobs } from "convex/server";
import { functions } from "./_generated/api";

const crons = cronJobs();
// crons.interval(
//     "periodicFetch",
//     { seconds: 5 },
//     functions.fetching.periodicFetch,
// );
export default crons;