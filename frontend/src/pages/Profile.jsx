import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Tabs,
  Tab,
  Badge,
  ProgressBar,
  Modal,
  Image,
  ListGroup,
  InputGroup
} from 'react-bootstrap';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaKey,
  FaChartLine,
  FaBell,
  FaHandshake,
  FaSearch,
  FaMapMarkerAlt,
  FaCog,
  FaShieldAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaLock,
  FaUnlock,
  FaHistory,
  FaTrash,
  FaCamera
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { BACKEND_URL } from '../api';
import './Profile.css';

const Profile = () => {
  const { user: authUser, logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit states
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deletePassword, setDeletePassword] = useState("");
  
  // Stats
  const [stats, setStats] = useState({
    lostItems: 0,
    foundItems: 0,
    matches: 0,
    claims: 0,
    successRate: 0
  });
  
  // Modals
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch user profile and stats
  useEffect(() => {
    if (authUser) {
      fetchProfile();
      fetchStats();
    }
  }, [authUser]);
  
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.user);
      setFormData({
        username: response.data.user.username || '',
        email: response.data.user.email || '',
        phone: response.data.user.phone || ''
      });
    } catch (err) {
      setError('Failed to load profile. Please try again.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      // Fetch user statistics
      const [lostRes, foundRes, matchesRes, claimsRes] = await Promise.all([
        api.get('/items/mylistings/lost?limit=100'),
        api.get('/items/mylistings/found?limit=100'),
        api.get('/items/mylistings/matches?limit=100'),
        api.get('/items/myclaims')
      ]);
      
      const lostItems = lostRes.data.lostItems?.length || 0;
      const foundItems = foundRes.data.foundItems?.length || 0;
      const matches = matchesRes.data.matches?.length || 0;
      const claimsMade = claimsRes.data.claims_made?.items?.length || 0;
      const claimsReceived = claimsRes.data.claims_received?.length || 0;
      const totalClaims = claimsMade + claimsReceived;
      
      // Calculate success rate (items claimed or returned)
      const claimedItems = lostRes.data.items?.filter(item => item.status === 'Claimed').length || 0;
      const returnedItems = foundRes.data.items?.filter(item => item.status === 'Returned').length || 0;
      const successRate = lostItems + foundItems > 0 
        ? Math.round(((claimedItems + returnedItems) / (lostItems + foundItems)) * 100)
        : 0;
      
      setStats({
        lostItems,
        foundItems,
        matches,
        claims: totalClaims,
        successRate
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };
  
  const handleEditToggle = () => {
    if (editing) {
      // Reset form data
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setEditing(!editing);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_pic', file);

    try {
      const res = await api.put('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(prev => ({
        ...prev,
        profile_pic: res.data.profile_pic
      }));

      setSuccess('Profile picture updated successfully');

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      const response = await api.put('/auth/profile', formData);
      
      setUser(response.data.user);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    }
  };
  
  const handleChangePassword = async () => {
    setError('');

    if (!passwordForm.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!passwordForm.newPassword) {
      setError('New password is required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);

      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Password is required to delete account');
      return;
    }

    try {
      await api.delete('/auth/delete-account', {
        data: { password: deletePassword }
      });

      logout();
      window.location.href = '/';

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    }
  };
  
  // Components
  const StatCard = ({ title, value, icon: Icon, color, subtitle, progress }) => (
    <Card className="stat-card h-100">
      <Card.Body>
        <div className="stat-icon-wrapper">
          <div className={`stat-icon ${color}`}>
            <Icon size={24} />
          </div>
        </div>
        <h3 className="stat-value">{value}</h3>
        <Card.Title className="stat-title">{title}</Card.Title>
        {subtitle && <small className="text-muted">{subtitle}</small>}
        {progress !== undefined && (
          <ProgressBar 
            now={progress} 
            variant={progress >= 70 ? 'success' : progress >= 40 ? 'warning' : 'danger'}
            className="mt-2"
            label={`${progress}%`}
          />
        )}
      </Card.Body>
    </Card>
  );
  
  const SecurityTip = ({ title, description, icon: Icon, color }) => (
    <div className="security-tip">
      <div className={`security-tip-icon ${color}`}>
        <Icon />
      </div>
      <div className="security-tip-content">
        <h6>{title}</h6>
        <p className="text-muted small">{description}</p>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="profile-page">
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading profile...</p>
          </div>
        </Container>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="profile-page">
        <Container className="py-5">
          <Alert variant="danger">
            <FaExclamationTriangle className="me-2" />
            Unable to load profile. Please try again.
          </Alert>
          <Button variant="primary" onClick={fetchProfile}>
            Retry
          </Button>
        </Container>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <Container fluid="xxl" className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="profile-header">
              <h1 className="page-title">
                <FaUser className="me-3" />
                My Profile
              </h1>
              <p className="page-subtitle">
                Manage your account settings and view your activity statistics.
              </p>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <Button
              variant={editing ? "outline-secondary" : "outline-primary"}
              onClick={handleEditToggle}
              className="me-2"
            >
              {editing ? (
                <>
                  <FaTimes className="me-2" />
                  Cancel
                </>
              ) : (
                <>
                  <FaEdit className="me-2" />
                  Edit Profile
                </>
              )}
            </Button>
            {editing && (
              <Button variant="primary" onClick={handleSaveProfile}>
                <FaSave className="me-2" />
                Save Changes
              </Button>
            )}
          </Col>
        </Row>
        
        {/* Success/Error Messages */}
        {success && (
          <Alert variant="success" className="mb-4" onClose={() => setSuccess('')} dismissible>
            <FaCheckCircle className="me-2" />
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        
        {/* Main Content */}
        <Row>
          {/* Left Column - Profile Info */}
          <Col lg={4} className="mb-4">
            <Card className="profile-card">
              <Card.Body className="text-center">
                {/* Avatar */}
                <div className="profile-avatar-wrapper mb-4">
                  <div className="profile-avatar">
                    {user.profile_pic ? (
                      <Image
                        src={`${BACKEND_URL}/${user.profile_pic}`}
                        roundedCircle
                        width={120}
                        height={120}
                        className="profile-avatar-img"
                      />
                    ) : (
                      <div className="avatar-circle">
                        <FaUser size={48} />
                      </div>
                    )}

                    {/* Upload Icon */}
                    <label htmlFor="profilePicUpload" className="avatar-upload-btn">
                      <FaCamera />
                    </label>

                    <input
                      type="file"
                      id="profilePicUpload"
                      accept="image/*"
                      hidden
                      onChange={handleProfilePicUpload}
                    />
                  </div>
                </div>
                
                {/* User Info */}
                <h3 className="profile-name">{user.username}</h3>
                <p className="profile-email text-muted">
                  <FaEnvelope className="me-2" />
                  {user.email}
                </p>
                
                {user.phone && (
                  <p className="profile-phone text-muted">
                    <FaPhone className="me-2" />
                    {user.phone}
                  </p>
                )}
                
                <div className="profile-join-date text-muted">
                  <FaCalendarAlt className="me-2" />
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                
                {/* Quick Stats */}
                <div className="profile-quick-stats mt-4">
                  <Row>
                    <Col xs={6} className="mb-3">
                      <div className="quick-stat">
                        <h5>{stats.lostItems}</h5>
                        <small className="text-muted">Lost Items</small>
                      </div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="quick-stat">
                        <h5>{stats.foundItems}</h5>
                        <small className="text-muted">Found Items</small>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Account Actions */}
                <div className="profile-actions mt-4">
                  <Button
                    variant="outline-primary"
                    className="w-100 mb-2"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <FaKey className="me-2" />
                    Change Password
                  </Button>
                  
                  <Button
                    variant="outline-danger"
                    className="w-100"
                    onClick={() => setShowDeleteAccount(true)}
                  >
                    <FaTrash className="me-2" />
                    Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
            
            {/* Security Tips */}
            <Card className="mt-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaShieldAlt className="me-2" />
                  Security Tips
                </h5>
              </Card.Header>
              <Card.Body>
                <SecurityTip
                  title="Strong Password"
                  description="Use a unique password with letters, numbers, and symbols."
                  icon={FaLock}
                  color="primary"
                />
                <SecurityTip
                  title="Email Verification"
                  description="Your email is verified for important notifications."
                  icon={FaCheckCircle}
                  color="success"
                />
                <SecurityTip
                  title="Regular Updates"
                  description="Keep your profile information up to date."
                  icon={FaBell}
                  color="warning"
                />
              </Card.Body>
            </Card>
          </Col>
          
          {/* Right Column - Detailed Info */}
          <Col lg={8}>
            <Card className="profile-details-card">
              <Card.Body>
                {/* Tabs */}
                <Tabs
                  activeKey={activeTab}
                  onSelect={setActiveTab}
                  className="profile-tabs mb-4"
                >
                  <Tab eventKey="overview" title="Overview">
                    <div className="tab-content mt-4">
                      <h5 className="mb-4">Profile Information</h5>
                      
                      {editing ? (
                        <Form>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaUser className="me-2" />
                              Username
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              placeholder="Enter your username"
                            />
                            <Form.Text className="text-muted">
                              This will be displayed to other users.
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaEnvelope className="me-2" />
                              Email Address
                            </Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="Enter your email"
                            />
                            <Form.Text className="text-muted">
                              We'll send notifications to this email.
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPhone className="me-2" />
                              Phone Number (Optional)
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Enter your phone number"
                            />
                            <Form.Text className="text-muted">
                              Used for important alerts (optional).
                            </Form.Text>
                          </Form.Group>
                        </Form>
                      ) : (
                        <ListGroup variant="flush">
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaUser className="me-3" />
                              <strong>Username:</strong>
                            </div>
                            <span>{user.username}</span>
                          </ListGroup.Item>
                          
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaEnvelope className="me-3" />
                              <strong>Email:</strong>
                            </div>
                            <span>{user.email}</span>
                          </ListGroup.Item>
                          
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaPhone className="me-3" />
                              <strong>Phone:</strong>
                            </div>
                            <span>{user.phone || 'Not provided'}</span>
                          </ListGroup.Item>
                          
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaCalendarAlt className="me-3" />
                              <strong>Member Since:</strong>
                            </div>
                            <span>
                              {new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </ListGroup.Item>
                        </ListGroup>
                      )}
                      
                      <div className="profile-bio mt-4">
                        <h6 className="mb-3">About Me</h6>
                        <p className="text-muted">
                          {editing ? (
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Tell us a bit about yourself..."
                            />
                          ) : (
                            'No bio added yet. Click "Edit Profile" to add a short bio.'
                          )}
                        </p>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab eventKey="stats" title="Statistics">
                    <div className="tab-content mt-4">
                      <h5 className="mb-4">Your Activity Statistics</h5>
                      
                      <Row className="mb-4">
                        <Col md={6} className="mb-3">
                          <StatCard
                            title="Lost Items"
                            value={stats.lostItems}
                            icon={FaSearch}
                            color="danger"
                            subtitle="Items you've reported as lost"
                          />
                        </Col>
                        <Col md={6} className="mb-3">
                          <StatCard
                            title="Found Items"
                            value={stats.foundItems}
                            icon={FaBell}
                            color="success"
                            subtitle="Items you've reported as found"
                          />
                        </Col>
                      </Row>
                      
                      <Row className="mb-4">
                        <Col md={6} className="mb-3">
                          <StatCard
                            title="Matches"
                            value={stats.matches}
                            icon={FaHandshake}
                            color="primary"
                            subtitle="Potential matches found"
                          />
                        </Col>
                        <Col md={6} className="mb-3">
                          <StatCard
                            title="Claims"
                            value={stats.claims}
                            icon={FaCheckCircle}
                            color="info"
                            subtitle="Claims made or received"
                          />
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={12}>
                          <StatCard
                            title="Success Rate"
                            value={`${stats.successRate}%`}
                            icon={FaChartLine}
                            color="warning"
                            subtitle="Items successfully claimed or returned"
                            progress={stats.successRate}
                          />
                        </Col>
                      </Row>
                      
                      <div className="statistics-insights mt-4">
                        <h6 className="mb-3">
                          <FaChartLine className="me-2" />
                          Insights
                        </h6>
                        <ul className="text-muted">
                          <li>You've reported {stats.lostItems + stats.foundItems} items in total</li>
                          <li>Your items have {stats.matches} potential matches</li>
                          <li>{stats.successRate}% of your reported items were successfully resolved</li>
                          <li>Keep reporting items to increase your success rate</li>
                        </ul>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab eventKey="settings" title="Settings">
                    <div className="tab-content mt-4">
                      <h5 className="mb-4">Account Settings</h5>
                      
                      <Form>
                        {/* Notification Settings */}
                        <div className="settings-section mb-4">
                          <h6 className="mb-3">
                            <FaBell className="me-2" />
                            Notification Settings
                          </h6>
                          
                          <Form.Check 
                            type="switch"
                            id="email-notifications"
                            label="Email notifications for new matches"
                            defaultChecked
                            className="mb-2"
                          />
                          
                          <Form.Check 
                            type="switch"
                            id="push-notifications"
                            label="Push notifications for claims"
                            defaultChecked
                            className="mb-2"
                          />
                          
                          <Form.Check 
                            type="switch"
                            id="newsletter"
                            label="Receive newsletter and updates"
                            defaultChecked
                          />
                        </div>
                        
                        {/* Privacy Settings */}
                        <div className="settings-section mb-4">
                          <h6 className="mb-3">
                            <FaLock className="me-2" />
                            Privacy Settings
                          </h6>
                          
                          <Form.Check 
                            type="switch"
                            id="show-profile"
                            label="Show my profile to other users"
                            defaultChecked
                            className="mb-2"
                          />
                          
                          <Form.Check 
                            type="switch"
                            id="show-email"
                            label="Show email to matched users"
                            defaultChecked
                            className="mb-2"
                          />
                          
                          <Form.Check 
                            type="switch"
                            id="show-phone"
                            label="Show phone number to matched users"
                            defaultChecked
                          />
                        </div>
                        
                        {/* Display Settings */}
                        <div className="settings-section">
                          <h6 className="mb-3">
                            <FaCog className="me-2" />
                            Display Settings
                          </h6>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Theme</Form.Label>
                            <Form.Select>
                              <option>Light Theme</option>
                              <option>Dark Theme</option>
                              <option>Auto (System)</option>
                            </Form.Select>
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Items per page</Form.Label>
                            <Form.Select>
                              <option>10 items</option>
                              <option>20 items</option>
                              <option>50 items</option>
                            </Form.Select>
                          </Form.Group>
                        </div>
                        
                        <Button variant="primary" className="mt-3">
                          <FaSave className="me-2" />
                          Save Settings
                        </Button>
                      </Form>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Change Password Modal */}
      <Modal show={showChangePassword} onHide={() => setShowChangePassword(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaKey className="me-2" />
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
              />
            </Form.Group>
            
            <Alert variant="info" className="mt-3">
              <FaInfoCircle className="me-2" />
              <strong>Tip:</strong> Use a strong password with a mix of letters, numbers, and symbols.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChangePassword(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleChangePassword}>
            <FaSave className="me-2" />
            Change Password
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Account Modal */}
      <Modal show={showDeleteAccount} onHide={() => setShowDeleteAccount(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExclamationTriangle className="me-2 text-danger" />
            Delete Account
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-3">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning:</strong> This action cannot be undone!
          </Alert>
          
          <p className="text-muted">
            Are you sure you want to delete your account? This will:
          </p>
          
          <ul className="text-muted">
            <li>Permanently delete your profile</li>
            <li>Remove all your reported items</li>
            <li>Delete your match history</li>
            <li>Cancel all pending claims</li>
          </ul>
          
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAccount(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount}>
            <FaTrash className="me-2" />
            Delete Account
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Profile;