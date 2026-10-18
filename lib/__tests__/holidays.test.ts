import { describe, it, expect } from "vitest";
import {
  addCalendarDays,
  createLocalNoonDate,
  formatDateKey,
  getHolidaysForYear,
  getEffectivePickupDate,
  getPacificCalendarDate,
  getUpcomingPickups,
  parseDayNameToIndex,
} from "@/lib/holidays";

describe("City of San Diego ESD Holiday Slide Engine (lib/holidays.ts)", () => {
  describe("getHolidaysForYear", () => {
    it("calculates the exact 5 observed ESD holidays for 2026", () => {
      const holidays = getHolidaysForYear(2026);
      expect(holidays).toHaveLength(5);

      expect(holidays.map((h) => ({ name: h.name, dateKey: h.dateKey }))).toEqual([
        { name: "New Year's Day", dateKey: "2026-01-01" }, // Thursday
        { name: "Memorial Day", dateKey: "2026-05-25" }, // Last Monday in May
        { name: "Labor Day", dateKey: "2026-09-07" }, // First Monday in Sep
        { name: "Thanksgiving Day", dateKey: "2026-11-26" }, // 4th Thursday in Nov
        { name: "Christmas Day", dateKey: "2026-12-25" }, // Friday
      ]);
    });

    it("calculates the exact 5 observed ESD holidays for 2027 (with Saturday Christmas)", () => {
      const holidays = getHolidaysForYear(2027);
      expect(holidays.map((h) => ({ name: h.name, dateKey: h.dateKey, isWeekday: h.isWeekday }))).toEqual([
        { name: "New Year's Day", dateKey: "2027-01-01", isWeekday: true }, // Friday
        { name: "Memorial Day", dateKey: "2027-05-31", isWeekday: true }, // Last Monday in May
        { name: "Labor Day", dateKey: "2027-09-06", isWeekday: true }, // First Monday in Sep
        { name: "Thanksgiving Day", dateKey: "2027-11-25", isWeekday: true }, // 4th Thursday in Nov
        { name: "Christmas Day", dateKey: "2027-12-25", isWeekday: false }, // Saturday
      ]);
    });
  });

  describe("Thanksgiving Week Slide Logic", () => {
    it("keeps Monday, Tuesday, and Wednesday pickups unaffected before Thanksgiving Thursday", () => {
      // Thanksgiving 2026 is Thursday, Nov 26, 2026
      const mon = getEffectivePickupDate(createLocalNoonDate(2026, 10, 23));
      const tue = getEffectivePickupDate(createLocalNoonDate(2026, 10, 24));
      const wed = getEffectivePickupDate(createLocalNoonDate(2026, 10, 25));

      expect(mon.isDelayed).toBe(false);
      expect(mon.actualDateKey).toBe("2026-11-23");

      expect(tue.isDelayed).toBe(false);
      expect(tue.actualDateKey).toBe("2026-11-24");

      expect(wed.isDelayed).toBe(false);
      expect(wed.actualDateKey).toBe("2026-11-25");
    });

    it("shifts Thursday (Thanksgiving Day) pickup to Friday (+1 day)", () => {
      const thu = getEffectivePickupDate(createLocalNoonDate(2026, 10, 26));
      expect(thu.isDelayed).toBe(true);
      expect(thu.shiftDays).toBe(1);
      expect(thu.holidayName).toBe("Thanksgiving Day");
      expect(thu.originalDateKey).toBe("2026-11-26");
      expect(thu.actualDateKey).toBe("2026-11-27");
      expect(thu.actualDayName).toBe("Friday");
    });

    it("shifts Friday pickup after Thanksgiving (e.g., 7445 Jackson Dr) to Saturday, Nov 28", () => {
      const fri = getEffectivePickupDate(
        createLocalNoonDate(2026, 10, 27),
        "Jackson Dr"
      );
      expect(fri.isDelayed).toBe(true);
      expect(fri.shiftDays).toBe(1);
      expect(fri.holidayName).toBe("Thanksgiving Day");
      expect(fri.originalDateKey).toBe("2026-11-27");
      expect(fri.actualDateKey).toBe("2026-11-28");
      expect(fri.actualDayName).toBe("Saturday");
      expect(fri.alertMessage).toBe(
        "Thanksgiving Day Delay: Your Friday pickup on Jackson Dr moves to Saturday, Nov 28."
      );
    });
  });

  describe("Monday Holidays (Memorial Day & Labor Day)", () => {
    it("shifts all Monday–Friday pickups by +1 day during Memorial Day week 2026", () => {
      // Memorial Day 2026 is Monday, May 25, 2026
      const expected = [
        { scheduledDay: 25, actualDateKey: "2026-05-26", actualDayName: "Tuesday" },
        { scheduledDay: 26, actualDateKey: "2026-05-27", actualDayName: "Wednesday" },
        { scheduledDay: 27, actualDateKey: "2026-05-28", actualDayName: "Thursday" },
        { scheduledDay: 28, actualDateKey: "2026-05-29", actualDayName: "Friday" },
        { scheduledDay: 29, actualDateKey: "2026-05-30", actualDayName: "Saturday" },
      ];

      for (const item of expected) {
        const result = getEffectivePickupDate(
          createLocalNoonDate(2026, 4, item.scheduledDay)
        );
        expect(result.isDelayed).toBe(true);
        expect(result.holidayName).toBe("Memorial Day");
        expect(result.actualDateKey).toBe(item.actualDateKey);
        expect(result.actualDayName).toBe(item.actualDayName);
      }
    });

    it("shifts all Monday–Friday pickups by +1 day during Labor Day week 2026", () => {
      // Labor Day 2026 is Monday, Sep 7, 2026
      const mon = getEffectivePickupDate(createLocalNoonDate(2026, 8, 7));
      const fri = getEffectivePickupDate(createLocalNoonDate(2026, 8, 11));

      expect(mon.isDelayed).toBe(true);
      expect(mon.holidayName).toBe("Labor Day");
      expect(mon.actualDateKey).toBe("2026-09-08");

      expect(fri.isDelayed).toBe(true);
      expect(fri.holidayName).toBe("Labor Day");
      expect(fri.actualDateKey).toBe("2026-09-12");
      expect(fri.actualDayName).toBe("Saturday");
    });
  });

  describe("Fixed-Date Holidays (New Year's Day & Christmas Day) — Weekday vs. Weekend", () => {
    it("handles cross-year week for New Year's Day 2026 (Thursday, Jan 1, 2026)", () => {
      // Week runs Mon Dec 29, 2025 -> Fri Jan 2, 2026
      const wedDec31 = getEffectivePickupDate(createLocalNoonDate(2025, 11, 31));
      const thuJan1 = getEffectivePickupDate(createLocalNoonDate(2026, 0, 1));
      const friJan2 = getEffectivePickupDate(createLocalNoonDate(2026, 0, 2));

      expect(wedDec31.isDelayed).toBe(false);
      expect(wedDec31.actualDateKey).toBe("2025-12-31");

      expect(thuJan1.isDelayed).toBe(true);
      expect(thuJan1.holidayName).toBe("New Year's Day");
      expect(thuJan1.actualDateKey).toBe("2026-01-02");

      expect(friJan2.isDelayed).toBe(true);
      expect(friJan2.holidayName).toBe("New Year's Day");
      expect(friJan2.actualDateKey).toBe("2026-01-03");
      expect(friJan2.actualDayName).toBe("Saturday");
    });

    it("shifts only Friday when Christmas Day falls on Friday (Dec 25, 2026)", () => {
      const thuDec24 = getEffectivePickupDate(createLocalNoonDate(2026, 11, 24));
      const friDec25 = getEffectivePickupDate(createLocalNoonDate(2026, 11, 25));

      expect(thuDec24.isDelayed).toBe(false);
      expect(thuDec24.actualDateKey).toBe("2026-12-24");

      expect(friDec25.isDelayed).toBe(true);
      expect(friDec25.holidayName).toBe("Christmas Day");
      expect(friDec25.actualDateKey).toBe("2026-12-26");
      expect(friDec25.actualDayName).toBe("Saturday");
    });

    it("does NOT shift any pickups when Christmas or New Year's falls on a Saturday or Sunday", () => {
      // Christmas 2027 is Saturday, Dec 25, 2027
      const friBeforeSatXmas = getEffectivePickupDate(
        createLocalNoonDate(2027, 11, 24)
      );
      const monAfterSatXmas = getEffectivePickupDate(
        createLocalNoonDate(2027, 11, 27)
      );
      expect(friBeforeSatXmas.isDelayed).toBe(false);
      expect(monAfterSatXmas.isDelayed).toBe(false);

      // New Year's Day 2023 was Sunday, Jan 1, 2023
      const monJan2_2023 = getEffectivePickupDate(createLocalNoonDate(2023, 0, 2));
      expect(monJan2_2023.isDelayed).toBe(false);
      expect(monJan2_2023.actualDateKey).toBe("2023-01-02");
    });
  });

  describe("getUpcomingPickups & parseDayNameToIndex", () => {
    it("parses weekday strings and numbers accurately", () => {
      expect(parseDayNameToIndex("Monday")).toBe(1);
      expect(parseDayNameToIndex("fri")).toBe(5);
      expect(parseDayNameToIndex(3)).toBe(3);
      expect(() => parseDayNameToIndex("Sunday")).toThrow();
    });

    it("returns a 4-week timeline with holiday slide included", () => {
      // Starting Monday, Nov 16, 2026 for a Friday route
      const upcoming = getUpcomingPickups(
        "Friday",
        createLocalNoonDate(2026, 10, 16),
        4,
        "Jackson Dr"
      );

      expect(upcoming).toHaveLength(4);
      expect(upcoming.map((u) => ({
        original: u.originalDateKey,
        actual: u.actualDateKey,
        isDelayed: u.isDelayed,
      }))).toEqual([
        { original: "2026-11-20", actual: "2026-11-20", isDelayed: false },
        { original: "2026-11-27", actual: "2026-11-28", isDelayed: true }, // Thanksgiving slide
        { original: "2026-12-04", actual: "2026-12-04", isDelayed: false },
        { original: "2026-12-11", actual: "2026-12-11", isDelayed: false },
      ]);
    });
  });

  describe("getPacificCalendarDate (Cron Dispatches in Pacific Time)", () => {
    it("returns Wednesday for 02:00 UTC Thursday (7:00 PM Wednesday PDT)", () => {
      // 02:00 UTC on Thursday Oct 22 is 7:00 PM PDT on Wednesday Oct 21
      const wednesdayNightUtc = new Date("2026-10-22T02:00:00Z");
      const todayPacific = getPacificCalendarDate(wednesdayNightUtc);
      expect(formatDateKey(todayPacific)).toBe("2026-10-21");

      const tomorrow = addCalendarDays(todayPacific, 1);
      expect(formatDateKey(tomorrow)).toBe("2026-10-22");
      expect(tomorrow.getDay()).toBe(4); // Thursday, NOT Friday (5)
    });

    it("returns Thursday for 02:00 UTC Friday (7:00 PM Thursday PDT)", () => {
      // 02:00 UTC on Friday Oct 23 is 7:00 PM PDT on Thursday Oct 22
      const thursdayNightUtc = new Date("2026-10-23T02:00:00Z");
      const todayPacific = getPacificCalendarDate(thursdayNightUtc);
      expect(formatDateKey(todayPacific)).toBe("2026-10-22");

      const tomorrow = addCalendarDays(todayPacific, 1);
      expect(formatDateKey(tomorrow)).toBe("2026-10-23");
      expect(tomorrow.getDay()).toBe(5); // Friday - exactly the night before Friday pickup
    });
  });
});
