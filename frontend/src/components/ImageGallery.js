import React, { useState } from 'react';

const ImageModal = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="image-modal" onClick={onClose}>
      <button className="image-modal-close" onClick={onClose}>
        ×
      </button>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={`/api/loops/images/${image.filename}`}
          alt={image.originalName || 'Property image'}
        />
      </div>
    </div>
  );
};

const ImageGallery = ({ images = [], maxThumbnails = 3 }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageError = (index, filename) => {
    console.error(`Failed to load image: ${filename}`);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: false }));
  };

  const visibleImages = images.slice(0, maxThumbnails);
  const remainingCount = images.length - maxThumbnails;

  const openImage = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="loop-images">
        {visibleImages.map((image, index) => {
          if (imageErrors[index]) {
            return (
              <div
                key={index}
                className="loop-image-thumbnail"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '12px'
                }}
              >
                ❌
              </div>
            );
          }

          return (
            <img
              key={index}
              src={`/api/loops/images/${image.filename}`}
              alt={image.originalName || `Property image ${index + 1}`}
              className="loop-image-thumbnail"
              onClick={() => openImage(image)}
              onError={() => handleImageError(index, image.filename)}
              onLoad={() => handleImageLoad(index)}
              title={`Click to view ${image.originalName || 'image'}`}
            />
          );
        })}
        
        {remainingCount > 0 && (
          <div className="loop-images-count">
            +{remainingCount}
          </div>
        )}
      </div>

      <ImageModal image={selectedImage} onClose={closeModal} />
    </>
  );
};

export default ImageGallery;
