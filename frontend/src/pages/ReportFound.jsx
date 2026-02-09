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
  Modal,
  Accordion
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
  FaCheck,
  FaLock,
  FaQuestionCircle,
  FaShieldAlt,
  FaHourglassHalf
} from 'react-icons/fa';
import api from '../api';
import './Report.css';

const ReportFound = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    description: '',
    found_location: '',
    found_date: '',
    question1: '',
    answer1: '',
    question2: '',
    answer2: ''
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matchWindowEnd, setMatchWindowEnd] = useState(null);
  
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
  
  // Sample verification questions
  const questionSuggestions = [
    "What brand is this item?",
    "What color is the item?",
    "Are there any unique markings or serial numbers?",
    "What was inside the item?",
    "Where exactly did you find it?",
    "What time of day did you find it?",
    "Was the item in a case or container?",
    "Are there any distinctive features or damage?",
    "What was near the item when you found it?",
    "Did the item have any accessories with it?"
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
  
  const selectQuestionSuggestion = (questionNum, suggestion) => {
    setFormData(prev => ({
      ...prev,
      [`question${questionNum}`]: suggestion
    }));
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
    
    if (!formData.found_location.trim()) {
      setError('Found location is required');
      return false;
    }
    
    if (!formData.found_date) {
      setError('Found date is required');
      return false;
    }
    
    // Validate date not in future
    const selectedDate = new Date(formData.found_date);
    const today = new Date();
    if (selectedDate > today) {
      setError('Found date cannot be in the future');
      return false;
    }
    
    // Validate verification questions
    if (!formData.question1.trim() || !formData.answer1.trim()) {
      setError('Security Question 1 and Answer are required');
      return false;
    }
    
    if (!formData.question2.trim() || !formData.answer2.trim()) {
      setError('Security Question 2 and Answer are required');
      return false;
    }
    
    // Answers should be different
    if (formData.answer1.toLowerCase() === formData.answer2.toLowerCase()) {
      setError('Security answers should be different for better verification');
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
      const response = await api.post('/items/found', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSuccess('Found item reported successfully! Our system will search for matches.');
      
      // Show match window info if returned
      if (response.data.match_window_end) {
        const windowEnd = new Date(response.data.match_window_end);
        setMatchWindowEnd(windowEnd);
      }
      
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
        if (!matchWindowEnd) {
          navigate('/');
        }
      }, 5000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report found item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      item_name: '',
      category: '',
      description: '',
      found_location: '',
      found_date: '',
      question1: '',
      answer1: '',
      question2: '',
      answer2: ''
    });
    setImages([]);
    setError('');
    setSuccess('');
    setMatchWindowEnd(null);
  };
  
  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 9; // All required fields
    
    if (formData.item_name.trim()) completed++;
    if (formData.category) completed++;
    if (formData.description.trim()) completed++;
    if (formData.found_location.trim()) completed++;
    if (formData.found_date) completed++;
    if (formData.question1.trim()) completed++;
    if (formData.answer1.trim()) completed++;
    if (formData.question2.trim()) completed++;
    if (formData.answer2.trim()) completed++;
    
    return (completed / total) * 100;
  };
  
  const formatMatchWindowTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="report-page found-report-page">
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
                  <FaLock className="me-2" />
                  Report a Found Item
                </h3>
                <p className="mb-0 mt-1 small opacity-90">
                  Found something? Help reunite it with its owner through our secure verification system.
                </p>
              </Card.Header>
              
              <Card.Body className="p-4">
                {/* Success Alert with Match Window Info */}
                {success && (
                  <Alert variant="success" className="alert-custom">
                    <div className="d-flex align-items-start">
                      <FaCheck className="me-2 mt-1" size={20} />
                      <div>
                        <h5 className="alert-heading">Success!</h5>
                        <p className="mb-2">{success}</p>
                        {matchWindowEnd && (
                          <div className="match-window-info mt-2 p-3">
                            <FaHourglassHalf className="me-2" />
                            <strong>Private Match Window Active:</strong>
                            <p className="mb-1">
                              Your item will remain private until <strong>{formatMatchWindowTime(matchWindowEnd)}</strong>
                            </p>
                            <small className="text-muted">
                              During this time, only our matching system can see it. After 24 hours, it will become public.
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                )}
                
                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="alert-custom">
                    <FaInfoCircle className="me-2" />
                    {error}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  {/* Item Information Section */}
                  <Accordion defaultActiveKey="0" className="mb-4">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        <h5 className="mb-0">
                          <FaTag className="me-2" />
                          Item Information
                        </h5>
                      </Accordion.Header>
                      <Accordion.Body>
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
                          
                          {/* Found Date */}
                          <Col md={6} className="mb-4">
                            <Form.Group>
                              <Form.Label className="form-label-custom">
                                <FaCalendarAlt className="me-2" />
                                Found Date *
                              </Form.Label>
                              <Form.Control
                                type="date"
                                name="found_date"
                                value={formData.found_date}
                                onChange={handleChange}
                                required
                                className="form-control-custom"
                                max={new Date().toISOString().split('T')[0]}
                              />
                              <Form.Text className="text-muted">
                                When did you find it?
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        {/* Found Location */}
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-custom">
                            <FaMapMarkerAlt className="me-2" />
                            Found Location *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="found_location"
                            value={formData.found_location}
                            onChange={handleChange}
                            placeholder="e.g., Main Library, 2nd Floor or 123 Main St, New York, NY 10001"
                            required
                            className="form-control-custom"
                            maxLength={255}
                          />
                          <Form.Text className="text-muted">
                            Be as specific as possible about where you found it
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
                            placeholder="Describe the found item in detail. Include brand, color, size, condition, unique features..."
                            required
                            className="form-control-custom"
                            rows={4}
                            maxLength={1000}
                          />
                          <Form.Text className="text-muted">
                            Detailed descriptions help the rightful owner identify their item
                          </Form.Text>
                        </Form.Group>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                  
                  {/* Security Verification Section */}
                  <Accordion className="mb-4">
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>
                        <h5 className="mb-0">
                          <FaShieldAlt className="me-2" />
                          Security Verification
                        </h5>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Alert variant="warning" className="mb-4">
                          <FaInfoCircle className="me-2" />
                          <strong>Important:</strong> These questions will be used to verify the identity of the 
                          rightful owner. Choose questions that only the true owner would know.
                        </Alert>
                        
                        {/* Question Suggestions */}
                        <div className="question-suggestions mb-4">
                          <h6>Question Suggestions:</h6>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {questionSuggestions.map((suggestion, index) => (
                              <Badge 
                                key={index}
                                bg="secondary"
                                className="suggestion-badge"
                                onClick={() => selectQuestionSuggestion(1, suggestion)}
                                style={{ cursor: 'pointer' }}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Security Question 1 */}
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-custom">
                            <FaQuestionCircle className="me-2" />
                            Security Question 1 *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="question1"
                            value={formData.question1}
                            onChange={handleChange}
                            placeholder="Create a verification question about the item"
                            required
                            className="form-control-custom"
                            maxLength={255}
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-custom">
                            Answer 1 *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="answer1"
                            value={formData.answer1}
                            onChange={handleChange}
                            placeholder="The answer to your first question"
                            required
                            className="form-control-custom"
                            maxLength={255}
                          />
                          <Form.Text className="text-muted">
                            Remember this answer - it will be used for verification
                          </Form.Text>
                        </Form.Group>
                        
                        {/* Security Question 2 */}
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-custom">
                            <FaQuestionCircle className="me-2" />
                            Security Question 2 *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="question2"
                            value={formData.question2}
                            onChange={handleChange}
                            placeholder="Create a second verification question"
                            required
                            className="form-control-custom"
                            maxLength={255}
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-4">
                          <Form.Label className="form-label-custom">
                            Answer 2 *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="answer2"
                            value={formData.answer2}
                            onChange={handleChange}
                            placeholder="The answer to your second question"
                            required
                            className="form-control-custom"
                            maxLength={255}
                          />
                          <Form.Text className="text-muted">
                            This should be different from your first answer
                          </Form.Text>
                        </Form.Group>
                        
                        <div className="security-note p-3">
                          <FaLock className="me-2 text-success" />
                          <small>
                            <strong>Note:</strong> Answers are securely encrypted and never stored in plain text. 
                            Only users who can answer both questions correctly can claim this item.
                          </small>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                  
                  {/* Image Upload Section */}
                  <Accordion className="mb-4">
                    <Accordion.Item eventKey="2">
                      <Accordion.Header>
                        <h5 className="mb-0">
                          <FaCamera className="me-2" />
                          Upload Images (Optional)
                        </h5>
                      </Accordion.Header>
                      <Accordion.Body>
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
                          Add clear photos from different angles to help the owner identify their item
                        </Form.Text>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                  
                  {/* Important Notes */}
                  <Alert variant="info" className="mb-4">
                    <FaInfoCircle className="me-2" />
                    <strong>Important:</strong> Once reported, our system will automatically search for 
                    matching lost items. The item will remain private for 24 hours before becoming publicly listed.
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
                        'Report Found Item'
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

export default ReportFound;