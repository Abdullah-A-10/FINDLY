// components/ClaimModal.js
import React from 'react';
import { Modal, Card, Row, Col, Badge, Alert, Form, Button, Spinner } from 'react-bootstrap';
import { 
  FaUserCheck, 
  FaTag, 
  FaShieldAlt, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaCheckCircle
} from 'react-icons/fa';

const ClaimModal = ({ 
  show, 
  onHide, 
  match, 
  answers, 
  onAnswerChange, 
  onSubmit, 
  loading, 
  success,
  error 
}) => {
  if (!match) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaUserCheck className="me-2" />
          Claim Your Item
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Match Summary */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Your Lost Item</h6>
                <p className="mb-1"><strong>{match.lost_item.item_name}</strong></p>
                <small className="text-muted"><FaTag className="me-1"  size={20}/> {match.lost_item.category}</small>
              </Col>
              <Col md={6}>
                <h6>Found Item</h6>
                <p className="mb-1"><strong>{match.found_item.item_name}</strong></p>
                <small className="text-muted"><FaTag className="me-1" size={20}/> {match.found_item.category}</small>
              </Col>
            </Row>
            <div className="text-center mt-3">
              <Badge bg="primary">Match Score: {match.match_score}%</Badge>
            </div>
          </Card.Body>
        </Card>

        {/* Security Verification */}
        <Alert  className="mb-4">
          <FaShieldAlt className="me-2" />
          <strong>Security Verification Required</strong>
          <p className="mb-0 mt-2">
            Answer the security questions below to prove you're the rightful owner.
            These answers must match exactly what the finder provided.
          </p>
        </Alert>

        {/* Answer Form */}
        <Form>
          {/* Question 1 */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Question 1:</Form.Label>
            <div className="p-3 mb-2 rounded border-start border-4 border-primary bg-light shadow-sm fw-semibold">
              {match.found_item.question1 || "First security question"}
            </div>
            <Form.Control
              className='border-2 border-primary'
              type="text"
              placeholder="Enter answer to first security question"
              value={answers.answer1}
              onChange={(e) => onAnswerChange('answer1', e.target.value)}
              disabled={loading}
              required
            />
            <Form.Text className="text-muted">
              Be precise with your answer 
            </Form.Text>
          </Form.Group>

          {/* Question 2 */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Question 2:</Form.Label>
            <div className="p-3 mb-2 rounded border-start border-4 border-success bg-light shadow-sm fw-semibold">
              {match.found_item.question2 || "Second security question"}
            </div>
            <Form.Control
              className='border-2 border-primary'
              type="text"
              placeholder="Enter answer to second security question"
              value={answers.answer2}
              onChange={(e) => onAnswerChange('answer2', e.target.value)}
              disabled={loading}
              required
            />
            <Form.Text className="text-muted">
              This should be different from your first answer
            </Form.Text>
          </Form.Group>

          {/*Success Message */}
          {success && (
            <Alert variant="success" className="mb-4">
              <FaCheckCircle style={{color:'green'}} className="me-2" />
              {success}
            </Alert>
            
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <FaExclamationTriangle className="me-2" />
              {error}
            </Alert>
          )}

          {/* Info Alert */}
          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>Important:</strong> After successful verification, you'll receive the 
            finder's contact information to arrange item pickup.
          </Alert>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="success" 
          onClick={onSubmit}
          disabled={loading || !answers.answer1 || !answers.answer2}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Verifying...
            </>
          ) : (
            <>
              <FaUserCheck className="me-2" />
              Submit Claim
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClaimModal;
