const express = require('express');
const {pool} = require('../db');
const bcrypt = require('bcryptjs');
const stringSimilarity = require('string-similarity')
const { uploadImages,deleteUploadedFiles } = require('../utils/storage');  
const authenticateUser = require('../middleware/authenticateUser');
const {calculateMatchScore} = require('../utils/matching');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Report a lost item
router.post(
    '/lost',
    authenticateUser,
    uploadImages,
    [
        body("item_name").notEmpty().withMessage("Item name is required"),
        body("category").notEmpty().withMessage("Category is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("lost_location").notEmpty().withMessage("Lost location is required"),
        body("lost_date").isISO8601().withMessage("Lost date must be a valid date"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { item_name, category, description, lost_location, lost_date} = req.body;

        const images = req.files || []; 
        let image_urls = '[]';
        if (req.files && req.files.length > 0) {
        image_urls = JSON.stringify(images.map(file => `/uploads/${file.filename}`));
        }

        const user_id = req.user.id;

        try {
            // Insert lost item into the database
            const [result] = await pool.query(
                "INSERT INTO lost_items (user_id, item_name, category, description, lost_location, lost_date, image_urls) VALUES (?, ?, ?, ?, ?, ?,?)",
                [user_id, item_name, category, description, lost_location, lost_date , image_urls]
            );

            const lost_item_id = result.insertId;
            const [rows] = await pool.query('SELECT * FROM lost_items WHERE id = ?', [lost_item_id]);
            const lostItem = rows[0]; 

            // Search for potential matching fpund items
            const [potentialMatches] = await pool.query(
                `SELECT * FROM found_items 
                 WHERE status = 'Reported'
                 AND category = ?
                 AND ABS(DATEDIFF(found_date, ?)) <= 5
                 AND (
                   found_location LIKE CONCAT('%', ?, '%') OR  -- Partial match
                   ? LIKE CONCAT('%', found_location, '%')    -- Reverse partial match
                 )`,
                [
                  category,
                  lost_date,
                  lost_location, 
                  lost_location
                ]
            );

            //Filter the highest ranking matches
            // Score and filter matches (≥70%)

            const strongMatches = await Promise.all(
                potentialMatches.map(async foundItem => {
                    const score = calculateMatchScore(lostItem , foundItem );
                    return {foundItem , score};

                })
            ).then(results =>  results.filter(match => match.score>=70));
            

            // If matches are found, create match records and notify 
            if (strongMatches.length > 0) {
                for (const match of strongMatches) {
                    await pool.query(
                        "INSERT INTO matches (lost_item_id, found_item_id, status ,match_score) VALUES (?, ?, 'Pending',?)",
                        [lost_item_id , match.foundItem.id, match.score]
                    );

                    // Notify the loser and finder
                    await pool.query(
                        "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)",
                        [user_id , `A found item matching (${Math.round(match.score)}%) your "${lostItem.item_name}" has been found. Go to the Matches section to claim it.`, 'match-alert']
                    );

                    await pool.query(
                        "INSERT INTO notifications (user_id, message , type) VALUES (?, ?,?)",
                        [match.foundItem.user_id, `A lost item matching (${Math.round(match.score)}%) your "${match.foundItem.item_name}" has been found. Great Work !` , 'match-alert']
                    );

                    //update statues of items
                    await pool.query(
                        `UPDATE lost_items 
                        SET status = "Matched"
                        WHERE id = ? AND status = "Lost"
                        ` , [lost_item_id]
                    );
                    await pool.query(
                        `UPDATE found_items 
                        SET status = "Matched"
                        WHERE id = ? AND status = "Reported"
                        ` , [match.foundItem.id]
                    );

                }
            }
            res.status(201).json({ message: "Lost item reported successfully" });
            

        }
        catch (error) {
            console.error(error);
            if (req.files && req.files.length > 0) {
            const filePaths = req.files.map(file => file.path);
            deleteUploadedFiles(filePaths);
            }
            res.status(500).json({ error: error+"Internal Server Error" });
        }
    }
);

// Report a found item
router.post(
    '/found',
    authenticateUser,
    uploadImages,
    [
        body("item_name").notEmpty().withMessage("Item name is required"),
        body("category").notEmpty().withMessage("Category is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("found_location").notEmpty().withMessage("Found location is required"),
        body("found_date").isISO8601().withMessage("Found date must be a valid date"),
        body('question1').notEmpty(),
        body('answer1').notEmpty(),
        body('question2').notEmpty(),
        body('answer2').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {item_name, category, description, found_location, found_date, question1, answer1, question2, answer2 } = req.body;
        const user_id = req.user.id;
        
        const images = req.files ; 
        let image_urls = '[]';
        if (req.files && req.files.length > 0) {
        image_urls = JSON.stringify(images.map(file => file.path));
        }

        /* Hash verification answers
      const [answer1_hash, answer2_hash] = await Promise.all([
        bcrypt.hash(answer1, 10),
        bcrypt.hash(answer2, 10)
      ]);*/

        try {
             
            // Insert with 24hr private window
            const [result] = await pool.query(
                `INSERT INTO found_items 
                (user_id, item_name, category,description, image_urls, question1, question2, 
                answer1_hash, answer2_hash, found_location, found_date, is_public, match_window_end) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, FALSE, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
                [user_id, item_name, category,description, image_urls, question1, question2, 
                answer1, answer2, found_location, found_date]
            );
         
            const found_item_id = result.insertId;
            const [rows] = await pool.query('SELECT * FROM found_items WHERE id = ?', [found_item_id]);
            const foundItem = rows[0]; 



            // Search for potential matching lost items
            const [potentialMatches] = await pool.query(
                `SELECT * FROM lost_items 
                 WHERE status = 'Lost'
                 AND category = ?
                 AND ABS(DATEDIFF(lost_date, ?)) <= 5
                 AND (
                   lost_location LIKE CONCAT('%', ?, '%') OR  -- Partial match
                   ? LIKE CONCAT('%', lost_location, '%')    -- Reverse partial match
                 )`,
                [
                  category,
                  found_date,
                  found_location, 
                  found_location
                ]
              );

              //Filter the highest ranking matches
              // Score and filter matches (≥70%)

              const strongMatches = await Promise.all(
                potentialMatches.map(async lostItem => {
                    const score = calculateMatchScore(lostItem , foundItem );
                    return {lostItem , score};

                })
              ).then(results =>  results.filter(match => match.score>=70));
            

            // If matches are found, create match records and notify 
            if (strongMatches && strongMatches.length > 0) {
                for (const match of strongMatches) {
                    await pool.query(
                        "INSERT INTO matches (lost_item_id, found_item_id, status,match_score) VALUES (?, ?, 'Pending',?)",
                        [match.lostItem.id, found_item_id , match.score]
                    );

                    // Notify the loser and finder
                    await pool.query(
                        "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)",
                        [match.lostItem.user_id , `A found item matching (${Math.round(match.score)}%) your "${match.lostItem.item_name}" has been found. Go to the Matches section to claim it.`, 'match-alert']
                    );

                    await pool.query(
                        "INSERT INTO notifications (user_id, message , type) VALUES (?, ?,?)",
                        [foundItem.user_id, `A lost item matching (${Math.round(match.score)}%) your "${foundItem.item_name}" has been found. Great Work !` , 'match-alert']
                    );

                    //update statues of items
                    await pool.query(
                        `UPDATE lost_items 
                        SET status = "Matched"
                        WHERE id = ? AND status = "Lost"
                        ` , [match.lostItem.id]
                    );
                    await pool.query(
                        `UPDATE found_items 
                        SET status = "Matched"
                        WHERE id = ? AND status = "Reported"
                        ` , [found_item_id]
                    );

                }
            }

            res.status(201).json({  message: "Found item submitted successfully",
                is_public: false,
                match_window_end: new Date(Date.now() + 24 * 60 * 60 * 1000)  
            });
        } 
        catch (error) {
            console.error(error.sqlMessage || error);
            if (req.files && req.files.length > 0) {
            const filePaths = req.files.map(file => file.path);
            deleteUploadedFiles(filePaths);
            }
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

// 3. Claim Found Item Match (with quiz)
router.post(
    '/match/claim',
    authenticateUser,
    [ body('match_id').isInt(),
      body('answer1').notEmpty(),
      body('answer2').notEmpty()
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
      try {
        const { match_id , answer1, answer2 } = req.body;
        const user_id = req.user.id;

        //Get the lost item of match
        const [lostItems] = await pool.query("SELECT * FROM lost_items WHERE id = (SELECT lost_item_id FROM matches WHERE id = ?)",[match_id]);
        const lostItem = lostItems[0];

        //Get the found item of match
        const [foundItems] = await pool.query("SELECT * FROM found_items WHERE id = (SELECT found_item_id FROM matches WHERE id = ?)",[match_id]);
        const foundItem = foundItems[0];


       const normalize = s => s.trim().toLowerCase();

       const [score1, score2] = await Promise.all([
        stringSimilarity.compareTwoStrings(
        normalize(answer1),
        normalize(foundItem.answer1_hash)
        ),
        stringSimilarity.compareTwoStrings(
        normalize(answer2),
        normalize(foundItem.answer2_hash)
        )
      ]);

      const THRESHOLD = 0.5;

      if (score1 < THRESHOLD || score2 < THRESHOLD) {
        await pool.query(
            `UPDATE matches
            SET status = 'Rejected'
            WHERE id = ? AND status = 'Pending'`,
            [match_id]
        );
        console.log(score1, score2);

        return res.status(200).json({ error: "Verification failed" , status:"rejected"});
       }


        // Create a claim record
        await pool.query(
            "INSERT INTO claims (lost_item_id, found_item_id, claimer_id, answer_attempt_1, answer_attempt_2, status) VALUES (?, ?, ?,?, ?, 'Approved')",
            [lostItem.id, foundItem.id, user_id, answer1 , answer2]
        );
  
        // Update statuses
        await pool.query(
          `UPDATE matches 
           SET status = 'approved' 
           WHERE found_item_id = ? AND status = 'Pending'`,
          [foundItem.id]
        );
  
        await pool.query(
          `UPDATE found_items SET status = 'Returned' WHERE id = ?`,
          [foundItem.id]
        );

        await pool.query(`UPDATE lost_items 
            SET status = 'Claimed' 
            WHERE id = ?`
            , [lostItem.id]
        );
  
        // Notify finder / loser
        await pool.query(
          `INSERT INTO notifications 
           (user_id, message, type) 
           VALUES (?, ?, ?)`,
          [foundItem.user_id, 
           `Your found ${foundItem.item_name} was claimed! Safely hand over the item to its owner on contact. Thank You !`, 
           'claim_approved']
        );

        await pool.query(
            `INSERT INTO notifications 
            (user_id, message, type) 
            VALUES (?, ?, ?)`,
            [lostItem.user_id, 
            `Your lost ${lostItem.item_name} has been claimed! Contact the finder to get the possessiion of your item. Contact No. : ${foundItem.contact} .`, 
            'claim_approved']
        );

        // Share finder's contact 

        const [finder] = await pool.query(
        `SELECT * FROM users WHERE id = ?`,
        [foundItem.user_id]
        );

        res.status(200).json({ 
        status:"approved",
        message: "Claim approved!", 
        contact: finder[0]  
        });
       }
       catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
);


router.post('/claim/public', authenticateUser, async (req, res) => {
  const user_id = req.user.id;
  const { found_item_id } = req.body;

  try {
    /* Fetch found item */
    const [[foundItem]] = await pool.query(
      `SELECT * FROM found_items
       WHERE id = ? AND status = 'Reported'`,
      [found_item_id]
    );

    if (!foundItem) {
      return res.status(200).json({
        status: 'rejected',
        error: 'Found item not available'
      });
    }

    /* Find a loose lost item match (user-owned) */
    const [[lostItem]] = await pool.query(
      `SELECT * FROM lost_items
       WHERE user_id = ?
       AND category = ?
       AND status = 'Lost'
       AND (
         item_name LIKE ?
         OR lost_location LIKE ?
       )
       ORDER BY created_at ASC
       LIMIT 1`,
      [
        user_id,
        foundItem.category,
        `%${foundItem.item_name}%`,
        `%${foundItem.found_location}%`
      ]
    );

    if (!lostItem) {
      return res.status(200).json({
        status: 'rejected',
        error: 'Please report your lost item first'
      });
    }

    /* Prevent duplicate matches */
    const [[existingMatch]] = await pool.query(
      `SELECT id FROM matches
       WHERE lost_item_id = ? AND found_item_id = ?`,
      [lostItem.id, found_item_id]
    );

    if (existingMatch) {
      return res.status(200).json({
        status: 'match_exists',
        match_id: existingMatch.id
      });
    }

    /* Create auto-match */
    const [result] = await pool.query(
      `INSERT INTO matches
       (lost_item_id, found_item_id, match_score, status)
       VALUES (?, ?, ?, 'Pending')`,
      [lostItem.id, found_item_id, 60]
    );

    return res.status(200).json({
      status: 'match_created',
      match_id: result.insertId,
      message: 'Potential match created. Please verify ownership in the Matches section.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// View notifications
router.get('/notifications', authenticateUser, async (req, res) => {
    const user_id = req.user.id;

    try {
        const [notifications] = await pool.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            [user_id] );
            const [unread] = await pool.query(`SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND status = 'unread'`, [req.user.id]);
        
        res.status(200).json({notifications , unread_count : unread[0].count});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Mark single notification as read
router.put('/notifications/:id/read', authenticateUser, async (req, res) => {
  const user_id = req.user.id;
  const notification_id = req.params.id;

  try {
    const [result] = await pool.query(
      `UPDATE notifications 
       SET status = 'read' 
       WHERE id = ? AND user_id = ?`,
      [notification_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticateUser, async (req, res) => {
  const user_id = req.user.id;

  try {
    await pool.query(
      `UPDATE notifications 
       SET status = 'read' 
       WHERE user_id = ? AND status = 'unread'`,
      [user_id]
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Delete single notification
router.delete('/notifications/:id', authenticateUser, async (req, res) => {
  const user_id = req.user.id;
  const notification_id = req.params.id;

  try {
    const [result] = await pool.query(
      `DELETE FROM notifications 
       WHERE id = ? AND user_id = ?`,
      [notification_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Delete all notifications
router.delete('/notifications', authenticateUser, async (req, res) => {
  const user_id = req.user.id;

  try {
    await pool.query(
      `DELETE FROM notifications WHERE user_id = ?`,
      [user_id]
    );

    res.status(200).json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Get unread notifications
router.get('/notifications/unread', authenticateUser, async (req, res) => {
  const user_id = req.user.id;

  try {
    const [notifications] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND status = 'unread'
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// View all lost items 
router.get('/lost', authenticateUser, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        // Get total count
        const [totalCount] = await pool.query(
            "SELECT COUNT(*) as total FROM lost_items WHERE status = 'Lost'"
        );
        
        // Get paginated items
        const [lostItems] = await pool.query(
            "SELECT * FROM lost_items WHERE status = 'Lost' ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );
        
        res.status(200).json({
            items: lostItems,
            pagination: {
                page,
                limit,
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit),
                hasNextPage: page < Math.ceil(totalCount[0].total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// View all found items 
router.get('/found', authenticateUser, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        // Get total count
        const [totalCount] = await pool.query(
            "SELECT COUNT(*) as total FROM found_items WHERE status = 'Reported' AND is_public = TRUE"
        );
        
        // Get paginated items
        const [foundItems] = await pool.query(
            "SELECT * FROM found_items WHERE status = 'Reported' AND is_public = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );
        
        res.status(200).json({
            items: foundItems,
            pagination: {
                page,
                limit,
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit),
                hasNextPage: page < Math.ceil(totalCount[0].total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// View a lost item
router.get('/lost:id', authenticateUser, async (req, res) => {

    const {id} = req.params ;

    try {
        const [lostItems] = await pool.query("SELECT * FROM lost_items WHERE id = ? AND status = 'Lost'" , [id]);
        res.status(200).json(lostItems[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// View a found item
router.get('/found:id', authenticateUser, async (req, res) => {
    
    const {id} = req.params ;
    try {
        const [foundItems] = await pool.query("SELECT * FROM found_items WHERE id = ? AND status = 'Reported' AND is_public = True ",[id]);
        res.status(200).json(foundItems[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Search/filter lost items with pagination
router.get('/lost/search', authenticateUser, async (req, res) => {
    const { item_name, category, location, start_date, end_date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        let query = "SELECT * FROM lost_items WHERE status = 'Lost'";
        let countQuery = "SELECT COUNT(*) as total FROM lost_items WHERE status = 'Lost'";
        const params = [];
        const countParams = [];

        if (item_name) {
            query += " AND item_name LIKE ?";
            countQuery += " AND item_name LIKE ?";
            params.push(`%${item_name}%`);
            countParams.push(`%${item_name}%`);
        }
        if (category) {
            query += " AND category = ?";
            countQuery += " AND category = ?";
            params.push(category);
            countParams.push(category);
        }
        if (location) {
            query += " AND lost_location LIKE ?";
            countQuery += " AND lost_location LIKE ?";
            params.push(`%${location}%`);
            countParams.push(`%${location}%`);
        }
        if (start_date && end_date) {
            query += " AND lost_date BETWEEN ? AND ?";
            countQuery += " AND lost_date BETWEEN ? AND ?";
            params.push(start_date, end_date);
            countParams.push(start_date, end_date);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        
        const [totalRows] = await pool.query(countQuery, countParams);
        const totalCount = totalRows[0]?.total || 0;

        const [lostItems] = await pool.query(query, params);

        
        res.status(200).json({
            items: lostItems,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Search/filter found items 
router.get('/found/search', authenticateUser, async (req, res) => {
    const { item_name, category, location, start_date, end_date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        let query = "SELECT * FROM found_items WHERE status = 'Reported' AND is_public = TRUE";
        let countQuery = "SELECT COUNT(*) as total FROM found_items WHERE status = 'Reported' AND is_public = TRUE";
        const params = [];
        const countParams = [];

        if (item_name) {
            query += " AND item_name LIKE ?";
            countQuery += " AND item_name LIKE ?";
            params.push(`%${item_name}%`);
            countParams.push(`%${item_name}%`);
        }
        if (category) {
            query += " AND category = ?";
            countQuery += " AND category = ?";
            params.push(category);
            countParams.push(category);
        }
        if (location) {
            query += " AND found_location LIKE ?";
            countQuery += " AND found_location LIKE ?";
            params.push(`%${location}%`);
            countParams.push(`%${location}%`);
        }
        if (start_date && end_date) {
            query += " AND found_date BETWEEN ? AND ?";
            countQuery += " AND found_date BETWEEN ? AND ?";
            params.push(start_date, end_date);
            countParams.push(start_date, end_date);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

    
        const [totalCount] = await pool.query(countQuery, countParams);
        
        
        const [foundItems] = await pool.query(query, params);
        
        res.status(200).json({
            items: foundItems,
            pagination: {
                page,
                limit,
                total: totalCount[0].total,
                totalPages: Math.ceil(totalCount[0].total / limit),
                hasNextPage: page < Math.ceil(totalCount[0].total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Fetch user's lost items
router.get('/mylistings/lost', authenticateUser, async (req, res) => {
    const user_id = req.user.id;

    try {
        const [lostItems] = await pool.query("SELECT * FROM lost_items WHERE user_id = ? ORDER BY created_at DESC", [user_id]);
        if (lostItems.length > 0) {
            res.status(200).json({lostItems});
        } else {
            res.status(404).json({ message: "Lost item not found or it has been claimed." });
        }


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch user's found items
router.get('/mylistings/found', authenticateUser, async (req, res) => {
    const user_id = req.user.id;

    try {
        const [foundItems] = await pool.query("SELECT * FROM found_items WHERE user_id = ? ORDER BY created_at DESC", [user_id]);
        if(foundItems && foundItems.length > 0) {
            res.status(200).json({foundItems});
        } else {
            res.status(404).json({ message: "founde item not found or it has been returned." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//Fetch user's matches
router.get('/mylistings/matches', authenticateUser, async (req, res) => {
  const user_id = req.user.id;

  try {
    const [matches] = await pool.query(
      `
      SELECT 
        m.id AS match_id,
        m.status AS match_status,
        m.match_score,

        JSON_OBJECT(
          'id', l.id,
          'item_name', l.item_name,
          'category', l.category,
          'lost_location', l.lost_location,
          'lost_date', l.lost_date,
          'description',l.description,
          'image_urls', l.image_urls,
          'created_at',l.created_at
        ) AS lost_item,

        JSON_OBJECT(
          'id', f.id,
          'item_name', f.item_name,
          'category', f.category,
          'found_location', f.found_location,
          'found_date', f.found_date,
          'description',f.description,
          'image_urls', f.image_urls,
          'question1' , f.question1,
          'question2' , f.question2,
          'created_at',f.created_at
        ) AS found_item

      FROM matches m
      LEFT JOIN lost_items l ON m.lost_item_id = l.id
      LEFT JOIN found_items f ON m.found_item_id = f.id
      WHERE l.user_id = ?
      `,
      [user_id]
    );

    res.status(200).json({ matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Fetch user's claims (both made by user and claims on user's found items)
router.get('/myclaims', authenticateUser, async (req, res) => {
    const user_id = req.user.id;
    
    try {
        // 1. Claims where user is the claimer (user claimed found items)
        const [claimsMade] = await pool.query(
            `SELECT 
                c.id as claim_id,
                c.status as claim_status,
                c.created_at as claim_date,
                c.answer_attempt_1,
                c.answer_attempt_2,
                l.id as lost_item_id,
                l.item_name as lost_item_name,
                l.category as lost_item_category,
                l.description as lost_item_description,
                l.lost_date,
                l.lost_location,
                f.id as found_item_id,
                f.item_name as found_item_name,
                f.category as found_item_category,
                f.description as found_item_description,
                f.found_date,
                f.found_location,
                u_finder.username as finder_username,
                u_finder.email as finder_email,
                u_finder.phone as finder_phone
            FROM claims c
            JOIN lost_items l ON c.lost_item_id = l.id
            JOIN found_items f ON c.found_item_id = f.id
            JOIN users u_finder ON f.user_id = u_finder.id
            WHERE c.claimer_id = ?
            ORDER BY c.created_at DESC`,
            [user_id]
        );

        // 2. Claims made by others on user's found items
        const [claimsReceived] = await pool.query(
            `SELECT 
                c.id as claim_id,
                c.status as claim_status,
                c.created_at as claim_date,
                c.answer_attempt_1,
                c.answer_attempt_2,
                l.id as lost_item_id,
                l.item_name as lost_item_name,
                l.category as lost_item_category,
                l.description as lost_item_description,
                l.lost_date,
                l.lost_location,
                u_claimer.username as claimer_username,
                u_claimer.email as claimer_email,
                u_claimer.phone as claimer_phone,
                f.id as found_item_id,
                f.item_name as found_item_name,
                f.category as found_item_category,
                f.description as found_item_description,
                f.found_date,
                f.found_location
            FROM claims c
            JOIN found_items f ON c.found_item_id = f.id
            JOIN lost_items l ON c.lost_item_id = l.id
            JOIN users u_claimer ON c.claimer_id = u_claimer.id
            WHERE f.user_id = ? AND c.claimer_id != ?
            ORDER BY c.created_at DESC`,
            [user_id, user_id]
        );

        res.status(200).json({
            success: true,
            claims_made: claimsMade,      // Claims user has made
            claims_received: claimsReceived // Claims on user's found items
        });

    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error" 
        });
    }
});

// Get single claim details
router.get('/claims/:id', authenticateUser, async (req, res) => {
    const claim_id = req.params.id;
    const user_id = req.user.id;

    try {
        const [claims] = await pool.query(
            `SELECT 
                c.*,
                l.item_name as lost_item_name,
                l.description as lost_item_description,
                l.lost_date,
                l.lost_location,
                f.item_name as found_item_name,
                f.description as found_item_description,
                f.found_date,
                f.found_location,
                u_claimer.username as claimer_username,
                u_finder.username as finder_username
            FROM claims c
            JOIN lost_items l ON c.lost_item_id = l.id
            JOIN found_items f ON c.found_item_id = f.id
            JOIN users u_claimer ON c.claimer_id = u_claimer.id
            JOIN users u_finder ON f.user_id = u_finder.id
            WHERE c.id = ? AND (c.claimer_id = ? OR f.user_id = ?)`,
            [claim_id, user_id, user_id]
        );

        if (claims.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Claim not found or unauthorized" 
            });
        }

        res.status(200).json({
            success: true,
            claim: claims[0]
        });

    } catch (error) {
        console.error('Error fetching claim:', error);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error" 
        });
    }
});

// Update a lost item
router.put('/lost/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { description, lost_location, lost_date } = req.body;
    const user_id = req.user.id;

    try {
        // Check if the item exists and belongs to the user
        const [item] = await pool.query("SELECT * FROM lost_items WHERE id = ? AND user_id = ?", [id, user_id]);
        if (item.length === 0) {
            return res.status(404).json({ error: "Item not found or you do not have permission to update it." });
        }

        // Prevent updates if the item is already matched or claimed
        if (item[0].status !== 'Lost') {
            return res.status(400).json({ error: "Item cannot be updated as it is already matched or claimed." });
        }

        // Update the item
        await pool.query(
            "UPDATE lost_items SET description = ?, lost_location = ?, lost_date = ? WHERE id = ?",
            [description, lost_location, lost_date, id]
        );

        res.status(200).json({ message: "Item updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete a lost item
router.delete('/lost/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Check if the item exists and belongs to the user
        const [item] = await pool.query("SELECT * FROM lost_items WHERE id = ? AND user_id = ?", [id, user_id]);
        if (item.length === 0) {
            return res.status(404).json({ error: "Item not found or you do not have permission to delete it." });
        }

        // Prevent deletion if the item is already matched or claimed
        if (item[0].status !== 'Lost') {
            return res.status(400).json({ error: "Item cannot be deleted as it is already matched or claimed." });
        }

        // Delete the item
        await pool.query("DELETE FROM lost_items WHERE id = ?", [id]);

        res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update a found item
router.put('/found/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { description, found_location, found_date } = req.body;
    const user_id = req.user.id;

    try {
        // Check if the item exists and belongs to the user
        const [item] = await pool.query("SELECT * FROM found_items WHERE id = ? AND user_id = ?", [id, user_id]);
        if (item.length === 0) {
            return res.status(404).json({ error: "Item not found or you do not have permission to update it." });
        }

        // Prevent updates if the item is already matched or returned
        if (item[0].status !== 'Reported') {
            return res.status(400).json({ error: "Item cannot be updated as it is already matched or returned." });
        }

        // Update the item
        await pool.query(
            "UPDATE found_items SET description = ?, found_location = ?, found_date = ? WHERE id = ?",
            [description, found_location, found_date, id]
        );

        res.status(200).json({ message: "Item updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete a found item
router.delete('/found/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Check if the item exists and belongs to the user
        const [item] = await pool.query("SELECT * FROM found_items WHERE id = ? AND user_id = ?", [id, user_id]);
        if (item.length === 0) {
            return res.status(404).json({ error: "Item not found or you do not have permission to delete it." });
        }

        // Prevent deletion if the item is already matched or returned
        if (item[0].status !== 'Reported') {
            return res.status(400).json({ error: "Item cannot be deleted as it is already matched or returned." });
        }

        // Delete the item
        await pool.query("DELETE FROM found_items WHERE id = ?", [id]);

        res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;

   