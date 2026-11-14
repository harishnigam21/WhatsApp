// mongooseLogger.ts
import mongoose, { Schema } from "mongoose";
import path from "path";

const operationLabels: Record<string, string> = {
  save: "document saved/created",
  insertMany: "documents inserted",
  find: "documents fetched (find)",
  findOne: "document fetched (findOne)",
  findOneAndUpdate: "document updated",
  updateOne: "document updated",
  updateMany: "documents updated",
  replaceOne: "document replaced",
  findOneAndReplace: "document replaced",
  deleteOne: "document deleted",
  deleteMany: "documents deleted",
  findOneAndDelete: "document deleted",
  remove: "document removed",
  countDocuments: "documents counted",
  estimatedDocumentCount: "documents counted",
  distinct: "distinct query run",
  aggregate: "aggregation run",
  bulkWrite: "bulk operation run",
};

// Format time with milliseconds in IST (e.g., 07:18:42.105 pm)
const formatTimeWithMs = (date: Date): string => {
  const timePart = date.toLocaleTimeString("en-IN", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  // Insert .SSS right before am/pm
  return timePart.replace(/(\d{2}:\d{2}:\d{2})/, `$1.${ms}`);
};

const getCallerLocation = (): string => {
  const stack = new Error().stack?.split("\n") || [];

  for (const line of stack) {
    if (
      line.includes("at ") &&
      !line.includes("node_modules") &&
      !line.includes("node:internal") &&
      !line.includes("internal/") &&
      !line.includes("mongooseLogger")
    ) {
      const match =
        line.match(/\((.+):(\d+):(\d+)\)/) ||
        line.match(/at\s+(.+):(\d+):(\d+)/);

      if (match) {
        const fullPath = match[1].replace(/^file:\/\/\/?/, "");
        const lineNumber = match[2];
        const relativePath = path.relative(process.cwd(), fullPath);
        return `${relativePath}:${lineNumber}`;
      }
    }
  }

  return "unknown file";
};

let querySeq = 0;
let isPatched = false;

const initQueryMeta = (target: any) => {
  if (!target._querySeq) {
    target._querySeq = ++querySeq;
    target._calledAt = formatTimeWithMs(new Date());
    target._startTime = performance.now();
    target._callerFile = getCallerLocation();
  }
};

const patchMongooseCallers = () => {
  if (isPatched) return;
  isPatched = true;

  const originalExec = mongoose.Query.prototype.exec;
  mongoose.Query.prototype.exec = function (this: any, ...args: any[]) {
    initQueryMeta(this);
    return originalExec.apply(this, args as any);
  };

  const originalSave = mongoose.Model.prototype.save;
  mongoose.Model.prototype.save = function (this: any, ...args: any[]) {
    initQueryMeta(this);
    return originalSave.apply(this, args as any);
  };

  const originalAggExec = mongoose.Aggregate.prototype.exec;
  mongoose.Aggregate.prototype.exec = function (this: any, ...args: any[]) {
    initQueryMeta(this);
    return originalAggExec.apply(this, args as any);
  };
};

export const mongooseLoggerPlugin = (schema: Schema): void => {
  patchMongooseCallers();

  Object.keys(operationLabels).forEach((op) => {
    schema.pre(op as any, function (this: any) {
      initQueryMeta(this);
    });

    schema.post(op as any, function (this: any) {
      if (!this._startTime) return;

      const durationMs = (performance.now() - this._startTime).toFixed(2);
      const modelName: string =
        this.model?.modelName ||
        this.constructor?.modelName ||
        this.modelName ||
        "UnknownModel";

      const action = operationLabels[op];
      const caller = this._callerFile || "unknown file";
      const seq = this._querySeq;
      const calledAt = this._calledAt;

      console.log(
        `[#${seq}] ${action} ---- in ${modelName} --- in ${durationMs}ms --- called at ${calledAt} --- from ${caller}`
      );
    });
  });
};
