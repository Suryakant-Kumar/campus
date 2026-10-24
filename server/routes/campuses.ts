import { Router, Request, Response } from 'express';
import { getPool, isDbConfigured } from '../db.js';
import { authenticate, requireRole, enforceCampusIsolation } from '../auth.js';

const router = Router();

/**
 * Get campus metadata by slug (publicly accessible for loading campus portal branding)
 */
router.get('/by-slug/:slug', async (req: Request, res: Response): Promise<void> => {
  if (!isDbConfigured()) {
    res.status(503).json({ error: 'DATABASE_URL is not configured.' });
    return;
  }

  const { slug } = req.params;
  const pool = getPool();

  try {
    const campusRes = await pool.query(
      `SELECT c.id, c.name, c.slug, c.type, c.description, c.address, c.created_at,
              (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id) AS member_count,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id AND i.status != 'resolved') AS open_issues_count,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id AND i.status = 'resolved') AS resolved_issues_count
       FROM campuses c
       WHERE c.slug = $1`,
      [slug.toLowerCase().trim()]
    );

    if (campusRes.rows.length === 0) {
      res.status(404).json({ error: `Campus "${slug}" not found.` });
      return;
    }

    res.json(campusRes.rows[0]);
  } catch (err: any) {
    console.error('Error fetching campus by slug:', err);
    res.status(500).json({ error: 'Failed to retrieve campus information.' });
  }
});

/**
 * List registered campuses for public directory / picker
 */
router.get('/list', async (_req: Request, res: Response): Promise<void> => {
  if (!isDbConfigured()) {
    res.status(503).json({ error: 'DATABASE_URL is not configured.' });
    return;
  }

  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.type, c.description, c.address, c.created_at,
              (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id) AS member_count,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id) AS total_issues_count,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id AND i.status = 'resolved') AS resolved_issues_count
       FROM campuses c
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Error listing campuses:', err);
    res.status(500).json({ error: 'Failed to list campuses.' });
  }
});

/**
 * Campus internal analytics (Workers, Co-Admins, Admins)
 */
router.get('/:campusSlug/stats', authenticate, enforceCampusIsolation, async (req: Request, res: Response): Promise<void> => {
  const { campusSlug } = req.params;
  const pool = getPool();

  try {
    const campusRes = await pool.query('SELECT id FROM campuses WHERE slug = $1', [campusSlug.toLowerCase().trim()]);
    if (campusRes.rows.length === 0) {
      res.status(404).json({ error: 'Campus not found.' });
      return;
    }
    const campusId = campusRes.rows[0].id;

    // Issue counts by status
    const statusCounts = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM issues
       WHERE campus_id = $1
       GROUP BY status`,
      [campusId]
    );

    // Issue counts by urgency
    const urgencyCounts = await pool.query(
      `SELECT urgency, COUNT(*) AS count
       FROM issues
       WHERE campus_id = $1
       GROUP BY urgency`,
      [campusId]
    );

    // Issue counts by category
    const categoryCounts = await pool.query(
      `SELECT category, COUNT(*) AS count
       FROM issues
       WHERE campus_id = $1
       GROUP BY category
       ORDER BY count DESC
       LIMIT 6`,
      [campusId]
    );

    // Member count & worker count
    const memberCounts = await pool.query(
      `SELECT role, COUNT(*) AS count
       FROM users
       WHERE campus_id = $1
       GROUP BY role`,
      [campusId]
    );

    res.json({
      statusCounts: statusCounts.rows,
      urgencyCounts: urgencyCounts.rows,
      categoryCounts: categoryCounts.rows,
      memberCounts: memberCounts.rows,
    });
  } catch (err: any) {
    console.error('Error fetching campus stats:', err);
    res.status(500).json({ error: 'Failed to fetch campus metrics.' });
  }
});

/**
 * Global Founder Only: All campuses view
 */
router.get('/founder/all-campuses', authenticate, requireRole('founder'), async (_req: Request, res: Response): Promise<void> => {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.type, c.description, c.address, c.contact_email, c.created_at,
              (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id) AS total_users,
              (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'admin') AS admin_count,
              (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'worker') AS worker_count,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id) AS total_issues,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id AND i.status = 'resolved') AS resolved_issues,
              (SELECT COUNT(*) FROM issues i WHERE i.campus_id = c.id AND i.urgency = 'critical' AND i.status != 'resolved') AS critical_open_issues
       FROM campuses c
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Founder error listing all campuses:', err);
    res.status(500).json({ error: 'Failed to retrieve global campuses data.' });
  }
});

/**
 * Global Founder Only: Platform overview analytics
 */
router.get('/founder/analytics', authenticate, requireRole('founder'), async (_req: Request, res: Response): Promise<void> => {
  const pool = getPool();

  try {
    const totalCampuses = await pool.query('SELECT COUNT(*) FROM campuses');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalIssues = await pool.query('SELECT COUNT(*) FROM issues');
    const resolvedIssues = await pool.query("SELECT COUNT(*) FROM issues WHERE status = 'resolved'");
    const totalUpvotes = await pool.query('SELECT COUNT(*) FROM issue_upvotes');
    const totalComments = await pool.query('SELECT COUNT(*) FROM issue_comments');

    res.json({
      totalCampuses: Number(totalCampuses.rows[0].count),
      totalUsers: Number(totalUsers.rows[0].count),
      totalIssues: Number(totalIssues.rows[0].count),
      resolvedIssues: Number(resolvedIssues.rows[0].count),
      totalUpvotes: Number(totalUpvotes.rows[0].count),
      totalComments: Number(totalComments.rows[0].count),
    });
  } catch (err: any) {
    console.error('Founder error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve platform analytics.' });
  }
});

export default router;
