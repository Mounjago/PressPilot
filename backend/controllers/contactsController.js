const Contact = require('../models/Contact');
const csv = require('csv-parse/sync');
const { Parser } = require('json2csv');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'presspilot-api' },
  transports: [new winston.transports.Console()]
});

/**
 * Get all contacts for the authenticated user
 * Support pagination, sorting, and filtering
 */
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      status,
      tags,
      mediaType,
      search
    } = req.query;

    // Build query
    const query = {
      createdBy: req.user.id,
      isArchived: false
    };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagsArray };
    }

    if (mediaType) {
      query['media.type'] = mediaType;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'media.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Contact.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching contacts', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
};

/**
 * Get a single contact by ID
 * Verify ownership before returning
 */
exports.getById = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Error fetching contact', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching contact'
    });
  }
};

/**
 * Create a new contact
 * Validate required fields and set createdBy
 */
exports.create = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Check for duplicate email for this user
    const existingContact = await Contact.findOne({
      email: email.toLowerCase(),
      createdBy: req.user.id,
      isArchived: false
    });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: 'A contact with this email already exists'
      });
    }

    // Create new contact
    const contact = new Contact({
      ...req.body,
      email: email.toLowerCase(),
      createdBy: req.user.id,
      status: req.body.status || 'active',
      engagementScore: 0,
      emailMetrics: {
        totalReceived: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReplied: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0
      }
    });

    await contact.save();

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Error creating contact', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error creating contact'
    });
  }
};

/**
 * Update a contact
 * Verify ownership before updating
 */
exports.update = async (req, res) => {
  try {
    // Don't allow updating createdBy or _id
    delete req.body.createdBy;
    delete req.body._id;

    // If email is being updated, lowercase it
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }

    const contact = await Contact.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Error updating contact', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating contact'
    });
  }
};

/**
 * Delete a contact (soft or hard delete)
 * Verify ownership before deleting
 */
exports.delete = async (req, res) => {
  try {
    const { hard } = req.query;

    if (hard === 'true') {
      // Hard delete - permanently remove from database
      const contact = await Contact.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user.id
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }
    } else {
      // Soft delete - set isArchived to true
      const contact = await Contact.findOneAndUpdate(
        {
          _id: req.params.id,
          createdBy: req.user.id
        },
        { isArchived: true },
        { new: true }
      );

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting contact', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error deleting contact'
    });
  }
};

/**
 * Search contacts using the static searchContacts method
 */
exports.search = async (req, res) => {
  try {
    const { q, status, tags, mediaType, limit = 20, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const options = {
      userId: req.user.id,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    if (status) options.status = status;
    if (tags) options.tags = Array.isArray(tags) ? tags : tags.split(',');
    if (mediaType) options.mediaType = mediaType;

    const results = await Contact.searchContacts(q, options);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error searching contacts', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error searching contacts'
    });
  }
};

/**
 * Get count of contacts for the authenticated user
 */
exports.getCount = async (req, res) => {
  try {
    const { status, tags, mediaType } = req.query;

    const query = {
      createdBy: req.user.id,
      isArchived: false
    };

    if (status) query.status = status;
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagsArray };
    }
    if (mediaType) query['media.type'] = mediaType;

    const count = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Error getting contact count', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error getting contact count'
    });
  }
};

/**
 * Get statistics about contacts
 * Use getSegmentationStats static + custom aggregation
 */
exports.getStats = async (req, res) => {
  try {
    // Get segmentation stats
    const segmentationStats = await Contact.getSegmentationStats(req.user.id);

    // Get engagement distribution
    const engagementDistribution = await Contact.aggregate([
      {
        $match: {
          createdBy: req.user.id,
          isArchived: false
        }
      },
      {
        $bucket: {
          groupBy: '$engagementScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            contacts: { $push: '$email' }
          }
        }
      }
    ]);

    // Get top engaged contacts
    const topEngaged = await Contact.find({
      createdBy: req.user.id,
      isArchived: false
    })
      .sort('-engagementScore')
      .limit(10)
      .select('firstName lastName email engagementScore media.name');

    // Get recent activity
    const recentActivity = await Contact.find({
      createdBy: req.user.id,
      isArchived: false
    })
      .sort('-lastContactDate')
      .limit(10)
      .select('firstName lastName email lastContactDate media.name');

    res.json({
      success: true,
      data: {
        segmentation: segmentationStats,
        engagementDistribution,
        topEngaged,
        recentActivity,
        summary: {
          total: await Contact.countDocuments({ createdBy: req.user.id, isArchived: false }),
          active: await Contact.countDocuments({ createdBy: req.user.id, status: 'active', isArchived: false }),
          inactive: await Contact.countDocuments({ createdBy: req.user.id, status: 'inactive', isArchived: false }),
          blacklisted: await Contact.countDocuments({ createdBy: req.user.id, status: 'blacklisted', isArchived: false })
        }
      }
    });
  } catch (error) {
    logger.error('Error getting contact stats', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error getting contact stats'
    });
  }
};

