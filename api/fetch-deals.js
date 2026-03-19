export default async function handler(req, res) {
  res.status(200).json({ message: 'Cron job triggered', time: new Date().toISOString() });
}