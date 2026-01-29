## Customer Webhooks

Endpoints:
- GET/POST `/api/webhooks/endpoints`
- POST `/api/webhooks/deliver` triggers deliveries to all matching endpoints

Security:
- HMAC SHA256 header `X-TZ-Signature` computed over JSON body

Retry & DLQ:
- Failed deliveries record in `webhook_dlq`; `webhook_delivery` stores attempts and status.

