import { z } from "zod";

export const mogipuConfigSchema = z.object({
  gitlabCiFile: z.string(),
  imageName: z.string().optional(),
});

export type MogipuConfig = z.infer<typeof mogipuConfigSchema>;
