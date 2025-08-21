from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(String, unique=True, index=True)
    github_login = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String)
    avatar_url = Column(String)
    access_token = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    projects = relationship("Project", back_populates="owner")
    questions = relationship("QnA", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    github_owner = Column(String)
    github_repo = Column(String)
    connected_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="projects")
    commits = relationship("Commit", back_populates="project")

class Commit(Base):
    __tablename__ = "commits"
    
    sha = Column(String, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    message = Column(Text)
    author_name = Column(String)
    author_login = Column(String)
    committed_at = Column(DateTime(timezone=True))
    files_summary = Column(JSON)
    url = Column(String)
    
    project = relationship("Project", back_populates="commits")
    ai_summary = relationship("CommitAI", back_populates="commit", uselist=False)
    questions = relationship("QnA", back_populates="commit")

class CommitAI(Base):
    __tablename__ = "commit_ai"
    
    id = Column(Integer, primary_key=True, index=True)
    sha = Column(String, ForeignKey("commits.sha"), unique=True)
    simple_explanation = Column(Text)
    technical_summary = Column(JSON)
    how_to_test = Column(JSON)
    tags = Column(JSON)
    risk_level = Column(Enum(RiskLevel))
    plan_run_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    commit = relationship("Commit", back_populates="ai_summary")

class QnA(Base):
    __tablename__ = "qna"
    
    id = Column(Integer, primary_key=True, index=True)
    sha = Column(String, ForeignKey("commits.sha"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(Text)
    answer = Column(Text)
    plan_run_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    commit = relationship("Commit", back_populates="questions")
    user = relationship("User", back_populates="questions")