/**
 * Import contacts from CSV file
 * Parse CSV and create contacts in bulk
 */
exports.importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const csvContent = req.file.buffer.toString();
    let records;

    try {
      records = csv.parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CSV format'
      });
    }

    const imported = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        // Map CSV fields to contact model
        const contactData = {
          firstName: record.firstName || record.first_name || record.FirstName,
          lastName: record.lastName || record.last_name || record.LastName,
          email: (record.email || record.Email || '').toLowerCase(),
          phone: record.phone || record.Phone,
          jobTitle: record.jobTitle || record.job_title || record.JobTitle,
          media: {
            name: record.mediaName || record.media_name || record.MediaName || record.company || record.Company,
            type: record.mediaType || record.media_type || record.MediaType,
            reach: record.mediaReach || record.media_reach || record.MediaReach,
            website: record.mediaWebsite || record.media_website || record.MediaWebsite || record.website || record.Website
          },
          city: record.city || record.City,
          country: record.country || record.Country,
          timezone: record.timezone || record.Timezone,
          twitter: record.twitter || record.Twitter,
          instagram: record.instagram || record.Instagram,
          linkedin: record.linkedin || record.LinkedIn,
          facebook: record.facebook || record.Facebook,
          youtube: record.youtube || record.YouTube,
          notes: record.notes ? [{ content: record.notes, createdAt: new Date() }] : [],
          tags: record.tags ? record.tags.split(',').map(t => t.trim()) : [],
          createdBy: req.user.id,
          source: 'csv_import',
          status: 'active'
        };

        // Validate required fields
        if (!contactData.firstName || !contactData.lastName || !contactData.email) {
          errors.push({
            row: i + 2, // +2 because CSV is 1-indexed and has header row
            error: 'Missing required fields (firstName, lastName, email)',
            data: record
          });
          continue;
        }

        // Check for duplicate
        const existingContact = await Contact.findOne({
          email: contactData.email,
          createdBy: req.user.id,
          isArchived: false
        });

        if (existingContact) {
          errors.push({
            row: i + 2,
            error: 'Duplicate email',
            data: record
          });
          continue;
        }

        // Create contact
        const contact = new Contact(contactData);
        await contact.save();
        imported.push(contact);

      } catch (importError) {
        errors.push({
          row: i + 2,
          error: importError.message,
          data: record
        });
      }
    }

    res.json({
      success: true,
      data: {
        imported: imported.length,
        errors: errors.length,
        details: {
          imported: imported.map(c => ({ id: c._id, email: c.email })),
          errors
        }
      }
    });
  } catch (error) {
    logger.error('Error importing CSV', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error importing CSV'
    });
  }
};

/**
 * Import contacts from JSON payload (frontend CSV importer)
 * Accepts pre-parsed array of contact objects
 */
exports.importJSON = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'An array of contacts is required'
      });
    }

    // Limit batch size to prevent abuse
    if (contacts.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 500 contacts per import'
      });
    }

    const imported = [];
    const errors = [];
    const duplicates = [];

    for (let i = 0; i < contacts.length; i++) {
      const record = contacts[i];

      try {
        // Validate required fields
        if (!record.firstName || !record.lastName || !record.email) {
          errors.push({
            row: i + 1,
            error: 'Champs obligatoires manquants (firstName, lastName, email)',
            data: { email: record.email || 'N/A' }
          });
          continue;
        }

        const email = record.email.toLowerCase().trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({
            row: i + 1,
            error: 'Format email invalide',
            data: { email }
          });
          continue;
        }

        // Check for duplicate in database
        const existingContact = await Contact.findOne({
          email,
          createdBy: req.user.id,
          isArchived: false
        });

        if (existingContact) {
          duplicates.push({
            row: i + 1,
            email,
            name: `${record.firstName} ${record.lastName}`
          });
          continue;
        }

        // Build contact data
        const contactData = {
          firstName: (record.firstName || '').trim(),
          lastName: (record.lastName || '').trim(),
          email,
          phone: record.phone ? record.phone.trim() : undefined,
          jobTitle: record.jobTitle ? record.jobTitle.trim() : undefined,
          media: {},
          tags: record.tags ? (Array.isArray(record.tags) ? record.tags : record.tags.split(',').map(t => t.trim())) : [],
          notes: record.notes ? [{ content: record.notes, createdAt: new Date() }] : [],
          createdBy: req.user.id,
          source: 'json_import',
          status: 'active',
          engagementScore: 0,
          emailMetrics: {
            totalReceived: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalReplied: 0,
            openRate: 0,
            clickRate: 0,
            responseRate: 0
          }
        };

        // Handle nested media fields
        if (record['media.name'] || record.mediaName) {
          contactData.media.name = (record['media.name'] || record.mediaName || '').trim();
        }
        if (record['media.type'] || record.mediaType) {
          contactData.media.type = (record['media.type'] || record.mediaType || '').trim();
        }
        if (record['media.website'] || record.mediaWebsite) {
          contactData.media.website = (record['media.website'] || record.mediaWebsite || '').trim();
        }
        if (record['media.reach'] || record.mediaReach) {
          contactData.media.reach = record['media.reach'] || record.mediaReach;
        }

        // Social fields
        if (record.twitter) contactData.twitter = record.twitter.trim();
        if (record.instagram) contactData.instagram = record.instagram.trim();
        if (record.linkedin) contactData.linkedin = record.linkedin.trim();
        if (record.facebook) contactData.facebook = record.facebook.trim();

        // Location fields
        if (record.city) contactData.city = record.city.trim();
        if (record.country) contactData.country = record.country.trim();

        // Create contact
        const contact = new Contact(contactData);
        await contact.save();
        imported.push({ id: contact._id, email: contact.email, name: `${contact.firstName} ${contact.lastName}` });

      } catch (importError) {
        errors.push({
          row: i + 1,
          error: importError.message,
          data: { email: record.email || 'N/A' }
        });
      }
    }

    logger.info('JSON import completed', {
      userId: req.user.id,
      total: contacts.length,
      imported: imported.length,
      duplicates: duplicates.length,
      errors: errors.length
    });

    res.json({
      success: true,
      data: {
        total: contacts.length,
        imported: imported.length,
        duplicates: duplicates.length,
        errors: errors.length,
        details: {
          imported,
          duplicates,
          errors
        }
      }
    });
  } catch (error) {
    logger.error('Error importing JSON contacts', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error importing contacts'
    });
  }
};

