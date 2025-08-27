import React, { useState, useEffect } from 'react';
import { dateUtils } from '../utils/dateUtils';
import ImageUpload from './ImageUpload';

const LoopForm = ({ initialData = {}, onSubmit, loading = false, isEdit = false }) => {
  const [formData, setFormData] = useState({
    type: '',
    property_address: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    sale: '',
    status: 'pre-offer',
    start_date: dateUtils.getCurrentDate(),
    end_date: '',
    tags: '',
    notes: '',
    ...initialData
  });

  const [images, setImages] = useState([]);
  const [customType, setCustomType] = useState('');
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        type: initialData.type || '',
        property_address: initialData.property_address || '',
        client_name: initialData.client_name || '',
        client_email: initialData.client_email || '',
        client_phone: initialData.client_phone || '',
        sale: initialData.sale || '',
        status: initialData.status || 'pre-offer',
        start_date: dateUtils.formatDateForInput(initialData.start_date) || dateUtils.getCurrentDate(),
        end_date: dateUtils.formatDateForInput(initialData.end_date) || '',
        tags: initialData.tags || '',
        notes: initialData.notes || ''
      });

      // Set existing images if available
      if (initialData.imageList && initialData.imageList.length > 0) {
        setImages(initialData.imageList.map(img => ({
          ...img,
          preview: null,
          isNew: false
        })));
      }

      // Check if type is a custom type (not in the predefined list)
      const predefinedTypes = ['Listing for Sale', 'Listing for Lease', 'Purchase', 'Lease', 'Real Estate Other', 'Others'];
      if (initialData.type && !predefinedTypes.includes(initialData.type)) {
        setCustomType(initialData.type);
        setShowCustomTypeInput(true);
        setFormData(prev => ({ ...prev, type: 'Others' }));
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      if (value === 'Others') {
        setShowCustomTypeInput(true);
      } else {
        setShowCustomTypeInput(false);
        setCustomType('');
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.type.trim()) {
      newErrors.type = 'Transaction type is required';
    } else if (formData.type === 'Others' && !customType.trim()) {
      newErrors.type = 'Custom transaction type is required when "Others" is selected';
    }

    if (!formData.property_address.trim()) {
      newErrors.property_address = 'Property address is required';
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }

    // Email validation
    if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.client_phone && !/^[\d\s\-()+"]+$/.test(formData.client_phone)) {
      newErrors.client_phone = 'Please enter a valid phone number';
    }

    // Sale amount validation
    if (formData.sale && (isNaN(formData.sale) || parseFloat(formData.sale) < 0)) {
      newErrors.sale = 'Please enter a valid sale amount';
    }

    // Date validation
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Create FormData for file upload
      const formDataToSubmit = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          if (key === 'sale' && formData[key]) {
            formDataToSubmit.append(key, parseFloat(formData[key]));
          } else if (key === 'type') {
            // Use custom type if "Others" is selected and custom type is provided
            const typeValue = formData[key] === 'Others' && customType.trim()
              ? customType.trim()
              : formData[key];
            formDataToSubmit.append(key, typeValue);
          } else {
            formDataToSubmit.append(key, formData[key]);
          }
        }
      });

      // Add image files (only new uploads)
      const newImages = images.filter(img => img.isNew && img.file);
      newImages.forEach(image => {
        formDataToSubmit.append('images', image.file);
      });

      // For edits, indicate if we want to replace images
      if (isEdit && newImages.length > 0) {
        formDataToSubmit.append('replaceImages', 'false'); // Append to existing
      }

      onSubmit(formDataToSubmit);
    }
  };

  const transactionTypes = [
    'Listing for Sale',
    'Listing for Lease',
    'Purchase',
    'Lease',
    'Real Estate Other',
    'Others'
  ];

  const statusOptions = [
    { value: 'pre-offer', label: 'Pre-offer' },
    { value: 'under-contract', label: 'Under Contract' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'sold', label: 'Sold' },
    { value: 'terminated', label: 'Terminated' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Details */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Transaction Details</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="type">Transaction Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={errors.type ? 'border-red-500' : ''}
                disabled={loading}
                required
              >
                <option value="">Select transaction type</option>
                {transactionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>

            {showCustomTypeInput && (
              <div className="form-group">
                <label htmlFor="customType">Custom Transaction Type *</label>
                <input
                  id="customType"
                  name="customType"
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Enter custom transaction type"
                  className={!customType.trim() && formData.type === 'Others' ? 'border-red-500' : ''}
                  disabled={loading}
                  required
                />
                {!customType.trim() && formData.type === 'Others' && (
                  <p className="text-red-500 text-sm mt-1">Custom type is required when "Others" is selected</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group md:col-span-2">
              <label htmlFor="property_address">Property Address *</label>
              <input
                id="property_address"
                name="property_address"
                type="text"
                value={formData.property_address}
                onChange={handleChange}
                placeholder="Enter the property address"
                className={errors.property_address ? 'border-red-500' : ''}
                disabled={loading}
                required
              />
              {errors.property_address && (
                <p className="text-red-500 text-sm mt-1">{errors.property_address}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sale">Sale Amount ($)</label>
              <input
                id="sale"
                name="sale"
                type="number"
                step="0.01"
                min="0"
                value={formData.sale}
                onChange={handleChange}
                placeholder="0.00"
                className={errors.sale ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.sale && <p className="text-red-500 text-sm mt-1">{errors.sale}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Client Information</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="client_name">Client Name *</label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="Enter client's full name"
                className={errors.client_name ? 'border-red-500' : ''}
                disabled={loading}
                required
              />
              {errors.client_name && (
                <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="client_email">Client Email</label>
              <input
                id="client_email"
                name="client_email"
                type="email"
                value={formData.client_email}
                onChange={handleChange}
                placeholder="client@example.com"
                className={errors.client_email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.client_email && (
                <p className="text-red-500 text-sm mt-1">{errors.client_email}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="client_phone">Client Phone</label>
              <input
                id="client_phone"
                name="client_phone"
                type="tel"
                value={formData.client_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className={errors.client_phone ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.client_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.client_phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Timeline</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="start_date">Start Date</label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">Target Close Date</label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                className={errors.end_date ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
              )}
              {formData.end_date && (
                <p className="text-sm text-gray-600 mt-1">
                  {dateUtils.getCountdownText(formData.end_date)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Additional Information</h3>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., first-time-buyer, cash-deal, luxury"
                disabled={loading}
              />
              <p className="text-sm text-gray-600 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes or comments about this transaction..."
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Property Images</label>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                disabled={loading}
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload up to 5 images of the property (JPG, PNG, GIF, max 5MB each)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Update Loop' : 'Create Loop'
          )}
        </button>
      </div>
    </form>
  );
};

export default LoopForm;
