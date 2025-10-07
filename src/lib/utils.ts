import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateLinkUrl(title: string, url: string): string | null {
  if (!url) return "URL is required";
  
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  // URL format validation
  try {
    new URL(url);
  } catch {
    return "Invalid URL format";
  }
  
  // Platform-specific validation
  if (lowerTitle.includes('linkedin')) {
    if (!lowerUrl.includes('linkedin.com')) {
      return "LinkedIn URL must contain linkedin.com";
    }
  } else if (lowerTitle.includes('github')) {
    if (!lowerUrl.includes('github.com')) {
      return "GitHub URL must contain github.com";
    }
  } else if (lowerTitle.includes('twitter') || lowerTitle.includes('x')) {
    if (!lowerUrl.includes('twitter.com') && !lowerUrl.includes('x.com')) {
      return "Twitter/X URL must contain twitter.com or x.com";
    }
  } else if (lowerTitle.includes('facebook')) {
    if (!lowerUrl.includes('facebook.com')) {
      return "Facebook URL must contain facebook.com";
    }
  } else if (lowerTitle.includes('instagram')) {
    if (!lowerUrl.includes('instagram.com')) {
      return "Instagram URL must contain instagram.com";
    }
  } else if (lowerTitle.includes('youtube')) {
    if (!lowerUrl.includes('youtube.com') && !lowerUrl.includes('youtu.be')) {
      return "YouTube URL must contain youtube.com or youtu.be";
    }
  }
  
  return null;
}
