// server/src/controllers/groupController.js
const { User, Group, Message, Attachment } = require('../db/models');

/**
 * Create a new group
 */
exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, memberIds } = req.body;
    
    if (!name) {
      return res.status(400).json({
        message: 'Group name is required'
      });
    }
    
    // Create the group
    const group = await Group.create({
      name,
      description,
      adminId: userId
    });
    
    // Add current user as a member
    await group.addMember(userId);
    
    // Add other members if provided
    if (memberIds && memberIds.length > 0) {
      // Verify all members exist
      const members = await User.findAll({
        where: {
          id: memberIds
        }
      });
      
      if (members.length !== memberIds.length) {
        return res.status(400).json({
          message: 'One or more members not found'
        });
      }
      
      // Add members to group
      await group.addMembers(memberIds);
    }
    
    // Fetch the complete group with members
    const completeGroup = await Group.findByPk(group.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'profilePicture', 'isOnline']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'email', 'profilePicture']
        }
      ]
    });
    
    res.status(201).json(completeGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      message: 'Server error while creating group'
    });
  }
};

/**
 * Get group details
 */
exports.getGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find the group and verify user is a member
    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'profilePicture', 'isOnline', 'lastSeen']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'email', 'profilePicture']
        }
      ]
    });
    
    if (!group) {
      return res.status(404).json({
        message: 'Group not found'
      });
    }
    
    // Check if user is a member
    const isMember = group.members.some(member => member.id === userId);
    
    if (!isMember) {
      return res.status(403).json({
        message: 'You are not a member of this group'
      });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      message: 'Server error while getting group'
    });
  }
};

/**
 * Update group details
 */
exports.updateGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, groupPicture } = req.body;
    
    // Find the group
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({
        message: 'Group not found'
      });
    }
    
    // Check if user is the admin
    if (group.adminId !== userId) {
      return res.status(403).json({
        message: 'Only the group admin can update group details'
      });
    }
    
    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (groupPicture) group.groupPicture = groupPicture;
    
    await group.save();
    
    // Fetch updated group with members
    const updatedGroup = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'profilePicture', 'isOnline']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'email', 'profilePicture']
        }
      ]
    });
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      message: 'Server error while updating group'
    });
  }
};

/**
 * Add member to group
 */
exports.addMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({
        message: 'Member ID is required'
      });
    }
    
    // Find the group
    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id']
        }
      ]
    });
    
    if (!group) {
      return res.status(404).json({
        message: 'Group not found'
      });
    }
    
    // Check if user is the admin or a member
    const isMember = group.members.some(member => member.id === userId);
    const isAdmin = group.adminId === userId;
    
    if (!isMember && !isAdmin) {
      return res.status(403).json({
        message: 'You are not a member of this group'
      });
    }
    
    // Check if the user to add exists
    const userToAdd = await User.findByPk(memberId);
    
    if (!userToAdd) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => member.id === parseInt(memberId));
    
    if (isAlreadyMember) {
      return res.status(400).json({
        message: 'User is already a member of this group'
      });
    }
    
    // Add user to group
    await group.addMember(memberId);
    
    // Get updated group
    const updatedGroup = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'profilePicture', 'isOnline']
        }
      ]
    });
    
    res.json({
      message: 'Member added successfully',
      members: updatedGroup.members
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      message: 'Server error while adding member'
    });
  }
};

/**
 * Remove member from group
 */
exports.removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, memberId } = req.params;
    
    // Find the group
    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id']
        }
      ]
    });
    
    if (!group) {
      return res.status(404).json({
        message: 'Group not found'
      });
    }
    
    // Check if the user to remove exists in the group
    const memberExists = group.members.some(member => member.id === parseInt(memberId));
    
    if (!memberExists) {
      return res.status(404).json({
        message: 'User is not a member of this group'
      });
    }
    
    // Check permissions
    // Admin can remove anyone, users can remove themselves
    const isAdmin = group.adminId === userId;
    const isSelfRemoval = parseInt(memberId) === userId;
    
    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({
        message: 'You do not have permission to remove this member'
      });
    }
    
    // Cannot remove the admin
    if (parseInt(memberId) === group.adminId && !isSelfRemoval) {
      return res.status(403).json({
        message: 'The group admin cannot be removed'
      });
    }
    
    // Remove member
    await group.removeMember(memberId);
    
    // If admin is leaving, either delete group or transfer ownership
    if (isSelfRemoval && isAdmin) {
      // Check if there are other members
      const remainingMembers = group.members.filter(member => member.id !== userId);
      
      if (remainingMembers.length > 0) {
        // Transfer ownership to first remaining member
        group.adminId = remainingMembers[0].id;
        await group.save();
      } else {
        // Delete the group if no members left
        await group.destroy();
        return res.json({
          message: 'Group deleted as no members remain'
        });
      }
    }
    
    // Get updated group
    const updatedGroup = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'profilePicture', 'isOnline']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'email', 'profilePicture']
        }
      ]
    });
    
    res.json({
      message: 'Member removed successfully',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      message: 'Server error while removing member'
    });
  }
};

/**
 * Delete group
 */
exports.deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find the group
    const group = await Group.findByPk(id);
    
    if (!group) {
      return res.status(404).json({
        message: 'Group not found'
      });
    }
    
    // Check if user is the admin
    if (group.adminId !== userId) {
      return res.status(403).json({
        message: 'Only the group admin can delete the group'
      });
    }
    
    // Delete the group
    await group.destroy();
    
    res.json({
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      message: 'Server error while deleting group'
    });
  }
};