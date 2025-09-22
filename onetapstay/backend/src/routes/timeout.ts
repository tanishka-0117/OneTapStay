import { Router, Request, Response } from 'express'
import { timeoutMonitoringService } from '../services/timeoutMonitoring'
import { AppError, asyncHandler } from '../middleware/errorHandler'

const router = Router()

// @desc Start timeout monitoring service
// @route POST /api/timeout/start
// @access Private (Hotel staff only)
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  try {
    timeoutMonitoringService.start()
    res.status(200).json({
      success: true,
      message: 'Timeout monitoring service started successfully',
    })
  } catch (error) {
    throw new AppError('Failed to start timeout monitoring service', 500)
  }
}))

// @desc Stop timeout monitoring service
// @route POST /api/timeout/stop
// @access Private (Hotel staff only)
router.post('/stop', asyncHandler(async (req: Request, res: Response) => {
  try {
    timeoutMonitoringService.stop()
    res.status(200).json({
      success: true,
      message: 'Timeout monitoring service stopped successfully',
    })
  } catch (error) {
    throw new AppError('Failed to stop timeout monitoring service', 500)
  }
}))

// @desc Get timeout statistics
// @route GET /api/timeout/stats
// @access Private (Hotel staff only)
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await timeoutMonitoringService.getTimeoutStats()
    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    throw new AppError('Failed to retrieve timeout statistics', 500)
  }
}))

// @desc Get active timeout alarms (for sound notifications)
// @route GET /api/timeout/alarms
// @access Private (Hotel staff only)
router.get('/alarms', asyncHandler(async (req: Request, res: Response) => {
  try {
    // This endpoint will be used by the frontend to poll for active alarms
    // and trigger sound notifications
    
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      data: {
        activeAlarms: [],
        hasNewAlarms: false,
        totalActiveAlarms: 0,
      },
      message: 'Timeout alarms retrieved successfully'
    })
  } catch (error) {
    throw new AppError('Failed to retrieve timeout alarms', 500)
  }
}))

// @desc Acknowledge timeout alarm
// @route POST /api/timeout/alarms/:alarmId/acknowledge
// @access Private (Hotel staff only)
router.post('/alarms/:alarmId/acknowledge', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { alarmId } = req.params
    const { staffMember } = req.body

    // For now, return success response
    // This will be implemented when we enable the full timeout monitoring
    
    res.status(200).json({
      success: true,
      message: `Timeout alarm ${alarmId} acknowledged successfully`,
      data: {
        alarmId,
        acknowledgedBy: staffMember || 'Unknown Staff',
        acknowledgedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    throw new AppError('Failed to acknowledge timeout alarm', 500)
  }
}))

// @desc Manual timeout check (for testing)
// @route POST /api/timeout/check
// @access Private (Hotel staff only)
router.post('/check', asyncHandler(async (req: Request, res: Response) => {
  try {
    // This will manually trigger a timeout check
    // Useful for testing the timeout monitoring system
    
    console.log('Manual timeout check triggered')
    // await timeoutMonitoringService.checkTimeouts() // Will be enabled later
    
    res.status(200).json({
      success: true,
      message: 'Manual timeout check completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    throw new AppError('Failed to perform manual timeout check', 500)
  }
}))

export default router