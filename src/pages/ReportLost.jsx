import React, { useState, useRef } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Badge,
  ProgressBar,
  Image,
  Modal
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCamera, 
  FaTrash, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaTag,
  FaInfoCircle,
  FaUpload,
  FaCheck
} from 'react-icons/fa';
import api from '../api';
import './Report.css';

const ReportLost = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    description: '',
    lost_location: '',
    lost_date: '',
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Categories from backend
  const categories = [
    'Electronics',
    'Documents',
    'Jewelry',
    'Clothing',
    'Accessories',
    'Bags & Wallets',
    'Keys',
    'Books',
    'Toys',
    'Sports Equipment',
    'Other'
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        setError('Only JPG, PNG, GIF, and WebP images are allowed');
        return false;
      }
      
      if (!isValidSize) {
        setError('Maximum file size is 5MB per image');
        return false;
      }
      
      return true;
    });
    
    // Create preview URLs
    const imagePreviews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setImages(prev => [...prev, ...imagePreviews]);
    setError('');
  };
  
  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview); // Clean up memory
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  const openImagePreview = (index) => {
    setCurrentImageIndex(index);
    setShowPreview(true);
  };
  
  const validateForm = () => {
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return false;
    }
    
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (!formData.lost_location.trim()) {
      setError('Lost location is required');
      return false;
    }
    
    if (!formData.lost_date) {
      setError('Lost date is required');
      return false;
    }
    
    // Validate date not in future
    const selectedDate = new Date(formData.lost_date);
    const today = new Date();
    if (selectedDate > today) {
      setError('Lost date cannot be in the future');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append images
      images.forEach((image, index) => {
        formDataToSend.append('images', image.file);
      });
      
      // Submit to backend
      const response = await api.post('/items/lost', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSuccess('Lost item reported successfully! Our system is searching for matches.');
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        resetForm();
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report lost item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      description: '',
      lost_location: '',
      lost_date: '',
    });
    setImages([]);
    setError('');
    setSuccess('');
  };
  
  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 5; // item_name, category, description, location, date
    
    if (formData.item_name.trim()) completed++;
    if (formData.category) completed++;
    if (formData.description.trim()) completed++;
    if (formData.lost_location.trim()) completed++;
    if (formData.lost_date) completed++;
    
    return (completed / total) * 100;
  };
  
  return (
    <div className="report-page lost-report-page">
      <Container className="py-4">
        {/* Back Button */}
        <Button 
          variant="outline-primary" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <FaArrowLeft className="me-2" /> Back to Home
        </Button>
        
        {/* Progress Bar */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Report Progress</h6>
              <Badge bg="primary">{Math.round(getCompletionPercentage())}%</Badge>
            </div>
            <ProgressBar 
              now={getCompletionPercentage()} 
              className="report-progress"
            />
          </Card.Body>
        </Card>
        
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-primary text-white">
                <h3 className="mb-0">
                  <FaTag className="me-2" />
                  Report a Lost Item
                </h3>
                <p className="mb-0 mt-1 small opacity-90">
                  Fill in the details below to report your lost item. The more details you provide, the better chance of finding it.
                </p>
              </Card.Header>
              
              <Card.Body className="p-4">
                {/* Success Alert */}
                {success && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <FaCheck className="me-2" size={20} />
                    {success}
                  </Alert>
                )}
                
                {/* Error Alert */}
                {error && (
                  <Alert variant="danger">
                    <FaInfoCircle className="me-2" />
                    {error}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  {/* Item Name */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">
                      <FaTag className="me-2" />
                      Item Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleChange}
                      placeholder="e.g., iPhone 13 Pro, Black Leather Wallet, House Keys"
                      required
                      className="form-control-custom"
                      maxLength={255}
                    />
                    <Form.Text className="text-muted">
                      Be specific about the item name
                    </Form.Text>
                  </Form.Group>
                  
                  <Row>
                    {/* Category */}
                    <Col md={6} className="mb-4">
                      <Form.Group>
                        <Form.Label className="form-label-custom">
                          Category *
                        </Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className="form-control-custom"
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat, index) => (
                            <option key={index} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    {/* Lost Date */}
                    <Col md={6} className="mb-4">
                      <Form.Group>
                        <Form.Label className="form-label-custom">
                          <FaCalendarAlt className="me-2" />
                          Lost Date *
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="lost_date"
                          value={formData.lost_date}
                          onChange={handleChange}
                          required
                          className="form-control-custom"
                          max={new Date().toISOString().split('T')[0]}
                        />
                        <Form.Text className="text-muted">
                          When did you lose it?
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {/* Lost Location */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">
                      <FaMapMarkerAlt className="me-2" />
                      Lost Location *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="lost_location"
                      value={formData.lost_location}
                      onChange={handleChange}
                      placeholder="e.g., Main Library, 2nd Floor or 123 Main St, New York, NY 10001"
                      required
                      className="form-control-custom"
                      maxLength={255}
                    />
                    <Form.Text className="text-muted">
                      Be as specific as possible about where you lost it
                    </Form.Text>
                  </Form.Group>
                  
                  {/* Description */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">
                      <FaInfoCircle className="me-2" />
                      Description *
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your lost item in detail. Include brand, color, size, unique features, contents (if applicable)..."
                      required
                      className="form-control-custom"
                      rows={4}
                      maxLength={1000}
                    />
                    <Form.Text className="text-muted">
                      Detailed descriptions increase chances of recovery
                    </Form.Text>
                  </Form.Group>
                  
                  {/* Image Upload */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">
                      <FaCamera className="me-2" />
                      Upload Images (Optional)
                    </Form.Label>
                    
                    <div className="image-upload-area">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        multiple
                        accept="image/*"
                        className="d-none"
                      />
                      
                      <div 
                        className="upload-dropzone"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FaUpload size={40} className="text-muted mb-3" />
                        <h5>Click to upload images</h5>
                        <p className="text-muted">
                          Upload up to 5 images (Max 5MB each)
                        </p>
                        <Button variant="outline-primary">
                          Browse Files
                        </Button>
                      </div>
                      
                      {/* Image Preview */}
                      {images.length > 0 && (
                        <div className="image-preview-container mt-3">
                          <h6>Selected Images ({images.length}/5)</h6>
                          <Row className="g-2 mt-2">
                            {images.map((image, index) => (
                              <Col xs={4} sm={3} md={2} key={index}>
                                <div className="image-preview-wrapper">
                                  <Image
                                    src={image.preview}
                                    alt={`Preview ${index + 1}`}
                                    className="image-preview"
                                    onClick={() => openImagePreview(index)}
                                  />
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="remove-image-btn"
                                    onClick={() => removeImage(index)}
                                  >
                                    <FaTrash size={12} />
                                  </Button>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                    </div>
                    
                    <Form.Text className="text-muted">
                      Add clear photos from different angles for better identification
                    </Form.Text>
                  </Form.Group>
                  
                  {/* Important Notes */}
                  <Alert variant="info" className="mb-4">
                    <FaInfoCircle className="me-2" />
                    <strong>Important:</strong> Once reported, our system will automatically search for 
                    matching found items. You'll receive notifications if any matches are found.
                  </Alert>
                  
                  {/* Form Actions */}
                  <div className="d-flex justify-content-between mt-4">
                    <Button
                      variant="outline-secondary"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Clear Form
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className="submit-report-btn"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Reporting...
                        </>
                      ) : (
                        'Report Lost Item'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Image Preview Modal */}
      <Modal 
        show={showPreview} 
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {images[currentImageIndex] && (
            <Image
              src={images[currentImageIndex].preview}
              alt={`Preview ${currentImageIndex + 1}`}
              fluid
              className="modal-preview-image"
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowPreview(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReportLost;