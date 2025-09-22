import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createStaffMember, getStaffMembers, updateStaffMember, deactivateStaffMember } from '../controllers/staffController';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createBookingSchema = z.object({
  externalBookingId: z.string().min(1, 'Booking ID is required'),
  guestEmail: z.string().email('Valid email is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  checkIn: z.string().datetime('Valid check-in date is required'),
  checkOut: z.string().datetime('Valid check-out date is required'),
  hotelId: z.string().optional(),
});

const updateBookingSchema = z.object({
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(1).optional(),
  roomNumber: z.string().min(1).optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']).optional(),
  isTimeoutActive: z.boolean().optional(),
});

// POST /api/admin/bookings - Create a new booking
router.post('/bookings', async (req, res): Promise<any> => {
  try {
    const validatedData = createBookingSchema.parse(req.body);

    // Check if booking ID already exists
    const existingBooking = await (prisma as any).booking.findUnique({
      where: { externalBookingId: validatedData.externalBookingId }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: `Booking ID '${validatedData.externalBookingId}' already exists in the system. Please use a different booking ID.`
      });
    }

    // Find or create user by email
    let user = await (prisma as any).user.findUnique({
      where: { email: validatedData.guestEmail }
    });

    if (!user) {
      user = await (prisma as any).user.create({
        data: {
          email: validatedData.guestEmail,
          firstName: validatedData.guestName.split(' ')[0],
          lastName: validatedData.guestName.split(' ').slice(1).join(' ') || '',
          type: 'guest',
          isActive: true,
          isVerified: false,
        }
      });
    }

    // Find hotel (use default hotel for now)
    let hotel = await (prisma as any).hotel.findFirst();
    if (!hotel) {
      // Create a default hotel if none exists
      const defaultUser = await (prisma as any).user.findFirst({ where: { type: 'hotel' } });
      if (!defaultUser) {
        const hotelUser = await (prisma as any).user.create({
          data: {
            email: 'hotel@onetapstay.com',
            type: 'hotel',
            firstName: 'OneTapStay',
            lastName: 'Hotel',
            isActive: true,
            isVerified: true,
          }
        });
        hotel = await (prisma as any).hotel.create({
          data: {
            userId: hotelUser.id,
            name: 'OneTapStay Hotel',
            address: '123 Main St',
            city: 'City',
            state: 'State',
            country: 'Country',
            zipCode: '12345',
            phone: '+1234567890',
            email: 'hotel@onetapstay.com',
          }
        });
      } else {
        // Use existing hotel user to create hotel
        hotel = await (prisma as any).hotel.create({
          data: {
            userId: defaultUser.id,
            name: 'OneTapStay Hotel',
            address: '123 Main St',
            city: 'City',
            state: 'State',
            country: 'Country',
            zipCode: '12345',
            phone: '+1234567890',
            email: defaultUser.email,
          }
        });
      }
    }

    // Find or create room by number
    let room = await (prisma as any).room.findFirst({
      where: { 
        hotelId: hotel.id,
        number: validatedData.roomNumber
      }
    });

    if (!room) {
      room = await (prisma as any).room.create({
        data: {
          hotelId: hotel.id,
          number: validatedData.roomNumber,
          type: 'standard',
          capacity: 2,
          beds: 1,
          bathrooms: 1,
          basePrice: 100.00,
          currency: 'USD',
        }
      });
    }

    // Create booking
    const booking = await (prisma as any).booking.create({
      data: {
        guestId: user.id,
        hotelId: hotel.id,
        roomId: room.id,
        externalBookingId: validatedData.externalBookingId,
        checkIn: new Date(validatedData.checkIn),
        checkOut: new Date(validatedData.checkOut),
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guests: 1,
        totalAmount: 100.00,
        currency: 'USD',
        status: 'confirmed',
        isTimeoutActive: false,
        timeoutNotified: false,
      },
      include: {
        guest: { select: { id: true, email: true, firstName: true, lastName: true } },
        hotel: { select: { id: true, name: true } },
        room: { select: { id: true, number: true, type: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/bookings - Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { externalBookingId: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const bookings = await (prisma as any).booking.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { id: true, email: true, firstName: true, lastName: true } },
        hotel: { select: { id: true, name: true } },
        room: { select: { id: true, number: true, type: true } }
      }
    });

    const total = await (prisma as any).booking.count({ where });

    return res.json({
      success: true,
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/bookings/:id - Get specific booking
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await (prisma as any).booking.findUnique({
      where: { id },
      include: {
        guest: { select: { id: true, email: true, firstName: true, lastName: true } },
        hotel: { select: { id: true, name: true } },
        room: { select: { id: true, number: true, type: true } },
        payments: true,
        keys: true,
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/admin/bookings/:id - Update booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);

    const existingBooking = await (prisma as any).booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const updateData: any = {};

    if (validatedData.guestEmail) updateData.guestEmail = validatedData.guestEmail;
    if (validatedData.guestName) updateData.guestName = validatedData.guestName;
    if (validatedData.checkIn) updateData.checkIn = new Date(validatedData.checkIn);
    if (validatedData.checkOut) updateData.checkOut = new Date(validatedData.checkOut);
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.isTimeoutActive !== undefined) updateData.isTimeoutActive = validatedData.isTimeoutActive;

    // Handle room number change
    if (validatedData.roomNumber) {
      let room = await (prisma as any).room.findFirst({
        where: { 
          hotelId: existingBooking.hotelId,
          number: validatedData.roomNumber
        }
      });

      if (!room) {
        room = await (prisma as any).room.create({
          data: {
            hotelId: existingBooking.hotelId,
            number: validatedData.roomNumber,
            type: 'standard',
            capacity: 2,
            beds: 1,
            bathrooms: 1,
            basePrice: 100.00,
            currency: 'USD',
          }
        });
      }
      updateData.roomId = room.id;
    }

    const booking = await (prisma as any).booking.update({
      where: { id },
      data: updateData,
      include: {
        guest: { select: { id: true, email: true, firstName: true, lastName: true } },
        hotel: { select: { id: true, name: true } },
        room: { select: { id: true, number: true, type: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/admin/bookings/:id - Delete booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingBooking = await (prisma as any).booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await (prisma as any).booking.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/booking-by-external/:externalId - Find booking by external ID
router.get('/booking-by-external/:externalId', async (req, res) => {
  try {
    const { externalId } = req.params;

    const booking = await (prisma as any).booking.findUnique({
      where: { externalBookingId: externalId },
      include: {
        guest: { select: { id: true, email: true, firstName: true, lastName: true } },
        hotel: { select: { id: true, name: true } },
        room: { select: { id: true, number: true, type: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Error fetching booking by external ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin Management Routes (Admin Only)
// Note: Authentication and authorization middleware would be applied in the main app

// GET /api/admin/users - Get all staff/admin members  
router.get('/users', getStaffMembers);

// POST /api/admin/users - Create new staff/admin member
router.post('/users', createStaffMember);

// PUT /api/admin/users/:id - Update staff/admin member
router.put('/users/:id', updateStaffMember);

// PUT /api/admin/users/:id/deactivate - Deactivate staff/admin member
router.put('/users/:id/deactivate', deactivateStaffMember);

export default router;