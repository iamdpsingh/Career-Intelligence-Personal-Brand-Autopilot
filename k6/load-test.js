import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp-up to 20 users
    { duration: '30s', target: 20 }, // Stay at 20 users
    { duration: '10s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests should be below 1500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const res = http.get('http://localhost:3000/');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'body includes HTML': (r) => r.body && r.body.includes('html'),
  });

  sleep(1);
}
