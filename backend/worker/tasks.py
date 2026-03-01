import logging
from datetime import datetime
from worker.celery_app import celery_app
from database import SessionLocal
from models.models import ModelFile

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def process_model_file(self, model_file_id: int):
    db = SessionLocal()
    model_file = None

    try:
        model_file = db.query(ModelFile).filter(ModelFile.id == model_file_id).first()
        if not model_file:
            logger.error(f"ModelFile {model_file_id} not found")
            return


        model_file.status = "processing"
        db.commit()

        logger.info(f"Processing model file {model_file_id}: {model_file.file_path}")

        from services.mesh_analyzer import analyze_mesh
        result = analyze_mesh(model_file.file_path, model_file.file_format)


        model_file.dim_x = result["dim_x"]
        model_file.dim_y = result["dim_y"]
        model_file.dim_z = result["dim_z"]
        model_file.volume_cm3 = result["volume_cm3"]
        model_file.surface_area_cm2 = result["surface_area_cm2"]
        model_file.polygon_count = result["polygon_count"]
        model_file.status = "done"
        model_file.processed_at = datetime.utcnow()
        model_file.error_message = ""

        db.commit()
        logger.info(f"Model file {model_file_id} processed successfully: {result}")

    except Exception as exc:
        logger.error(f"Failed to process model file {model_file_id}: {exc}")
        if model_file:
            model_file.status = "error"
            model_file.error_message = str(exc)[:500]
            db.commit()


        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

    finally:
        db.close()
