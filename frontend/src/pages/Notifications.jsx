import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  Dropdown,
  ListGroup,
} from 'react-bootstrap';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaHandshake,
  FaCalendarAlt,
  FaFilter,
  FaSync,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import './Notifications.css'; 

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/items/notifications');
      const notificationsData = response.data.notifications || [];
      setNotifications(notificationsData);
      setStats({
        total: notificationsData.length,
        unread: response.data.unread_count || 0,
      });
      setActiveFilter('all');
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/items/notifications/unread');
      setNotifications(response.data || []);
      setActiveFilter('unread');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      // Optimistic UI
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
      );
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));

      await api.put(`/items/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      setStats(prev => ({ ...prev, unread: 0 }));
      await api.put('/items/notifications/read-all');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    if (!id) return;
    try {
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setStats(prev => ({
        total: prev.total - 1,
        unread:
          deletedNotification?.status === 'unread'
            ? Math.max(0, prev.unread - 1)
            : prev.unread,
      }));
      setSelectedNotification(null);
      setShowDeleteModal(false);

      await api.delete(`/items/notifications/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      setNotifications([]);
      setStats({ total: 0, unread: 0 });
      await api.delete('/items/notifications');
    } catch (err) {
      console.error(err);
    }
  };

  const isToday = (dateString) => {
    const today = new Date().toDateString();
    const notificationDate = new Date(dateString).toDateString();
    return today === notificationDate;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (notification) => {
    if (notification.status === 'unread') {
      return <FaExclamationCircle className="nu-icon-unread" />;
    } else {
      return <FaCheckCircle className="nu-icon-read" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'all') return true;
      return n.status === activeFilter;
    });
  }, [notifications, activeFilter]);

  const todayCount = useMemo(
    () => notifications.filter((n) => isToday(n.created_at)).length,
    [notifications]
  );

  const statsCards = [
    { title: 'Total', value: stats.total, color: 'primary', icon: FaBell },
    { title: 'Unread', value: stats.unread, color: 'warning', icon: FaExclamationCircle },
    { title: 'Today', value: todayCount, color: 'info', icon: FaCalendarAlt },
  ];

  return (
    <Container className="nu-container py-5">
      {/* Header */}
      <Row className="nu-header-row mb-4 align-items-center">
        <Col>
          <h1 className="nu-header-title mb-0 d-flex align-items-center">
            <FaBell className="me-3 nu-header-icon"size={35} />
            Notifications
            <Badge bg="primary" className="ms-3 nu-badge-pill">
              {stats.unread}
            </Badge>
          </h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <FaSync className={loading ? 'nu-spin' : ''} />
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <FaFilter className="me-2" />
              Filter
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
              >
                All
              </Dropdown.Item>
              <Dropdown.Item
                active={activeFilter === 'unread'}
                onClick={fetchUnread}
              >
                Unread Only
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        {statsCards.map((stat, idx) => (
          <Col key={idx} xs={12} md={4} className="mb-3">
            <Card className={`nu-stats-card ${stat.color}`}>
              <Card.Body className="d-flex align-items-center">
                <div className="nu-icon-circle me-3">
                  <stat.icon className={`nu-icon-stat ${stat.color}`} />
                </div>
                <div>
                  <div className="fw-bold">{stat.title}</div>
                  <div className={`nu-stat-value ${stat.color} h3 mb-0 fs-3 fw-bold`}>{stat.value}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Bulk Actions */}
      <Card className="mb-4 nu-bulk-card">
        <Card.Body className="py-2 d-flex justify-content-between align-items-center">
          <div className="text-muted">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
          <div className="d-flex gap-2">
            {stats.unread > 0 && (
              <Button variant="outline-success" size="sm" onClick={markAllAsRead}>
                <FaCheck className="me-2" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline-danger" size="sm" onClick={deleteAllNotifications}>
                <FaTrash className="me-2" />
                Clear All
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading notifications...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert variant="danger" className="text-center">
          {error}
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-3"
            onClick={fetchNotifications}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Empty */}
      {!loading && !error && filteredNotifications.length === 0 && (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <div className="mb-4">
              <div className="nu-empty-icon-circle">
                <FaBell className="text-muted" size={48} />
              </div>
            </div>
            <h4 className="text-muted">No notifications</h4>
            <p className="text-muted mb-0">
              {activeFilter === 'unread' ? "You're all caught up!" : "No notifications to show"}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Notifications List */}
      {!loading && !error && filteredNotifications.length > 0 && (
        <ListGroup variant="flush" className="nu-list-group">
          {filteredNotifications.map((notification) => (
            <ListGroup.Item
              key={notification.id}
              className={`nu-notification-item ${notification.status}`}
            >
              <div className="d-flex align-items-start">
                <div className="nu-notification-icon me-3">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className='notif-title'>
                      <span className={`nu-type-badge ${notification.type?.toLowerCase() || 'default'}`}>
                        {notification.type || 'Notification'}
                      </span>
                    </div>
                    <small className="text-muted">{formatTime(notification.created_at)}</small>
                  </div>
                  <p className="mb-2 fs-5">{notification.message}</p>
                  <div className="d-flex gap-2 mt-2">
                    {notification.status === 'unread' && (
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => markAsRead(notification.id)}
                        disabled={actionLoading[notification.id]}
                      >
                        <FaCheck className="me-1" />
                        {actionLoading[notification.id] ? '...' : 'Mark Read'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => {
                        setSelectedNotification(notification);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash className="me-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrash className="me-2 text-danger" />
            Delete Notification
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this notification?</p>
          <p className="text-muted small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => deleteNotification(selectedNotification?.id)}
            disabled={!selectedNotification}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Notifications;
