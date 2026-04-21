import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FaSearch, 
  FaBullhorn, 
  FaList, 
  FaBell, 
  FaArrowRight, 
  FaChartLine,
  FaCheckCircle,
  FaUsers,
  FaMapMarkerAlt,
  FaClock,
  FaGift
} from 'react-icons/fa';
import api from '../api';
import './HomePage.css';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    lostItems: 0,
    foundItems: 0,
    matches: 0,
    claims: 0
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats
      const [lostRes, foundRes, matchesRes, claimsRes] = await Promise.all([
        api.get('/items/mylistings/lost'),
        api.get('/items/mylistings/found'),
        api.get('/items/mylistings/matches'),
        api.get('/items/myclaims')
      ]);

      setStats({
        lostItems: lostRes.data.lostItems?.length || 0,
        foundItems: foundRes.data.foundItems?.length || 0,
        matches: matchesRes.data.matches?.length || 0,
        claims: (claimsRes.data.claims_made?.length || 0) + 
               (claimsRes.data.claims_received?.length || 0)
      });

      // Get recent matches (first 3)
      setRecentMatches(matchesRes.data.matches?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, show landing page
  if (!user) {
    return (
      <div className="landing-page">
        <Container>
          {/* Hero Section */}
          <Row className="align-items-center hero-section">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="hero-content">
                <Badge bg="primary" className="hero-badge mb-3">
                  <FaGift className="me-2" />
                  Reuniting Lost Items Since 2024
                </Badge>
                <h1 className="hero-title">
                  Find What You've Lost,<br />
                  <span className="text-gradient">Return What You've Found</span>
                </h1>
                <p className="hero-subtitle">
                  FINDLY is your community-powered lost and found system. 
                  Using smart matching algorithms, we help reunite people with their lost belongings.
                </p>
                <div className="hero-buttons mt-4">
                  <Button 
                    as={Link} 
                    to="/signup" 
                    variant="primary" 
                    size="lg"
                    className="me-3"
                  >
                    Join Now - It's Free
                  </Button>
                  <Button 
                    as={Link} 
                    to="/login" 
                    variant="outline-primary" 
                    size="lg"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-image-container">
                <div className="floating-card">
                  <FaCheckCircle className="icon-large text-success" />
                  <h5>Smart Matching</h5>
                  <p>AI-powered matching system</p>
                </div>
                <div className="floating-card">
                  <FaUsers className="icon-large text-primary" />
                  <h5>Community Trust</h5>
                  <p>Verified users only</p>
                </div>
                <div className="floating-card">
                  <FaMapMarkerAlt className="icon-large text-warning" />
                  <h5>Location Based</h5>
                  <p>Find items near you</p>
                </div>
                <div className="floating-card">
                  <FaClock className="icon-large text-info" />
                  <h5>24/7 Service</h5>
                  <p>Always available</p>
                </div>
              </div>
            </Col>
          </Row>

          {/* Features Section */}
          <Row className="features-section mt-5">
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-3">
                    <FaSearch size={40} />
                  </div>
                  <Card.Title>Report Lost Items</Card.Title>
                  <Card.Text>
                    Can't find something valuable? Let us know with a detailed report.
                    Our system will automatically search for matches.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-3">
                    <FaBullhorn size={40} />
                  </div>
                  <Card.Title>Report Found Items</Card.Title>
                  <Card.Text>
                    Found something that's not yours? Report it and help reunite it 
                    with its rightful owner through our secure system.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-3">
                    <FaBell size={40} />
                  </div>
                  <Card.Title>Instant Notifications</Card.Title>
                  <Card.Text>
                    Get real-time alerts when a match is found or when someone 
                    claims your found item. Stay updated every step of the way.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Stats Section */}
          <Row className="stats-section mt-5">
            <Col className="text-center">
              <h2 className="section-title">Trusted by Thousands</h2>
              <p className="section-subtitle">Join our growing community of responsible citizens</p>
              <Row className="mt-4">
                <Col md={3} className="mb-3">
                  <div className="stat-box">
                    <h3 className="stat-numbers">10,000+</h3>
                    <p className="stat-labels">Items Reunited</p>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="stat-box">
                    <h3 className="stat-numbers">50,000+</h3>
                    <p className="stat-labels">Active Users</p>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="stat-box">
                    <h3 className="stat-numbers">95%</h3>
                    <p className="stat-labels">Success Rate</p>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="stat-box">
                    <h3 className="stat-numbers">24/7</h3>
                    <p className="stat-labels">Available Support</p>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>

        </Container>
      </div>
    );
  }

  // Dashboard for logged-in users
  return (
    <div className="dashboard-page">
      <Container>
        {/* Welcome Header */}
        <Row className="mb-4">
          <Col>
            <div className="welcome-header">
              <h1 className="welcome-title">
                Welcome back, <span className="user_name">{user.username}!</span> 😊
              </h1>
              <p className="welcome-subtitle">
                FINDLY is here to help you find what you're looking for! 🎉
              </p>
              <div className="welcome-progress">
                <ProgressBar 
                  now={75} 
                  label="Profile 75% Complete" 
                  className="profile-progress"
                />
                <small className="text-muted">Complete your profile for better matches</small>
              </div>
            </div>
          </Col>
        </Row>

        {/* Quick Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-card-content">
                  <div className="stat-icon lost">
                    <FaSearch />
                  </div>
                  <div>
                    <h3 className="stat-number">{stats.lostItems}</h3>
                    <p className="stat-label">Lost Items</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-card-content">
                  <div className="stat-icon found">
                    <FaBullhorn />
                  </div>
                  <div>
                    <h3 className="stat-number">{stats.foundItems}</h3>
                    <p className="stat-label">Found Items</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-card-content">
                  <div className="stat-icon matches">
                    <FaBell />
                  </div>
                  <div>
                    <h3 className="stat-number">{stats.matches}</h3>
                    <p className="stat-label">Matches</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-card-content">
                  <div className="stat-icon claims">
                    <FaChartLine />
                  </div>
                  <div>
                    <h3 className="stat-number">{stats.claims}</h3>
                    <p className="stat-label">Claims</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mb-5">
          <Col md={6} lg={3} className="mb-4">
            <Card className="action-card">
              <Card.Body>
                <div className="action-icon lost-action">
                  <FaSearch size={24} />
                </div>
                <Card.Title className="mt-3">Report Lost Items</Card.Title>
                <Card.Text>
                  Can't find something valuable? Let us know with a detailed report.
                </Card.Text>
                <Button 
                  as={Link} 
                  to="/lost/report" 
                  variant="outline-primary" 
                  className="action-button"
                >
                  Go to Report <FaArrowRight className="ms-2" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3} className="mb-4">
            <Card className="action-card">
              <Card.Body>
                <div className="action-icon found-action">
                  <FaBullhorn size={24} />
                </div>
                <Card.Title className="mt-3">Report Found Items</Card.Title>
                <Card.Text>
                  Found something? Report it here to help reunite it with its owner.
                </Card.Text>
                <Button 
                  as={Link} 
                  to="/found/report" 
                  variant="outline-primary" 
                  className="action-button"
                >
                  Go to Report <FaArrowRight className="ms-2" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3} className="mb-4">
            <Card className="action-card">
              <Card.Body>
                <div className="action-icon view-action">
                  <FaList size={24} />
                </div>
                <Card.Title className="mt-3">View Listings</Card.Title>
                <Card.Text>
                  Browse through lost and found items in your area.
                </Card.Text>
                <Button 
                  as={Link} 
                  to="/listings" 
                  variant="outline-primary" 
                  className="action-button"
                >
                  Go to View <FaArrowRight className="ms-2" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3} className="mb-4">
            <Card className="action-card">
              <Card.Body>
                <div className="action-icon match-action">
                  <FaBell size={24} />
                </div>
                <Card.Title className="mt-3">Match Updates</Card.Title>
                <Card.Text>
                  Matches are coming your way! Check your pending and recent matches.
                </Card.Text>
                <Button 
                  as={Link} 
                  to="/matches" 
                  variant="outline-primary" 
                  className="action-button"
                >
                  See in Detail <FaArrowRight className="ms-2" />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Matches & Notifications */}
        <Row>
          <Col lg={8} className="mb-4">
            <Card className="recent-matches-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Matches</h5>
                <Badge bg="primary">{recentMatches.length} new</Badge>
              </Card.Header>
              <Card.Body>
                {recentMatches.length > 0 ? (
                  <div className="matches-list">
                    {recentMatches.map((match, index) => (
                      <div key={index} className="match-item">
                        <div className="match-info">
                          <h6 className="match-title">
                            {match.lost_item.item_name} → {match.found_item.item_name}
                          </h6>
                          <div className="match-details">
                            <span className="match-location">
                              <FaMapMarkerAlt className="me-1" />
                              {match.lost_item_location}
                            </span>
                            <span className="match-score">
                              <Badge bg={match.match_score > 80 ? "success" : "warning"}>
                                {match.match_score}% match
                              </Badge>
                            </span>
                          </div>
                        </div>
                        <div className="match-actions">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => navigate(`/matches`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="info" className="text-center">
                    No matches yet. Report a lost or found item to get started!
                  </Alert>
                )}
                <div className="text-center mt-3">
                  <Button 
                    as={Link} 
                    to="/matches" 
                    variant="link" 
                    className="view-all-link"
                  >
                    View All Matches <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-4">
            <Card className="tips-card">
              <Card.Header>
                <h5 className="mb-0">Quick Tips</h5>
              </Card.Header>
              <Card.Body>
                <ul className="tips-list">
                  <li className="tip-item">
                    <FaCheckCircle className="text-success me-2" />
                    <span>Add clear photos for better matches</span>
                  </li>
                  <li className="tip-item">
                    <FaCheckCircle className="text-success me-2" />
                    <span>Be specific with location details</span>
                  </li>
                  <li className="tip-item">
                    <FaCheckCircle className="text-success me-2" />
                    <span>Check notifications regularly</span>
                  </li>
                  <li className="tip-item">
                    <FaCheckCircle className="text-success me-2" />
                    <span>Respond to claims within 48 hours</span>
                  </li>
                  <li className="tip-item">
                    <FaCheckCircle className="text-success me-2" />
                    <span>Verify item details before claiming</span>
                  </li>
                </ul>
                
                <Alert variant="primary" className="mt-3">
                  <strong>Pro Tip:</strong> Complete your profile to increase 
                  match accuracy by 30%!
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;