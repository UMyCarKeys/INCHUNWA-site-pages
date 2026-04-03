import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const episodes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/episodes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    series: z.string().optional(),
    seasonNumber: z.number().optional(),
    episodeNumber: z.number().optional(),
    episodeType: z.enum(['full', 'trailer', 'bonus']).default('full'),
    duration: z.string(), // HH:MM:SS
    audioUrl: z.string().url(),
    audioLength: z.number().optional(), // bytes for RSS enclosure
    coverImage: z.string().optional(),
    coverImageAlt: z.string().optional(),
    hasTranscript: z.boolean().default(false),
    transcript: z.string().optional(),
    explicit: z.boolean().default(false),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    coverImage: z.string().optional(),
    coverImageAlt: z.string().optional(),
    order: z.number().default(0),
  }),
});

const staff = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/staff' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    photo: z.string().optional(),
    photoAlt: z.string().optional(),
    email: z.string().email().optional(),
    socialLinks: z.array(z.object({
      platform: z.string(),
      url: z.string().url(),
    })).default([]),
    order: z.number().default(0),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    author: z.string(),
    role: z.string().optional(),
    quote: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const funders = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/funders' }),
  schema: z.object({
    name: z.string(),
    logo: z.string().optional(),
    logoAlt: z.string().optional(),
    url: z.string().url().optional(),
    active: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = {
  episodes,
  series,
  staff,
  testimonials,
  funders,
  pages,
};