/**
 * Export contacts as CSV
 * Generate CSV string and send as download
 */
exports.exportCSV = async (req, res) => {
  try {
    const { status, tags, mediaType } = req.query;

    const query = {
      createdBy: req.user.id,
      isArchived: false
    };

    if (status) query.status = status;
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagsArray };
    }
    if (mediaType) query['media.type'] = mediaType;

    const contacts = await Contact.find(query).lean();

    // Transform contacts for CSV
    const csvData = contacts.map(contact => ({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      jobTitle: contact.jobTitle || '',
      mediaName: contact.media?.name || '',
      mediaType: contact.media?.type || '',
      mediaReach: contact.media?.reach || '',
      mediaWebsite: contact.media?.website || '',
      city: contact.city || '',
      country: contact.country || '',
      timezone: contact.timezone || '',
      twitter: contact.twitter || '',
      instagram: contact.instagram || '',
      linkedin: contact.linkedin || '',
      facebook: contact.facebook || '',
      youtube: contact.youtube || '',
      status: contact.status,
      engagementScore: contact.engagementScore,
      tags: contact.tags?.join(', ') || '',
      specializations: contact.specializations?.join(', ') || '',
      interests: contact.interests?.join(', ') || '',
      preferredContactMethod: contact.preferredContactMethod || '',
      bestTimeToContact: contact.bestTimeToContact || '',
      lastContactDate: contact.lastContactDate ? new Date(contact.lastContactDate).toISOString() : '',
      createdAt: new Date(contact.createdAt).toISOString()
    }));

    // Generate CSV
    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'jobTitle',
      'mediaName', 'mediaType', 'mediaReach', 'mediaWebsite',
      'city', 'country', 'timezone',
      'twitter', 'instagram', 'linkedin', 'facebook', 'youtube',
      'status', 'engagementScore', 'tags', 'specializations', 'interests',
      'preferredContactMethod', 'bestTimeToContact', 'lastContactDate', 'createdAt'
    ];

    const parser = new Parser({ fields });
    const csvString = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contacts-${Date.now()}.csv"`);

    res.send(csvString);
  } catch (error) {
    logger.error('Error exporting CSV', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error exporting CSV'
    });
  }
};

/**
 * Update engagement score for a contact
 * Call the updateEngagementScore method with action
 */
exports.updateEngagement = async (req, res) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update engagement score using the model method
    contact.updateEngagementScore(action);
    await contact.save();

    res.json({
      success: true,
      data: {
        engagementScore: contact.engagementScore,
        action
      }
    });
  } catch (error) {
    logger.error('Error updating engagement', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating engagement'
    });
  }
};

/**
 * Add a tag to a contact
 */
exports.addTag = async (req, res) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({
        success: false,
        message: 'Tag is required'
      });
    }

    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Add tag if not already present
    if (!contact.tags.includes(tag)) {
      contact.tags.push(tag);
      await contact.save();
    }

    res.json({
      success: true,
      data: contact.tags
    });
  } catch (error) {
    logger.error('Error adding tag', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error adding tag'
    });
  }
};

/**
 * Remove a tag from a contact
 */
exports.removeTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const contact = await Contact.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Remove tag
    contact.tags = contact.tags.filter(t => t !== tag);
    await contact.save();

    res.json({
      success: true,
      data: contact.tags
    });
  } catch (error) {
    logger.error('Error removing tag', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error removing tag'
    });
  }
};