import React, { useState, useRef } from 'react';

const ImageUpload = ({ images = [], onImagesChange, maxImages = 5, disabled = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const newImages = Array.from(files).slice(0, maxImages - images.length);
    const imageFiles = newImages.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== newImages.length) {
      alert('Only image files are allowed.');
    }

    if (imageFiles.length > 0) {
      // Create preview URLs for new images
      const newImagePreviews = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        isNew: true,
        name: file.name,
        size: file.size
      }));
      
      onImagesChange([...images, ...newImagePreviews]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInput = (e) => {
    if (disabled) return;
    const files = e.target.files;
    handleFiles(files);
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index) => {
    if (disabled) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-upload-container">
      {/* Upload Area */}
      <div
        className={`upload-dropzone ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="upload-content">
          <div className="upload-icon">📸</div>
          <p className="upload-text">
            {images.length >= maxImages
              ? `Maximum ${maxImages} images allowed`
              : 'Drop images here or click to browse'
            }
          </p>
          <p className="upload-subtext">
            {images.length < maxImages && `${maxImages - images.length} more images allowed`}
          </p>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="image-previews">
          <h4 className="preview-title">Uploaded Images ({images.length}/{maxImages})</h4>
          <div className="preview-grid">
            {images.map((image, index) => (
              <div key={index} className="preview-item">
                <div className="preview-image-container">
                  <img
                    src={image.preview || (image.filename ? `/api/loops/images/${image.filename}` : '')}
                    alt={image.name || image.originalName || `Preview ${index + 1}`}
                    className="preview-image"
                    onLoad={() => {
                      // Clean up preview URL if it's a new upload
                      if (image.isNew && image.preview) {
                        URL.revokeObjectURL(image.preview);
                      }
                    }}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="remove-image-btn"
                      title="Remove image"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="preview-info">
                  <p className="preview-name">
                    {image.name || image.originalName || `Image ${index + 1}`}
                  </p>
                  <p className="preview-size">
                    {formatFileSize(image.size || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
