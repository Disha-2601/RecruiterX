import datetime
import json
import uuid
from typing import Optional, List, Union
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, text

from .database import engine, Base, SessionLocal, get_db
from .models import Organisation, OrgMember, Project, Candidate, ApiKey

app = FastAPI(title="Recruiter-X local database API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to get SQLAlchemy model from table name
MODEL_MAP = {
    "organisations": Organisation,
    "org_members": OrgMember,
    "projects": Project,
    "candidates": Candidate,
    "api_keys": ApiKey
}

# Auto-create tables and seed initial data on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Dynamic SQL migrations to add new columns to candidates table if they are missing
        for col_name, col_type in [("skill_match_score", "INTEGER"), ("education_score", "INTEGER"), ("consistency_penalty", "FLOAT")]:
            try:
                db.execute(text(f"ALTER TABLE candidates ADD COLUMN {col_name} {col_type}"))
                db.commit()
            except Exception:
                db.rollback()
    except Exception as e:
        print(f"Migration error: {e}")
        
    try:
        # Seed Organisation
        if not db.query(Organisation).filter(Organisation.id == "mock-local-org").first():
            org = Organisation(id="mock-local-org", name="Local Dev Organization")
            db.add(org)
            db.commit()

        # Seed Org Member
        if not db.query(OrgMember).filter(OrgMember.user_id == "mock-local-user").first():
            member = OrgMember(org_id="mock-local-org", user_id="mock-local-user", role="owner")
            db.add(member)
            db.commit()

        # Seed Api Key
        if not db.query(ApiKey).filter(ApiKey.org_id == "mock-local-org").first():
            key = ApiKey(
                id="mock-api-key-id", 
                org_id="mock-local-org", 
                key_val="mock-key-123", 
                name="Default Key", 
                is_active=True
            )
            db.add(key)
            db.commit()

        # Seed Demo Project
        if not db.query(Project).filter(Project.id == "demo-project-id").first():
            demo_project = Project(
                id="demo-project-id",
                org_id="mock-local-org",
                title="Senior AI/ML Engineer Search",
                role="Senior AI/ML Engineer",
                department="Engineering",
                seniority="Senior",
                status="active",
                created_by="mock-local-user",
                jd_raw_text="Demo Job Description",
                jd_structured={
                    "must_have_skills": ["CUDA", "NCCL", "Python", "C++"],
                    "nice_to_have_skills": ["Docker"]
                }
            )
            db.add(demo_project)
            db.commit()
    finally:
        db.close()

def serialize_model(obj):
    if obj is None:
        return None
    if isinstance(obj, list):
        return [serialize_model(x) for x in obj]
        
    result = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    
    # Convert datetime to ISO string
    for k, v in result.items():
        if isinstance(v, (datetime.datetime, datetime.date)):
            result[k] = v.isoformat()
            
    # Eager load candidates for projects if relationship is defined
    if isinstance(obj, Project):
        result["candidates"] = [serialize_model(c) for c in obj.candidates]
        
    return result

# Generic DB endpoints mapping to SQLAlchemy
@app.get("/api/v1/db/{table}")
def db_select(
    table: str,
    filters: Optional[str] = Query(None),
    order_col: Optional[str] = Query(None),
    order_desc: Optional[str] = Query(None),
    limit: Optional[int] = Query(None),
    single: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if table not in MODEL_MAP:
        raise HTTPException(status_code=400, detail=f"Table '{table}' not supported")
        
    Model = MODEL_MAP[table]
    query = db.query(Model)
    
    # Apply filters (format: [{"column":"col","value":"val"}])
    if filters:
        try:
            filter_list = json.loads(filters)
            for f in filter_list:
                col = f.get("column")
                val = f.get("value")
                if hasattr(Model, col):
                    query = query.filter(getattr(Model, col) == val)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid filters format: {e}")
            
    # Apply ordering
    if order_col and hasattr(Model, order_col):
        if order_desc == "true":
            query = query.order_by(desc(getattr(Model, order_col)))
        else:
            query = query.order_by(asc(getattr(Model, order_col)))
            
    # Apply limit
    if limit:
        query = query.limit(limit)
        
    # Execute query
    if single == "true":
        result = query.first()
        if not result:
            raise HTTPException(status_code=404, detail="Row not found")
        return serialize_model(result)
    else:
        results = query.all()
        return serialize_model(results)

@app.post("/api/v1/db/{table}")
async def db_insert(table: str, request: Request, db: Session = Depends(get_db)):
    if table not in MODEL_MAP:
        raise HTTPException(status_code=400, detail=f"Table '{table}' not supported")
        
    Model = MODEL_MAP[table]
    data = await request.json()
    
    # Handle single or bulk insert
    if isinstance(data, list):
        db_items = []
        for item in data:
            if "id" not in item and hasattr(Model, "id"):
                item["id"] = str(uuid.uuid4())
            db_items.append(Model(**item))
        db.add_all(db_items)
        db.commit()
        for item in db_items:
            db.refresh(item)
        return serialize_model(db_items)
    else:
        if "id" not in data and hasattr(Model, "id"):
            data["id"] = str(uuid.uuid4())
        db_item = Model(**data)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return serialize_model(db_item)

@app.put("/api/v1/db/{table}")
async def db_update(
    table: str, 
    request: Request, 
    filters: Optional[str] = Query(None), 
    db: Session = Depends(get_db)
):
    if table not in MODEL_MAP:
        raise HTTPException(status_code=400, detail=f"Table '{table}' not supported")
        
    Model = MODEL_MAP[table]
    data = await request.json()
    
    query = db.query(Model)
    
    # Apply filters to find rows to update
    if filters:
        try:
            filter_list = json.loads(filters)
            for f in filter_list:
                col = f.get("column")
                val = f.get("value")
                if hasattr(Model, col):
                    query = query.filter(getattr(Model, col) == val)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid filters format: {e}")
            
    items = query.all()
    if not items:
        raise HTTPException(status_code=404, detail="No rows found to update")
        
    for item in items:
        for key, val in data.items():
            if hasattr(item, key):
                setattr(item, key, val)
                
    db.commit()
    for item in items:
        db.refresh(item)
        
    return serialize_model(items[0] if len(items) == 1 else items)

@app.delete("/api/v1/db/{table}")
def db_delete(
    table: str, 
    filters: Optional[str] = Query(None), 
    db: Session = Depends(get_db)
):
    if table not in MODEL_MAP:
        raise HTTPException(status_code=400, detail=f"Table '{table}' not supported")
        
    Model = MODEL_MAP[table]
    query = db.query(Model)
    
    # Apply filters to find rows to delete
    if filters:
        try:
            filter_list = json.loads(filters)
            for f in filter_list:
                col = f.get("column")
                val = f.get("value")
                if hasattr(Model, col):
                    query = query.filter(getattr(Model, col) == val)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid filters format: {e}")
            
    items = query.all()
    if not items:
        return {"message": "No rows found to delete"}
        
    for item in items:
        db.delete(item)
        
    db.commit()
    return {"message": f"Successfully deleted {len(items)} rows"}
