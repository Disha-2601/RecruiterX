import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class OrgMember(Base):
    __tablename__ = "org_members"
    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(String, ForeignKey("organisations.id"))
    user_id = Column(String, nullable=False)
    role = Column(String, default="member")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True)
    org_id = Column(String, ForeignKey("organisations.id"))
    title = Column(String, default="Untitled Project")
    role = Column(String, default="Untitled Role")
    department = Column(String, nullable=True)
    seniority = Column(String, nullable=True)
    status = Column(String, default="draft")
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    jd_raw_text = Column(Text, nullable=True)
    jd_structured = Column(JSON, nullable=True)

    candidates = relationship("Candidate", back_populates="project", cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    org_id = Column(String, nullable=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    resume_file_url = Column(String, nullable=True)
    trajectory_score = Column(Integer, nullable=True)
    behaviour_score = Column(Integer, nullable=True)
    insider_score = Column(Integer, nullable=True)
    credibility_score = Column(Integer, nullable=True)
    final_score = Column(Integer, nullable=True)
    trajectory_label = Column(String, nullable=True)
    red_flags = Column(JSON, nullable=True)
    insider_signals = Column(JSON, nullable=True)
    interrogation_qs = Column(JSON, nullable=True)
    narrative = Column(Text, nullable=True)
    analysis_status = Column(String, default="parsing")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="candidates")

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(String, primary_key=True)
    org_id = Column(String, ForeignKey("organisations.id"))
    key_val = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
