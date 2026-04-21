import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Badge,
  Button,
  Alert,
  Spinner,
  ProgressBar,
  Dropdown,
  Modal,
  Form,
  ListGroup
} from 'react-bootstrap';
import {
  getImageUrls,
  formatDate,
  getItemLocation,
  getItemDate
} from '../utils/itemHelpers';
import {ItemDetailsModal} from '../components/ItemDetailsModal';
import FinderInfoModal from '../components/FinderInfoModal';
import ClaimModal from '../components/ClaimModal';
import {

  FaBell,
  FaHandshake,
  FaChartLine,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaEye,
  FaChevronRight,
  FaPercentage,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTag,
  FaQuestionCircle,
  FaExclamationTriangle,
  FaHistory,
  FaSync,
  FaArrowRight,
  FaComment,
  FaUserCheck,
  FaImage,
  FaShieldAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import './Matches.css';

// Constants
const MATCH_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const MATCH_STATUS_COLORS = {
  [MATCH_STATUS.PENDING]: 'warning',
  [MATCH_STATUS.APPROVED]: 'success',
  [MATCH_STATUS.REJECTED]: 'danger'
};

const MATCH_STATUS_ICONS = {
  [MATCH_STATUS.PENDING]: FaClock,
  [MATCH_STATUS.APPROVED]: FaCheckCircle,
  [MATCH_STATUS.REJECTED]: FaTimesCircle
};

const getMatchQuality = (score) => {
  if (score >= 90) return { label: 'Excellent', color: 'success', emoji: '🎯' };
  if (score >= 80) return { label: 'Very Good', color: 'info', emoji: '✨' };
  if (score >= 70) return { label: 'Good', color: 'primary', emoji: '👍' };
  if (score >= 60) return { label: 'Fair', color: 'warning', emoji: '🤔' };
  return { label: 'Weak', color: 'secondary', emoji: '📝' };
};

const Matches = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('all');
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgScore: 0,
    highScore: 0
  });

  const [sortConfig, setSortConfig] = useState({
    field: 'created_at',
    direction: 'desc'
  });

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [claimAnswers, setClaimAnswers] = useState({ answer1: '', answer2: '' });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess , setClaimSucccess] = useState('');
  const [claimError, setClaimError] = useState('');

  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null); // 'lost' | 'found'
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [showFinderModal, setShowFinderModal] = useState(false);
  const [finderInfo, setFinderInfo] = useState(null);


  // Fetch matches
  const fetchMatches = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/items/mylistings/matches');
      const matchesData = response.data.matches || [];
      setMatches(matchesData);
      setFilteredMatches(matchesData);
      
      // Calculate statistics
      calculateStats(matchesData);
    } catch (err) {
      setError('Failed to load matches. Please try again.');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateStats = (matchesData) => {
    const total = matchesData.length;
    const pending = matchesData.filter(m => m.match_status === MATCH_STATUS.PENDING).length;
    const approved = matchesData.filter(m => m.match_status === MATCH_STATUS.APPROVED).length;
    const rejected = matchesData.filter(m => m.match_status === MATCH_STATUS.REJECTED).length;
    
    const scores = matchesData.map(m => m.match_score || 0);
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const highScore = scores.length > 0 ? Math.max(...scores) : 0;

    setStats({
      total,
      pending,
      approved,
      rejected,
      avgScore,
      highScore
    });
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Filter matches by active tab
  useEffect(() => {
    let filtered = [...matches];
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(match => match.match_status === activeTab);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      if (sortConfig.field === 'match_score') {
        return (b.match_score - a.match_score) * direction;
      }
      
      if (sortConfig.field === 'created_at') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return (dateB - dateA) * direction;
      }
      
      return 0;
    });
    
    setFilteredMatches(filtered);
  }, [activeTab, matches, sortConfig]);

  // Handlers
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleClaimClick = (match) => {
    setSelectedMatch(match);
    setClaimAnswers({ answer1: '', answer2: '' });
    setClaimError('');
    setShowClaimModal(true);
  };

  const handleClaimSubmit = async () => {
  if (!selectedMatch || !claimAnswers.answer1 || !claimAnswers.answer2) {
    setClaimError('Please answer both security questions');
    return;
  }

  setClaimLoading(true);
  setClaimError('');
  setClaimSucccess('');

  try {
    const matchId = selectedMatch.match_id;

    const response = await api.post('/items/match/claim', {
      match_id: matchId,
      answer1: claimAnswers.answer1,
      answer2: claimAnswers.answer2
    });

    const { status, contact, error } = response.data;

    if (status === 'approved') {
      //  update UI from backend truth
      setMatches(prev =>
        prev.map(match =>
          match.match_id === matchId
            ? { ...match, match_status: MATCH_STATUS.APPROVED }
            : match
        )
      );

      setClaimSucccess('Claim approved successfully!');
      setFinderInfo(contact);
      setShowFinderModal(true);

      setTimeout(() => setShowClaimModal(false), 1000);
    }

    else if (status === 'rejected') {
      //  rejected by backend
      setMatches(prev =>
        prev.map(match =>
          match.match_id === matchId
            ? { ...match, match_status: MATCH_STATUS.REJECTED }
            : match
        )
      );

      setClaimError(error || 'Claim rejected. Answers did not match.');
    }

  } catch (err) {
    //  real server / network failure only
    setClaimError(
      err.response?.data?.error || 'Server error. Please try again later.'
    );
  } finally {
    setClaimLoading(false);
  }
 };

 
  //Item Detail Handler
   const viewItemDetails = (item, type) => {
  setSelectedItem(item);
  setItemType(type);     
  setCarouselIndex(0);
  setShowItemModal(true);
};

  // Components
  const StatsCard = ({ title, value, icon: Icon, color, description }) => (
    <Card className="stats-card h-100">
      <Card.Body className="d-flex align-items-center">
        <div className={`stats-icon ${color}`}>
          <Icon size={24} />
        </div>
        <div className="ms-3 flex-grow-1">
          <Card.Title className="mb-1">{value}</Card.Title>
          <Card.Subtitle className="text-muted mb-1">{title}</Card.Subtitle>
          {description && <small className="text-muted">{description}</small>}
        </div>
      </Card.Body>
    </Card>
  );

  const MatchCard = ({ match }) => {
    const StatusIcon = MATCH_STATUS_ICONS[match.match_status] || FaClock;
    const quality = getMatchQuality(match.match_score);
    const isClaimable = match.match_status === MATCH_STATUS.PENDING;

    return (
      <Col xs={12} md={6} lg={4} className="mb-4">
        <Card className="match-card h-100">
          {/* Card Header with Status */}
          <Card.Header className="match-card-header">
            <div className="d-flex justify-content-between align-items-center">
              <Badge bg={MATCH_STATUS_COLORS[match.match_status]} className="status-badge">
                <StatusIcon className="me-1" size={12} />
                {match.match_status}
              </Badge>
              <Badge bg="light" text="dark" className="score-badge">
                <FaPercentage className="me-1" />
                {match.match_score}%
              </Badge>
            </div>
          </Card.Header>

          <Card.Body>
            {/* Match Quality */}
            <div className="match-quality mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="quality-label">
                  {quality.emoji} {quality.label} Match
                </span>
                <Badge bg={quality.color} className="quality-badge">
                  {match.match_score}%
                </Badge>
              </div>
              <ProgressBar 
                now={match.match_score} 
                variant={quality.color}
                className="match-progress"
              />
            </div>

            {/* Items Info */}
            <div className="match-items">
              <div className="lost-item mb-3">
                <small className="text-muted d-block mb-1">Your Lost Item</small>
                <div className="d-flex align-items-center">
                  <div className="item-icon lost">
                    <FaBell />
                  </div>
                  <div className="ms-2 flex-grow-1">
                    <h6 className="mb-0">{match.lost_item.item_name}</h6>
                    <small className="text-muted">
                      <FaTag className="me-1" /> {match.lost_item.category}
                    </small>
                  </div>
                </div>
                <div className="item-details mt-2">
                  <small>
                    <FaMapMarkerAlt className="me-1" />
                    {match.lost_item.lost_location}
                  </small>
                  <br />
                  <div className='d-flex justify-content-between'>
                    <small>
                      <FaCalendarAlt className="me-1" />
                      {formatDate(match.lost_item.lost_date)}
                    </small>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => viewItemDetails(match.lost_item , "lost")}
                    >
                      <FaEye className="me-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>

              <div className="match-arrow text-center my-2">
                <FaArrowRight size={20} className="text-primary" />
              </div>

              <div className="found-item">
                <small className="text-muted d-block mb-1">Found Item</small>
                <div className="d-flex align-items-center">
                  <div className="item-icon found">
                    <FaHandshake />
                  </div>
                  <div className="ms-2 flex-grow-1">
                    <h6 className="mb-0">{match.found_item.item_name}</h6>
                    <small className="text-muted">
                      <FaTag className="me-1" /> {match.found_item.category}
                    </small>
                  </div>
                </div>
                <div className="item-details mt-2">
                  <small>
                    <FaMapMarkerAlt className="me-1" />
                    {match.found_item.found_location}
                  </small>
                  <br />
                  <div className='d-flex justify-content-between'>
                  <small>
                    <FaCalendarAlt className="me-1" />
                    {formatDate(match.found_item.found_date)}
                  </small>
                  <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => viewItemDetails(match.found_item , "found")}
                    >
                      <FaEye className="me-2" />
                      View Details
                    </Button>
                    </div>
                </div>
              </div>
            </div>
          </Card.Body>

          <Card.Footer className="match-card-footer">
            <div className="d-grid gap-2">
              {isClaimable && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleClaimClick(match)}
                >
                  <FaUserCheck className="me-2" />
                  Claim Match
                </Button>
              )}
            </div>
          </Card.Footer>
        </Card>
      </Col>
    );
  };

  const EmptyState = () => (
    <Card className="text-center py-5 empty-state">
      <Card.Body>
        <FaHandshake size={60} className="text-muted mb-3" />
        <h4>No Matches Found</h4>
        <p className="text-muted">
          {activeTab === 'all'
            ? "You don't have any matches yet. Report a lost item to get started!"
            : `No ${activeTab.toLowerCase()} matches found.`
          }
        </p>
        <Button
          as={Link}
          to="/lost/report"
          variant="primary"
          className="mt-3"
        >
          <FaBell className="me-2" />
          Report Lost Item
        </Button>
      </Card.Body>
    </Card>
  );

  // Tabs configuration
  const tabs = [
    { key: 'all', label: 'All Matches', count: stats.total, icon: FaHandshake },
    { key: MATCH_STATUS.PENDING, label: 'Pending', count: stats.pending, icon: FaClock },
    { key: MATCH_STATUS.APPROVED, label: 'Approved', count: stats.approved, icon: FaCheckCircle },
    { key: MATCH_STATUS.REJECTED, label: 'Rejected', count: stats.rejected, icon: FaTimesCircle },
  ];

  return (
    <div className="matches-page">
      <Container fluid="xxl" className="py-4">
        {/* Header */}
        <Row className="mb-4 align-items-center">
          <Col>
            <div className="page-header">
              <h1 className="page-title">
                <FaHandshake className="me-2" />
                Your Matches
              </h1>
              <p className="page-subtitle">
                Smart matches found for your lost items. Review and claim them here.
              </p>
            </div>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-primary"
              onClick={fetchMatches}
              disabled={loading}
            >
              <FaSync className={loading ? 'spinning' : ''} />
              <span className="ms-2">Refresh</span>
            </Button>
          </Col>
        </Row>

        {/* Statistics */}
        <Row className="mb-4">
          <Col xs={12} md={6} lg={3} className="mb-3">
            <StatsCard
              title="Total Matches"
              value={stats.total}
              icon={FaHandshake}
              color="primary"
              description="All matches found"
            />
          </Col>
          <Col xs={12} md={6} lg={3} className="mb-3">
            <StatsCard
              title="Pending"
              value={stats.pending}
              icon={FaClock}
              color="warning"
              description="Awaiting action"
            />
          </Col>
          <Col xs={12} md={6} lg={3} className="mb-3">
            <StatsCard
              title="Avg. Match Score"
              value={`${stats.avgScore}%`}
              icon={FaPercentage}
              color="info"
              description="Average match quality"
            />
          </Col>
          <Col xs={12} md={6} lg={3} className="mb-3">
            <StatsCard
              title="Best Match"
              value={`${stats.highScore}%`}
              icon={FaChartLine}
              color="success"
              description="Highest match score"
            />
          </Col>
        </Row>

        {/* Tabs and Controls */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="p-0">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-3">
              <Tabs
                activeKey={activeTab}
                onSelect={setActiveTab}
                className="matches-tabs mb-3 mb-md-0"
              >
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <Tab
                      key={tab.key}
                      eventKey={tab.key}
                      title={
                        <div className="tab-title">
                          <Icon className="me-2" />
                          {tab.label}
                          {tab.count > 0 && (
                            <Badge bg="light" text="dark" className="ms-2">
                              {tab.count}
                            </Badge>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </Tabs>

              <div className="controls">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
                    {sortConfig.direction === 'asc' ? (
                      <FaSortAmountUp className="me-2" />
                    ) : (
                      <FaSortAmountDown className="me-2" />
                    )}
                    Sort by {sortConfig.field === 'match_score' ? 'Score' : 'Date'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleSort('match_score')}>
                      <FaPercentage className="me-2" />
                      Match Score {sortConfig.field === 'match_score' && 
                        (sortConfig.direction === 'desc' ? '(High to Low)' : '(Low to High)')}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleSort('created_at')}>
                      <FaHistory className="me-2" />
                      Date {sortConfig.field === 'created_at' && 
                        (sortConfig.direction === 'desc' ? '(Newest)' : '(Oldest)')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Finding your matches...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="danger" className="text-center">
            <FaExclamationTriangle className="me-2" />
            {error}
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="ms-3" 
              onClick={fetchMatches}
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Matches Grid */}
        {!loading && !error && (
          <>
            {filteredMatches.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Row>
                  {filteredMatches.map(match => (
                    <MatchCard key={match.match_id} match={match} />
                  ))}
                </Row>
                
                {/* Match Summary */}
                {filteredMatches.length > 0 && (
                  <Card className="mt-4">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">
                            Showing {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
                            {activeTab !== 'all' && ` (${activeTab.toLowerCase()} only)`}
                          </small>
                        </div>
                        <div>
                          <small className="text-muted">
                            Avg. Score: <strong>{stats.avgScore}%</strong>
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Claim Modal */}
      <ClaimModal
        show={showClaimModal}
        onHide={() => setShowClaimModal(false)}
        match={selectedMatch}
        answers={claimAnswers}
        onAnswerChange={(field, value) => 
          setClaimAnswers(prev => ({ ...prev, [field]: value }))
        }
        onSubmit={handleClaimSubmit}
        loading={claimLoading}
        success={claimSuccess}
        error={claimError}
      />

      {/* Item Details Modal */}
      <ItemDetailsModal
        show={showItemModal}
        onHide={() => setShowItemModal(false)}
        item={selectedItem}
        type={itemType}
        carouselIndex={carouselIndex}
        onSelectCarousel={setCarouselIndex}
        onPrevCarousel={() =>
          setCarouselIndex((prev) => Math.max(prev - 1, 0))
        }
        onNextCarousel={() =>
          setCarouselIndex((prev) => prev + 1)
        }
        onClaim={null}
      />

      {/* Finder Info Modal */}
      <FinderInfoModal
        show={showFinderModal}
        onHide={() => {
        setShowFinderModal(false);
        setFinderInfo(null);
        }}
        finder={finderInfo}
      />

    </div>
  );
};

export default Matches;