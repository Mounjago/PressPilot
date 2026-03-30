const AnalyticsMetric = require('../models/AnalyticsMetric');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const EmailTracking = require('../models/EmailTracking');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

/**
 * Analytics Controller
 * Handles all analytics-related endpoints
 */
class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Get dashboard metrics with aggregated data
   */
  async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d'; // 7d, 30d, 90d

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      // Get total contacts
      const totalContacts = await Contact.countDocuments({
        userId,
        createdAt: { $gte: startDate }
      });

      // Get total campaigns
      const totalCampaigns = await Campaign.countDocuments({
        userId,
        createdAt: { $gte: startDate }
      });

      // Get email metrics
      const emailMetrics = await EmailTracking.getCampaignMetrics(userId, { startDate, endDate: now });

      // Calculate average rates
      const campaigns = await Campaign.find({
        userId,
        createdAt: { $gte: startDate }
      }).select('stats');

      let totalSent = 0;
      let totalOpens = 0;
      let totalClicks = 0;
      let totalResponses = 0;

      campaigns.forEach(campaign => {
        if (campaign.stats) {
          totalSent += campaign.stats.sent || 0;
          totalOpens += campaign.stats.opened || 0;
          totalClicks += campaign.stats.clicked || 0;
          totalResponses += campaign.stats.responded || 0;
        }
      });

      const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      const avgClickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
      const avgResponseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;

      // Get engagement trend
      const trendData = await AnalyticsMetric.getMetricTrends(userId, 'engagement', period);

      // Get top performers
      const topPerformers = await AnalyticsMetric.getTopPerformers(userId, 'campaign', 5);

      // Get benchmark data
      const benchmarks = await AnalyticsMetric.getBenchmarkData(userId, 'industry');

      res.json({
        success: true,
        data: {
          overview: {
            totalContacts,
            totalCampaigns,
            totalSent,
            avgOpenRate: avgOpenRate.toFixed(2),
            avgClickRate: avgClickRate.toFixed(2),
            avgResponseRate: avgResponseRate.toFixed(2)
          },
          trends: trendData,
          topPerformers,
          benchmarks,
          period
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard analytics', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard analytics'
      });
    }
  }

  /**
   * GET /api/analytics/contacts
   * Get contact engagement analytics
   */
  async getContacts(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d';
      const { tags, segment, status } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      // Build filter
      const filter = { userId };
      if (tags) {
        filter.tags = { $in: tags.split(',') };
      }
      if (segment) {
        filter.segment = segment;
      }
      if (status) {
        filter.status = status;
      }

      // Get contact engagement distribution
      const contacts = await Contact.find(filter)
        .select('email engagement lastActivity tags segment')
        .sort('-engagement.score');

      // Group by engagement level
      const engagementDistribution = {
        high: 0,
        medium: 0,
        low: 0,
        inactive: 0
      };

      const topEngaged = [];

      contacts.forEach((contact, index) => {
        const score = contact.engagement?.score || 0;
        if (score > 70) {
          engagementDistribution.high++;
        } else if (score > 40) {
          engagementDistribution.medium++;
        } else if (score > 0) {
          engagementDistribution.low++;
        } else {
          engagementDistribution.inactive++;
        }

        // Collect top 10 engaged contacts
        if (index < 10) {
          topEngaged.push({
            email: contact.email,
            score: score,
            lastActivity: contact.lastActivity,
            tags: contact.tags,
            segment: contact.segment
          });
        }
      });

      // Get journalist engagement data
      const journalistEngagement = await EmailTracking.getJournalistEngagement(userId, { startDate, endDate: now });

      res.json({
        success: true,
        data: {
          totalContacts: contacts.length,
          engagementDistribution,
          topEngaged,
          journalistEngagement,
          filters: { tags, segment, status, period }
        }
      });
    } catch (error) {
      logger.error('Error fetching contact analytics', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching contact analytics'
      });
    }
  }

  /**
   * GET /api/analytics/campaigns
   * Get campaign performance analytics
   */
  async getCampaigns(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d';
      const { status, type, projectId } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      // Build filter
      const filter = {
        userId,
        createdAt: { $gte: startDate }
      };
      if (status) {
        filter.status = status;
      }
      if (type) {
        filter.type = type;
      }
      if (projectId) {
        filter.projectId = projectId;
      }

      // Get campaigns with stats
      const campaigns = await Campaign.find(filter)
        .select('name status type stats createdAt scheduledDate')
        .sort('-createdAt');

      // Calculate performance metrics
      const performanceMetrics = {
        totalCampaigns: campaigns.length,
        completed: 0,
        scheduled: 0,
        draft: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        avgResponseRate: 0
      };

      let totalSent = 0;
      let totalOpens = 0;
      let totalClicks = 0;
      let totalResponses = 0;

      campaigns.forEach(campaign => {
        // Count by status
        if (campaign.status === 'completed') {
          performanceMetrics.completed++;
        } else if (campaign.status === 'scheduled') {
          performanceMetrics.scheduled++;
        } else if (campaign.status === 'draft') {
          performanceMetrics.draft++;
        }

        // Sum stats for averages
        if (campaign.stats) {
          totalSent += campaign.stats.sent || 0;
          totalOpens += campaign.stats.opened || 0;
          totalClicks += campaign.stats.clicked || 0;
          totalResponses += campaign.stats.responded || 0;
        }
      });

      // Calculate averages
      if (totalSent > 0) {
        performanceMetrics.avgOpenRate = ((totalOpens / totalSent) * 100).toFixed(2);
        performanceMetrics.avgClickRate = ((totalClicks / totalSent) * 100).toFixed(2);
        performanceMetrics.avgResponseRate = ((totalResponses / totalSent) * 100).toFixed(2);
      }

      // Get temporal trends (group by day/week)
      const temporalTrends = [];
      const groupBy = days <= 7 ? 'day' : days <= 30 ? 'week' : 'month';

      // Get campaign metrics from EmailTracking
      const campaignMetrics = await EmailTracking.getCampaignMetrics(userId, { startDate, endDate: now });

      res.json({
        success: true,
        data: {
          performanceMetrics,
          campaigns: campaigns.slice(0, 20), // Return top 20 recent campaigns
          campaignMetrics,
          temporalTrends,
          filters: { status, type, projectId, period }
        }
      });
    } catch (error) {
      logger.error('Error fetching campaign analytics', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching campaign analytics'
      });
    }
  }

  /**
   * GET /api/analytics/projects
   * Get project analytics
   */
  async getProjects(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d';

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      // Get campaigns grouped by project
      const campaigns = await Campaign.find({
        userId,
        createdAt: { $gte: startDate }
      }).populate('projectId', 'name status releaseDate genre');

      // Group campaigns by project
      const projectMap = new Map();

      campaigns.forEach(campaign => {
        const projectId = campaign.projectId?._id?.toString() || 'no-project';
        const projectName = campaign.projectId?.name || 'Unassigned';

        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            id: projectId,
            name: projectName,
            status: campaign.projectId?.status || 'unknown',
            releaseDate: campaign.projectId?.releaseDate,
            genre: campaign.projectId?.genre,
            campaigns: [],
            totalSent: 0,
            totalOpens: 0,
            totalClicks: 0,
            totalResponses: 0
          });
        }

        const project = projectMap.get(projectId);
        project.campaigns.push(campaign);

        if (campaign.stats) {
          project.totalSent += campaign.stats.sent || 0;
          project.totalOpens += campaign.stats.opened || 0;
          project.totalClicks += campaign.stats.clicked || 0;
          project.totalResponses += campaign.stats.responded || 0;
        }
      });

      // Convert map to array and calculate metrics
      const projects = Array.from(projectMap.values()).map(project => ({
        ...project,
        campaignCount: project.campaigns.length,
        openRate: project.totalSent > 0 ? ((project.totalOpens / project.totalSent) * 100).toFixed(2) : 0,
        clickRate: project.totalSent > 0 ? ((project.totalClicks / project.totalSent) * 100).toFixed(2) : 0,
        responseRate: project.totalSent > 0 ? ((project.totalResponses / project.totalSent) * 100).toFixed(2) : 0,
        campaigns: undefined // Remove campaign details from response
      }));

      // Project status distribution
      const statusDistribution = {
        planning: 0,
        active: 0,
        completed: 0,
        archived: 0
      };

      projects.forEach(project => {
        if (statusDistribution.hasOwnProperty(project.status)) {
          statusDistribution[project.status]++;
        }
      });

      // Release timeline
      const releaseTimeline = projects
        .filter(p => p.releaseDate)
        .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          totalProjects: projects.length,
          statusDistribution,
          projects: projects.slice(0, 10), // Return top 10 projects
          releaseTimeline,
          period
        }
      });
    } catch (error) {
      logger.error('Error fetching project analytics', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching project analytics'
      });
    }
  }

  /**
   * GET /api/analytics/best-times
   * Get best times to send emails
   */
  async getBestTimes(req, res) {
    try {
      const userId = req.user.id;
      const period = req.query.period || '30d';

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      // Get best send times from EmailTracking
      const bestTimes = await EmailTracking.getBestSendTimes(userId, { startDate, endDate: now });

      // Create hourly breakdown (24 hours)
      const hourlyBreakdown = Array(24).fill(0).map((_, hour) => ({
        hour,
        sends: 0,
        opens: 0,
        clicks: 0,
        responses: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0
      }));

      // Create daily breakdown (7 days)
      const dailyBreakdown = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => ({
        day,
        sends: 0,
        opens: 0,
        clicks: 0,
        responses: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0
      }));

      // Process best times data if available
      if (bestTimes && bestTimes.hourlyData) {
        bestTimes.hourlyData.forEach(data => {
          if (data.hour >= 0 && data.hour < 24) {
            hourlyBreakdown[data.hour] = {
              ...hourlyBreakdown[data.hour],
              ...data
            };
          }
        });
      }

      if (bestTimes && bestTimes.dailyData) {
        bestTimes.dailyData.forEach(data => {
          const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(data.day);
          if (dayIndex !== -1) {
            dailyBreakdown[dayIndex] = {
              ...dailyBreakdown[dayIndex],
              ...data
            };
          }
        });
      }

      // Calculate recommendations
      const recommendations = {
        bestHours: hourlyBreakdown
          .filter(h => h.openRate > 0)
          .sort((a, b) => b.openRate - a.openRate)
          .slice(0, 3)
          .map(h => ({
            hour: h.hour,
            time: `${h.hour.toString().padStart(2, '0')}:00`,
            openRate: h.openRate
          })),
        bestDays: dailyBreakdown
          .filter(d => d.openRate > 0)
          .sort((a, b) => b.openRate - a.openRate)
          .slice(0, 3)
          .map(d => ({
            day: d.day,
            openRate: d.openRate
          })),
        worstHours: hourlyBreakdown
          .filter(h => h.sends > 0)
          .sort((a, b) => a.openRate - b.openRate)
          .slice(0, 3)
          .map(h => ({
            hour: h.hour,
            time: `${h.hour.toString().padStart(2, '0')}:00`,
            openRate: h.openRate
          }))
      };

      res.json({
        success: true,
        data: {
          hourlyBreakdown,
          dailyBreakdown,
          recommendations,
          period,
          summary: bestTimes?.summary || {
            totalAnalyzed: 0,
            avgOpenRate: 0,
            avgClickRate: 0,
            avgResponseRate: 0
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching best send times', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error fetching best send times'
      });
    }
  }

  /**
   * GET /api/analytics/export
   * Export analytics data
   */
  async exportAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const type = req.query.type || 'json'; // csv or json
      const period = req.query.period || '30d';
      const reportType = req.query.report || 'dashboard'; // dashboard, contacts, campaigns, projects

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      startDate.setDate(now.getDate() - days);

      let data = {};

      // Fetch data based on report type
      switch (reportType) {
        case 'contacts':
          const contacts = await Contact.find({ userId })
            .select('email name organization tags segment engagement lastActivity createdAt');
          data = {
            reportType: 'contacts',
            period,
            generatedAt: new Date(),
            totalRecords: contacts.length,
            contacts: contacts.map(c => ({
              email: c.email,
              name: c.name,
              organization: c.organization,
              tags: c.tags.join(', '),
              segment: c.segment,
              engagementScore: c.engagement?.score || 0,
              lastActivity: c.lastActivity,
              createdAt: c.createdAt
            }))
          };
          break;

        case 'campaigns':
          const campaigns = await Campaign.find({
            userId,
            createdAt: { $gte: startDate }
          }).select('name type status stats createdAt scheduledDate');

          data = {
            reportType: 'campaigns',
            period,
            generatedAt: new Date(),
            totalRecords: campaigns.length,
            campaigns: campaigns.map(c => ({
              name: c.name,
              type: c.type,
              status: c.status,
              sent: c.stats?.sent || 0,
              opened: c.stats?.opened || 0,
              clicked: c.stats?.clicked || 0,
              responded: c.stats?.responded || 0,
              openRate: c.stats?.sent > 0 ? ((c.stats.opened / c.stats.sent) * 100).toFixed(2) : 0,
              clickRate: c.stats?.sent > 0 ? ((c.stats.clicked / c.stats.sent) * 100).toFixed(2) : 0,
              responseRate: c.stats?.sent > 0 ? ((c.stats.responded / c.stats.sent) * 100).toFixed(2) : 0,
              createdAt: c.createdAt,
              scheduledDate: c.scheduledDate
            }))
          };
          break;

        case 'projects':
          const projectCampaigns = await Campaign.find({
            userId,
            createdAt: { $gte: startDate }
          }).populate('projectId');

          const projectsData = {};
          projectCampaigns.forEach(c => {
            const projectName = c.projectId?.name || 'Unassigned';
            if (!projectsData[projectName]) {
              projectsData[projectName] = {
                name: projectName,
                campaigns: 0,
                totalSent: 0,
                totalOpened: 0,
                totalClicked: 0,
                totalResponded: 0
              };
            }
            projectsData[projectName].campaigns++;
            projectsData[projectName].totalSent += c.stats?.sent || 0;
            projectsData[projectName].totalOpened += c.stats?.opened || 0;
            projectsData[projectName].totalClicked += c.stats?.clicked || 0;
            projectsData[projectName].totalResponded += c.stats?.responded || 0;
          });

          data = {
            reportType: 'projects',
            period,
            generatedAt: new Date(),
            projects: Object.values(projectsData)
          };
          break;

        default: // dashboard
          const totalContacts = await Contact.countDocuments({ userId });
          const totalCampaigns = await Campaign.countDocuments({
            userId,
            createdAt: { $gte: startDate }
          });

          const dashboardCampaigns = await Campaign.find({
            userId,
            createdAt: { $gte: startDate }
          }).select('stats');

          let totalSent = 0, totalOpens = 0, totalClicks = 0, totalResponses = 0;
          dashboardCampaigns.forEach(c => {
            totalSent += c.stats?.sent || 0;
            totalOpens += c.stats?.opened || 0;
            totalClicks += c.stats?.clicked || 0;
            totalResponses += c.stats?.responded || 0;
          });

          data = {
            reportType: 'dashboard',
            period,
            generatedAt: new Date(),
            overview: {
              totalContacts,
              totalCampaigns,
              totalSent,
              totalOpens,
              totalClicks,
              totalResponses,
              avgOpenRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(2) : 0,
              avgClickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(2) : 0,
              avgResponseRate: totalSent > 0 ? ((totalResponses / totalSent) * 100).toFixed(2) : 0
            }
          };
      }

      // Export as CSV or JSON
      if (type === 'csv') {
        // Convert to CSV format
        let csv = '';

        if (data.contacts) {
          csv = 'Email,Name,Organization,Tags,Segment,Engagement Score,Last Activity,Created At\n';
          data.contacts.forEach(c => {
            csv += `"${c.email}","${c.name || ''}","${c.organization || ''}","${c.tags}","${c.segment || ''}",${c.engagementScore},"${c.lastActivity || ''}","${c.createdAt}"\n`;
          });
        } else if (data.campaigns) {
          csv = 'Name,Type,Status,Sent,Opened,Clicked,Responded,Open Rate,Click Rate,Response Rate,Created At,Scheduled Date\n';
          data.campaigns.forEach(c => {
            csv += `"${c.name}","${c.type}","${c.status}",${c.sent},${c.opened},${c.clicked},${c.responded},${c.openRate},${c.clickRate},${c.responseRate},"${c.createdAt}","${c.scheduledDate || ''}"\n`;
          });
        } else if (data.projects) {
          csv = 'Project Name,Campaigns,Total Sent,Total Opened,Total Clicked,Total Responded\n';
          data.projects.forEach(p => {
            csv += `"${p.name}",${p.campaigns},${p.totalSent},${p.totalOpened},${p.totalClicked},${p.totalResponded}\n`;
          });
        } else {
          csv = 'Metric,Value\n';
          Object.entries(data.overview).forEach(([key, value]) => {
            csv += `"${key}","${value}"\n`;
          });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${reportType}-${period}.csv"`);
        res.send(csv);
      } else {
        // Return as JSON
        res.json({
          success: true,
          data
        });
      }
    } catch (error) {
      logger.error('Error exporting analytics', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Error exporting analytics'
      });
    }
  }
}

module.exports = new AnalyticsController();