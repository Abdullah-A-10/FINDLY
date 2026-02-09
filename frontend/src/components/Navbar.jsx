import React, { useContext, useState, useEffect } from 'react';
import { 
  Navbar, 
  Nav, 
  Container, 
  Button, 
  Badge, 
  Dropdown, 
  OverlayTrigger,
  Tooltip,
  Offcanvas
} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FaBell, 
  FaUser, 
  FaSignOutAlt, 
  FaHome, 
  FaSearch, 
  FaPlus, 
  FaList,
  FaCog,
  FaQuestionCircle,
  FaBars,
  FaEnvelope,
  FaBriefcase,
  FaChartLine,
  FaHandshake,
  FaCheck,
  FaListAlt
} from 'react-icons/fa';
import api from '../api';
import './Navbar.css';

const CustomNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  useEffect(() => {
  if (!user) return;

  const interval = setInterval(() => {
    fetchNotifications();
  }, 20000); // fetch every 20 seconds

  // Cleanup
  return () => clearInterval(interval);
 }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/items/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowOffcanvas(false);
  };

  const markNotificationsAsRead = async () => {
    try {
      await api.get('/items/notifications?mark_read=true');
      setUnreadCount(0);
      // Update notifications to show as read
      setNotifications(prev => prev.map(notif => ({ ...notif, status: 'read' })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Navigation items for logged in users
  const navItems = user ? [
    { path: '/', label: 'Dashboard', icon: <FaHome /> },
    { path: '/listings', label: 'View Listings', icon: <FaList /> },
    { path: '/matches', label: 'My Matches', icon: <FaHandshake /> },
  ] : [];

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="custom-navbar">
        <Container fluid="xxl">
          {/* Logo/Brand */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <div className="brand-logo">
              <span className="logo-text">FINDLY</span>
              <span className="logo-subtitle">Lost & Found</span>
            </div>
          </Navbar.Brand>

          {/* Mobile Menu Toggle */}
          <Button
            variant="outline-light"
            className="d-lg-none ms-auto me-2"
            onClick={() => setShowOffcanvas(true)}
          >
            <FaBars />
          </Button>

          {/* Desktop Navigation */}
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
            {/* Main Navigation Links */}
            <Nav className="me-auto">
              {navItems.map((item, index) => (
                <OverlayTrigger
                  key={index}
                  placement="bottom"
                  overlay={<Tooltip>{item.label}</Tooltip>}
                >
                  <Nav.Link 
                    as={Link} 
                    to={item.path} 
                    className={`nav-link-custom ${isActive(item.path)}`}
                  >
                    {item.icon}
                    <span className="ms-2 d-lg-inline d-none">{item.label}</span>
                  </Nav.Link>
                </OverlayTrigger>
              ))}
              
              {/* Report Item Dropdown */}
              {user && (
                <Dropdown align="end" className="d-inline">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>Report Item</Tooltip>}
                  >
                    <Dropdown.Toggle variant="outline-light" id="dropdown-report" className="nav-link-custom report-toggle">
                      <FaPlus />
                      <span className="ms-2 d-lg-inline d-none">Report Item</span>
                    </Dropdown.Toggle>
                  </OverlayTrigger>
                  <Dropdown.Menu className="dropdown-menu-custom shadow-lg">
                    <Dropdown.Item 
                      as={Link} 
                      to="/lost/report" 
                      className="dropdown-item-custom lost-item"
                      onClick={() => setShowOffcanvas(false)}
                    >
                      <div className="d-flex align-items-center">
                        <div className="dropdown-icon lost">
                          <FaSearch />
                        </div>
                        <div>
                          <h6 className="mb-0">Report Lost Item</h6>
                          <small className="text-muted">Can't find something?</small>
                        </div>
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      as={Link} 
                      to="/found/report" 
                      className="dropdown-item-custom found-item"
                      onClick={() => setShowOffcanvas(false)}
                    >
                      <div className="d-flex align-items-center">
                        <div className="dropdown-icon found">
                          <FaBriefcase />
                        </div>
                        <div>
                          <h6 className="mb-0">Report Found Item</h6>
                          <small className="text-muted">Found something?</small>
                        </div>
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Nav>

            {/* Right-side items */}
            <Nav className="align-items-center gap-2">
              {user ? (
                <>
                  {/* Notifications */}
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>Notifications</Tooltip>}
                  >
                    <Nav.Link 
                      as={Link} 
                      to="/notifications" 
                      className="position-relative nav-link-custom"
                      onClick={markNotificationsAsRead}
                    >
                      <FaBell size={30} />
                      {unreadCount > 0 && (
                        <Badge pill bg="danger" className="notification-badge">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Nav.Link>
                  </OverlayTrigger>

                  {/* User Dropdown */}
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="outline-light" id="dropdown-user" className="user-toggle">
                      <div className="d-flex align-items-center">
                        <div className="user-avatar">
                          <FaUser />
                        </div>
                        <div className="d-none d-lg-block ms-2">
                          <div className="user-name">{user.username || user.name}</div>
                          <small className="user-email">{user.email}</small>
                        </div>
                      </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="dropdown-menu-custom shadow-lg" align="end">
                      <Dropdown.Header className="dropdown-header-custom">
                        <div className="d-flex align-items-center">
                          <div className="user-avatar-large">
                            <FaUser size={24} />
                          </div>
                          <div className="ms-3">
                            <h6 className="mb-0">{user.username || user.name}</h6>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </div>
                      </Dropdown.Header>
                      <Dropdown.Divider />
                      
                      <Dropdown.Item as={Link} to="/profile" className="dropdown-item-custom">
                        <FaUser className="me-3" />
                        <span>My Profile</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Item as={Link} to="/mylistings" className="dropdown-item-custom">
                        <FaList className="me-3" />
                        <span>My Listings</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Item as={Link} to="/matches" className="dropdown-item-custom">
                        <FaHandshake className="me-3" />
                        <span>Matches</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Item as={Link} to="/claims" className="dropdown-item-custom">
                        <FaChartLine className="me-3" />
                        <span>My Claims</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Divider />
                      
                      <Dropdown.Item as={Link} to="/settings" className="dropdown-item-custom">
                        <FaCog className="me-3" />
                        <span>Settings</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Item as={Link} to="/help" className="dropdown-item-custom">
                        <FaQuestionCircle className="me-3" />
                        <span>Help & Support</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Divider />
                      
                      <Dropdown.Item onClick={handleLogout} className="dropdown-item-custom logout-item">
                        <FaSignOutAlt className="me-3" />
                        <span>Logout</span>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>Login</Tooltip>}
                  >
                    <Button 
                      as={Link} 
                      to="/login" 
                      variant="outline-light" 
                      className="nav-btn"
                    >
                      <FaUser className="me-1 d-lg-none" />
                      <span className="d-none d-lg-inline">Login</span>
                    </Button>
                  </OverlayTrigger>
                  
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>Sign Up</Tooltip>}
                  >
                    <Button 
                      as={Link} 
                      to="/signup" 
                      variant="primary"
                      className="nav-btn-signup"
                    >
                      <FaEnvelope className="me-1 d-lg-none" />
                      <span className="d-none d-lg-inline">Sign Up</span>
                    </Button>
                  </OverlayTrigger>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="end"
        className="mobile-menu-offcanvas"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white">
            <div className="brand-logo">
              <span className="logo-text">FINDLY</span>
              <span className="logo-subtitle">Menu</span>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="mobile-menu-body">
          {user ? (
            <>
              {/* User Info */}
              <div className="mobile-user-info mb-4">
                <div className="user-avatar-large mb-3">
                  <FaUser size={32} />
                </div>
                <h5 className="text-white">{user.username || user.name}</h5>
                <small className="text-light">{user.email}</small>
              </div>

              {/* Mobile Navigation */}
              <Nav className="flex-column gap-2">
                {navItems.map((item, index) => (
                  <Nav.Link 
                    key={index}
                    as={Link} 
                    to={item.path} 
                    className={`mobile-nav-link ${isActive(item.path)}`}
                    onClick={() => setShowOffcanvas(false)}
                  >
                    {item.icon}
                    <span className="ms-3">{item.label}</span>
                  </Nav.Link>
                ))}

                {/* Report Items */}
                <div className="mobile-report-section mt-3">
                  <h6 className="text-light mb-2">Report Items</h6>
                  <div className="d-grid gap-2">
                    <Button 
                      as={Link} 
                      to="/lost/report" 
                      variant="outline-light" 
                      className="mobile-report-btn lost-btn"
                      onClick={() => setShowOffcanvas(false)}
                    >
                      <FaSearch className="me-2" />
                      Report Lost Item
                    </Button>
                    <Button 
                      as={Link} 
                      to="/found/report" 
                      variant="outline-light" 
                      className="mobile-report-btn found-btn"
                      onClick={() => setShowOffcanvas(false)}
                    >
                      <FaBriefcase className="me-2" />
                      Report Found Item
                    </Button>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-4">
                  <h6 className="text-light mb-2">Quick Links</h6>
                  <Nav className="flex-column gap-1">
                    <Nav.Link as={Link} to="/notifications" className="mobile-nav-link" onClick={() => setShowOffcanvas(false)}>
                      <FaBell className="me-3" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge pill bg="danger" className="ms-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </Nav.Link>
                    <Nav.Link as={Link} to="/profile" className="mobile-nav-link" onClick={() => setShowOffcanvas(false)}>
                      <FaUser className="me-3" />
                      Profile
                    </Nav.Link>
                    <Nav.Link as={Link} to="/mylistings" className="mobile-nav-link" onClick={() => setShowOffcanvas(false)}>
                      <FaListAlt className="me-3" />
                      My Listings
                    </Nav.Link>
                    <Nav.Link as={Link} to="/claims" className="mobile-nav-link" onClick={() => setShowOffcanvas(false)}>
                      <FaCheck className="me-3" />
                      My Claims
                    </Nav.Link>
                    <Nav.Link as={Link} to="/settings" className="mobile-nav-link" onClick={() => setShowOffcanvas(false)}>
                      <FaCog className="me-3" />
                      Settings
                    </Nav.Link>
                    <Nav.Link as={Link} to="/help" className="mobile-nav-link" onClick={() => setShowOffcanvas(false)}>
                      <FaQuestionCircle className="me-3" />
                      Help
                    </Nav.Link>
                  </Nav>
                </div>

                {/* Logout Button */}
                <Button 
                  variant="danger" 
                  className="mt-4 w-100"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Button>
              </Nav>
            </>
          ) : (
            /* Mobile menu for non-logged in users */
            <Nav className="flex-column gap-3">
              <Nav.Link 
                as={Link} 
                to="/login" 
                className="mobile-nav-link text-center"
                onClick={() => setShowOffcanvas(false)}
              >
                <FaUser className="me-2" />
                Login
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/signup" 
                className="mobile-nav-link text-center"
                onClick={() => setShowOffcanvas(false)}
              >
                <FaEnvelope className="me-2" />
                Sign Up
              </Nav.Link>
              <div className="mt-4">
                <h6 className="text-light">About FINDLY</h6>
                <p className="text-light small">
                  Reuniting lost items with their owners through smart matching and community collaboration.
                </p>
              </div>
            </Nav>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default CustomNavbar;