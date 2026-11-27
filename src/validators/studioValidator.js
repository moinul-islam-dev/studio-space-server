import { z } from "zod";
import { AMENITY_OPTIONS, STUDIO_CATEGORIES } from "../constants/studio.js";

const detailsError = "Please provide all required studio details.";
const pricingError = "Invalid pricing or capacity information.";
const amenitiesError = "Invalid amenities.";
const noTimeRangesError = "At least one available time range is required.";

const requiredText = z.string(detailsError).trim().min(1, detailsError);
const numberField = z.string(pricingError).trim().min(1, pricingError).transform(Number);
const number = z.number(pricingError);

function jsonField(schema, message) {
  return z.string(message).transform((value, ctx) => {
    try {
      return JSON.parse(value);
    } catch {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
  }).pipe(schema);
}

const amenities = z.array(z.enum(AMENITY_OPTIONS, amenitiesError), amenitiesError)
  .refine((items) => new Set(items).size === items.length, amenitiesError);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const timeRange = z.object({ startTime: time, endTime: time })
  .refine(({ startTime, endTime }) => startTime < endTime);

const timeRanges = z.array(z.unknown(), noTimeRangesError)
  .nonempty(noTimeRangesError)
  // Validate the ranges without stripping any extra fields they contain.
  .refine((ranges) => ranges.every((range) => timeRange.safeParse(range).success),
    "Invalid available time range.");

// Schema field order keeps the same first error when multiple fields are invalid.
const studioInput = z.object({
  title: requiredText,
  location: requiredText,
  address: requiredText,
  overview: requiredText,
  category: z.unknown().refine(Boolean, detailsError)
    .pipe(z.enum(STUDIO_CATEGORIES, "Invalid studio category.")),
  hourlyRate: numberField.pipe(number.positive(pricingError)),
  securityDeposit: numberField.pipe(number.nonnegative(pricingError)),
  capacity: numberField.pipe(number.positive(pricingError).refine(Number.isInteger, pricingError)),
  amenities: jsonField(amenities, "Invalid amenities format."),
  availableTimeRanges: jsonField(timeRanges, "Invalid available time ranges format."),
}, detailsError);

export function validateStudioInput(body) {
  const result = studioInput.safeParse(body);
  return result.success ? { data: result.data } : { error: result.error.issues[0].message };
}
