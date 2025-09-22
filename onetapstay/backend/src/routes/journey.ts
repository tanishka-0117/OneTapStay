import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { guestAuthMiddleware } from '../middleware/guestAuth';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

// Get guest journey timeline (for guest dashboard)
router.get('/guest/:bookingId/journey', guestAuthMiddleware, asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Verify booking belongs to authenticated guest
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true }
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.guestId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const journeyEvents = await prisma.guestJourneyEvent.findMany({
    where: { bookingId },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      facilityTransaction: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalAmount: true,
          paymentStatus: true,
          paymentMethod: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  // Group events by date for better display
  const groupedEvents = journeyEvents.reduce((acc, event) => {
    const date = event.timestamp.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof journeyEvents>);

  // Calculate summary statistics
  const summary = {
    totalEvents: journeyEvents.length,
    totalSpent: journeyEvents
      .filter(event => event.amount && event.facilityTransaction?.paymentStatus === 'completed')
      .reduce((sum, event) => sum + (event.amount || 0), 0),
    pendingAmount: journeyEvents
      .filter(event => event.amount && event.facilityTransaction?.paymentStatus === 'pending')
      .reduce((sum, event) => sum + (event.amount || 0), 0),
    facilitiesVisited: new Set(journeyEvents
      .filter(event => event.facilityId)
      .map(event => event.facilityId)
    ).size
  };

  res.json({
    success: true,
    data: {
      events: journeyEvents,
      groupedEvents,
      summary
    }
  });
}));

// Add manual journey event (for staff/admin)
router.post('/journey/event', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const {
    bookingId,
    eventType,
    title,
    description,
    facilityId,
    amount,
    metadata
  } = req.body;

  // Verify booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true }
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const journeyEvent = await prisma.guestJourneyEvent.create({
    data: {
      bookingId,
      eventType,
      title,
      description,
      facilityId,
      amount,
      metadata: metadata ? JSON.stringify(metadata) : null
    },
    include: {
      facility: {
        select: {
          name: true,
          type: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Journey event added successfully',
    data: journeyEvent
  });
}));

// Create check-in journey event
router.post('/journey/checkin', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const { bookingId, roomKeyId, notes } = req.body;

  // Verify booking and get details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: { 
        select: { 
          firstName: true, 
          lastName: true 
        } 
      },
      room: { 
        select: { 
          number: true, 
          type: true 
        } 
      }
    }
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const guestName = `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}`.trim();

  // Create check-in journey event
  const journeyEvent = await prisma.guestJourneyEvent.create({
    data: {
      bookingId,
      eventType: 'check_in',
      title: 'Check-in Completed',
      description: `${guestName} checked into Room ${booking.room.number} (${booking.room.type})`,
      roomKeyId,
      metadata: JSON.stringify({
        roomNumber: booking.room.number,
        roomType: booking.room.type,
        checkInTime: new Date().toISOString(),
        notes
      })
    }
  });

  res.json({
    success: true,
    message: 'Check-in journey event created successfully',
    data: journeyEvent
  });
}));

// Create door access journey event
router.post('/journey/door-access', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const { bookingId, roomKeyId, accessType, location } = req.body;

  // Verify booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true }
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Create door access journey event
  const journeyEvent = await prisma.guestJourneyEvent.create({
    data: {
      bookingId,
      eventType: 'door_access',
      title: `${accessType === 'room' ? 'Room' : 'Facility'} Access`,
      description: `Accessed ${location} using digital key`,
      roomKeyId,
      metadata: JSON.stringify({
        accessType,
        location,
        accessTime: new Date().toISOString()
      })
    }
  });

  res.json({
    success: true,
    message: 'Door access event recorded successfully',
    data: journeyEvent
  });
}));

// Get journey events for admin dashboard
router.get('/admin/journeys', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const {
    hotelId,
    dateFrom,
    dateTo,
    eventType,
    facilityId,
    page = 1,
    limit = 50
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause
  const where: any = {};

  if (hotelId) {
    where.booking = { hotelId };
  }

  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
    if (dateTo) where.timestamp.lte = new Date(dateTo as string);
  }

  if (eventType) {
    where.eventType = eventType;
  }

  if (facilityId) {
    where.facilityId = facilityId;
  }

  const [events, total] = await Promise.all([
    prisma.guestJourneyEvent.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            guest: { 
              select: { 
                firstName: true, 
                lastName: true, 
                email: true 
              } 
            },
            room: { 
              select: { 
                number: true 
              } 
            },
            hotel: { 
              select: { 
                name: true 
              } 
            }
          }
        },
        facility: {
          select: { name: true, type: true }
        },
        facilityTransaction: {
          select: {
            totalAmount: true,
            paymentStatus: true,
            paymentMethod: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.guestJourneyEvent.count({ where })
  ]);

  // Calculate summary statistics
  const summary = await prisma.guestJourneyEvent.groupBy({
    by: ['eventType'],
    where,
    _count: {
      id: true
    }
  });

  const totalRevenue = await prisma.facilityTransaction.aggregate({
    where: {
      paymentStatus: 'completed',
      ...(hotelId && {
        booking: { hotelId: hotelId as string }
      }),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom as string) }),
          ...(dateTo && { lte: new Date(dateTo as string) })
        }
      } : {})
    },
    _sum: {
      totalAmount: true
    }
  });

  res.json({
    success: true,
    data: {
      events,
      summary: {
        eventTypes: summary,
        totalRevenue: totalRevenue._sum.totalAmount || 0
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Get facility-specific journey events
router.get('/facility/:facilityId/journey-events', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const {
    dateFrom,
    dateTo,
    eventType,
    page = 1,
    limit = 20
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause
  const where: any = { facilityId };

  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
    if (dateTo) where.timestamp.lte = new Date(dateTo as string);
  }

  if (eventType) {
    where.eventType = eventType;
  }

  const [events, total] = await Promise.all([
    prisma.guestJourneyEvent.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            guest: { 
              select: { 
                firstName: true, 
                lastName: true 
              } 
            },
            room: { 
              select: { 
                number: true 
              } 
            }
          }
        },
        facilityTransaction: {
          select: {
            totalAmount: true,
            paymentStatus: true,
            quantity: true,
            serviceName: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.guestJourneyEvent.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

export default router;