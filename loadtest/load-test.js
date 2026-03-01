import http from 'k6/http';
import { check } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const BASE_URL = 'http://localhost:3000';
const HEADERS = { 'Content-Type': 'application/json' };

// Test area boundaries - coordinates should match the area created in setup
const AREA_MIN_LNG = 28.975;
const AREA_MAX_LNG = 28.995;
const AREA_MIN_LAT = 40.990;
const AREA_MAX_LAT = 41.010;

export const options = {
  stages: [
    { duration: '5s', target: 50 },   // ramp up to 50 users
    { duration: '10s', target: 100 },  // ramp up to 100 users
    { duration: '5s', target: 0 },     // ramp down
  ],
};

// Runs once before the test - creates a test area
export function setup() {
  const area = JSON.stringify({
    name: 'Load Test Area',
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [AREA_MIN_LNG, AREA_MIN_LAT],
        [AREA_MAX_LNG, AREA_MIN_LAT],
        [AREA_MAX_LNG, AREA_MAX_LAT],
        [AREA_MIN_LNG, AREA_MAX_LAT],
        [AREA_MIN_LNG, AREA_MIN_LAT],
      ]],
    },
  });

  const res = http.post(`${BASE_URL}/areas`, area, { headers: HEADERS });
  check(res, { 'area created': (r) => r.status === 201 });
}

// Main test - sends random locations inside the area
export default function () {
  const payload = JSON.stringify({
    userId: `user_${randomIntBetween(1, 1000)}`,
    latitude: AREA_MIN_LAT + Math.random() * (AREA_MAX_LAT - AREA_MIN_LAT),
    longitude: AREA_MIN_LNG + Math.random() * (AREA_MAX_LNG - AREA_MIN_LNG),
    timestamp: new Date().toISOString(),
  });

  const res = http.post(`${BASE_URL}/locations`, payload, { headers: HEADERS });

  check(res, {
    'status is 202': (r) => r.status === 202,
  });
}
