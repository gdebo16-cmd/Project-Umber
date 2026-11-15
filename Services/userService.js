// services/userService.js
const { Op } = require('sequelize');
// Assuming you exported your initialized sequelize instance and Character model
const { User, Character, sequelize } = require('../models'); 

// Find whole user row for login
export async function findUserByUsername(username) {
    return await User.findOne({
        where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('username')), 
            sequelize.fn('LOWER', username)
        )
    });
}

// Check if username exists
export async function usernameExists(username) {
    const count = await User.count({
        where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('username')), 
            sequelize.fn('LOWER', username)
        )
    });
    return count > 0;
}

// Create user
export async function createUser(username, hash, name, email) {
    const newUser = await User.create({
        username,
        password_hash: hash,
        name,
        email,
        site_theme: 'default'
    });
    // Return specific fields to match your original function
    return {
        id: newUser.id,
        username: newUser.username,
        created_at: newUser.created_at
    };
}

// Get settings
export async function getSettings(userId) {
    return await User.findByPk(userId, {
        attributes: ['username', 'email']
    });
}

// Update settings (hash = null keeps old password)
export async function updateSettings(userId, username, email, hash) {
    const updateData = { username, email };
    if (hash) {
        updateData.password_hash = hash;
    }
    await User.update(updateData, {
        where: { id: userId }
    });
}

// Get profile (includes character count)
export async function getProfile(userId) {
    const user = await User.findByPk(userId, {
        attributes: [
            'name', 'username', 'email', 'created_at', 
            'site_theme', 'site_background', 'site_display',
            [sequelize.fn('COUNT', sequelize.col('Characters.id')), 'character_count']
        ],
        include: [{
            model: Character,
            attributes: [] // Don't fetch character rows, just count them
        }],
        group: ['User.id']
    });
    return user ? user.toJSON() : null;
}

// Update profile (null values keep old values via logic or handling)
export async function updateProfile(userId, name, siteTheme, siteBackground = null, siteDisplay = null) {
    const user = await User.findByPk(userId);
    if (!user) return null;

    // COALESCE logic equivalent
    await user.update({
        name: name !== undefined ? name : user.name,
        site_theme: siteTheme !== undefined ? siteTheme : user.site_theme,
        site_background: siteBackground !== null ? siteBackground : user.site_background,
        site_display: siteDisplay !== null ? siteDisplay : user.site_display,
    });

    return {
        name: user.name,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        site_theme: user.site_theme,
        site_background: user.site_background,
        site_display: user.site_display,
    };
}

// Delete user and characters inside a transaction
export async function deleteUser(userId) {
    const t = await sequelize.transaction();
    try {
        // Delete characters first (assuming your User hasMany Character association)
        await Character.destroy({
            where: { user_id: userId },
            transaction: t
        });

        const deletedRows = await User.destroy({
            where: { id: userId },
            transaction: t
        });

        await t.commit();
        return deletedRows;
    } catch (err) {
        await t.rollback();
        throw err;
    }
}