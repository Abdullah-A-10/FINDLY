import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaCheck } from 'react-icons/fa';
import api from '../api';
import './AuthPages.css';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Check password strength
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return '#dc3545';
    if (passwordStrength === 1) return '#dc3545';
    if (passwordStrength === 2) return '#ffc107';
    if (passwordStrength === 3) return '#28a745';
    return '#28a745';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null
      });

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6} xl={5}>
            <Card className="auth-card shadow-lg">
              <Card.Body className="p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="auth-title">
                    <FaUserPlus className="me-2" />
                    Create Account
                  </h2>
                  <p className="auth-subtitle">Join FINDLY today</p>
                </div>

                {/* Success Alert */}
                {success && (
                  <Alert variant="success" className="alert-custom">
                    <FaCheck className="me-2" />
                    {success}
                  </Alert>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="alert-custom">
                    {error}
                  </Alert>
                )}

                {/* Signup Form */}
                <Form onSubmit={handleSubmit}>
                  {/* Username */}
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">
                      <FaUser className="me-2" />
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      required
                      className="form-control-custom"
                    />
                  </Form.Group>

                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">
                      <FaEnvelope className="me-2" />
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="form-control-custom"
                    />
                  </Form.Group>

                  {/* Phone (Optional) */}
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">
                      Phone Number 
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (123) 456-7890"
                      className="form-control-custom"
                    />
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">
                      <FaLock className="me-2" />
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      required
                      className="form-control-custom"
                    />
                    {/* Password Strength Meter */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="password-strength-bar">
                          <div 
                            className="strength-fill"
                            style={{
                              width: `${passwordStrength * 25}%`,
                              backgroundColor: getPasswordStrengthColor()
                            }}
                          ></div>
                        </div>
                        <small className={`strength-text text-${passwordStrength >= 3 ? 'success' : passwordStrength >= 2 ? 'warning' : 'danger'}`}>
                          {passwordStrength === 0 && 'Very Weak'}
                          {passwordStrength === 1 && 'Weak'}
                          {passwordStrength === 2 && 'Fair'}
                          {passwordStrength === 3 && 'Good'}
                          {passwordStrength === 4 && 'Strong'}
                        </small>
                      </div>
                    )}
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">
                      <FaLock className="me-2" />
                      Confirm Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      className="form-control-custom"
                    />
                  </Form.Group>

                  {/* Terms & Conditions */}
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      required
                      label={
                        <>
                          I agree to the{' '}
                          <Link to="/terms" className="terms-link">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="terms-link">
                            Privacy Policy
                          </Link>
                        </>
                      }
                      className="form-check-custom"
                    />
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="auth-button w-100 mb-3"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="auth-switch-text">
                      Already have an account?{' '}
                      <Link to="/login" className="auth-switch-link">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Signup;