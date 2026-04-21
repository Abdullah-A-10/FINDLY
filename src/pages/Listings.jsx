import React, { useState, useEffect, useContext } from 'react';
import {
  getImageUrls,
  formatDate,
} from '../utils/itemHelpers';
import { ItemDetailsModal, StatusBadge } from '../components/ItemDetailsModal';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Form,
  Button,
  Badge,
  InputGroup,
  Spinner,
  Alert,
  Modal,
  Dropdown,
  Pagination,
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaTag,
  FaEye,
  FaPlus,
  FaTimes,
  FaSortAmountDown,
  FaSortAmountUp,
  FaImage,
  FaClock,
  FaBell,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import './Listings.css';

// Constants
const CATEGORIES = [
  'Electronics', 'Documents', 'Jewelry', 'Clothing', 'Accessories',
  'Bags & Wallets', 'Keys', 'Books', 'Toys', 'Sports Equipment', 'Other'
];

const STATUS_OPTIONS = {
  lost: ['Lost', 'Matched', 'Claimed'],
  found: ['Reported', 'Matched', 'Returned']
};

const Listings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [claimNotice, setClaimNotice] = useState({ type: '', info: '' });
  
  // SIMPLE pagination state - one object for current tab
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 12;
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  
  // Separate counts for each tab
  const [tabCounts, setTabCounts] = useState({
    lost: 0,
    found: 0
  });
  
  // Sort state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch counts for both tabs
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      try {
        const lostRes = await api.get('/items/lost/search?limit=1');
        const foundRes = await api.get('/items/found/search?limit=1');
        
        setTabCounts({
          lost: lostRes.data.pagination?.total || 0,
          found: foundRes.data.pagination?.total || 0
        });
      } catch (err) {
        console.error('Error fetching counts:', err);
      }
    };
    
    fetchCounts();
  }, [user]);

  // Fetch items 
  const fetchItems = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: page,
        limit: limit
      });

      // Add filters
      if (filters.search?.trim()) params.append('item_name', filters.search.trim());
      if (filters.category) params.append('category', filters.category);
      if (filters.location?.trim()) params.append('location', filters.location.trim());
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const endpoint = activeTab === 'lost' ? '/items/lost/search' : '/items/found/search';
      const response = await api.get(`${endpoint}?${params}`);
      
      setItems(response.data.items || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || 0);
      
    } catch (err) {
      setError(`Failed to load ${activeTab} items. Please try again.`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when tab, page, or filters change
  useEffect(() => {
    fetchItems();
  }, [activeTab, page, filters]); // Dependencies are explicit

  // Handle tab change 
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1); // Reset to page 1 when changing tabs
  };

  // Handle filter changes with debounce
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to page 1 when filters change
  };

  // Apply filters from modal
  const applyFilters = () => {
    setShowFilters(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    setPage(1);
    setShowFilters(false);
  };

  // Remove individual filter
  const removeFilter = (filterName) => {
    setFilters(prev => ({ ...prev, [filterName]: '' }));
    setPage(1);
  };

  // SIMPLE page change handler
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }

    // Sort current items
    const sorted = [...items].sort((a, b) => {
      if (field === 'created_at') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (field === 'item_name') {
        const nameA = a.item_name?.toLowerCase() || '';
        const nameB = b.item_name?.toLowerCase() || '';
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });
    
    setItems(sorted);
  };

  // Modal handlers
  const viewItemDetails = (item) => {
    setSelectedItem(item);
    setCarouselIndex(0);
    setShowItemModal(true);
  };

  const handleClaimItem = async (foundItemId) => {
    try {
      setClaimNotice({ type: 'info', info: 'Checking for a matching lost item...' });

      const response = await api.post('/items/claim/public', { found_item_id: foundItemId });
      const { status, error } = response.data;

      if (status === 'match_created') {
        setClaimNotice({ type: 'success', info: 'Potential match found! Please verify ownership.' });
        setTimeout(() => navigate('/matches'), 1500);
      } else if (status === 'match_exists') {
        setClaimNotice({ type: 'info', info: 'You already have a match for this item. Redirecting...' });
        setTimeout(() => navigate('/matches'), 800);
      } else if (status === 'rejected') {
        setClaimNotice({ type: 'warning', info: error || 'Unable to create a match.' });
      }
    } catch (err) {
      setClaimNotice({ 
        type: 'danger', 
        info: err.response?.data?.error || 'Something went wrong. Please try again.' 
      });
    }
  };

  const handleCarouselPrev = () => {
    const urls = getImageUrls(selectedItem?.image_urls);
    setCarouselIndex(prev => (prev === 0 ? urls.length - 1 : prev - 1));
  };

  const handleCarouselNext = () => {
    const urls = getImageUrls(selectedItem?.image_urls);
    setCarouselIndex(prev => (prev === urls.length - 1 ? 0 : prev + 1));
  };

  // Active filters display
  const ActiveFilters = () => {
    const active = Object.entries(filters).filter(([_, v]) => v);
    if (active.length === 0) return null;

    return (
      <div className="active-filters mt-3">
        <small className="text-muted me-2">Active filters:</small>
        {active.map(([key, value]) => (
          <Badge key={key} bg="info" className="me-2 filter-badge">
            {key === 'startDate' ? 'From' : key === 'endDate' ? 'To' : key}: {value}
            <FaTimes className="ms-1 filter-remove" onClick={() => removeFilter(key)} />
          </Badge>
        ))}
        <Button variant="link" size="sm" onClick={resetFilters}>
          Clear all
        </Button>
      </div>
    );
  };

  // Item Card Component
  const ItemCard = ({ item }) => {
    const urls = getImageUrls(item.image_urls);
    const firstImage = urls[0];

    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
        <Card className="listing_card h-100">
          <div className="card-image-section">
            {firstImage ? (
              <Card.Img
                variant="top"
                src={firstImage}
                alt={item.item_name}
                className="item-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.querySelector('.no-image-placeholder')?.classList.remove('d-none');
                }}
              />
            ) : null}
            <div className={`no-image-placeholder ${firstImage ? 'd-none' : ''}`}>
              <FaImage size={40} />
              <span>No Image</span>
            </div>
            
            {urls.length > 1 && (
              <Badge bg="dark" className="image-count-badge">
                {urls.length} <FaImage size={12} />
              </Badge>
            )}
            
            <div className="card-overlay">
              <div className="status-overlay">
                <StatusBadge status={item.status} type={activeTab} />
              </div>
              <Button variant="light" size="sm" className="view-btn" onClick={() => viewItemDetails(item)}>
                <FaEye /> View
              </Button>
            </div>
          </div>
          
          <Card.Body className="d-flex flex-column">
            <Card.Title className="item-title">
              {item.item_name}
              <small className="text-muted d-block mt-1">
                <FaTag className="me-1" /> {item.category}
              </small>
            </Card.Title>
            
            <Card.Text className="item-description flex-grow-1">
              {item.description?.length > 100
                ? `${item.description.substring(0, 50)}...`
                : item.description}
            </Card.Text>
            
            <div className="item-meta mt-auto">
              <div className="location">
                <FaMapMarkerAlt size={22} style={{color: "#212529" }} className="me-1" />
                <small>{activeTab === 'lost' ? item.lost_location : item.found_location}</small>
              </div>
              <div className="date">
                <FaClock size={22} style={{ color: "#5c5f66"}} className="me-1" />
                <small>
                  {activeTab === 'lost'
                    ? `Lost: ${formatDate(item.lost_date)}`
                    : `Found: ${formatDate(item.found_date)}`
                  }
                </small>
              </div>
              {activeTab === 'found' && !item.is_public && (
                <div className="private-warning">
                  <FaClock className="me-1 text-warning" />
                  <small className="text-warning">Private Match Window</small>
                </div>
              )}
            </div>
            
            <div className="d-grid gap-2 mt-3">
              <Button
                variant={activeTab === 'lost' ? 'primary' : 'success'}
                onClick={() => viewItemDetails(item)}
              >
                View Details
              </Button>
              {activeTab === 'found' && item.status === 'Reported' && (
                <Button
                  variant="outline-success"
                  onClick={() => viewItemDetails(item)}
                >
                  <FaBell className="me-1" /> Claim This Item
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  // Pagination Component
  const PaginationComponent = () => {
    if (items.length === 0 || totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Pagination.Item 
          key={i} 
          active={i === page} 
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    return (
      <div className="pagination-wrapper mt-4">
        <Pagination className="justify-content-center">
          <Pagination.First onClick={() => handlePageChange(1)} disabled={page === 1} />
          <Pagination.Prev onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
          {pages}
          <Pagination.Next onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} />
          <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} />
        </Pagination>
        <div className="text-center text-muted mt-2">
          Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
          {Math.min(page * limit, totalItems)} of {totalItems} items
        </div>
      </div>
    );
  };

  const reportPath = activeTab === 'lost' ? '/lost/report' : '/found/report';

  return (
    <div className="listings-page">
      <Container fluid="xxl" className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="listings-header">
              <h1 className="page-title">
                {activeTab === 'lost' ? 'Lost Items' : 'Found Items'}
                <Badge bg="light" text="dark" className="ms-3">
                  {totalItems} items
                </Badge>
              </h1>
              <p className="page-subtitle">
                Browse through {activeTab} items reported by the community.
                {activeTab === 'found' && ' Some items may be in private match window.'}
              </p>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <Button
              as={Link}
              to={reportPath}
              variant={activeTab === 'lost' ? 'danger' : 'success'}
              className="report-btn"
            >
              <FaPlus className="me-2" />
              Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
            </Button>
          </Col>
        </Row>

        {/* Tabs */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabChange}
              className="listings-tabs"
              fill
            >
              <Tab
                eventKey="lost"
                title={
                  <div className="tab-title">
                    <FaSearch className="me-2" />
                    Lost Items
                    <Badge bg="warning" className="ms-2">
                      {tabCounts.lost}
                    </Badge>
                  </div>
                }
              />
              <Tab
                eventKey="found"
                title={
                  <div className="tab-title">
                    <FaBell className="me-2" />
                    Found Items
                    <Badge bg="success" className="ms-2">
                      {tabCounts.found}
                    </Badge>
                  </div>
                }
              />
            </Tabs>
          </Card.Body>
        </Card>

        {/* Filters */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={6} lg={4}>
                <InputGroup>
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                  <Form.Control
                    placeholder="Search by item name..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Col>
              <Col md={4} lg={3}>
                <Form.Select name="category" value={filters.category} onChange={handleFilterChange}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Form.Select>
              </Col>
              <Col md={2} lg={2}>
                <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All Status</option>
                  {STATUS_OPTIONS[activeTab].map(status => <option key={status} value={status}>{status}</option>)}
                </Form.Select>
              </Col>
              <Col md={4} lg={3} className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => setShowFilters(true)}
                  className="flex-grow-1"
                >
                  <FaFilter className="me-2" /> More Filters
                </Button>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary">
                    {sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />} Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleSort('created_at')}>
                      Date {sortField === 'created_at' ? (sortDirection === 'desc' ? '(Newest)' : '(Oldest)') : ''}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleSort('item_name')}>
                      Name {sortField === 'item_name' ? (sortDirection === 'desc' ? '(Z-A)' : '(A-Z)') : ''}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            <ActiveFilters />
          </Card.Body>
        </Card>

        {/* Content */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading {activeTab} items...</p>
          </div>
        )}

        {error && !loading && (
          <Alert variant="danger" className="text-center">
            {error} <Button variant="outline-danger" size="sm" onClick={fetchItems}>Retry</Button>
          </Alert>
        )}

        {!loading && !error && items.length === 0 && (
          <Card className="text-center py-5">
            <Card.Body>
              <FaSearch size={60} className="text-muted mb-3" />
              <h4>No {activeTab} items found</h4>
              <p className="text-muted">
                {Object.values(filters).some(Boolean) ? 'Try changing your filters.' : `No ${activeTab} items reported yet.`}
              </p>
              <Button as={Link} to={reportPath} variant={activeTab === 'lost' ? 'danger' : 'success'} className="mt-3">
                <FaPlus className="me-2" /> Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
              </Button>
            </Card.Body>
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <Row>
              {items.map(item => <ItemCard key={item.id} item={item} />)}
            </Row>
            <PaginationComponent />
          </>
        )}
      </Container>

      {/* Filters Modal */}
      <Modal show={showFilters} onHide={() => setShowFilters(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaFilter className="me-2" />Advanced Filters</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Control 
                  type="text" 
                  name="location" 
                  value={filters.location} 
                  onChange={handleFilterChange} 
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Row className="g-2">
                  <Col>
                    <Form.Control 
                      type="date" 
                      name="startDate" 
                      value={filters.startDate} 
                      onChange={handleFilterChange} 
                      placeholder="Start" 
                    />
                  </Col>
                  <Col>
                    <Form.Control 
                      type="date" 
                      name="endDate" 
                      value={filters.endDate} 
                      onChange={handleFilterChange} 
                      placeholder="End" 
                    />
                  </Col>
                </Row>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="mt-4">
            <h6>Quick Filters</h6>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setFilters(prev => ({ 
                    ...prev, 
                    startDate: weekAgo.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  }));
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setDate(today.getDate() - 30);
                  setFilters(prev => ({ 
                    ...prev, 
                    startDate: monthAgo.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  }));
                }}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setFilters(prev => ({ 
                    ...prev, 
                    startDate: '',
                    endDate: ''
                  }));
                }}
              >
                Clear Dates
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFilters(false)}>Cancel</Button>
          <Button variant="outline-secondary" onClick={resetFilters}>Reset All</Button>
          <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
        </Modal.Footer>
      </Modal>

      {/* Item Details Modal */}
      <ItemDetailsModal
        show={showItemModal}
        onHide={() => {
          setShowItemModal(false);
          setClaimNotice({ type: '', info: '' });
        }}
        item={selectedItem}
        type={activeTab}
        onClaim={() => selectedItem && handleClaimItem(selectedItem.id)}
        carouselIndex={carouselIndex}
        onSelectCarousel={setCarouselIndex}
        onPrevCarousel={handleCarouselPrev}
        onNextCarousel={handleCarouselNext}
        claimNotice={claimNotice}
        onClaimNoticeClose={() => setClaimNotice({ type: '', info: '' })}
      />
    </div>
  );
};

export default Listings;