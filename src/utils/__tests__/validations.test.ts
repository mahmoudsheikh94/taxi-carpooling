import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  tripSchema,
  resetPasswordSchema,
  validateEmail,
  validatePhone,
  validatePassword,
} from '../validations';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true);
      expect(validatePhone('+44123456789')).toBe(true);
      expect(validatePhone('+33123456789')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123456789')).toBe(false); // No + prefix
      expect(validatePhone('+123')).toBe(false); // Too short
      expect(validatePhone('+123456789012345')).toBe(false); // Too long
      expect(validatePhone('abc123')).toBe(false); // Contains letters
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MyPassword1')).toBe(true);
      expect(validatePassword('Test123456')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false); // Too short
      expect(validatePassword('onlylowercase')).toBe(false); // No uppercase or numbers
      expect(validatePassword('ONLYUPPERCASE')).toBe(false); // No lowercase or numbers
      expect(validatePassword('OnlyLetters')).toBe(false); // No numbers
      expect(validatePassword('123456789')).toBe(false); // Only numbers
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid login data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
        expect(result.error.issues[0].path).toEqual(['email']);
        expect(result.error.issues[1].path).toEqual(['password']);
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        phone: '+1234567890',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
        phone: '+1234567890',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const passwordError = result.error.issues.find(
          issue => issue.message === 'Passwords do not match'
        );
        expect(passwordError).toBeDefined();
      }
    });

    it('should reject invalid registration data', () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'weak',
        phone: 'invalid-phone',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('tripSchema', () => {
    it('should validate correct trip data', () => {
      const validData = {
        pickupLocation: {
          address: '123 Start St, City, State',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        dropoffLocation: {
          address: '456 End Ave, City, State',
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        departureTime: new Date('2024-12-30T10:00:00.000Z'),
        maxPassengers: 3,
        pricePerPerson: 15.00,
        description: 'Test trip description',
      };

      const result = tripSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid trip data', () => {
      const invalidData = {
        pickupLocation: {
          address: '', // Empty address
          coordinates: { lat: 0, lng: 0 }
        },
        dropoffLocation: {
          address: '456 End Ave, City, State',
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        departureTime: new Date('2020-01-01'), // Past date
        maxPassengers: 0, // Invalid passenger count
        pricePerPerson: -5, // Negative price
        description: '',
      };

      const result = tripSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate correct reset password data', () => {
      const validData = {
        password: 'NewStrongPass123!',
        confirmPassword: 'NewStrongPass123!',
      };

      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        password: 'NewStrongPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});