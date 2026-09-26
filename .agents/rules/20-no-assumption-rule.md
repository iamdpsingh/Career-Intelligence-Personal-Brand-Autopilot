# No Assumption Rule

Never invent missing information.

If information is unavailable:
1. mark it unknown
2. record the missing field
3. continue if the pipeline can safely continue
4. otherwise stop the affected stage

Examples:
Unknown salary → UNKNOWN
Unknown job experience → UNKNOWN
Unverified GitHub result → UNVERIFIED
Unverified technology claim → DO NOT PUBLISH
Unknown API response → ERROR
