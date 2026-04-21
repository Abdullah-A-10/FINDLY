import { BACKEND_URL } from '../api';

/* ================= Status ================= */

export const STATUS_BADGE_COLORS = {
  lost: {
    Lost: 'warning',
    Matched: 'info',
    Claimed: 'success'
  },
  found: {
    Reported: 'primary',
    Matched: 'info',
    Returned: 'success'
  }
};

/* ================= Dates ================= */

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/* ================= Images ================= */

export const getImageUrls = (imageData, limit = 5) => {
  if (!imageData) return [];

  let urls = [];

  if (Array.isArray(imageData)) {
    urls = imageData;
  } else if (typeof imageData === 'string') {
    try {
      urls = JSON.parse(imageData);
      if (!Array.isArray(urls)) urls = [imageData];
    } catch {
      urls = [imageData];
    }
  }

  return urls
    .filter(Boolean)
    .slice(0, limit)
    .map((url) => {
      if (url.startsWith('http')) return url;

      const normalized = url.startsWith('/') ? url : `/${url}`;
      return `${BACKEND_URL}${normalized}`.replace(/\\/g, '/');
    });
};


/* ================= Item Utilities ================= */

export const getItemLocation = (item, type) =>
  type === 'lost' ? item.lost_location : item.found_location;

export const getItemDate = (item, type) =>
  type === 'lost' ? item.lost_date : item.found_date;
