import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, FileText, MapPin, DollarSign, Calendar, Tag, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CaseForm, LegalDomain } from '@/types';

const LEGAL_DOMAINS: LegalDomain[] = [
  'Civil Law', 'Criminal Law', 'Corporate Law', 'Family Law',
  'Property Law', 'Constitutional Law', 'Tax Law', 'Intellectual Property',
  'Labor Law', 'Environmental Law', 'Banking Law', 'Insurance Law',
  'Real Estate Law', 'Immigration Law', 'Consumer Law', 'Cyber Law',
  'Media Law', 'Sports Law', 'Healthcare Law', 'Education Law'
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' }
];

export default function CreateCase() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CaseForm>();

  const priority = watch('priority');
  const budget = watch('budget');

  // Redirect if not authenticated or not a client
  if (!isAuthenticated || user?.role !== 'client') {
    router.push('/auth/login');
    return null;
  }

  const onSubmit = async (data: CaseForm) => {
    setIsLoading(true);
    try {
      // Prepare case data
      // Ensure tags is always an array before filtering
      let tagsArray: string[] = [];
      if (Array.isArray(data.tags)) {
          tagsArray = data.tags.filter((tag: string) => tag.trim());
      } else if (typeof data.tags === 'string') {
        tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
      const caseData = {
        ...data,
        tags: tagsArray,
          estimatedDuration: typeof data.estimatedDuration === 'number' ? data.estimatedDuration : undefined
      };

      // Create case via API
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(caseData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Case created successfully!');
        // Save new case ID to localStorage
        if (result.data && result.data._id) {
          localStorage.setItem('lastCaseId', result.data._id);
        }
        // Redirect to matched lawyers page
        router.push('/lawyers/matches');
      } else {
        throw new Error(result.message || 'Failed to create case');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create case');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Create New Case</h1>
            </div>
          </div>
          <p className="text-gray-600 ml-12">
            Provide detailed information about your legal case to help us find the right lawyer for you.
          </p>
        </div>

        {/* Case Creation Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            
            {/* Basic Case Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                Case Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="form-label">
                    Case Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className={`input-field ${errors.title ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Brief description of your case"
                    {...register('title', {
                      required: 'Case title is required',
                      minLength: { value: 10, message: 'Title must be at least 10 characters' },
                      maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
                    })}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-error-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="form-label">
                    Legal Category *
                  </label>
                  <select
                    id="category"
                    className={`input-field ${errors.category ? 'border-error-500 focus:ring-error-500' : ''}`}
                    {...register('category', { required: 'Legal category is required' })}
                  >
                    <option value="">Select a category</option>
                    {LEGAL_DOMAINS.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-error-600">{errors.category.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="form-label">
                    Case Description *
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    className={`input-field ${errors.description ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Provide a detailed description of your legal issue, including relevant facts, timeline, and what you hope to achieve..."
                    {...register('description', {
                      required: 'Case description is required',
                      minLength: { value: 50, message: 'Description must be at least 50 characters' },
                      maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
                    })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="priority" className="form-label">
                    Priority Level *
                  </label>
                  <select
                    id="priority"
                    className={`input-field ${errors.priority ? 'border-error-500 focus:ring-error-500' : ''}`}
                    {...register('priority', { required: 'Priority level is required' })}
                  >
                    <option value="">Select priority</option>
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-error-600">{errors.priority.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="estimatedDuration" className="form-label">
                    Estimated Duration (days)
                  </label>
                  <input
                    id="estimatedDuration"
                    type="number"
                    min="1"
                    max="365"
                    className={`input-field ${errors.estimatedDuration ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="How long do you expect this case to take?"
                    {...register('estimatedDuration', {
                      min: { value: 1, message: 'Duration must be at least 1 day' },
                      max: { value: 365, message: 'Duration cannot exceed 365 days' }
                    })}
                  />
                  {errors.estimatedDuration && (
                    <p className="mt-1 text-sm text-error-600">{errors.estimatedDuration.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                Case Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="state" className="form-label">
                    State/Province *
                  </label>
                  <input
                    id="state"
                    type="text"
                    className={`input-field ${errors.location?.state ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="e.g., California, New York"
                    {...register('location.state', { required: 'State is required' })}
                  />
                  {errors.location?.state && (
                    <p className="mt-1 text-sm text-error-600">{errors.location.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="district" className="form-label">
                    District/County *
                  </label>
                  <input
                    id="district"
                    type="text"
                    className={`input-field ${errors.location?.district ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="e.g., Los Angeles, Manhattan"
                    {...register('location.district', { required: 'District is required' })}
                  />
                  {errors.location?.district && (
                    <p className="mt-1 text-sm text-error-600">{errors.location.district.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    className={`input-field ${errors.location?.city ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="e.g., Beverly Hills, Brooklyn"
                    {...register('location.city')}
                  />
                  {errors.location?.city && (
                    <p className="mt-1 text-sm text-error-600">{errors.location.city.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Budget Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                Budget Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="budgetMin" className="form-label">
                    Minimum Budget
                  </label>
                  <input
                    id="budgetMin"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`input-field ${errors.budget?.min ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="0.00"
                    {...register('budget.min', {
                      min: { value: 0, message: 'Budget cannot be negative' }
                    })}
                  />
                  {errors.budget?.min && (
                    <p className="mt-1 text-sm text-error-600">{errors.budget.min.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="budgetMax" className="form-label">
                    Maximum Budget
                  </label>
                  <input
                    id="budgetMax"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`input-field ${errors.budget?.max ? 'border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="0.00"
                    {...register('budget.max', {
                      min: { value: 0, message: 'Budget cannot be negative' },
                      validate: value => {
                        const minBudget = budget?.min;
                        if (minBudget !== undefined && value !== undefined && value < minBudget) {
                          return 'Maximum budget must be greater than minimum budget';
                        }
                        return true;
                      }
                    })}
                  />
                  {errors.budget?.max && (
                    <p className="mt-1 text-sm text-error-600">{errors.budget.max.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="currency" className="form-label">
                    Currency
                  </label>
                  <select
                    id="currency"
                    className="input-field"
                    {...register('budget.currency')}
                  >
                    {CURRENCY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-primary-600" />
                Additional Information
              </h3>
              
              <div>
                <label htmlFor="tags" className="form-label">
                  Tags (Optional)
                </label>
                <input
                  id="tags"
                  type="text"
                  className="input-field"
                  placeholder="Enter tags separated by commas (e.g., urgent, family, property)"
                  {...register('tags')}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Add relevant tags to help lawyers understand your case better
                </p>
              </div>
            </div>

            {/* File Upload */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary-600" />
                Supporting Documents
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-primary-600 hover:text-primary-500">
                      Click to upload
                    </span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB each
                  </p>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Important Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    By submitting this case, you agree to our terms of service. 
                    All information provided will be shared with potential lawyers to help them understand your case better. 
                    Please ensure all details are accurate and complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Case...' : 'Create Case'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
