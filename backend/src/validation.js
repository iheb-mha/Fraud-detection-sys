import { z } from 'zod';

const vFields = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);
const vSchema = z.object(
  Object.fromEntries(vFields.map(k => [k, z.number().finite().optional()]))
).partial();

export const transactionSchema = z.object({
  amount: z.number().min(0),
  time: z.number().int().nonnegative().optional(),
  card_present: z.boolean(),
  country_mismatch: z.boolean(),
  velocity_5m: z.number().int().nonnegative().optional(),
  v: vSchema.optional()
});

// Schema for Python model /predict input: requires all PCA features plus Time, Amount
const featureShape = {
  Time: z.number().finite(),
  Amount: z.number().finite().min(0)
};
for (let i = 1; i <= 28; i++) {
  featureShape[`V${i}`] = z.number().finite();
}

export const modelFeaturesSchema = z.object(featureShape);
