import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import * as T from "./types";
import * as A from "./api";
import * as F from "./fixtures";

const pairs: [string, ZodType, unknown][] = [
  ["Staff", T.Staff, F.staffFixture],
  ["Engagement", T.Engagement, F.engagementFixture],
  ["TimesheetLine", T.TimesheetLine, F.timesheetLineFixture],
  ["TaskScore", T.TaskScore, F.taskScoreFixture],
  ["JobExposure", T.JobExposure, F.jobExposureFixture],
  ["Deadline", T.Deadline, F.deadlineFixture],
  ["UsageRecord", T.UsageRecord, F.usageRecordFixture],
  ["CatalogueItem", T.CatalogueItem, F.catalogueItemFixture],
  ["Recommendation", T.Recommendation, F.recommendationFixture],
  ["AthenaQuestion", T.AthenaQuestion, F.athenaQuestionFixture],
  ["AthenaResult", T.AthenaResult, F.athenaResultFixture],
  ["MeterReading", T.MeterReading, F.meterReadingFixture],
  ["LiteracyLogEntry", T.LiteracyLogEntry, F.literacyLogEntryFixture],
  ...F.sourcedNumberFixtures.map((n, i): [string, ZodType, unknown] => [`SourcedNumber ${i}`, T.SourcedNumber, n]),
  ["AthenaRequest", A.AthenaRequest, F.athenaRequestFixture],
  ["AthenaResponse", A.AthenaResponse, F.athenaResponseFixture],
  ["AskRequest", A.AskRequest, F.askRequestFixture],
  ["AskResponse", A.AskResponse, F.askResponseFixture],
];

describe("contract fixtures", () => {
  it.each(pairs)("%s fixture parses with its schema", (_name, schema, fixture) => {
    const result = schema.safeParse(fixture);
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.success).toBe(true);
  });
});

describe("ground rules", () => {
  it("rejects a real number with no source", () => {
    expect(T.SourcedNumber.safeParse({ label: "x", value: 1, unit: "h", synthetic: false }).success).toBe(false);
  });

  it("rejects a TaskScore with no source URL", () => {
    expect(T.TaskScore.safeParse({ ...F.taskScoreFixture, source: "not a url" }).success).toBe(false);
  });

  it("allows a null price in a meter reading", () => {
    expect(T.MeterReading.safeParse({ ...F.meterReadingFixture, euros: null }).success).toBe(true);
  });

  it("rejects a recommendation reason of 30 words or more", () => {
    const reason = Array(30).fill("word").join(" ");
    expect(T.Recommendation.safeParse({ ...F.recommendationFixture, reason }).success).toBe(false);
  });

  it("rejects an ask answer over 80 words", () => {
    const answer = Array(81).fill("word").join(" ");
    expect(A.AskResponse.safeParse({ ...F.askResponseFixture, answer }).success).toBe(false);
  });

  it("defaults a deadline's checked flag to true and athenaAnswers to empty", () => {
    const { checked: _c, ...rest } = F.deadlineFixture;
    expect(T.Deadline.parse(rest).checked).toBe(true);
    expect(A.AskRequest.parse({ question: "q", view: "partner" }).athenaAnswers).toEqual([]);
  });

  it("marks every made-up Frame fixture synthetic", () => {
    for (const f of [F.staffFixture, F.engagementFixture, F.timesheetLineFixture, F.usageRecordFixture, F.recommendationFixture]) {
      expect(f.synthetic).toBe(true);
    }
  });
});
