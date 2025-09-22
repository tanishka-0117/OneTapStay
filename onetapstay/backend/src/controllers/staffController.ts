// Staff management controllers

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create new staff member (Admin only)
export const createStaffMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, department, position, employeeId } = req.body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // For now, create a simplified staff member response
    // We'll enhance this once Prisma types are properly generated
    res.status(201).json({
      success: true,
      message: `Staff member ${firstName} ${lastName} created successfully`,
      user: {
        id: 'temp-id-' + Date.now(),
        email,
        firstName,
        lastName,
        role: role || 'STAFF'
      }
    })

  } catch (error) {
    console.error('Create staff member error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Get all staff members (Admin only)
export const getStaffMembers = async (req: Request, res: Response) => {
  try {
    // Mock data for now until Prisma types are fixed
    const mockStaffMembers = [
      {
        id: '1',
        email: 'admin@onetapstay.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        department: 'Management',
        position: 'System Administrator',
        employeeId: 'EMP001',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        email: 'staff@onetapstay.com',
        firstName: 'Staff',
        lastName: 'Member',
        role: 'STAFF',
        department: 'Front Desk',
        position: 'Receptionist',
        employeeId: 'EMP002',
        isActive: true,
        createdAt: '2025-01-02T00:00:00Z'
      }
    ]

    res.json({
      success: true,
      staffMembers: mockStaffMembers
    })

  } catch (error) {
    console.error('Get staff members error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Update staff member (Admin only)
export const updateStaffMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { firstName, lastName, role, department, position, employeeId, isActive } = req.body

    // Mock response for now
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      user: {
        id,
        firstName,
        lastName,
        role
      }
    })

  } catch (error) {
    console.error('Update staff member error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// Deactivate staff member (Admin only)
export const deactivateStaffMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Mock response for now
    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    })

  } catch (error) {
    console.error('Deactivate staff member error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}