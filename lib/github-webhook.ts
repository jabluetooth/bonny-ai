import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifies a GitHub webhook delivery's HMAC-SHA256 signature
 * (the `X-Hub-Signature-256` header) against the raw request body.
 */
export function verifyGithubSignature(
    rawBody: string,
    signatureHeader: string | null,
    secret: string
): boolean {
    if (!signatureHeader) return false

    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuf = Buffer.from(expected)
    const actualBuf = Buffer.from(signatureHeader)

    if (expectedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(expectedBuf, actualBuf)
}
