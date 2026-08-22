import os
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="simulations.run_simulation_task", bind=True)
def run_simulation_task(self, user_id: int, sim_config: dict):
    # This requires DB access to get the user and run the engine
    from app.database import SessionLocal
    from app.repositories import user_repository, financial_repository
    from app.services.simulation_service import get_sim_inputs, sim_config_from_schema
    from engine.simulation import MonteCarloEngine
    
    db = SessionLocal()
    try:
        db_user = user_repository.get_user(db, user_id=user_id)
        if not db_user:
            return {"error": "User not found"}
            
        profile, assets, goals, life_events, liabilities = get_sim_inputs(db_user)
        config = sim_config_from_schema(sim_config) if sim_config else None
        
        engine = MonteCarloEngine(
            profile=profile,
            assets=assets,
            config=config,
            life_events=life_events,
            liabilities=liabilities
        )
        
        result = engine.run(goals=goals)
        
        # Save to DB
        from app.models import SimulationRunModel
        run_record = SimulationRunModel(
            user_id=user_id,
            job_id=self.request.id,
            status="SUCCESS",
            terminal_wealth_mean=result.terminal_wealth_mean,
            terminal_wealth_median=result.terminal_wealth_median,
            ruin_probability=result.ruin_probability,
            max_drawdown_p50=result.max_drawdown_p50,
        )
        # We don't save the full JSON payload in SQLite if it's too big, but we can serialize it
        # Actually, let's omit result_data for now to save DB space, or save it if requested.
        
        db.add(run_record)
        db.commit()
        
        # Serialize the dataclass result to a dict so Celery can store it in Redis
        from dataclasses import asdict
        return asdict(result)
        
    except Exception as e:
        if 'db' in locals():
            from app.models import SimulationRunModel
            run_record = SimulationRunModel(
                user_id=user_id,
                job_id=self.request.id,
                status="FAILED"
            )
            db.add(run_record)
            db.commit()
        return {"error": str(e)}
    finally:
        db.close()
