import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Scale, ArrowLeft, Briefcase, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LawyerRegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  barNumber: string;
  barState: string;
  yearsOfExperience: number;
  specialization: string[];
  education: string;
  lawSchool: string;
  graduationYear: string;
  languages: string[];
  agreeToTerms: boolean;
}

// Updated to align with backend enum and shared LegalDomain union
const SPECIALIZATION_OPTIONS = [
  'Civil Law',
  'Criminal Law',
  'Corporate Law',
  'Family Law',
  'Property Law',
  'Constitutional Law',
  'Tax Law',
  'Intellectual Property',
  'Labor Law',
  'Environmental Law',
  'Banking Law',
  'Insurance Law',
  'Real Estate Law',
  'Immigration Law',
  'Consumer Law',
  'Cyber Law',
  'Media Law',
  'Sports Law',
  'Healthcare Law',
  'Education Law'
];

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Bengali',
  'Urdu',
  'Other'
];

export default function LawyerRegistration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<LawyerRegistrationFormData>();

  const password = watch('password');

  const onSubmit = async (data: LawyerRegistrationFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!data.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    if (!data.specialization || data.specialization.length === 0) {
      toast.error('Please select at least one specialization');
      return;
    }
    
    if (!data.languages || data.languages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }

    setIsLoading(true);
    try {
  const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        dateOfBirth: data.dateOfBirth,
        barNumber: data.barNumber,
        barState: data.barState,
  // Map to backend field name via AuthContext transformation
  yearsOfExperience: Number(data.yearsOfExperience),
        specialization: data.specialization,
        education: data.education,
        lawSchool: data.lawSchool,
        graduationYear: data.graduationYear,
        languages: data.languages,
        role: 'lawyer' as const,
        agreeToTerms: data.agreeToTerms,
        isVerified: false // Lawyers need admin verification
      };

      await registerUser(userData);
      toast.success('Registration successful! Your account will be reviewed by our team for verification.');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scale className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Lawyer Registration
          </h2>
          <p className="mt-2 text-gray-600">
            Join our network of qualified legal professionals
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/auth/register"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Role Selection
          </Link>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className={`input-field ${
                      errors.firstName ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="Enter your first name"
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`input-field ${
                      errors.lastName ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="Enter your last name"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={`input-field pl-10 ${
                        errors.email ? 'border-error-500 focus:ring-error-500' : ''
                      }`}
                      placeholder="Enter your email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      className={`input-field pl-10 ${
                        errors.phone ? 'border-error-500 focus:ring-error-500' : ''
                      }`}
                      placeholder="Enter your phone number"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[\+]?[1-9][\d]{0,15}$/,
                          message: 'Invalid phone number'
                        }
                      })}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="dateOfBirth" className="form-label">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={`input-field ${
                    errors.dateOfBirth ? 'border-error-500 focus:ring-error-500' : ''
                  }`}
                  {...register('dateOfBirth', {
                    required: 'Date of birth is required'
                  })}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-error-600">{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                Address Information
              </h3>
              
              <div>
                <label htmlFor="address" className="form-label">
                  Street Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="address"
                    type="text"
                    className={`input-field pl-10 ${
                      errors.address ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="Enter your street address"
                    {...register('address', {
                      required: 'Address is required'
                    })}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-error-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    className={`input-field ${
                      errors.city ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="City"
                    {...register('city', {
                      required: 'City is required'
                    })}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-error-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="form-label">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    className={`input-field ${
                      errors.state ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="State"
                    {...register('state', {
                      required: 'State is required'
                    })}
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-error-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="zipCode" className="form-label">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    className={`input-field ${
                      errors.zipCode ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="ZIP Code"
                    {...register('zipCode', {
                      required: 'ZIP Code is required',
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/,
                        message: 'Invalid ZIP Code'
                      }
                    })}
                  />
                  {errors.zipCode && (
                    <p className="mt-1 text-sm text-error-600">{errors.zipCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
                Professional Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="barNumber" className="form-label">
                    Bar Number
                  </label>
                  <input
                    id="barNumber"
                    type="text"
                    className={`input-field ${
                      errors.barNumber ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="Enter your bar number"
                    {...register('barNumber', {
                      required: 'Bar number is required'
                    })}
                  />
                  {errors.barNumber && (
                    <p className="mt-1 text-sm text-error-600">{errors.barNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="barState" className="form-label">
                    Bar State
                  </label>
                  <input
                    id="barState"
                    type="text"
                    className={`input-field ${
                      errors.barState ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="State where you're licensed"
                    {...register('barState', {
                      required: 'Bar state is required'
                    })}
                  />
                  {errors.barState && (
                    <p className="mt-1 text-sm text-error-600">{errors.barState.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="yearsOfExperience" className="form-label">
                    Years of Experience
                  </label>
                  <input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    max="50"
                    className={`input-field ${
                      errors.yearsOfExperience ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="Years of practice"
                    {...register('yearsOfExperience', {
                      required: 'Years of experience is required',
                      min: {
                        value: 0,
                        message: 'Years of experience cannot be negative'
                      },
                      max: {
                        value: 50,
                        message: 'Years of experience cannot exceed 50'
                      }
                    })}
                  />
                  {errors.yearsOfExperience && (
                    <p className="mt-1 text-sm text-error-600">{errors.yearsOfExperience.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="graduationYear" className="form-label">
                    Law School Graduation Year
                  </label>
                  <input
                    id="graduationYear"
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    className={`input-field ${
                      errors.graduationYear ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                    placeholder="Year of graduation"
                    {...register('graduationYear', {
                      required: 'Graduation year is required',
                      min: {
                        value: 1950,
                        message: 'Graduation year must be after 1950'
                      },
                      max: {
                        value: new Date().getFullYear(),
                        message: 'Graduation year cannot be in the future'
                      }
                    })}
                  />
                  {errors.graduationYear && (
                    <p className="mt-1 text-sm text-error-600">{errors.graduationYear.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="lawSchool" className="form-label">
                  Law School
                </label>
                <input
                  id="lawSchool"
                  type="text"
                  className={`input-field ${
                    errors.lawSchool ? 'border-error-500 focus:ring-error-500' : ''
                  }`}
                  placeholder="Name of your law school"
                  {...register('lawSchool', {
                    required: 'Law school is required'
                  })}
                />
                {errors.lawSchool && (
                  <p className="mt-1 text-sm text-error-600">{errors.lawSchool.message}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="education" className="form-label">
                  Additional Education
                </label>
                <textarea
                  id="education"
                  rows={3}
                  className={`input-field ${
                    errors.education ? 'border-error-500 focus:ring-error-500' : ''
                  }`}
                  placeholder="Any additional degrees, certifications, or relevant education"
                  {...register('education')}
                />
                {errors.education && (
                  <p className="mt-1 text-sm text-error-600">{errors.education.message}</p>
                )}
              </div>
            </div>

            {/* Specialization and Languages */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-primary-600" />
                Areas of Expertise
              </h3>
              
              <div>
                <label className="form-label">
                  Legal Specializations
                </label>
                <div className="grid md:grid-cols-3 gap-2 mt-2">
                  {SPECIALIZATION_OPTIONS.map((specialization) => (
                    <label key={specialization} className="flex items-center">
                      <input
                        type="checkbox"
                        value={specialization}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                        {...register('specialization', {
                          required: 'Please select at least one specialization'
                        })}
                      />
                      <span className="text-sm text-gray-700">{specialization}</span>
                    </label>
                  ))}
                </div>
                {errors.specialization && (
                  <p className="mt-1 text-sm text-error-600">{errors.specialization.message}</p>
                )}
              </div>

              <div className="mt-6">
                <label className="form-label">
                  Languages Spoken
                </label>
                <div className="grid md:grid-cols-3 gap-2 mt-2">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <label key={language} className="flex items-center">
                      <input
                        type="checkbox"
                        value={language}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                        {...register('languages', {
                          required: 'Please select at least one language'
                        })}
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
                {errors.languages && (
                  <p className="mt-1 text-sm text-error-600">{errors.languages.message}</p>
                )}
              </div>
            </div>

            {/* Password Fields */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary-600" />
                Account Security
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`input-field pl-10 pr-10 ${
                        errors.password ? 'border-error-500 focus:ring-error-500' : ''
                      }`}
                      placeholder="Create a password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                        }
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`input-field pl-10 pr-10 ${
                        errors.confirmPassword ? 'border-error-500 focus:ring-error-500' : ''
                      }`}
                      placeholder="Confirm your password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms and conditions'
                  })}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-700">
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Privacy Policy
                  </Link>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-error-600">{errors.agreeToTerms.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center"
              >
                                 {isLoading ? (
                   <div className="flex items-center justify-center">
                     <div className="loading-spinner mr-2"></div>
                     <span>Creating Account...</span>
                   </div>
                 ) : (
                   'Create Lawyer Account'
                 )}
              </button>
            </div>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
