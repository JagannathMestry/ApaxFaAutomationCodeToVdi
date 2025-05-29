context.log(`Request received: ${req.method} ${req.url}`);
context.log(`Request ID: ${context.executionContext.invocationId}`);
context.log('Headers:', {
  'user-agent': req.headers['user-agent'],
  'x-forwarded-for': req.headers['x-forwarded-for'], // client IP
  'authorization': '[REDACTED]', // don't log raw tokens
});
