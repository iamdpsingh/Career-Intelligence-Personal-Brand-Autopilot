# LinkedIn Publishing Rules

Publishing is human-approved only.

Allowed states:
DRAFT
REVIEW
APPROVED
SCHEDULED
PUBLISHING
PUBLISHED
REJECTED
FAILED

Only APPROVED or SCHEDULED content may enter PUBLISHING.

Before publishing verify:
- authenticated LinkedIn account
- valid credential
- content approval
- content not already published
- scheduled time reached
- image upload completed when required
- content hash/idempotency key is unused

On failure:
- preserve the draft
- preserve the error
- do not silently retry forever
- do not mark as published

Never auto-publish unreviewed AI-generated content.
