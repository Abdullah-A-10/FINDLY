import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaGithub, FaHeart } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row className="g-4">
          {/* Company Info */}
          <Col lg={4} md={6} className="mb-4">
            <div className="footer-brand">
              <h3 className="footer-logo">FINDLY</h3>
              <p className="footer-subtitle">Lost & Found System</p>
              <p className="footer-description">
                Reuniting lost items with their owners through smart matching and community collaboration.
              </p>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6} className="mb-4">
            <h5 className="footer-heading">Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/lost">Lost Items</Link></li>
              <li><Link to="/found">Found Items</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </Col>

          {/* Legal */}
          <Col lg={2} md={6} className="mb-4">
            <h5 className="footer-heading">Legal</h5>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/guidelines">Community Guidelines</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </Col>

          {/* Social Media */}
          <Col lg={4} md={6} className="mb-4">
            <h5 className="footer-heading">Connect With Us</h5>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaInstagram />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <FaGithub />
              </a>
            </div>
            
            <div className="newsletter mt-4">
              <h6>Stay Updated</h6>
              <div className="input-group">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Enter your email" 
                />
                <button className="btn btn-primary" type="button">
                  Subscribe
                </button>
              </div>
            </div>
          </Col>
        </Row>

        <hr className="footer-divider" />

        {/* Copyright */}
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="copyright">
              &copy; {currentYear} FINDLY. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <p className="made-with">
              Made with <FaHeart className="text-danger" /> by the FINDLY Team
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;