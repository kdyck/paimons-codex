import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os

logger = logging.getLogger(__name__)

class BackgroundScheduler:
    """Background task scheduler for periodic manhwa imports and other tasks"""
    
    def __init__(self, import_service=None):
        self.import_service = import_service
        self.running = False
        self.tasks = {}
        
        # Configuration from environment variables
        self.import_interval_minutes = int(os.getenv("MANHWA_IMPORT_INTERVAL_MINUTES", "30"))
        self.auto_import_enabled = os.getenv("MANHWA_AUTO_IMPORT_ENABLED", "true").lower() == "true"
        
        logger.info(f"BackgroundScheduler initialized - Auto import: {self.auto_import_enabled}, Interval: {self.import_interval_minutes}m")
    
    async def start(self):
        """Start the background scheduler"""
        if self.running:
            logger.warning("Background scheduler is already running")
            return
        
        self.running = True
        logger.info("Starting background scheduler")
        
        # Start periodic import task if enabled
        if self.auto_import_enabled and self.import_service:
            self.tasks["import"] = asyncio.create_task(self._periodic_import())
        
        # Add more scheduled tasks here as needed
        # self.tasks["cleanup"] = asyncio.create_task(self._periodic_cleanup())
    
    async def stop(self):
        """Stop the background scheduler"""
        if not self.running:
            return
        
        self.running = False
        logger.info("Stopping background scheduler")
        
        # Cancel all running tasks
        for task_name, task in self.tasks.items():
            if not task.done():
                logger.info(f"Cancelling task: {task_name}")
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        self.tasks.clear()
        logger.info("Background scheduler stopped")
    
    async def _periodic_import(self):
        """Periodically scan and import generated manhwa"""
        logger.info(f"Starting periodic manhwa import every {self.import_interval_minutes} minutes")
        
        # Wait a bit before first run to let services initialize
        await asyncio.sleep(60)
        
        while self.running:
            try:
                logger.info("Running scheduled manhwa import")
                
                if self.import_service:
                    results = await self.import_service.scan_and_import()
                    
                    if results["imported"] > 0:
                        logger.info(f"Scheduled import completed - imported {results['imported']} manhwa: {results['imported_titles']}")
                    else:
                        logger.debug("Scheduled import completed - no new manhwa found")
                else:
                    logger.warning("Import service not available for scheduled task")
                
            except Exception as e:
                logger.error(f"Error in scheduled manhwa import: {e}")
            
            # Wait for next interval
            if self.running:
                await asyncio.sleep(self.import_interval_minutes * 60)
    
    async def _periodic_cleanup(self):
        """Periodically clean up old data, logs, etc."""
        # This could be implemented for maintenance tasks
        # like cleaning up old temporary files, rotating logs, etc.
        cleanup_interval_hours = int(os.getenv("CLEANUP_INTERVAL_HOURS", "24"))
        
        while self.running:
            try:
                logger.info("Running scheduled cleanup tasks")
                
                # Add cleanup logic here
                # - Remove old temporary files
                # - Clean up expired cache entries
                # - Rotate log files
                # - etc.
                
                logger.debug("Cleanup tasks completed")
                
            except Exception as e:
                logger.error(f"Error in scheduled cleanup: {e}")
            
            # Wait for next interval
            if self.running:
                await asyncio.sleep(cleanup_interval_hours * 3600)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current scheduler status"""
        return {
            "running": self.running,
            "auto_import_enabled": self.auto_import_enabled,
            "import_interval_minutes": self.import_interval_minutes,
            "active_tasks": list(self.tasks.keys()),
            "task_status": {
                name: "running" if not task.done() else "completed"
                for name, task in self.tasks.items()
            },
            "uptime": datetime.now().isoformat() if self.running else None
        }
    
    async def trigger_import_now(self) -> Dict[str, Any]:
        """Manually trigger an import outside the schedule"""
        if not self.import_service:
            return {"status": "error", "message": "Import service not available"}
        
        try:
            logger.info("Manual trigger of scheduled import")
            results = await self.import_service.scan_and_import()
            return {"status": "success", "results": results}
            
        except Exception as e:
            logger.error(f"Error in manual trigger: {e}")
            return {"status": "error", "message": str(e)}

# Global scheduler instance
_scheduler: Optional[BackgroundScheduler] = None

def get_scheduler() -> Optional[BackgroundScheduler]:
    """Get the global scheduler instance"""
    return _scheduler

async def initialize_scheduler(import_service=None):
    """Initialize the global background scheduler"""
    global _scheduler
    
    if _scheduler is None:
        _scheduler = BackgroundScheduler(import_service)
        await _scheduler.start()
        logger.info("Global background scheduler initialized")
    else:
        logger.warning("Background scheduler already initialized")

async def shutdown_scheduler():
    """Shutdown the global background scheduler"""
    global _scheduler
    
    if _scheduler:
        await _scheduler.stop()
        _scheduler = None
        logger.info("Global background scheduler shutdown")