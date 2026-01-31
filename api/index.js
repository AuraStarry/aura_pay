/**
 * Aura Pay - Health Check
 */
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'Aura Pay API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
