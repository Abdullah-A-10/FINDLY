import React, { useState, useContext } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaLock, FaEnvelope, FaSignInAlt, FaGoogle, FaFacebookF } from 'react-icons/fa';
import api from '../api';
import './AuthPages.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { user, token } = response.data;
      login(user, token);
      
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Implement social login if needed
    console.log(`${provider} login clicked`);
  };

  return (
    <div className="auth-page login-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6} xl={5}>
            <Card className="auth-card shadow-lg">
              <Card.Body className="p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="auth-title">
                    <FaSignInAlt className="me-2" />
                    Welcome Back
                  </h2>
                  <p className="auth-subtitle">Sign in to your <span className='login_title'>FINDLY </span>account</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="alert-custom">
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
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
                      placeholder="Enter your password"
                      required
                      className="form-control-custom"
                    />
                    <div className="text-end mt-2">
                      <Link to="/forgot-password" className="forgot-link">
                        Forgot password?
                      </Link>
                    </div>
                  </Form.Group>

                  {/* Remember Me */}
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      label="Remember me"
                      className="form-check-custom"
                    />
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="auth-button w-100 mb-3"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  {/* Divider */}
                  <div className="divider-with-text my-4">
                    <span>Or continue with</span>
                  </div>

                  {/* Social Login Buttons */}
                  <Row className="g-5 mb-4">
                    <Col>
                      <Button
                        variant="outline-primary"
                        className="social-btn google-btn"
                        onClick={() => handleSocialLogin('google')}
                      >
                        <FaGoogle className="me-2" />
                        Google
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        variant="outline-primary"
                        className="social-btn facebook-btn"
                        onClick={() => handleSocialLogin('facebook')}
                      >
                        <FaFacebookF className="me-2" />
                        Facebook
                      </Button>
                    </Col>
                  </Row>

                  {/* Sign Up Link */}
                  <div className="text-center">
                    <p className="auth-switch-text">
                      Don't have an account?{' '}
                      <Link to="/signup" className="auth-switch-link">
                        Sign up here
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Additional Info */}
            <div className="auth-info mt-4 text-center">
              <p className="text-muted mb-0">
                <small>
                  By signing in, you agree to our{' '}
                  <Link to="/terms" className="text-decoration-none">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-decoration-none">
                    Privacy Policy
                  </Link>
                </small>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;