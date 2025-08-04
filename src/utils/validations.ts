import { z } from 'zod';

// Base validation schemas
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile schemas
export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
      message: 'Please enter a valid phone number',
    }),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 18 && age <= 100;
    }, {
      message: 'You must be between 18 and 100 years old',
    }),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// User preferences schema
export const preferencesSchema = z.object({
  max_detour_distance: z
    .number()
    .min(1, 'Distance must be at least 1km')
    .max(50, 'Distance must be less than 50km'),
  max_detour_time: z
    .number()
    .min(5, 'Time must be at least 5 minutes')
    .max(120, 'Time must be less than 120 minutes'),
  max_walking_distance: z
    .number()
    .min(100, 'Walking distance must be at least 100 meters')
    .max(2000, 'Walking distance must be less than 2000 meters'),
  time_flexibility: z
    .number()
    .min(0, 'Time flexibility cannot be negative')
    .max(60, 'Time flexibility must be less than 60 minutes'),
  price_range_min: z
    .number()
    .min(0, 'Minimum price cannot be negative'),
  price_range_max: z
    .number()
    .min(1, 'Maximum price must be at least $1'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  smoking_preference: z.enum(['yes', 'no', 'indifferent']),
  pets_preference: z.boolean(),
  music_preference: z.enum(['yes', 'no', 'indifferent']),
  conversation_level: z.enum(['chatty', 'quiet', 'indifferent']),
  gender_preference: z.enum(['same', 'any']),
  min_age: z
    .number()
    .min(18, 'Minimum age must be at least 18')
    .max(100, 'Minimum age must be less than 100')
    .optional(),
  max_age: z
    .number()
    .min(18, 'Maximum age must be at least 18')
    .max(100, 'Maximum age must be less than 100')
    .optional(),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  notify_new_matches: z.boolean(),
  notify_trip_requests: z.boolean(),
  notify_messages: z.boolean(),
  notify_trip_updates: z.boolean(),
}).refine((data) => {
  if (data.min_age && data.max_age) {
    return data.min_age <= data.max_age;
  }
  return true;
}, {
  message: 'Minimum age must be less than or equal to maximum age',
  path: ['max_age'],
}).refine((data) => {
  return data.price_range_min <= data.price_range_max;
}, {
  message: 'Minimum price must be less than or equal to maximum price',
  path: ['price_range_max'],
});

// Trip validation schemas
export const locationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  placeId: z.string().min(1, 'Place ID is required'),
  name: z.string().optional(),
  types: z.array(z.string()).optional(),
});

export const tripSchema = z.object({
  origin: z.string().min(3, 'Origin must be at least 3 characters'),
  destination: z.string().min(3, 'Destination must be at least 3 characters'),
  origin_location: locationSchema,
  destination_location: locationSchema,
  departure_time: z.string().refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      return date > now;
    },
    { message: 'Departure time must be in the future' }
  ),
  max_passengers: z
    .number()
    .min(1, 'Must have at least 1 passenger')
    .max(8, 'Cannot exceed 8 passengers'),
  price_per_seat: z.number().optional(),
  currency: z.string().optional().default('USD'),
  payment_method: z.string().optional(),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  smoking_allowed: z.boolean().default(false),
  pets_allowed: z.boolean().default(true),
  music_preference: z.enum(['yes', 'no', 'indifferent']).default('indifferent'),
  conversation_level: z.enum(['chatty', 'quiet', 'indifferent']).default('indifferent'),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_color: z.string().optional(),
  vehicle_plate: z.string().optional(),
});

export const tripUpdateSchema = tripSchema.partial().extend({
  id: z.string().min(1, 'Trip ID is required'),
});

export const tripFilterSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  departure_date: z.string().optional(),
  min_departure_time: z.string().optional(),
  max_departure_time: z.string().optional(),
  max_passengers: z.number().min(1).max(8).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  smoking_allowed: z.boolean().optional(),
  pets_allowed: z.boolean().optional(),
  music_preference: z.enum(['yes', 'no', 'indifferent']).optional(),
  conversation_level: z.enum(['chatty', 'quiet', 'indifferent']).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  user_id: z.string().optional(),
});

// Type inference for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type TripFormData = z.infer<typeof tripSchema>;
export type TripUpdateFormData = z.infer<typeof tripUpdateSchema>;
export type TripFilterFormData = z.infer<typeof tripFilterSchema>;