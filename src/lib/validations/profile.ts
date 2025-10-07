import { z } from 'zod';

// Profile validation schema
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional()
    .nullable(),
});

// Profile link validation schema
export const profileLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Link title is required" })
    .max(50, { message: "Link title must be less than 50 characters" }),
  url: z
    .string()
    .trim()
    .url({ message: "Invalid URL format" })
    .max(500, { message: "URL must be less than 500 characters" })
    .refine((url) => {
      // Basic URL validation
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }, { message: "Invalid URL format" }),
});

// Validate link matches platform
export const validatePlatformUrl = (title: string, url: string): string | null => {
  const lowerTitle = title.toLowerCase().trim();
  const lowerUrl = url.toLowerCase();

  const platformValidations: Record<string, string[]> = {
    linkedin: ['linkedin.com'],
    github: ['github.com'],
    twitter: ['twitter.com', 'x.com'],
    facebook: ['facebook.com', 'fb.com'],
    instagram: ['instagram.com'],
    youtube: ['youtube.com', 'youtu.be'],
    tiktok: ['tiktok.com'],
    medium: ['medium.com'],
    dev: ['dev.to'],
    stackoverflow: ['stackoverflow.com'],
    dribbble: ['dribbble.com'],
    behance: ['behance.net'],
    website: [], // Allow any URL for generic website
    portfolio: [], // Allow any URL for portfolio
    blog: [], // Allow any URL for blog
  };

  // Check if title matches a known platform
  for (const [platform, domains] of Object.entries(platformValidations)) {
    if (lowerTitle.includes(platform)) {
      // If it's a generic platform (website, portfolio, blog), allow any valid URL
      if (domains.length === 0) {
        return null;
      }
      
      // Check if URL contains the expected domain
      const isValid = domains.some(domain => lowerUrl.includes(domain));
      if (!isValid) {
        return `URL must be a valid ${platform.charAt(0).toUpperCase() + platform.slice(1)} link`;
      }
      return null;
    }
  }

  // If no specific platform is detected, allow any valid URL
  return null;
};

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProfileLinkFormData = z.infer<typeof profileLinkSchema>;
